const eventBus = require('../shared/events');

exports.listarFacturas = async (req, res) => {
    try {
        const clientConn = req.tenant.db;

        const { sucursal_id, prefijo, busqueda, fecha } = req.query;

        let query = `
            SELECT f.*, t.nombre_comercial as cliente_nombre 
            FROM facturas f 
            LEFT JOIN terceros t ON f.cliente_id = t.id
            LEFT JOIN documentos d ON f.documento_id = d.id -- Join documents to get branch info if not stored directly on invoice
        `;

        const conditions = [];
        const params = [];

        // Note: 'facturas' table usually tracks 'sucursal_id' directly or via 'documento_id'. 
        // Based on crearFactura, we do: SELECT ... sucursal_id FROM documentos ... 
        // But facturas table does NOT seem to have sucursal_id column in the INSERT statement (lines 131-133). 
        // However, 'documentos' table usually links to a branch.
        // Let's assume we filter by the document's branch.

        if (sucursal_id) {
            conditions.push('d.sucursal_id = ?');
            params.push(sucursal_id);
        }

        if (prefijo) {
            conditions.push('f.prefijo = ?');
            params.push(prefijo);
        }

        if (fecha) {
            // Assuming fecha param is YYYY-MM-DD
            conditions.push('DATE(f.fecha) = ?');
            params.push(fecha);
        }

        if (busqueda) {
            conditions.push('(f.numero_factura LIKE ? OR t.nombre_comercial LIKE ?)');
            params.push(`%${busqueda}%`, `%${busqueda}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY f.id DESC LIMIT 500';

        const [rows] = await clientConn.query(query, params);
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('listarFacturas error:', err);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

exports.crearFactura = async (req, res) => {
    try {
        const clientConn = req.tenant.db;

        // DDL Removed


        const {
            documento_id, cliente_id, subtotal, impuesto_total, total,
            tipo_pago, metodo_pago, monto_pagado, devuelta, items,
            caja_sesion_id, vendedor_id
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay productos en la factura' });
        }

        await clientConn.beginTransaction();

        // 1. Get Invoice Consecutive AND Branch Info (Moved up)
        const [docRows] = await clientConn.query(
            'SELECT prefijo, consecutivo_actual, sucursal_id FROM documentos WHERE id = ? FOR UPDATE',
            [documento_id]
        );
        if (docRows.length === 0) throw new Error('Tipo de documento (Factura) no encontrado');

        const { prefijo, consecutivo_actual, sucursal_id } = docRows[0];
        const numero_factura = `${prefijo || ''}${consecutivo_actual}`;

        // Update Invoice Consecutive
        await clientConn.query('UPDATE documentos SET consecutivo_actual = consecutivo_actual + 1 WHERE id = ?', [documento_id]);

        // 2. Validate Stock & Deduct (Now with sucursal_id available)
        for (const item of items) {
            const [prods] = await clientConn.query('SELECT stock_actual, maneja_inventario, costo FROM productos WHERE id = ? FOR UPDATE', [item.id]);
            if (prods.length === 0) throw new Error(`Producto ID ${item.id} no encontrado`);
            const prod = prods[0];

            if (prod.maneja_inventario) {
                let currentBranchStock = 0;
                if (sucursal_id) {
                    // Check Branch Stock
                    const [invSuc] = await clientConn.query('SELECT cant_actual FROM inventario_sucursales WHERE producto_id = ? AND sucursal_id = ? FOR UPDATE', [item.id, sucursal_id]);

                    if (invSuc.length > 0) {
                        currentBranchStock = parseFloat(invSuc[0].cant_actual);
                    } else {
                        // FALLBACK: If there's only one branch or this is the first time, 
                        // use the global stock from the 'productos' table.
                        currentBranchStock = parseFloat(prod.stock_actual) || 0;
                    }

                    if (currentBranchStock < item.cantidad) {
                        throw new Error(`Stock insuficiente en sucursal para producto ID ${item.id}. Stock Sucursal: ${currentBranchStock}`);
                    }
                } else {
                    // Fallback check
                    if ((prod.stock_actual || 0) < item.cantidad) {
                        throw new Error(`Stock insuficiente (Global) para producto ID ${item.id}`);
                    }
                }

                // Update Branch Stock
                if (sucursal_id) {
                    const newBranchStock = currentBranchStock - item.cantidad;
                    // Check if we need to update or insert
                    const [checkExists] = await clientConn.query('SELECT id FROM inventario_sucursales WHERE producto_id = ? AND sucursal_id = ?', [item.id, sucursal_id]);
                    if (checkExists.length > 0) {
                        await clientConn.query('UPDATE inventario_sucursales SET cant_actual = ? WHERE producto_id = ? AND sucursal_id = ?', [newBranchStock, item.id, sucursal_id]);
                    } else {
                        await clientConn.query('INSERT INTO inventario_sucursales (producto_id, sucursal_id, cant_actual) VALUES (?, ?, ?)', [item.id, sucursal_id, newBranchStock]);
                    }
                }

                // Update Global Stock
                const stockNuevo = (parseFloat(prod.stock_actual) || 0) - item.cantidad;
                await clientConn.query('UPDATE productos SET stock_actual = ? WHERE id = ?', [stockNuevo, item.id]);

                // Record Movement
                await clientConn.query(`
                     INSERT INTO movimientos_inventario 
                     (producto_id, sucursal_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, documento_referencia, costo_unitario)
                     VALUES (?, ?, 'VENTA', ?, ?, ?, ?, ?, ?)
                 `, [
                    item.id,
                    sucursal_id || null,
                    item.cantidad,
                    sucursal_id ? currentBranchStock : (prod.stock_actual || 0),
                    sucursal_id ? (currentBranchStock - item.cantidad) : stockNuevo,
                    'Venta POS',
                    numero_factura,
                    prod.costo || 0
                ]);
            }
        }




        // 3. Insert Invoice Header
        const { id: userId } = req.user;
        const [resFac] = await clientConn.query(`
            INSERT INTO facturas 
            (numero_factura, prefijo, documento_id, cliente_id, subtotal, impuesto_total, total, tipo_pago, metodo_pago, monto_pagado, devuelta, estado, vendedor_id, usuario_id, caja_sesion_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            numero_factura, prefijo, documento_id, cliente_id || null,
            subtotal, impuesto_total, total,
            tipo_pago, metodo_pago, monto_pagado, devuelta,
            (tipo_pago === 'Crédito' ? 'Pendiente' : 'Pagada'),
            vendedor_id || userId || null, userId || null, caja_sesion_id || null
        ]);
        const facturaId = resFac.insertId;

        // 4. Insert Invoice Details
        for (const item of items) {
            await clientConn.query(`
                INSERT INTO factura_detalle (factura_id, producto_id, cantidad, precio_unitario, impuesto_porcentaje, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [facturaId, item.id, item.cantidad, item.precio, item.impuesto_porcentaje, item.subtotal]);
        }

        // 5. Automatic Receipt (If 'Contado')
        // User requested: "generar un recibo de caja por esa venta si la factura fue de contado"
        let numero_recibo = null;
        if (tipo_pago === 'Contado') {
            // Find a document for 'Recibo de Caja' (e.g. category 'RC')
            const [rcDocs] = await clientConn.query("SELECT id, prefijo, consecutivo_actual FROM documentos WHERE categoria IN ('Recibo de Caja', 'RC') LIMIT 1 FOR UPDATE");

            if (rcDocs.length > 0) {
                const rcDoc = rcDocs[0];
                numero_recibo = `${rcDoc.prefijo || ''}${rcDoc.consecutivo_actual}`;

                // Insert RC
                await clientConn.query(`
                    INSERT INTO recibos_caja (numero_recibo, documento_id, factura_id, cliente_id, monto, concepto)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [numero_recibo, rcDoc.id, facturaId, cliente_id, total, `Pago contado factura ${numero_factura}`]);

                // Update RC Consecutive
                await clientConn.query('UPDATE documentos SET consecutivo_actual = consecutivo_actual + 1 WHERE id = ?', [rcDoc.id]);

                // Update Caja Session Totals (if exists and is effective/cash)
                if (caja_sesion_id) {
                    if (metodo_pago === 'Efectivo') {
                        await clientConn.query(
                            "UPDATE caja_sesiones SET monto_ventas_efectivo = monto_ventas_efectivo + ?, monto_total_esperado = monto_total_esperado + ? WHERE id = ?",
                            [total, total, caja_sesion_id]
                        );
                    } else {
                        await clientConn.query(
                            "UPDATE caja_sesiones SET monto_ventas_otros = monto_ventas_otros + ?, monto_total_esperado = monto_total_esperado + ? WHERE id = ?",
                            [total, total, caja_sesion_id]
                        );
                    }

                    // Add Movement
                    await clientConn.query(
                        "INSERT INTO caja_movimientos (sesion_id, tipo_movimiento, monto, motivo, metodo_pago, referencia_id) VALUES (?, 'Venta', ?, ?, ?, ?)",
                        [caja_sesion_id, total, `Venta ${numero_factura}`, metodo_pago, facturaId]
                    );
                }
            }
        } else if (caja_sesion_id) {
            // If not Contado (Credit), we still might want to track the movement or just the fact that it's in this session
            // but usually only cash movements are tracked in caja_sesiones totals for balancing.
            // We'll just update the session total expected if it also affects other methods.
            await clientConn.query(
                "UPDATE caja_sesiones SET monto_ventas_otros = monto_ventas_otros + ?, monto_total_esperado = monto_total_esperado + ? WHERE id = ?",
                [total, total, caja_sesion_id]
            );
            await clientConn.query(
                "INSERT INTO caja_movimientos (sesion_id, tipo_movimiento, monto, motivo, metodo_pago, referencia_id) VALUES (?, 'Venta', ?, ?, ?, ?)",
                [caja_sesion_id, total, `Venta Crédito ${numero_factura}`, metodo_pago, facturaId]
            );
        }
        
        await clientConn.commit();

        // 6. Disparar Evento para Contabilidad y DIAN (Asíncrono)
        eventBus.emit('sale.completed', {
            tenant: req.tenant,
            data: {
                id: facturaId,
                numero_factura,
                cliente_id,
                subtotal,
                impuesto_total,
                total,
                items
            }
        });

        res.status(201).json({
            success: true,
            message: 'Venta registrada exitosamente',
            numero: numero_factura,
            recibo: numero_recibo,
            factura_id: facturaId
        });

    } catch (err) {
        if (req.tenant?.db) await req.tenant.db.rollback();
        console.error('crearFactura error:', err);
        res.status(500).json({ success: false, message: 'Error al procesar la venta: ' + err.message });
    }
};

exports.obtenerDetallesFactura = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        // Get Header
        const [headers] = await clientConn.query(`
            SELECT f.*, 
                   t.nombre_comercial as cliente_nombre, t.documento as cliente_nit, 
                   t.direccion as cliente_direccion, t.telefono as cliente_telefono,
                   u.nombre as vendedor_nombre
            FROM facturas f
            LEFT JOIN terceros t ON f.cliente_id = t.id
            LEFT JOIN usuarios u ON f.vendedor_id = u.id
            WHERE f.id = ?
        `, [id]);

        if (headers.length === 0) return res.status(404).json({ success: false, message: 'Factura no encontrada' });

        // Get Details
        const [items] = await clientConn.query(`
            SELECT fd.*, p.nombre as nombre_producto, p.codigo
            FROM factura_detalle fd
            JOIN productos p ON fd.producto_id = p.id
            WHERE fd.factura_id = ?
        `, [id]);

        res.json({ success: true, data: headers[0], items: items });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.listarRecibos = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const [rows] = await clientConn.query(`
            SELECT r.*, t.nombre_comercial as cliente_nombre 
            FROM recibos_caja r 
            LEFT JOIN terceros t ON r.cliente_id = t.id 
            ORDER BY r.id DESC LIMIT 500
        `);

        res.json({ success: true, data: rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.anularFactura = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { factura_id, documento_id, motivo } = req.body;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.beginTransaction();

        try {
            // 1. Get Invoice Header
            const [facs] = await clientConn.query('SELECT * FROM facturas WHERE id = ? FOR UPDATE', [factura_id]);
            if (facs.length === 0) throw new Error('Factura no encontrada');
            const fac = facs[0];

            if (fac.estado === 'Anulada') throw new Error('La factura ya se encuentra anulada');

            // 2. Get Invoice Details
            const [items] = await clientConn.query('SELECT * FROM factura_detalle WHERE factura_id = ?', [factura_id]);

            // 3. Get NC Document info
            const [docRows] = await clientConn.query(
                'SELECT prefijo, consecutivo_actual, sucursal_id FROM documentos WHERE id = ? FOR UPDATE',
                [documento_id]
            );
            if (docRows.length === 0) throw new Error('Tipo de documento (Nota Crédito) no encontrado');
            const { prefijo, consecutivo_actual, sucursal_id } = docRows[0];
            const numero_nc = `${prefijo || ''}${consecutivo_actual}`;

            // 4. Create Nota Crédito Header
            const [ncRes] = await clientConn.query(`
                INSERT INTO notas_credito 
                (numero_nc, prefijo, documento_id, factura_id, cliente_id, subtotal, impuesto_total, total, motivo, usuario_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                numero_nc, prefijo, documento_id, factura_id, fac.cliente_id,
                fac.subtotal, fac.impuesto_total, fac.total, motivo || 'Anulación de Factura', req.user.id
            ]);
            const notaCreditoId = ncRes.insertId;

            // 5. Create NC Details and REVERSE Stock
            for (const item of items) {
                // Insert NC Detail
                await clientConn.query(`
                    INSERT INTO nota_credito_detalle (nota_credito_id, producto_id, cantidad, precio_unitario, impuesto_porcentaje, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [notaCreditoId, item.producto_id, item.cantidad, item.precio_unitario, item.impuesto_porcentaje, item.subtotal]);

                // Reverse Stock
                const [prods] = await clientConn.query('SELECT stock_actual, maneja_inventario, costo FROM productos WHERE id = ? FOR UPDATE', [item.producto_id]);
                if (prods.length > 0) {
                    const prod = prods[0];
                    if (prod.maneja_inventario) {
                        // Update Branch Stock
                        const [invSuc] = await clientConn.query('SELECT cant_actual FROM inventario_sucursales WHERE producto_id = ? AND sucursal_id = ? FOR UPDATE', [item.producto_id, sucursal_id]);
                        const oldBranchStock = invSuc.length > 0 ? parseFloat(invSuc[0].cant_actual) : 0;
                        const newBranchStock = oldBranchStock + parseFloat(item.cantidad);

                        if (invSuc.length > 0) {
                            await clientConn.query('UPDATE inventario_sucursales SET cant_actual = ? WHERE producto_id = ? AND sucursal_id = ?', [newBranchStock, item.producto_id, sucursal_id]);
                        } else {
                            await clientConn.query('INSERT INTO inventario_sucursales (producto_id, sucursal_id, cant_actual) VALUES (?, ?, ?)', [item.producto_id, sucursal_id, newBranchStock]);
                        }

                        // Update Global Stock
                        const oldGlobalStock = parseFloat(prod.stock_actual) || 0;
                        const newGlobalStock = oldGlobalStock + parseFloat(item.cantidad);
                        await clientConn.query('UPDATE productos SET stock_actual = ? WHERE id = ?', [newGlobalStock, item.producto_id]);

                        // Record Movement (ENTRADA por devolución)
                        await clientConn.query(`
                            INSERT INTO movimientos_inventario 
                            (producto_id, sucursal_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, documento_referencia, costo_unitario)
                            VALUES (?, ?, 'ENTRADA', ?, ?, ?, ?, ?, ?)
                        `, [
                            item.producto_id, sucursal_id, item.cantidad,
                            oldBranchStock, newBranchStock,
                            `Devolución/Anulación ${fac.numero_factura}`,
                            numero_nc,
                            prod.costo || 0
                        ]);
                    }
                }
            }

            // 6. Reverse Cash Session Movement (If applicable)
            if (fac.tipo_pago === 'Contado' && fac.caja_sesion_id) {
                // We create an 'Egreso' movement in the session for the refund
                await clientConn.query(
                    "INSERT INTO caja_movimientos (sesion_id, tipo_movimiento, monto, motivo, metodo_pago, referencia_id) VALUES (?, 'Egreso', ?, ?, ?, ?)",
                    [fac.caja_sesion_id, fac.total, `Anulación Factura ${fac.numero_factura}`, fac.metodo_pago, notaCreditoId]
                );

                // Update Session Totals
                if (fac.metodo_pago === 'Efectivo') {
                    await clientConn.query(
                        "UPDATE caja_sesiones SET monto_ventas_efectivo = monto_ventas_efectivo - ?, monto_total_esperado = monto_total_esperado - ? WHERE id = ?",
                        [fac.total, fac.total, fac.caja_sesion_id]
                    );
                } else {
                    await clientConn.query(
                        "UPDATE caja_sesiones SET monto_ventas_otros = monto_ventas_otros - ?, monto_total_esperado = monto_total_esperado - ? WHERE id = ?",
                        [fac.total, fac.total, fac.caja_sesion_id]
                    );
                }
            }

            // 7. Update Invoice Status
            await clientConn.query('UPDATE facturas SET estado = "Anulada" WHERE id = ?', [factura_id]);

            // 8. Increment NC Consecutive
            await clientConn.query('UPDATE documentos SET consecutivo_actual = consecutivo_actual + 1 WHERE id = ?', [documento_id]);

            await clientConn.commit();
            res.json({ success: true, message: 'Factura anulada exitosamente', numero_nc: numero_nc });

        } catch (txErr) {
            await clientConn.rollback();
            throw txErr;
        }

    } catch (err) {
        console.error('anularFactura error:', err);
        res.status(500).json({ success: false, message: 'Error al anular factura: ' + err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
