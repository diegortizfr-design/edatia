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

        // DDL Removed


        const [rows] = await clientConn.query('SELECT * FROM sucursales ORDER BY id DESC');

        // Lazy Migration: Add new columns if they don't exist
        const [columns] = await clientConn.query("SHOW COLUMNS FROM sucursales");
        const columnNames = columns.map(c => c.Field);

        const columnsToAdd = [
            { name: 'pais', def: "VARCHAR(100) DEFAULT 'Colombia'" },
            { name: 'departamento', def: "VARCHAR(100)" },
            { name: 'ciudad', def: "VARCHAR(100)" },
            { name: 'barrio', def: "VARCHAR(100)" },
            { name: 'es_tienda_fisica', def: "TINYINT(1) DEFAULT 0" },
            { name: 'es_bodega', def: "TINYINT(1) DEFAULT 0" }
        ];

        for (const col of columnsToAdd) {
            if (!columnNames.includes(col.name)) {
                await clientConn.query(`ALTER TABLE sucursales ADD COLUMN ${col.name} ${col.def}`);
            }
        }

        // Si no hay sucursales, crear una por defecto
        if (rows.length === 0) {
            const insertSQL = `
                INSERT INTO sucursales (nombre, direccion, pais, departamento, ciudad, telefono, es_principal, es_tienda_fisica, es_bodega)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
            `;
            await clientConn.query(insertSQL, ['Principal', 'Dirección General', 'Colombia', 'Antioquia', 'Medellín', '-', 1]);
            const [newRows] = await clientConn.query('SELECT * FROM sucursales');
            return res.json({ success: true, data: newRows });
        }

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
        const { nombre, direccion, telefono, estado, pais, departamento, ciudad, barrio, es_tienda_fisica, es_bodega } = req.body;

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no configurada' });

        clientConn = await connectToClientDB(dbConfig);

        const insertSQL = `
            INSERT INTO sucursales 
            (nombre, direccion, telefono, estado, pais, departamento, ciudad, barrio, es_tienda_fisica, es_bodega)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await clientConn.query(insertSQL, [
            nombre, direccion, telefono, estado,
            pais || 'Colombia', departamento, ciudad, barrio,
            es_tienda_fisica ? 1 : 0, es_bodega ? 1 : 0
        ]);

        res.status(200).json({ success: true, message: 'Sucursal creada correctamente' });

    } catch (err) {
        console.error('crearSucursal error:', err);
        res.status(500).json({ success: false, message: 'Error guardando sucursal' });
    } finally {
        if (clientConn) await clientConn.end();
    }
}

async function actualizarSucursal(req, res) {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const { nombre, direccion, telefono, estado, pais, departamento, ciudad, barrio, es_tienda_fisica, es_bodega } = req.body;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const updateSQL = `
            UPDATE sucursales 
            SET nombre=?, direccion=?, telefono=?, estado=?, pais=?, departamento=?, ciudad=?, barrio=?, es_tienda_fisica=?, es_bodega=?
            WHERE id=?
        `;

        await clientConn.query(updateSQL, [
            nombre, direccion, telefono, estado,
            pais, departamento, ciudad, barrio,
            es_tienda_fisica ? 1 : 0, es_bodega ? 1 : 0,
            id
        ]);

        res.json({ success: true, message: 'Sucursal actualizada correctamente' });

    } catch (err) {
        console.error('actualizarSucursal error:', err);
        res.status(500).json({ success: false, message: 'Error actualizando sucursal' });
    } finally {
        if (clientConn) await clientConn.end();
    }
}

module.exports = { listarSucursales, crearSucursal, actualizarSucursal };
