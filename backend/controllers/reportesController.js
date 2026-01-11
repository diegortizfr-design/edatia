const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.getDashboardStats = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        clientConn = await connectToClientDB(dbConfig);

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // 1. Sales this month
        const [salesMonthRows] = await clientConn.query(
            'SELECT SUM(total) as total FROM facturas WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?',
            [currentMonth, currentYear]
        );
        const ventasMes = parseFloat(salesMonthRows[0].total) || 0;

        // 2. Net Utility (approx: Sales price - Purchase cost)
        const [utilityRows] = await clientConn.query(`
            SELECT SUM((fd.precio_unitario - p.costo) * fd.cantidad) as total_utility
            FROM factura_detalle fd
            JOIN productos p ON fd.producto_id = p.id
            JOIN facturas f ON fd.factura_id = f.id
            WHERE MONTH(f.fecha) = ? AND YEAR(f.fecha) = ?
        `, [currentMonth, currentYear]);
        const utilidadNeta = parseFloat(utilityRows[0].total_utility) || 0;

        // 3. New Clients
        const [clientRows] = await clientConn.query(
            'SELECT COUNT(*) as count FROM terceros WHERE es_cliente = 1 AND MONTH(created_at) = ? AND YEAR(created_at) = ?',
            [currentMonth, currentYear]
        );
        const nuevosClientes = clientRows[0].count || 0;

        // 4. Monthly Sales (last 6 months)
        const [monthlySalesRows] = await clientConn.query(`
            SELECT MONTH(fecha) as mes, SUM(total) as total
            FROM facturas
            WHERE fecha >= DATE_SUB(LAST_DAY(NOW()), INTERVAL 6 MONTH)
            GROUP BY MONTH(fecha), YEAR(fecha)
            ORDER BY YEAR(fecha) ASC, MONTH(fecha) ASC
        `);

        // 5. Top Products
        const [topProductsRows] = await clientConn.query(`
            SELECT p.nombre, SUM(fd.cantidad) as cantidad, SUM(fd.subtotal) as total
            FROM factura_detalle fd
            JOIN productos p ON fd.producto_id = p.id
            GROUP BY p.id
            ORDER BY cantidad DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                kpis: {
                    ventasMes,
                    utilidadNeta,
                    nuevosClientes
                },
                monthlySales: monthlySalesRows,
                topProducts: topProductsRows
            }
        });

    } catch (err) {
        console.error('getDashboardStats error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
