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

        // First-run: Create tables if not exist
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
                metodo_pago VARCHAR(50),
                estado VARCHAR(20) DEFAULT 'Pagada',
                vendedor_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

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

        const {
            documento_id, cliente_id, subtotal, impuesto_total, total, metodo_pago, items
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay productos en la factura' });
        }

        await clientConn.beginTransaction();

        // 1. Get and increment consecutive from 'documentos'
        const [docRows] = await clientConn.query(
            'SELECT prefijo, consecutivo_actual FROM documentos WHERE id = ? FOR UPDATE',
            [documento_id]
        );

        if (docRows.length === 0) {
            throw new Error('Tipo de documento no encontrado');
        }

        const { prefijo, consecutivo_actual } = docRows[0];
        const numero_factura = `${prefijo || ''}${consecutivo_actual}`;

        // 2. Insert main invoice
        const [resFac] = await clientConn.query(`
            INSERT INTO facturas (numero_factura, prefijo, documento_id, cliente_id, subtotal, impuesto_total, total, metodo_pago)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [numero_factura, prefijo, documento_id, cliente_id || null, subtotal, impuesto_total, total, metodo_pago]);

        const facturaId = resFac.insertId;

        // 3. Insert details and update stock
        for (const item of items) {
            await clientConn.query(`
                INSERT INTO factura_detalle (factura_id, producto_id, cantidad, precio_unitario, impuesto_porcentaje, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [facturaId, item.id, item.cantidad, item.precio, item.impuesto_porcentaje, item.subtotal]);

            // Deduction from stock
            await clientConn.query(
                'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
                [item.cantidad, item.id]
            );
        }

        // 4. Update the consecutive in 'documentos'
        await clientConn.query(
            'UPDATE documentos SET consecutivo_actual = consecutivo_actual + 1 WHERE id = ?',
            [documento_id]
        );

        await clientConn.commit();
        res.status(201).json({ success: true, message: 'Factura generada exitosamente', numero: numero_factura });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('crearFactura error:', err);
        res.status(500).json({ success: false, message: 'Error al procesar la venta: ' + err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
