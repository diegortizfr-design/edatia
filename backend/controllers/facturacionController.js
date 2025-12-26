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

        // Assuming table name 'facturas' or 'ventas'
        const [rows] = await clientConn.query('SELECT * FROM facturas ORDER BY fecha DESC LIMIT 100');
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

        const {
            cliente_id, fecha, total, estado, items
        } = req.body;

        await clientConn.beginTransaction();

        const [result] = await clientConn.query(`
            INSERT INTO facturas (cliente_id, fecha, total, estado)
            VALUES (?, ?, ?, ?)
        `, [cliente_id, fecha, total, estado || 'Pendiente']);

        const facturaId = result.insertId;

        // items handling placeholder

        await clientConn.commit();
        res.status(201).json({ success: true, message: 'Factura creada', id: facturaId });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('crearFactura error:', err);
        res.status(500).json({ success: false, message: 'Error al crear factura' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
