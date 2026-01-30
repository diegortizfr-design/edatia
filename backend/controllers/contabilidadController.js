const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

// Helper para obtener config del cliente (Multi-tenant)
async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

// Obtener todo el PUC
exports.getPUC = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        const [rows] = await clientConn.query('SELECT * FROM contabilidad_puc ORDER BY codigo ASC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getPUC error:', err);
        // Manejo básico de error si la tabla no existe
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ success: true, data: [], message: 'Tabla PUC no inicializada' });
        }
        res.status(500).json({ success: false, message: 'Error al obtener PUC' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Crear Nueva Cuenta
exports.createAccount = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        const { codigo, nombre, naturaleza, nivel, tipo, requiere_tercero, requiere_costos, requiere_base, estado } = req.body;

        if (!codigo || !nombre) {
            return res.status(400).json({ success: false, message: 'Código y Nombre obligatorios' });
        }

        const sql = `
            INSERT INTO contabilidad_puc 
            (codigo, nombre, naturaleza, nivel, tipo, requiere_tercero, requiere_costos, requiere_base, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await clientConn.query(sql, [
            codigo,
            nombre.toUpperCase(),
            naturaleza,
            nivel,
            tipo,
            requiere_tercero ? 1 : 0,
            requiere_costos ? 1 : 0,
            requiere_base ? 1 : 0,
            estado || 'Activa'
        ]);

        res.status(201).json({ success: true, message: 'Cuenta creada exitosamente' });

    } catch (err) {
        console.error('createAccount error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'El código de cuenta ya existe' });
        }
        res.status(500).json({ success: false, message: 'Error al crear la cuenta' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
// Importación masiva (Bulk) de Cuentas (Plantilla)
exports.bulkImportPUC = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);
        const accounts = req.body; // Array de objetos

        if (!Array.isArray(accounts)) {
            return res.status(400).json({ success: false, message: 'Se esperaba un array de cuentas' });
        }

        await clientConn.beginTransaction();

        const sql = `
            INSERT IGNORE INTO contabilidad_puc 
            (codigo, nombre, naturaleza, nivel, tipo, requiere_tercero, requiere_costos, requiere_base, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (const acc of accounts) {
            await clientConn.query(sql, [
                acc.codigo,
                acc.nombre.toUpperCase(),
                acc.naturaleza,
                acc.nivel,
                acc.tipo,
                acc.requiere_tercero ? 1 : 0,
                acc.requiere_costos ? 1 : 0,
                acc.requiere_base ? 1 : 0,
                acc.estado || 'Activa'
            ]);
        }

        await clientConn.commit();
        res.json({ success: true, message: `${accounts.length} cuentas procesadas exitosamente.` });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('bulkImportPUC error:', err);
        res.status(500).json({ success: false, message: 'Error en importación masiva' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
