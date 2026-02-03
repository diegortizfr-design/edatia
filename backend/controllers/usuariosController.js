const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');
const { initializeTenantDB } = require('../utils/tenantInit');
const bcrypt = require('bcrypt');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.listarUsuarios = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const [rows] = await clientConn.query(`
            SELECT u.id, u.nombre, u.usuario, u.email, u.telefono, u.estado, u.created_at,
                   u.rol_id, r.nombre as rol_nombre,
                   u.cargo_id, c.nombre as cargo_nombre,
                   u.tercero_id, t.nombre_comercial as tercero_nombre
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            LEFT JOIN cargos c ON u.cargo_id = c.id
            LEFT JOIN terceros t ON u.tercero_id = t.id
            ORDER BY u.nombre ASC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
            try {
                await initializeTenantDB(await getClientDbConfig(req.user.nit));
                return res.status(503).json({ success: false, message: 'Esquema actualizado. Reintente por favor.' });
            } catch (migErr) { console.error('Migration failed:', migErr); }
        }
        res.status(500).json({ success: false, message: 'Error al listar usuarios' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearUsuario = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        let { nombre, usuario, email, password, rol_id, cargo_id, telefono, tercero_id } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
        }

        if (!tercero_id) {
            return res.status(400).json({ success: false, message: 'El usuario debe estar vinculado a un colaborador' });
        }

        // If tercero_id is provided, inherit cargo_id from tercero
        if (tercero_id) {
            const [terceroRows] = await clientConn.query('SELECT cargo_id FROM terceros WHERE id = ?', [tercero_id]);
            if (terceroRows.length > 0 && terceroRows[0].cargo_id) {
                cargo_id = terceroRows[0].cargo_id;
            }
        }

        const hashed = await bcrypt.hash(password, 10);

        await clientConn.query(`
            INSERT INTO usuarios (nombre, usuario, email, password, contraseña, rol_id, cargo_id, telefono, tercero_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [nombre, usuario, email, hashed, hashed, rol_id || null, cargo_id || null, telefono || null, tercero_id || null]);

        res.status(201).json({ success: true, message: 'Usuario creado exitosamente' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'El nombre de usuario ya existe' });
        }
        console.error(err);
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
            try {
                await initializeTenantDB(await getClientDbConfig(req.user.nit));
                return res.status(503).json({ success: false, message: 'Esquema actualizado. Reintente por favor.' });
            } catch (migErr) { console.error('Migration failed:', migErr); }
        }
        res.status(500).json({ success: false, message: 'Error al crear usuario' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarUsuario = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        let { nombre, usuario, email, password, rol_id, cargo_id, telefono, estado, tercero_id } = req.body;

        if (!tercero_id) {
            return res.status(400).json({ success: false, message: 'El usuario debe estar vinculado a un colaborador' });
        }

        // If tercero_id is provided, inherit cargo_id from tercero
        if (tercero_id) {
            const [terceroRows] = await clientConn.query('SELECT cargo_id FROM terceros WHERE id = ?', [tercero_id]);
            if (terceroRows.length > 0 && terceroRows[0].cargo_id) {
                cargo_id = terceroRows[0].cargo_id;
            }
        }

        let sql = 'UPDATE usuarios SET nombre = ?, usuario = ?, email = ?, rol_id = ?, cargo_id = ?, telefono = ?, estado = ?, tercero_id = ?';
        let params = [nombre, usuario, email, rol_id || null, cargo_id || null, telefono || null, estado, tercero_id || null];

        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            sql += ', password = ?, contraseña = ?';
            params.push(hashed, hashed);
        }

        sql += ' WHERE id = ?';
        params.push(id);

        await clientConn.query(sql, params);
        res.json({ success: true, message: 'Usuario actualizado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarUsuario = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;

        if (id == req.user.id) {
            return res.status(400).json({ success: false, message: 'No puedes eliminar tu propio usuario' });
        }

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ success: true, message: 'Usuario eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.listarRoles = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        const [rows] = await clientConn.query('SELECT * FROM roles ORDER BY nombre ASC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
            try {
                await initializeTenantDB(await getClientDbConfig(req.user.nit));
                return res.status(503).json({ success: false, message: 'Esquema actualizado. Reintente por favor.' });
            } catch (migErr) { console.error('Migration failed:', migErr); }
        }
        res.status(500).json({ success: false, message: 'Error al listar roles' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearRol = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { nombre, descripcion } = req.body;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        await clientConn.query('INSERT INTO roles (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
        res.status(201).json({ success: true, message: 'Rol creado' });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
            try {
                await initializeTenantDB(await getClientDbConfig(req.user.nit));
                return res.status(503).json({ success: false, message: 'Esquema actualizado. Reintente por favor.' });
            } catch (migErr) { console.error('Migration failed:', migErr); }
        }
        res.status(500).json({ success: false, message: 'Error al crear rol' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarRol = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const { nombre, descripcion } = req.body;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        await clientConn.query('UPDATE roles SET nombre = ?, descripcion = ? WHERE id = ?', [nombre, descripcion, id]);
        res.json({ success: true, message: 'Rol actualizado' });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
            try {
                await initializeTenantDB(await getClientDbConfig(req.user.nit));
                return res.status(503).json({ success: false, message: 'Esquema actualizado. Reintente por favor.' });
            } catch (migErr) { console.error('Migration failed:', migErr); }
        }
        res.status(500).json({ success: false, message: 'Error al actualizar rol' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarRol = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        await clientConn.query('DELETE FROM roles WHERE id = ?', [id]);
        res.json({ success: true, message: 'Rol eliminado' });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
            try {
                await initializeTenantDB(await getClientDbConfig(req.user.nit));
                return res.status(503).json({ success: false, message: 'Esquema actualizado. Reintente por favor.' });
            } catch (migErr) { console.error('Migration failed:', migErr); }
        }
        res.status(500).json({ success: false, message: 'Error al eliminar rol' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.listarCargos = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        const [rows] = await clientConn.query(`
            SELECT c.*, r.nombre as rol_nombre 
            FROM cargos c 
            LEFT JOIN roles r ON c.rol_id = r.id 
            ORDER BY c.nombre ASC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
            try {
                await initializeTenantDB(await getClientDbConfig(req.user.nit));
                return res.status(503).json({ success: false, message: 'Esquema actualizado. Reintente por favor.' });
            } catch (migErr) { console.error('Migration failed:', migErr); }
        }
        res.status(500).json({ success: false, message: 'Error al listar cargos' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearCargo = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { nombre, descripcion, rol_id } = req.body;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        await clientConn.query('INSERT INTO cargos (nombre, descripcion, rol_id) VALUES (?, ?, ?)',
            [nombre, descripcion || null, rol_id || null]);
        res.status(201).json({ success: true, message: 'Cargo creado' });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
            try {
                await initializeTenantDB(await getClientDbConfig(req.user.nit));
                return res.status(503).json({ success: false, message: 'Esquema actualizado. Reintente por favor.' });
            } catch (migErr) { console.error('Migration failed:', migErr); }
        }
        res.status(500).json({ success: false, message: 'Error al crear cargo' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarCargo = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const { nombre, descripcion, rol_id } = req.body;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        await clientConn.query('UPDATE cargos SET nombre = ?, descripcion = ?, rol_id = ? WHERE id = ?',
            [nombre, descripcion || null, rol_id || null, id]);
        res.json({ success: true, message: 'Cargo actualizado' });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
            try {
                await initializeTenantDB(await getClientDbConfig(req.user.nit));
                return res.status(503).json({ success: false, message: 'Esquema actualizado. Reintente por favor.' });
            } catch (migErr) { console.error('Migration failed:', migErr); }
        }
        res.status(500).json({ success: false, message: 'Error al actualizar cargo' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarCargo = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        await clientConn.query('DELETE FROM cargos WHERE id = ?', [id]);
        res.json({ success: true, message: 'Cargo eliminado' });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
            try {
                await initializeTenantDB(await getClientDbConfig(req.user.nit));
                return res.status(503).json({ success: false, message: 'Esquema actualizado. Reintente por favor.' });
            } catch (migErr) { console.error('Migration failed:', migErr); }
        }
        res.status(500).json({ success: false, message: 'Error al eliminar cargo' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.listarColaboradores = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        const [rows] = await clientConn.query('SELECT id, nombre_comercial, razon_social, documento FROM terceros WHERE es_colaborador = 1 ORDER BY nombre_comercial ASC');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al listar colaboradores' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
