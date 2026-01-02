const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.listarCompras = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        const [rows] = await clientConn.query('SELECT * FROM compras ORDER BY fecha DESC LIMIT 100');
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('listarCompras error:', err);
        res.status(500).json({ success: false, message: 'Error interno' });
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
            proveedor_id, fecha, total, estado, items
        } = req.body;

        // Ensure tables exist
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS compras (
                id INT AUTO_INCREMENT PRIMARY KEY,
                proveedor_id INT,
                fecha DATE,
                total DECIMAL(15,2),
                estado VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS compras_detalle (
                id INT AUTO_INCREMENT PRIMARY KEY,
                compra_id INT,
                producto_id INT,
                cantidad INT,
                costo_unitario DECIMAL(15,2),
                subtotal DECIMAL(15,2),
                FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE
            )
        `);

        // Start transaction
        await clientConn.beginTransaction();

        // 1. Insert Header
        const [result] = await clientConn.query(`
            INSERT INTO compras (proveedor_id, fecha, total, estado)
            VALUES (?, ?, ?, ?)
        `, [proveedor_id, fecha, total, estado || 'Recibida']);

        const compraId = result.insertId;

        // 2. Insert Items and Update Stock
        if (items && items.length > 0) {
            for (const item of items) {
                // Insert detail
                await clientConn.query(`
                    INSERT INTO compras_detalle (compra_id, producto_id, cantidad, costo_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                `, [compraId, item.producto_id, item.cantidad, item.costo, item.subtotal]);

                // Update Stock (Increase) and optionally Cost (Last Cost)
                await clientConn.query(`
                    UPDATE productos 
                    SET stock_actual = stock_actual + ?, costo = ?
                    WHERE id = ?
                `, [item.cantidad, item.costo, item.producto_id]);
            }
        }

        await clientConn.commit();
        res.status(201).json({ success: true, message: 'Compra registrada y stock actualizado', id: compraId });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('crearCompra error:', err);
        res.status(500).json({ success: false, message: 'Error al procesar la compra' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
