// backend/controllers/empresaController.js
const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

/**
 * Obtiene la configuración de conexión de la empresa basada en el NIT del usuario
 */
async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

async function listarEmpresas(req, res) {
    let clientConn = null;
    try {
        // 1. Identificar al usuario y su NIT desde el token
        const { nit } = req.user;
        if (!nit) return res.status(400).json({ success: false, message: 'Usuario no tiene NIT asociado' });

        // 2. Obtener credenciales de la BD del cliente
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Configuración de empresa no encontrada' });

        // 3. Conectar a la BD del cliente
        clientConn = await connectToClientDB(dbConfig);

        // 4. Consultar la tabla de información
        const [rows] = await clientConn.query('SELECT * FROM informacion_empresa LIMIT 1');

        const empresaData = rows.length > 0 ? rows[0] : {};

        res.json({ success: true, empresa: empresaData });

    } catch (err) {
        console.error('listarEmpresas error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener datos de empresa' });
    } finally {
        if (clientConn) await clientConn.end();
    }
}

async function crearEmpresa(req, res) {
    let clientConn = null;
    try {
        const { nit } = req.user; // Obtener NIT del token seguro
        if (!nit) return res.status(400).json({ success: false, message: 'Token inválido: falta NIT' });

        const {
            tipo_figura, nombre_fiscal, nombre_comercial,
            dv, direccion, telefono, correo, web, estado, logo_url
        } = req.body;

        // 2. Obtener credenciales BD cliente
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no configurada' });

        // 3. Conectar BD Cliente
        clientConn = await connectToClientDB(dbConfig);

        // 4. Revisar si ya existe registro
        const [existing] = await clientConn.query('SELECT id FROM informacion_empresa LIMIT 1');

        if (existing.length > 0) {
            // UPDATE
            const updateSQL = `
                UPDATE informacion_empresa 
                SET tipo_figura=?, nombre_fiscal=?, nombre_comercial=?, nit=?, dv=?, 
                    direccion=?, telefono=?, email=?, sitio_web=?, logo_url=?, estado=?
                WHERE id=?
            `;
            // Nota: usamos 'email' y 'sitio_web' según el esquema SQL nuevo
            await clientConn.query(updateSQL, [
                tipo_figura, nombre_fiscal, nombre_comercial, nit, dv,
                direccion, telefono, correo, web, logo_url, estado, existing[0].id
            ]);
        } else {
            // INSERT
            const insertSQL = `
                INSERT INTO informacion_empresa 
                (tipo_figura, nombre_fiscal, nombre_comercial, nit, dv, direccion, telefono, email, sitio_web, logo_url, estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await clientConn.query(insertSQL, [
                tipo_figura, nombre_fiscal, nombre_comercial, nit, dv,
                direccion, telefono, correo, web, logo_url, estado
            ]);
        }

        // Opcional: Actualizar nombre en la BD Maestra (empresasconfig) para referencia rápida
        // pero NO es crítico para el funcionamiento interno.
        const pool = getPool();
        await pool.query('UPDATE empresasconfig SET nombre_carpeta = ? WHERE nit = ?', [nombre_comercial, nit]);

        res.status(200).json({ success: true, message: 'Información actualizada correctamente' });

    } catch (err) {
        console.error('crearEmpresa error:', err);
        res.status(500).json({ success: false, message: 'Error guardando configuración' });
    } finally {
        if (clientConn) await clientConn.end();
    }
}

module.exports = { listarEmpresas, crearEmpresa };
