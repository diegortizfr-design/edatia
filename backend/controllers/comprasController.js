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

        // Start transaction
        await clientConn.beginTransaction();

        const [result] = await clientConn.query(`
            INSERT INTO compras (proveedor_id, fecha, total, estado)
            VALUES (?, ?, ?, ?)
        `, [proveedor_id, fecha, total, estado || 'Pendiente']);

        const compraId = result.insertId;

        // Insert items (detalle_compra) if relevant tables exist
        // For now, assuming basic header insertion is priority
        // Ideally: Insert into detalle_compra for each item

        await clientConn.commit();
        res.status(201).json({ success: true, message: 'Compra creada', id: compraId });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('crearCompra error:', err);
        res.status(500).json({ success: false, message: 'Error al crear compra' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
