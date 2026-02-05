const { connectToClientDB } = require('../config/dbFactory');
const { getPool } = require('../config/db');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

async function ensureCajaTables(clientConn) {
    await clientConn.query(`
        CREATE TABLE IF NOT EXISTS cajas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            sucursal_id INT,
            documento_id INT,
            impresora_config JSON,
            codigo_acceso VARCHAR(50),
            codigo_puc VARCHAR(20),
            cliente_defecto_id INT,
            estado ENUM('Activa', 'Inactiva') DEFAULT 'Activa',
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const [columnsCaja] = await clientConn.query("SHOW COLUMNS FROM cajas");
    const colNames = columnsCaja.map(c => c.Field);

    if (!colNames.includes('codigo_acceso')) {
        await clientConn.query("ALTER TABLE cajas ADD COLUMN codigo_acceso VARCHAR(50) NULL");
    }
    if (!colNames.includes('codigo_puc')) {
        await clientConn.query("ALTER TABLE cajas ADD COLUMN codigo_puc VARCHAR(20) NULL");
    }
    if (!colNames.includes('cliente_defecto_id')) {
        await clientConn.query("ALTER TABLE cajas ADD COLUMN cliente_defecto_id INT NULL");
    }

    await clientConn.query(`
        CREATE TABLE IF NOT EXISTS caja_sesiones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            sucursal_id INT,
            caja_id INT,
            fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_cierre DATETIME NULL,
            base_inicial DECIMAL(15,2) DEFAULT 0,
            monto_ventas_efectivo DECIMAL(15,2) DEFAULT 0,
            monto_ventas_otros DECIMAL(15,2) DEFAULT 0,
            monto_total_esperado DECIMAL(15,2) DEFAULT 0,
            monto_real_cierre DECIMAL(15,2) DEFAULT 0,
            diferencia DECIMAL(15,2) DEFAULT 0,
            observaciones TEXT,
            estado ENUM('Abierta', 'Cerrada') DEFAULT 'Abierta'
        )
    `);

    await clientConn.query(`
        CREATE TABLE IF NOT EXISTS caja_movimientos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sesion_id INT NOT NULL,
            tipo_movimiento ENUM('Ingreso', 'Egreso', 'Venta') NOT NULL,
            monto DECIMAL(15,2) NOT NULL,
            motivo VARCHAR(255),
            metodo_pago VARCHAR(50),
            referencia_id INT,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sesion_id) REFERENCES caja_sesiones(id)
        )
    `);

    const [columnsFac] = await clientConn.query("SHOW COLUMNS FROM facturas LIKE 'caja_sesion_id'");
    if (columnsFac.length === 0) {
        await clientConn.query("ALTER TABLE facturas ADD COLUMN caja_sesion_id INT NULL");
    }

    const [columnsSes] = await clientConn.query("SHOW COLUMNS FROM caja_sesiones LIKE 'caja_id'");
    if (columnsSes.length === 0) {
        await clientConn.query("ALTER TABLE caja_sesiones ADD COLUMN caja_id INT NULL");
    }
}

// --- GESTIÓN DE CAJAS DEFINICIÓN ---

exports.listarCajas = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        // Garantizar que las tablas existan
        await ensureCajaTables(clientConn);

        const [rows] = await clientConn.query(`
            SELECT c.*, 
                   s.nombre as sucursal_nombre,
                   d.nombre as documento_nombre,
                   ses.id as sesion_activa_id,
                   ses.usuario_id as sesion_usuario_id,
                   u.nombre as sesion_usuario_nombre,
                   t.nombre_comercial as cliente_defecto_nombre
            FROM cajas c
            LEFT JOIN sucursales s ON c.sucursal_id = s.id
            LEFT JOIN documentos d ON c.documento_id = d.id
            LEFT JOIN caja_sesiones ses ON c.id = ses.caja_id AND ses.estado = 'Abierta'
            LEFT JOIN usuarios u ON ses.usuario_id = u.id
            LEFT JOIN terceros t ON c.cliente_defecto_id = t.id
            ORDER BY c.nombre ASC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error listarCajas:', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearCaja = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        // Garantizar que las tablas existan antes de insertar
        await ensureCajaTables(clientConn);

        const { nombre, sucursal_id, documento_id, impresora_config, codigo_acceso, codigo_puc, cliente_defecto_id } = req.body;
        const [result] = await clientConn.query(
            "INSERT INTO cajas (nombre, sucursal_id, documento_id, impresora_config, codigo_acceso, codigo_puc, cliente_defecto_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [nombre, sucursal_id || null, documento_id || null, JSON.stringify(impresora_config || {}), codigo_acceso || null, codigo_puc || null, cliente_defecto_id || null]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('Error crearCaja:', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarCaja = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        const { nombre, sucursal_id, documento_id, impresora_config, estado, codigo_acceso, codigo_puc, cliente_defecto_id } = req.body;
        await clientConn.query(
            "UPDATE cajas SET nombre = ?, sucursal_id = ?, documento_id = ?, impresora_config = ?, estado = ?, codigo_acceso = ?, codigo_puc = ?, cliente_defecto_id = ? WHERE id = ?",
            [nombre, sucursal_id || null, documento_id || null, JSON.stringify(impresora_config || {}), estado, codigo_acceso || null, codigo_puc || null, cliente_defecto_id || null, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarCaja = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        await clientConn.query("DELETE FROM cajas WHERE id = ?", [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.abrirCaja = async (req, res) => {
    let clientConn = null;
    try {
        const { nit, id: userId } = req.user;
        const { sucursal_id, base_inicial, caja_id, codigo_acceso } = req.body;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await ensureCajaTables(clientConn);

        // 1. Validar código de acceso de la caja
        const [cajaInfo] = await clientConn.query("SELECT codigo_acceso FROM cajas WHERE id = ?", [caja_id]);
        if (cajaInfo.length === 0) return res.status(404).json({ success: false, message: 'Caja no encontrada' });

        const codigoReal = cajaInfo[0].codigo_acceso;
        if (codigoReal && codigoReal.trim() !== '' && codigoReal !== codigo_acceso) {
            return res.status(401).json({ success: false, message: 'Código de acceso incorrecto para esta caja' });
        }

        // 2. Verificar si ya tiene una caja abierta
        const [abiertas] = await clientConn.query(
            "SELECT id FROM caja_sesiones WHERE usuario_id = ? AND estado = 'Abierta'",
            [userId]
        );

        if (abiertas.length > 0) {
            return res.status(400).json({ success: false, message: 'Ya tienes una sesión de caja abierta' });
        }

        const [result] = await clientConn.query(
            "INSERT INTO caja_sesiones (usuario_id, sucursal_id, caja_id, base_inicial, monto_total_esperado, estado) VALUES (?, ?, ?, ?, ?, 'Abierta')",
            [userId, sucursal_id || null, caja_id || null, base_inicial || 0, base_inicial || 0]
        );

        res.json({ success: true, message: 'Caja abierta correctamente', sesion_id: result.insertId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.verificarCaja = async (req, res) => {
    let clientConn = null;
    try {
        const { nit, id: userId } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await ensureCajaTables(clientConn);

        const [rows] = await clientConn.query(`
            SELECT s.*, c.cliente_defecto_id, c.codigo_puc, 
                   t.nombre_comercial as cliente_defecto_nombre,
                   t.documento as cliente_defecto_documento
            FROM caja_sesiones s
            LEFT JOIN cajas c ON s.caja_id = c.id
            LEFT JOIN terceros t ON c.cliente_defecto_id = t.id
            WHERE s.usuario_id = ? AND s.estado = 'Abierta' 
            LIMIT 1
        `, [userId]);

        if (rows.length === 0) {
            return res.json({ success: true, abierta: false });
        }

        res.json({ success: true, abierta: true, data: rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.obtenerTotalesCaja = async (req, res) => {
    let clientConn = null;
    try {
        const { nit, id: userId } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const [sesiones] = await clientConn.query(
            "SELECT * FROM caja_sesiones WHERE usuario_id = ? AND estado = 'Abierta' LIMIT 1",
            [userId]
        );

        if (sesiones.length === 0) {
            return res.status(404).json({ success: false, message: 'No hay sesión activa' });
        }

        const sesion = sesiones[0];

        // Obtener resumen de ventas por método de pago de esta sesión
        // Las facturas tienen caja_sesion_id
        const [ventas] = await clientConn.query(
            "SELECT metodo_pago, SUM(total) as total FROM facturas WHERE caja_sesion_id = ? GROUP BY metodo_pago",
            [sesion.id]
        );

        res.json({ success: true, sesion, ventas });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.cerrarCaja = async (req, res) => {
    let clientConn = null;
    try {
        const { nit, id: userId } = req.user;
        const { monto_real, observaciones } = req.body;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const [sesiones] = await clientConn.query(
            "SELECT * FROM caja_sesiones WHERE usuario_id = ? AND estado = 'Abierta' LIMIT 1",
            [userId]
        );

        if (sesiones.length === 0) {
            return res.status(404).json({ success: false, message: 'No hay sesión activa para cerrar' });
        }

        const sesion = sesiones[0];
        const diferencia = parseFloat(monto_real) - (parseFloat(sesion.monto_total_esperado || 0));

        await clientConn.query(
            "UPDATE caja_sesiones SET fecha_cierre = CURRENT_TIMESTAMP, monto_real_cierre = ?, diferencia = ?, observaciones = ?, estado = 'Cerrada' WHERE id = ?",
            [monto_real, diferencia, observaciones || '', sesion.id]
        );

        res.json({ success: true, message: 'Caja cerrada correctamente' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
