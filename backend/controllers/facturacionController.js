const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.listarFacturas = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        // Fetch invoices with customer name
        const [rows] = await clientConn.query(`
            SELECT f.*, t.nombre as cliente_nombre 
            FROM facturas f 
            LEFT JOIN terceros t ON f.cliente_id = t.id 
            ORDER BY f.id DESC LIMIT 500
        `);
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('listarFacturas error:', err);
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearFactura = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        // DDL Removed


        const {
            documento_id, cliente_id, subtotal, impuesto_total, total,
            tipo_pago, metodo_pago, monto_pagado, devuelta, items
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
                    currentBranchStock = invSuc.length > 0 ? parseFloat(invSuc[0].cant_actual) : 0;
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
                    if (currentBranchStock > 0) {
                        await clientConn.query('UPDATE inventario_sucursales SET cant_actual = ? WHERE producto_id = ? AND sucursal_id = ?', [newBranchStock, item.id, sucursal_id]);
                    } else {
                        await clientConn.query('INSERT INTO inventario_sucursales (producto_id, sucursal_id, cant_actual) VALUES (?, ?, ?)', [newBranchStock, item.id, sucursal_id]);
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
            (numero_factura, prefijo, documento_id, cliente_id, subtotal, impuesto_total, total, tipo_pago, metodo_pago, monto_pagado, devuelta, estado, vendedor_id, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            numero_factura, prefijo, documento_id, cliente_id || null,
            subtotal, impuesto_total, total,
            tipo_pago, metodo_pago, monto_pagado, devuelta,
            (tipo_pago === 'Crédito' ? 'Pendiente' : 'Pagada'),
            userId || null, userId || null
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
            }
        }

        await clientConn.commit();

        res.status(201).json({
            success: true,
            message: 'Venta registrada exitosamente',
            numero: numero_factura,
            recibo: numero_recibo,
            factura_id: facturaId
        });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('crearFactura error:', err);
        res.status(500).json({ success: false, message: 'Error al procesar la venta: ' + err.message });
    } finally {
        if (clientConn) await clientConn.end();
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
                   t.nombre as cliente_nombre, t.numero_documento as cliente_nit, 
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
