const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');
const { initializeTenantDB } = require('../utils/tenantInit');

// Helper: Obtener config de BD del cliente
async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.listarDocumentos = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        // Vamos a hacer un JOIN con sucursales para mostrar el nombre de la sucursal
        const sql = `
            SELECT d.*, s.nombre as nombre_sucursal 
            FROM documentos d
            LEFT JOIN sucursales s ON d.sucursal_id = s.id
            ORDER BY d.nombre ASC
        `;

        const [rows] = await clientConn.query(sql);
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('listarDocumentos error:', err);
        // Si la tabla no existe, devolver array vacío en vez de error 500 para evitar bloqueos
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ success: true, data: [] });
        }
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearDocumento = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        const {
            sucursal_id, categoria, nombre, prefijo, consecutivo_actual,
            resolucion_numero, resolucion_fecha, resolucion_fecha_vencimiento,
            resolucion_rango_inicial, resolucion_rango_final, resolucion_texto,
            documento_equivalente, tipo_doc_electronico, excluir_impuestos, estado
        } = req.body;

        if (!nombre || !sucursal_id) {
            return res.status(400).json({ success: false, message: 'Nombre y Sucursal son obligatorios' });
        }

        const sql = `
            INSERT INTO documentos 
            (sucursal_id, categoria, nombre, prefijo, consecutivo_actual, resolucion_numero, 
             resolucion_fecha, resolucion_fecha_vencimiento, resolucion_rango_inicial, 
             resolucion_rango_final, resolucion_texto, documento_equivalente, 
             tipo_doc_electronico, excluir_impuestos, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await clientConn.query(sql, [
            sucursal_id, categoria, nombre, prefijo, consecutivo_actual || 1,
            resolucion_numero, resolucion_fecha || null, resolucion_fecha_vencimiento || null,
            resolucion_rango_inicial, resolucion_rango_final, resolucion_texto,
            documento_equivalente, tipo_doc_electronico, excluir_impuestos ? 1 : 0, estado ? 1 : 0
        ]);

        res.status(201).json({ success: true, message: 'Documento configurado correctamente' });

    } catch (err) {
        // Auto-fix schema mismatch (Lazy Migration)
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
            console.warn(`[Schema Mismatch] in crearDocumento for NIT ${req.user.nit}. Running migration...`);
            try {
                await initializeTenantDB(await getClientDbConfig(req.user.nit));
                return res.status(503).json({ success: false, message: 'El sistema ha actualizado la base de datos. Por favor, intente guardar de nuevo.' });
            } catch (migErr) {
                console.error('Migration failed:', migErr);
            }
        }

        console.error('crearDocumento error:', err);
        res.status(500).json({ success: false, message: 'Error al crear documento: ' + err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarDocumento = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const {
            sucursal_id, categoria, nombre, prefijo, consecutivo_actual,
            resolucion_numero, resolucion_fecha, resolucion_fecha_vencimiento,
            resolucion_rango_inicial, resolucion_rango_final, resolucion_texto,
            documento_equivalente, tipo_doc_electronico, excluir_impuestos, estado
        } = req.body;

        const sql = `
            UPDATE documentos
            SET sucursal_id = ?, categoria = ?, nombre = ?, prefijo = ?, consecutivo_actual = ?,
                resolucion_numero = ?, resolucion_fecha = ?, resolucion_fecha_vencimiento = ?,
                resolucion_rango_inicial = ?, resolucion_rango_final = ?, resolucion_texto = ?,
                documento_equivalente = ?, tipo_doc_electronico = ?, excluir_impuestos = ?, estado = ?
            WHERE id = ?
        `;

        await clientConn.query(sql, [
            sucursal_id, categoria, nombre, prefijo, consecutivo_actual,
            resolucion_numero, resolucion_fecha || null, resolucion_fecha_vencimiento || null,
            resolucion_rango_inicial, resolucion_rango_final, resolucion_texto,
            documento_equivalente, tipo_doc_electronico, excluir_impuestos ? 1 : 0, estado ? 1 : 0,
            id
        ]);

        res.json({ success: true, message: 'Documento actualizado' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al actualizar' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarDocumento = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('DELETE FROM documentos WHERE id = ?', [id]);
        res.json({ success: true, message: 'Documento eliminado' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al eliminar' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
