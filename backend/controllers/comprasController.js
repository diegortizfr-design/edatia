const eventBus = require('../shared/events');

exports.listarCompras = async (req, res) => {
    try {
        const clientConn = req.tenant.db;

        // JOIN with Terceros and Documentos for full details
        const sql = `
            SELECT c.*, 
                   t.nombre_comercial, t.razon_social, t.documento as proveedor_nit,
                   d.nombre as documento_nombre, d.prefijo as documento_prefijo
            FROM compras c
            LEFT JOIN terceros t ON c.proveedor_id = t.id
            LEFT JOIN documentos d ON c.documento_id = d.id
            ORDER BY c.fecha DESC LIMIT 100
        `;

        const [rows] = await clientConn.query(sql);

        // Map format for frontend convenience
        const mod = rows.map(r => ({
            ...r,
            proveedor_nombre: r.nombre_comercial || r.razon_social || 'Desconocido',
            combo_documento: r.documento_nombre ? `${r.documento_nombre} (${r.numero_comprobante || 'S/N'})` : 'N/A'
        }));

        res.json({ success: true, data: mod });

    } catch (err) {
        console.error('listarCompras error:', err);
        res.status(500).json({ success: false, message: 'Error interno: ' + err.message });
    }
};

exports.actualizarCompra = async (req, res) => {
    try {
        const clientConn = req.tenant.db;
        const { id } = req.params;
        const {
            estado, estado_pago, proveedor_id, sucursal_id, fecha, total, items,
            documento_id, factura_referencia, metodo_pago
        } = req.body;

        const [ordenes] = await clientConn.query('SELECT * FROM compras WHERE id = ?', [id]);
        if (ordenes.length === 0) return res.status(404).json({ success: false, message: 'Orden no encontrada' });

        const ordenActual = ordenes[0];

        // 🔒 LOCK: If already 'Completada', prevent any modification
        if (ordenActual.estado && ordenActual.estado.toLowerCase() === 'completada') {
            return res.status(400).json({ success: false, message: 'La orden está finalizada y no se puede modificar.' });
        }

        await clientConn.beginTransaction();

        // 1. Logic for stock movement (transitioning to Completada)
        if (estado === 'Completada') {
            const [detalleItems] = await clientConn.query('SELECT * FROM compras_detalle WHERE compra_id = ?', [id]);
            let targetSucursal = ordenActual.sucursal_id;
            if (!targetSucursal) {
                const [sucs] = await clientConn.query("SELECT id FROM sucursales WHERE es_principal = 1 LIMIT 1");
                targetSucursal = sucs.length > 0 ? sucs[0].id : 1;
            }

            for (const item of detalleItems) {
                const qty = Number(item.cantidad) || 0;
                const cost = Number(item.costo_unitario) || 0;

                const [invSuc] = await clientConn.query('SELECT cant_actual FROM inventario_sucursales WHERE producto_id = ? AND sucursal_id = ? FOR UPDATE', [item.producto_id, targetSucursal]);
                const currentBranchStock = invSuc.length > 0 ? parseFloat(invSuc[0].cant_actual) : 0;
                const newBranchStock = currentBranchStock + qty;

                const [prods] = await clientConn.query('SELECT stock_actual, costo FROM productos WHERE id = ?', [item.producto_id]);
                const currentGlobalStock = prods.length ? (Number(prods[0].stock_actual) || 0) : 0;
                const currentCost = prods.length ? (Number(prods[0].costo) || 0) : 0;
                const newGlobalStock = currentGlobalStock + qty;

                let finalCost = cost;
                if (newGlobalStock > 0) {
                    finalCost = ((currentGlobalStock * currentCost) + (qty * cost)) / newGlobalStock;
                }

                if (invSuc.length > 0) {
                    await clientConn.query('UPDATE inventario_sucursales SET cant_actual = ? WHERE producto_id = ? AND sucursal_id = ?', [newBranchStock, item.producto_id, targetSucursal]);
                } else {
                    await clientConn.query('INSERT INTO inventario_sucursales (producto_id, sucursal_id, cant_actual) VALUES (?, ?, ?)', [item.producto_id, targetSucursal, newBranchStock]);
                }

                await clientConn.query('UPDATE productos SET stock_actual = ?, costo = ? WHERE id = ?', [newGlobalStock, finalCost, item.producto_id]);

                await clientConn.query(`
                    INSERT INTO movimientos_inventario 
                    (producto_id, sucursal_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, documento_referencia, costo_unitario)
                    VALUES (?, ?, 'COMPRA', ?, ?, ?, 'Entrada por Compra', ?, ?)
                `, [item.producto_id, targetSucursal, qty, currentBranchStock, newBranchStock, ordenActual.numero_comprobante, cost]);
            }
        }

        // 2. Update Header
        const headerUpdates = [];
        const headerParams = [];

        if (proveedor_id) { headerUpdates.push('proveedor_id = ?'); headerParams.push(proveedor_id); }
        if (sucursal_id) { headerUpdates.push('sucursal_id = ?'); headerParams.push(sucursal_id); }
        if (fecha) { headerUpdates.push('fecha = ?'); headerParams.push(fecha); }
        if (total !== undefined) { headerUpdates.push('total = ?'); headerParams.push(total); }
        if (estado) { headerUpdates.push('estado = ?'); headerParams.push(estado); }
        if (estado_pago) { headerUpdates.push('estado_pago = ?'); headerParams.push(estado_pago); }
        if (factura_referencia !== undefined) { headerUpdates.push('factura_referencia = ?'); headerParams.push(factura_referencia); }
        if (metodo_pago) {
            headerUpdates.push('metodo_pago = ?'); headerParams.push(metodo_pago);
            if (!estado_pago) {
                headerUpdates.push('estado_pago = ?');
                headerParams.push(metodo_pago === 'Contado' ? 'Pago' : 'Debe');
            }
        }

        if (req.file) {
            const fileUrl = `/uploads/facturas/${req.file.filename}`;
            headerUpdates.push('factura_url = ?');
            headerParams.push(fileUrl);
        }

        if (headerUpdates.length > 0) {
            headerParams.push(id);
            await clientConn.query(`UPDATE compras SET ${headerUpdates.join(', ')} WHERE id = ?`, headerParams);
        }

        // 3. Update Items (If provided)
        if (items && items.length > 0) {
            await clientConn.query('DELETE FROM compras_detalle WHERE compra_id = ?', [id]);
            for (const item of items) {
                await clientConn.query(`
                    INSERT INTO compras_detalle (compra_id, producto_id, cantidad, costo_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                `, [id, item.producto_id, item.cantidad, item.costo, item.subtotal]);
            }
        }

        if (estado === 'Completada') {
            eventBus.emit('purchase.completed', {
                tenant: req.tenant,
                data: {
                    id: id,
                    total: total || ordenActual.total,
                    proveedor_id: proveedor_id || ordenActual.proveedor_id,
                    items: items || [] // Idealmente cargar items si no vienen
                }
            });
        }

        res.json({ success: true, message: 'Compra actualizada correctamente' });

    } catch (err) {
        if (req.tenant?.db) await req.tenant.db.rollback();
        console.error('actualizarCompra error:', err);
        res.status(500).json({ success: false, message: 'Error actualizando compra: ' + err.message });
    }
};

exports.crearCompra = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const {
            proveedor_id, sucursal_id, fecha, total, estado, items,
            documento_id, factura_referencia, metodo_pago // add metodo_pago
        } = req.body;

        // DDL Removed


        // Start transaction
        await clientConn.beginTransaction();

        let numero_comprobante = '';

        // 1. Process Document (Consecutive Logic)
        if (documento_id) {
            const [docs] = await clientConn.query('SELECT * FROM documentos WHERE id = ? FOR UPDATE', [documento_id]);
            if (docs.length === 0) {
                await clientConn.rollback();
                return res.status(400).json({ success: false, message: 'Documento no válido' });
            }
            const doc = docs[0];
            numero_comprobante = `${doc.prefijo || ''}${doc.consecutivo_actual}`;

            // Increment consecutive
            await clientConn.query('UPDATE documentos SET consecutivo_actual = consecutivo_actual + 1 WHERE id = ?', [documento_id]);
        }

        // --- VALIDATION: Prevent Duplicate Invoice ---
        if (factura_referencia && proveedor_id) {
            const [dups] = await clientConn.query('SELECT id FROM compras WHERE proveedor_id = ? AND factura_referencia = ?', [proveedor_id, factura_referencia]);
            if (dups.length > 0) {
                await clientConn.rollback();
                return res.status(400).json({ success: false, message: 'Ya existe una compra con ese número de factura para este proveedor.' });
            }
        }

        // 2. Insert Header
        const [result] = await clientConn.query(`
            INSERT INTO compras 
            (proveedor_id, sucursal_id, documento_id, numero_comprobante, fecha, total, estado, estado_pago, usuario_id, factura_referencia, factura_url, metodo_pago)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            proveedor_id, sucursal_id || null, documento_id || null, numero_comprobante,
            fecha, total, (factura_referencia ? 'Realizada' : (estado || 'Orden de Compra')),
            (metodo_pago === 'Contado' ? 'Pago' : 'Debe'),
            req.user.id, factura_referencia || null, null, metodo_pago || 'Contado'
        ]);

        const compraId = result.insertId;

        // 3. Insert Items
        if (items && items.length > 0) {
            for (const item of items) {
                await clientConn.query(`
                    INSERT INTO compras_detalle (compra_id, producto_id, cantidad, costo_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                `, [compraId, item.producto_id, item.cantidad, item.costo, item.subtotal]);
            }
        }

        await clientConn.commit();
        res.status(201).json({ success: true, message: 'Orden de compra creada', id: compraId, comprobante: numero_comprobante });

    } catch (err) {
        if (req.tenant?.db) await req.tenant.db.rollback();
        console.error('crearCompra error:', err);
        res.status(500).json({ success: false, message: 'Error al procesar la compra: ' + err.message });
    }
};

exports.obtenerDetallesCompra = async (req, res) => {
    try {
        const clientConn = req.tenant.db;
        const { id } = req.params;

        const [items] = await clientConn.query(`
            SELECT d.*, p.nombre as nombre_producto 
            FROM compras_detalle d 
            JOIN productos p ON d.producto_id = p.id 
            WHERE d.compra_id = ?
        `, [id]);

        res.json({ success: true, data: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error obteniendo detalles' });
    }
};

exports.eliminarCompra = async (req, res) => {
    try {
        const clientConn = req.tenant.db;
        const { id } = req.params;

        // 1. Check if exists and state
        const [ordenes] = await clientConn.query('SELECT estado FROM compras WHERE id = ?', [id]);
        if (ordenes.length === 0) return res.status(404).json({ success: false, message: 'Orden no encontrada' });

        if (ordenes[0].estado === 'Completada') {
            return res.status(400).json({ success: false, message: 'No se puede eliminar una compra completada porque ya afectó el stock e inventario.' });
        }

        // 2. Delete
        await clientConn.beginTransaction();
        await clientConn.query('DELETE FROM compras_detalle WHERE compra_id = ?', [id]);
        await clientConn.query('DELETE FROM compras WHERE id = ?', [id]);
        await clientConn.commit();

        res.json({ success: true, message: 'Compra eliminada correctamente' });

    } catch (err) {
        if (req.tenant?.db) await req.tenant.db.rollback();
        console.error('eliminarCompra error:', err);
        res.status(500).json({ success: false, message: 'Error eliminando compra: ' + err.message });
    }
};
