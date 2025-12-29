const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

// Helper: Obtener config de BD del cliente
async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.listarTerceros = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        // Filtros opcionales (ej: ?tipo=cliente o ?tipo=proveedor)
        const { tipo } = req.query;
        let query = 'SELECT * FROM terceros';
        const params = [];

        if (tipo === 'cliente') {
            query += ' WHERE es_cliente = 1';
        } else if (tipo === 'proveedor') {
            query += ' WHERE es_proveedor = 1';
        } else {
            // Default: orden alfabético
            query += ' ORDER BY nombre_comercial ASC';
        }

        const [rows] = await clientConn.query(query, params);
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('listarTerceros error:', err);
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearTercero = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        const {
            nombre_comercial, razon_social, tipo_documento, documento,
            direccion, telefono, email, es_cliente, es_proveedor
        } = req.body;

        if (!nombre_comercial || !documento) {
            return res.status(400).json({ success: false, message: 'Nombre y Documento son obligatorios' });
        }

        // Validar duplicados
        const [exists] = await clientConn.query('SELECT id FROM terceros WHERE documento = ?', [documento]);
        if (exists.length > 0) {
            return res.status(400).json({ success: false, message: 'Ya existe un tercero con ese documento' });
        }

        const sql = `
            INSERT INTO terceros 
            (nombre_comercial, razon_social, tipo_documento, documento, direccion, telefono, email, es_cliente, es_proveedor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await clientConn.query(sql, [
            nombre_comercial, razon_social || nombre_comercial, tipo_documento, documento,
            direccion, telefono, email, es_cliente ? 1 : 0, es_proveedor ? 1 : 0
        ]);

        res.status(201).json({ success: true, message: 'Tercero creado correctamente' });

    } catch (err) {
        console.error('crearTercero error:', err);
        res.status(500).json({ success: false, message: 'Error al crear tercero' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarTercero = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const {
            nombre_comercial, razon_social, tipo_documento, documento,
            direccion, telefono, email, es_cliente, es_proveedor
        } = req.body;

        const sql = `
            UPDATE terceros
            SET nombre_comercial = ?, razon_social = ?, tipo_documento = ?, documento = ?, 
                direccion = ?, telefono = ?, email = ?,
                es_cliente = ?, es_proveedor = ?
            WHERE id = ?
        `;

        await clientConn.query(sql, [
            nombre_comercial, razon_social, tipo_documento, documento,
            direccion, telefono, email,
            es_cliente ? 1 : 0, es_proveedor ? 1 : 0, id
        ]);

        res.json({ success: true, message: 'Tercero actualizado' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al actualizar' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarTercero = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        // Validar si tiene relaciones (facturas/compras) antes de borrar
        // Por simplicidad, intentamos borrar y si falla por FK capturamos el error
        try {
            await clientConn.query('DELETE FROM terceros WHERE id = ?', [id]);
            res.json({ success: true, message: 'Tercero eliminado' });
        } catch (fkError) {
            if (fkError.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ success: false, message: 'No se puede eliminar: Este tercero tiene movimientos asociados.' });
            }
            throw fkError;
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error la eliminar' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
