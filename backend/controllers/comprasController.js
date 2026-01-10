const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

// Helper to ensure schema exists (Mini-migration system)
async function ensureComprasSchema(clientConn) {
    // DDL Removed - Handled by tenantInit
}

exports.listarCompras = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        // Ensure schema exists before querying (prevents 500 if columns missing)
        await ensureComprasSchema(clientConn);

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
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarCompra = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        const { id } = req.params;
        const { estado, estado_pago } = req.body;

        console.log(`[actualizarCompra] ID: ${id}, New Estado: ${estado}, User: ${nit}`);

        // Validar que la orden existe
        const [ordenes] = await clientConn.query('SELECT * FROM compras WHERE id = ?', [id]);
        if (ordenes.length === 0) return res.status(404).json({ success: false, message: 'Orden no encontrada' });

        const ordenActual = ordenes[0];
        console.log(`[actualizarCompra] Estado Actual: ${ordenActual.estado}`);

        // 🔒 LOCK: If already 'Completada', prevent any status change
        // Ensure accurate comparison (case insensitive just in case)
        if (ordenActual.estado && ordenActual.estado.toLowerCase() === 'completada') {
            console.log('[actualizarCompra] Blocked: Order is already completed.');
            return res.status(400).json({ success: false, message: 'La orden está finalizada y no se puede modificar.' });
        }

        // LOGIC: Stock Movement (If transitioning TO 'Completada')
        if (estado === 'Completada') {

            console.log('[actualizarCompra] Processing stock update...');
            // Get items
            const [items] = await clientConn.query('SELECT * FROM compras_detalle WHERE compra_id = ?', [id]);

            await clientConn.beginTransaction();

            try {
                // Get Default Branch if not set in order
                let targetSucursal = ordenActual.sucursal_id;
                if (!targetSucursal) {
                    const [sucs] = await clientConn.query("SELECT id FROM sucursales WHERE es_principal = 1 LIMIT 1");
                    targetSucursal = sucs.length > 0 ? sucs[0].id : 1;
                }

                // Update Stock
                for (const item of items) {
                    // Ensure values are numbers
                    const qty = Number(item.cantidad) || 0;
                    const cost = Number(item.costo_unitario) || 0;

                    // 1. Fetch CURRENT Branch Stock
                    const [invSuc] = await clientConn.query('SELECT cant_actual FROM inventario_sucursales WHERE producto_id = ? AND sucursal_id = ? FOR UPDATE', [item.producto_id, targetSucursal]);
                    const currentBranchStock = invSuc.length > 0 ? parseFloat(invSuc[0].cant_actual) : 0;
                    const newBranchStock = currentBranchStock + qty;

                    // 2. Fetch Global Stock (for cost update & global cache)
                    const [prods] = await clientConn.query('SELECT stock_actual, costo FROM productos WHERE id = ?', [item.producto_id]);
                    const currentGlobalStock = prods.length ? (Number(prods[0].stock_actual) || 0) : 0;
                    const newGlobalStock = currentGlobalStock + qty;

                    // 3. Upsert Branch Stock
                    if (invSuc.length > 0) {
                        await clientConn.query('UPDATE inventario_sucursales SET cant_actual = ? WHERE producto_id = ? AND sucursal_id = ?', [newBranchStock, item.producto_id, targetSucursal]);
                    } else {
                        await clientConn.query('INSERT INTO inventario_sucursales (producto_id, sucursal_id, cant_actual) VALUES (?, ?, ?)', [item.producto_id, targetSucursal, newBranchStock]);
                    }

                    // 4. Update Global Stock & Cost
                    await clientConn.query(`
                        UPDATE productos 
                        SET stock_actual = ?, costo = ?
                        WHERE id = ?
                    `, [newGlobalStock, cost, item.producto_id]);

                    // 5. Record Movement (Kardex)
                    await clientConn.query(`
                        INSERT INTO movimientos_inventario 
                        (producto_id, sucursal_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, documento_referencia, costo_unitario)
                        VALUES (?, ?, 'COMPRA', ?, ?, ?, ?, ?, ?)
                    `, [
                        item.producto_id,
                        targetSucursal,
                        qty,
                        currentBranchStock,
                        newBranchStock,
                        'Entrada por Compra',
                        ordenActual.numero_comprobante,
                        cost
                    ]);
                }

                // Update Header
                await clientConn.query('UPDATE compras SET estado = ? WHERE id = ?', ['Completada', id]);
                await clientConn.commit();
                console.log('[actualizarCompra] Transaction Committed.');

            } catch (txErr) {
                await clientConn.rollback();
                console.error('[actualizarCompra] Transaction Failed:', txErr);
                throw txErr; // Re-throw to main catch
            }

        } else if (estado) {
            console.log(`[actualizarCompra] Updating simple status to: ${estado}`);
            await clientConn.query('UPDATE compras SET estado = ? WHERE id = ?', [estado, id]);
        }

        // Update Invoice Details if provided (e.g., in Realizada state)
        if (req.body.factura_referencia || req.file || req.body.factura_url) {
            const updates = [];
            const params = [];
            if (req.body.factura_referencia) { updates.push('factura_referencia = ?'); params.push(req.body.factura_referencia); }

            // Handle file upload
            if (req.file) {
                const fileUrl = `/uploads/facturas/${req.file.filename}`;
                updates.push('factura_url = ?');
                params.push(fileUrl);
            } else if (req.body.factura_url) {
                updates.push('factura_url = ?');
                params.push(req.body.factura_url);
            }

            if (updates.length > 0) {
                params.push(id);
                await clientConn.query(`UPDATE compras SET ${updates.join(', ')} WHERE id = ?`, params);
            }
        }


        if (estado_pago) {
            await clientConn.query('UPDATE compras SET estado_pago = ? WHERE id = ?', [estado_pago, id]);
        }

        res.json({ success: true, message: 'Orden actualizada' });

    } catch (err) {
        // Only rollback if we are in a transaction state (hard to track here simply, but safe to try)
        // Ideally handled inside the specific block
        console.error('actualizarCompra error:', err);
        res.status(500).json({ success: false, message: 'Error actualizando compra: ' + err.message });
    } finally {
        if (clientConn) await clientConn.end();
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
            documento_id, factura_referencia // cruce logic
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
            (proveedor_id, sucursal_id, documento_id, numero_comprobante, fecha, total, estado, estado_pago, usuario_id, factura_referencia, factura_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            proveedor_id, sucursal_id || null, documento_id || null, numero_comprobante,
            fecha, total, estado || 'Orden de Compra', 'Debe',
            req.user.id, factura_referencia || null, null
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
        if (clientConn) await clientConn.rollback();
        console.error('crearCompra error:', err);
        res.status(500).json({ success: false, message: 'Error al procesar la compra: ' + err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.obtenerDetallesCompra = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

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
    } finally {
        if (clientConn) await clientConn.end();
    }
};
