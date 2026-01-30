const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

// Obtener todos los eventos de camIA
exports.getEventos = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);
        const [rows] = await clientConn.query('SELECT * FROM eventos_camia WHERE usuario_id = ? ORDER BY fecha_inicio ASC', [req.user.id]);

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getEventos error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener eventos' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Crear evento en camIA
exports.crearEvento = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const { titulo, descripcion, fecha_inicio, fecha_fin, categoria, prioridad, color, es_todo_el_dia } = req.body;
        const usuario_id = req.user.id;

        await clientConn.query(`
            INSERT INTO eventos_camia 
            (usuario_id, titulo, descripcion, fecha_inicio, fecha_fin, categoria, prioridad, color, es_todo_el_dia)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [usuario_id, titulo, descripcion, fecha_inicio, fecha_fin, categoria, prioridad, color, es_todo_el_dia || 0]);

        res.json({ success: true, message: 'Evento agendado con camIA' });
    } catch (err) {
        console.error('crearEvento error:', err);
        res.status(500).json({ success: false, message: 'Error al agendar evento' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Resumen de hoy para el widget del Dashboard
exports.getResumenHoy = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const usuario_id = req.user.id;
        const hoy = new Date().toISOString().split('T')[0];

        // 1. Obtener eventos de hoy
        const [eventos] = await clientConn.query(`
            SELECT categoria, count(*) as total 
            FROM eventos_camia 
            WHERE usuario_id = ? AND DATE(fecha_inicio) = ?
            GROUP BY categoria
        `, [usuario_id, hoy]);

        // 2. Opcional: buscar facturas vencidas hoy (integración proactiva)
        const [facturas] = await clientConn.query(`
            SELECT count(*) as total 
            FROM facturas 
            WHERE estado = 'pendiente' AND DATE(fecha_vencimiento) <= ?
        `, [hoy]);

        res.json({
            success: true,
            resumen: {
                eventos: eventos,
                facturasVencidas: facturas[0].total
            }
        });
    } catch (err) {
        console.error('getResumenHoy error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener resumen de camIA' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
