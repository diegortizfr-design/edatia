const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

/**
 * Helper: Obtiene la configuración de conexión basada en el NIT del usuario
 */
async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

async function listarSucursales(req, res) {
    let clientConn = null;
    try {
        const { nit } = req.user;
        if (!nit) return res.status(400).json({ success: false, message: 'Usuario no tiene NIT asociado' });

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Configuración de empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        // Crear tabla si no existe (seguridad para evitar errores en primera ejecución)
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS sucursales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                direccion VARCHAR(255) NOT NULL,
                telefono VARCHAR(50),
                estado VARCHAR(20) DEFAULT 'Activa',
                es_principal BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const [rows] = await clientConn.query('SELECT * FROM sucursales ORDER BY id DESC');
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('listarSucursales error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener sucursales' });
    } finally {
        if (clientConn) await clientConn.end();
    }
}

async function crearSucursal(req, res) {
    let clientConn = null;
    try {
        const { nit } = req.user;
        if (!nit) return res.status(400).json({ success: false, message: 'Token inválido: falta NIT' });

        const { nombre, direccion, telefono, estado } = req.body;

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no configurada' });

        clientConn = await connectToClientDB(dbConfig);

        // Asegurar que exista tabla
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS sucursales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                direccion VARCHAR(255) NOT NULL,
                telefono VARCHAR(50),
                estado VARCHAR(20) DEFAULT 'Activa',
                es_principal BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // INSERT
        const insertSQL = `
            INSERT INTO sucursales (nombre, direccion, telefono, estado)
            VALUES (?, ?, ?, ?)
        `;

        await clientConn.query(insertSQL, [nombre, direccion, telefono, estado]);

        res.status(200).json({ success: true, message: 'Sucursal creada correctamente' });

    } catch (err) {
        console.error('crearSucursal error:', err);
        res.status(500).json({ success: false, message: 'Error guardando sucursal' });
    } finally {
        if (clientConn) await clientConn.end();
    }
}

module.exports = { listarSucursales, crearSucursal };
