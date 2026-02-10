const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

// ===== COUNTRIES =====
exports.listarPaises = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);
        const [rows] = await clientConn.query('SELECT * FROM paises ORDER BY nombre ASC');
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('listarPaises error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener países' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearPais = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { nombre, codigo } = req.body;

        if (!nombre) return res.status(400).json({ success: false, message: 'Nombre es obligatorio' });

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('INSERT INTO paises (nombre, codigo) VALUES (?, ?)', [nombre, codigo]);
        res.status(201).json({ success: true, message: 'País creado' });

    } catch (err) {
        console.error('crearPais error:', err);
        res.status(500).json({ success: false, message: 'Error al crear país' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarPais = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const { nombre, codigo } = req.body;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('UPDATE paises SET nombre = ?, codigo = ? WHERE id = ?', [nombre, codigo, id]);
        res.json({ success: true, message: 'País actualizado' });

    } catch (err) {
        console.error('actualizarPais error:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar país' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarPais = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('DELETE FROM paises WHERE id = ?', [id]);
        res.json({ success: true, message: 'País eliminado' });

    } catch (err) {
        console.error('eliminarPais error:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar país' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// ===== DEPARTMENTS =====
exports.listarDepartamentos = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { pais_id } = req.query;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        let query = 'SELECT d.*, p.nombre as pais_nombre FROM departamentos d LEFT JOIN paises p ON d.pais_id = p.id';
        const params = [];

        if (pais_id) {
            query += ' WHERE d.pais_id = ?';
            params.push(pais_id);
        }

        query += ' ORDER BY d.nombre ASC';
        const [rows] = await clientConn.query(query, params);
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('listarDepartamentos error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener departamentos' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearDepartamento = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { pais_id, nombre, codigo } = req.body;

        if (!nombre || !pais_id) return res.status(400).json({ success: false, message: 'Nombre y País son obligatorios' });

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('INSERT INTO departamentos (pais_id, nombre, codigo) VALUES (?, ?, ?)', [pais_id, nombre, codigo]);
        res.status(201).json({ success: true, message: 'Departamento creado' });

    } catch (err) {
        console.error('crearDepartamento error:', err);
        res.status(500).json({ success: false, message: 'Error al crear departamento' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarDepartamento = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const { pais_id, nombre, codigo } = req.body;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('UPDATE departamentos SET pais_id = ?, nombre = ?, codigo = ? WHERE id = ?', [pais_id, nombre, codigo, id]);
        res.json({ success: true, message: 'Departamento actualizado' });

    } catch (err) {
        console.error('actualizarDepartamento error:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar departamento' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarDepartamento = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('DELETE FROM departamentos WHERE id = ?', [id]);
        res.json({ success: true, message: 'Departamento eliminado' });

    } catch (err) {
        console.error('eliminarDepartamento error:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar departamento' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// ===== CITIES =====
exports.listarCiudades = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { departamento_id } = req.query;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        let query = 'SELECT c.*, d.nombre as departamento_nombre FROM ciudades c LEFT JOIN departamentos d ON c.departamento_id = d.id';
        const params = [];

        if (departamento_id) {
            query += ' WHERE c.departamento_id = ?';
            params.push(departamento_id);
        }

        query += ' ORDER BY c.nombre ASC';
        const [rows] = await clientConn.query(query, params);
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('listarCiudades error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener ciudades' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearCiudad = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { departamento_id, nombre, codigo } = req.body;

        if (!nombre || !departamento_id) return res.status(400).json({ success: false, message: 'Nombre y Departamento son obligatorios' });

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('INSERT INTO ciudades (departamento_id, nombre, codigo) VALUES (?, ?, ?)', [departamento_id, nombre, codigo]);
        res.status(201).json({ success: true, message: 'Ciudad creada' });

    } catch (err) {
        console.error('crearCiudad error:', err);
        res.status(500).json({ success: false, message: 'Error al crear ciudad' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarCiudad = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const { departamento_id, nombre, codigo } = req.body;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('UPDATE ciudades SET departamento_id = ?, nombre = ?, codigo = ? WHERE id = ?', [departamento_id, nombre, codigo, id]);
        res.json({ success: true, message: 'Ciudad actualizada' });

    } catch (err) {
        console.error('actualizarCiudad error:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar ciudad' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarCiudad = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('DELETE FROM ciudades WHERE id = ?', [id]);
        res.json({ success: true, message: 'Ciudad eliminada' });

    } catch (err) {
        console.error('eliminarCiudad error:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar ciudad' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
