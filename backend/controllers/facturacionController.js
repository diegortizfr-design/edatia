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

        // --- SCHEMA UPDATES ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS facturas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero_factura VARCHAR(50) UNIQUE,
                prefijo VARCHAR(20),
                documento_id INT,
                cliente_id INT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                subtotal DECIMAL(15,2) DEFAULT 0,
                impuesto_total DECIMAL(15,2) DEFAULT 0,
                total DECIMAL(15,2) DEFAULT 0,
                
                tipo_pago VARCHAR(20),  -- Contado / Credito
                metodo_pago VARCHAR(50), -- Efectivo, Tarjeta, etc.
                monto_pagado DECIMAL(15,2) DEFAULT 0,
                devuelta DECIMAL(15,2) DEFAULT 0,
                
                estado VARCHAR(20) DEFAULT 'Pagada',
                vendedor_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Add columns if missing (Mini-migration)
        try { await clientConn.query("ALTER TABLE facturas ADD COLUMN tipo_pago VARCHAR(20)"); } catch (e) { }
        try { await clientConn.query("ALTER TABLE facturas ADD COLUMN monto_pagado DECIMAL(15,2) DEFAULT 0"); } catch (e) { }
        try { await clientConn.query("ALTER TABLE facturas ADD COLUMN devuelta DECIMAL(15,2) DEFAULT 0"); } catch (e) { }


        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS factura_detalle (
                id INT AUTO_INCREMENT PRIMARY KEY,
                factura_id INT,
                producto_id INT,
                cantidad DECIMAL(15,2),
                precio_unitario DECIMAL(15,2),
                impuesto_porcentaje DECIMAL(5,2),
                subtotal DECIMAL(15,2),
                FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
            )
        `);

        // Table for Receipts
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS recibos_caja (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero_recibo VARCHAR(50),
                documento_id INT,
                factura_id INT, 
                cliente_id INT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                monto DECIMAL(15,2),
                concepto VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const {
            documento_id, cliente_id, subtotal, impuesto_total, total,
            tipo_pago, metodo_pago, monto_pagado, devuelta, items
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay productos en la factura' });
        }

        await clientConn.beginTransaction();

        // 1. Validate Stock & Prepare Items
        for (const item of items) {
            // Get product current stock settings (afecta_inventario)
            const [prods] = await clientConn.query('SELECT stock_actual, afecta_inventario FROM productos WHERE id = ? FOR UPDATE', [item.id]);
            if (prods.length === 0) throw new Error(`Producto ID ${item.id} no encontrado`);
            const prod = prods[0];

            if (prod.afecta_inventario) {
                if ((prod.stock_actual || 0) < item.cantidad) {
                    throw new Error(`Stock insuficiente para producto ID ${item.id}. Stock: ${prod.stock_actual}`);
                }
                // Deduct
                await clientConn.query('UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?', [item.cantidad, item.id]);
            }
        }

        // 2. Get Invoice Consecutive
        const [docRows] = await clientConn.query(
            'SELECT prefijo, consecutivo_actual FROM documentos WHERE id = ? FOR UPDATE',
            [documento_id]
        );
        if (docRows.length === 0) throw new Error('Tipo de documento (Factura) no encontrado');

        const { prefijo, consecutivo_actual } = docRows[0];
        const numero_factura = `${prefijo || ''}${consecutivo_actual}`;

        // Update Invoice Consecutive
        await clientConn.query('UPDATE documentos SET consecutivo_actual = consecutivo_actual + 1 WHERE id = ?', [documento_id]);


        // 3. Insert Invoice Header
        const [resFac] = await clientConn.query(`
            INSERT INTO facturas 
            (numero_factura, prefijo, documento_id, cliente_id, subtotal, impuesto_total, total, tipo_pago, metodo_pago, monto_pagado, devuelta, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            numero_factura, prefijo, documento_id, cliente_id || null,
            subtotal, impuesto_total, total,
            tipo_pago, metodo_pago, monto_pagado, devuelta,
            (tipo_pago === 'Crédito' ? 'Pendiente' : 'Pagada')
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
