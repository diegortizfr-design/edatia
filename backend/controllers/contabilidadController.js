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

// ============================================
// PUC - EDICIÓN Y ELIMINACIÓN
// ============================================

// Editar cuenta existente
exports.updateAccount = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { codigo } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        const { nombre, naturaleza, requiere_tercero, requiere_costos, requiere_base, estado } = req.body;

        if (!nombre) {
            return res.status(400).json({ success: false, message: 'Nombre es obligatorio' });
        }

        const sql = `
            UPDATE contabilidad_puc 
            SET nombre = ?, naturaleza = ?, requiere_tercero = ?, requiere_costos = ?, requiere_base = ?, estado = ?
            WHERE codigo = ?
        `;

        const [result] = await clientConn.query(sql, [
            nombre.toUpperCase(),
            naturaleza,
            requiere_tercero ? 1 : 0,
            requiere_costos ? 1 : 0,
            requiere_base ? 1 : 0,
            estado || 'Activa',
            codigo
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        res.json({ success: true, message: 'Cuenta actualizada exitosamente' });

    } catch (err) {
        console.error('updateAccount error:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar la cuenta' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Eliminar cuenta (validar que no tenga movimientos)
exports.deleteAccount = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { codigo } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        // Verificar si tiene movimientos
        const [movimientos] = await clientConn.query(
            'SELECT COUNT(*) as count FROM contabilidad_movimientos WHERE cuenta_codigo = ?',
            [codigo]
        );

        if (movimientos[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar una cuenta con movimientos contables'
            });
        }

        const [result] = await clientConn.query('DELETE FROM contabilidad_puc WHERE codigo = ?', [codigo]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        res.json({ success: true, message: 'Cuenta eliminada exitosamente' });

    } catch (err) {
        console.error('deleteAccount error:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar la cuenta' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// ============================================
// COMPROBANTES CONTABLES
// ============================================

// Obtener todos los comprobantes con filtros
exports.getComprobantes = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { tipo, estado, fecha_inicio, fecha_fin } = req.query;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        let sql = 'SELECT * FROM contabilidad_comprobantes WHERE 1=1';
        const params = [];

        if (tipo) {
            sql += ' AND tipo = ?';
            params.push(tipo);
        }
        if (estado) {
            sql += ' AND estado = ?';
            params.push(estado);
        }
        if (fecha_inicio) {
            sql += ' AND fecha >= ?';
            params.push(fecha_inicio);
        }
        if (fecha_fin) {
            sql += ' AND fecha <= ?';
            params.push(fecha_fin);
        }

        sql += ' ORDER BY fecha DESC, numero DESC';

        const [rows] = await clientConn.query(sql, params);
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('getComprobantes error:', err);
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ success: true, data: [], message: 'Tabla de comprobantes no inicializada' });
        }
        res.status(500).json({ success: false, message: 'Error al obtener comprobantes' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Obtener comprobante por ID con sus movimientos
exports.getComprobanteById = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        const [comprobante] = await clientConn.query(
            'SELECT * FROM contabilidad_comprobantes WHERE id = ?',
            [id]
        );

        if (comprobante.length === 0) {
            return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
        }

        const [movimientos] = await clientConn.query(
            `SELECT m.*, p.nombre as cuenta_nombre 
             FROM contabilidad_movimientos m
             LEFT JOIN contabilidad_puc p ON m.cuenta_codigo = p.codigo
             WHERE m.comprobante_id = ?
             ORDER BY m.id ASC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...comprobante[0],
                movimientos
            }
        });

    } catch (err) {
        console.error('getComprobanteById error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener comprobante' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Crear nuevo comprobante con movimientos
exports.createComprobante = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        const { numero, tipo, fecha, descripcion, movimientos } = req.body;

        if (!numero || !tipo || !fecha || !movimientos || movimientos.length === 0) {
            return res.status(400).json({ success: false, message: 'Datos incompletos' });
        }

        // Validar partida doble
        let totalDebito = 0;
        let totalCredito = 0;
        movimientos.forEach(m => {
            totalDebito += parseFloat(m.debito || 0);
            totalCredito += parseFloat(m.credito || 0);
        });

        if (Math.abs(totalDebito - totalCredito) > 0.01) {
            return res.status(400).json({
                success: false,
                message: 'El comprobante no está balanceado. Débitos deben ser igual a Créditos'
            });
        }

        await clientConn.beginTransaction();

        // Insertar comprobante
        const sqlComprobante = `
            INSERT INTO contabilidad_comprobantes 
            (numero, tipo, fecha, descripcion, total_debito, total_credito, estado, created_by)
            VALUES (?, ?, ?, ?, ?, ?, 'Borrador', ?)
        `;

        const [result] = await clientConn.query(sqlComprobante, [
            numero,
            tipo,
            fecha,
            descripcion,
            totalDebito,
            totalCredito,
            req.user.id || null
        ]);

        const comprobanteId = result.insertId;

        // Insertar movimientos
        const sqlMovimiento = `
            INSERT INTO contabilidad_movimientos 
            (comprobante_id, cuenta_codigo, tercero_id, descripcion, debito, credito)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        for (const mov of movimientos) {
            await clientConn.query(sqlMovimiento, [
                comprobanteId,
                mov.cuenta_codigo,
                mov.tercero_id || null,
                mov.descripcion || '',
                parseFloat(mov.debito || 0),
                parseFloat(mov.credito || 0)
            ]);
        }

        await clientConn.commit();
        res.status(201).json({ success: true, message: 'Comprobante creado exitosamente', id: comprobanteId });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('createComprobante error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'El número de comprobante ya existe' });
        }
        res.status(500).json({ success: false, message: 'Error al crear comprobante' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Actualizar comprobante (solo borradores)
exports.updateComprobante = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        // Verificar que sea borrador
        const [comprobante] = await clientConn.query(
            'SELECT estado FROM contabilidad_comprobantes WHERE id = ?',
            [id]
        );

        if (comprobante.length === 0) {
            return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
        }

        if (comprobante[0].estado !== 'Borrador') {
            return res.status(400).json({ success: false, message: 'Solo se pueden editar comprobantes en borrador' });
        }

        const { fecha, descripcion, movimientos } = req.body;

        // Validar partida doble
        let totalDebito = 0;
        let totalCredito = 0;
        movimientos.forEach(m => {
            totalDebito += parseFloat(m.debito || 0);
            totalCredito += parseFloat(m.credito || 0);
        });

        if (Math.abs(totalDebito - totalCredito) > 0.01) {
            return res.status(400).json({
                success: false,
                message: 'El comprobante no está balanceado'
            });
        }

        await clientConn.beginTransaction();

        // Actualizar comprobante
        await clientConn.query(
            'UPDATE contabilidad_comprobantes SET fecha = ?, descripcion = ?, total_debito = ?, total_credito = ? WHERE id = ?',
            [fecha, descripcion, totalDebito, totalCredito, id]
        );

        // Eliminar movimientos anteriores
        await clientConn.query('DELETE FROM contabilidad_movimientos WHERE comprobante_id = ?', [id]);

        // Insertar nuevos movimientos
        const sqlMovimiento = `
            INSERT INTO contabilidad_movimientos 
            (comprobante_id, cuenta_codigo, tercero_id, descripcion, debito, credito)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        for (const mov of movimientos) {
            await clientConn.query(sqlMovimiento, [
                id,
                mov.cuenta_codigo,
                mov.tercero_id || null,
                mov.descripcion || '',
                parseFloat(mov.debito || 0),
                parseFloat(mov.credito || 0)
            ]);
        }

        await clientConn.commit();
        res.json({ success: true, message: 'Comprobante actualizado exitosamente' });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('updateComprobante error:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar comprobante' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Eliminar comprobante (solo borradores)
exports.deleteComprobante = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        const [comprobante] = await clientConn.query(
            'SELECT estado FROM contabilidad_comprobantes WHERE id = ?',
            [id]
        );

        if (comprobante.length === 0) {
            return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
        }

        if (comprobante[0].estado !== 'Borrador') {
            return res.status(400).json({ success: false, message: 'Solo se pueden eliminar comprobantes en borrador' });
        }

        await clientConn.query('DELETE FROM contabilidad_comprobantes WHERE id = ?', [id]);
        res.json({ success: true, message: 'Comprobante eliminado exitosamente' });

    } catch (err) {
        console.error('deleteComprobante error:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar comprobante' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Contabilizar comprobante (cambiar estado de Borrador a Contabilizado)
exports.contabilizarComprobante = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        const [comprobante] = await clientConn.query(
            'SELECT estado FROM contabilidad_comprobantes WHERE id = ?',
            [id]
        );

        if (comprobante.length === 0) {
            return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
        }

        if (comprobante[0].estado !== 'Borrador') {
            return res.status(400).json({ success: false, message: 'El comprobante ya está contabilizado' });
        }

        await clientConn.query(
            'UPDATE contabilidad_comprobantes SET estado = ? WHERE id = ?',
            ['Contabilizado', id]
        );

        res.json({ success: true, message: 'Comprobante contabilizado exitosamente' });

    } catch (err) {
        console.error('contabilizarComprobante error:', err);
        res.status(500).json({ success: false, message: 'Error al contabilizar comprobante' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// ============================================
// REPORTES
// ============================================

// Libro Diario
exports.getLibroDiario = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { fecha_inicio, fecha_fin, cuenta_codigo } = req.query;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        let sql = `
            SELECT 
                c.numero, c.tipo, c.fecha, c.descripcion as comprobante_desc, c.estado,
                m.cuenta_codigo, p.nombre as cuenta_nombre, m.descripcion as movimiento_desc,
                m.debito, m.credito
            FROM contabilidad_movimientos m
            INNER JOIN contabilidad_comprobantes c ON m.comprobante_id = c.id
            LEFT JOIN contabilidad_puc p ON m.cuenta_codigo = p.codigo
            WHERE c.estado = 'Contabilizado'
        `;

        const params = [];

        if (fecha_inicio) {
            sql += ' AND c.fecha >= ?';
            params.push(fecha_inicio);
        }
        if (fecha_fin) {
            sql += ' AND c.fecha <= ?';
            params.push(fecha_fin);
        }
        if (cuenta_codigo) {
            sql += ' AND m.cuenta_codigo = ?';
            params.push(cuenta_codigo);
        }

        sql += ' ORDER BY c.fecha ASC, c.numero ASC, m.id ASC';

        const [rows] = await clientConn.query(sql, params);

        // Calcular totales
        let totalDebito = 0;
        let totalCredito = 0;
        rows.forEach(row => {
            totalDebito += parseFloat(row.debito || 0);
            totalCredito += parseFloat(row.credito || 0);
        });

        res.json({
            success: true,
            data: rows,
            totales: {
                debito: totalDebito,
                credito: totalCredito
            }
        });

    } catch (err) {
        console.error('getLibroDiario error:', err);
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ success: true, data: [], totales: { debito: 0, credito: 0 } });
        }
        res.status(500).json({ success: false, message: 'Error al obtener libro diario' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Balance General
exports.getBalanceGeneral = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { fecha_corte } = req.query;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        let sql = `
            SELECT 
                p.codigo, p.nombre, p.naturaleza, p.nivel, p.tipo,
                COALESCE(SUM(m.debito), 0) as total_debito,
                COALESCE(SUM(m.credito), 0) as total_credito,
                CASE 
                    WHEN p.naturaleza = 'Debito' THEN COALESCE(SUM(m.debito), 0) - COALESCE(SUM(m.credito), 0)
                    ELSE COALESCE(SUM(m.credito), 0) - COALESCE(SUM(m.debito), 0)
                END as saldo
            FROM contabilidad_puc p
            LEFT JOIN contabilidad_movimientos m ON p.codigo = m.cuenta_codigo
            LEFT JOIN contabilidad_comprobantes c ON m.comprobante_id = c.id AND c.estado = 'Contabilizado'
        `;

        const params = [];

        if (fecha_corte) {
            sql += ' WHERE c.fecha <= ?';
            params.push(fecha_corte);
        }

        sql += ' GROUP BY p.codigo, p.nombre, p.naturaleza, p.nivel, p.tipo ORDER BY p.codigo ASC';

        const [rows] = await clientConn.query(sql, params);

        // Calcular totales por clase
        const totales = {
            activos: 0,
            pasivos: 0,
            patrimonio: 0,
            ingresos: 0,
            gastos: 0,
            costos: 0
        };

        rows.forEach(row => {
            const saldo = parseFloat(row.saldo || 0);
            const clase = row.codigo.charAt(0);

            if (clase === '1') totales.activos += saldo;
            else if (clase === '2') totales.pasivos += saldo;
            else if (clase === '3') totales.patrimonio += saldo;
            else if (clase === '4') totales.ingresos += saldo;
            else if (clase === '5') totales.gastos += saldo;
            else if (clase === '6' || clase === '7') totales.costos += saldo;
        });

        res.json({
            success: true,
            data: rows,
            totales
        });

    } catch (err) {
        console.error('getBalanceGeneral error:', err);
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ success: true, data: [], totales: {} });
        }
        res.status(500).json({ success: false, message: 'Error al obtener balance general' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
