const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.getWebOrders = async (req, res) => {
    try {
        const dbConfig = await getClientDbConfig(req.user.nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        const clientConn = await connectToClientDB(dbConfig);
        const [orders] = await clientConn.query(`
            SELECT p.*, t.nombre as cliente_nombre 
            FROM pedidos_web p
            LEFT JOIN terceros t ON p.cliente_id = t.id
            ORDER BY p.fecha DESC
        `);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Error fetching web orders:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getWebOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(req.user.nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        const clientConn = await connectToClientDB(dbConfig);

        const [order] = await clientConn.query(`
            SELECT p.*, t.nombre as cliente_nombre, t.documento as cliente_documento, t.telefono, t.email
            FROM pedidos_web p
            LEFT JOIN terceros t ON p.cliente_id = t.id
            WHERE p.id = ?
        `, [id]);

        if (order.length === 0) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

        const [items] = await clientConn.query(`
            SELECT d.*, p.nombre as producto_nombre, p.referencia_fabrica
            FROM pedidos_web_detalle d
            JOIN productos p ON d.producto_id = p.id
            WHERE d.pedido_id = ?
        `, [id]);

        res.json({ success: true, data: { ...order[0], items } });
    } catch (error) {
        console.error('Error fetching web order detail:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateWebOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const dbConfig = await getClientDbConfig(req.user.nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        const clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('UPDATE pedidos_web SET estado = ? WHERE id = ?', [estado, id]);
        res.json({ success: true, message: 'Estado actualizado' });
    } catch (error) {
        console.error('Error updating web order status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
