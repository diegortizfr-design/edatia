const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

// Obtener todas las averías
exports.getAverias = async (req, res) => {
    let clientConn = null;
    try {
        if (!req.user || !req.user.nit) {
            return res.status(400).json({ success: false, message: 'Token de usuario inválido o falta NIT' });
        }
        const { nit } = req.user;

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) {
            console.error('Empresa no encontrada para NIT:', nit);
            return res.status(404).json({ success: false, message: 'Empresa no encontrada en configuración' });
        }

        clientConn = await connectToClientDB(dbConfig);


        // Obtener averías con datos de producto y costo en una sola consulta
        const [rows] = await clientConn.query(`
            SELECT a.*, p.nombre as producto_nombre, p.imagen_url, p.referencia_fabrica, p.costo, s.nombre as sucursal_nombre
            FROM averias a
            JOIN productos p ON a.producto_id = p.id
            JOIN sucursales s ON a.sucursal_origen_id = s.id
            ORDER BY a.fecha_reporte DESC
        `);

        // Calcular KPIs usando la consulta única
        const totalItems = rows.reduce((acc, curr) => acc + parseFloat(curr.cantidad || 0), 0);
        const valorPerdida = rows.reduce((acc, curr) => {
            if (curr.estado !== 'Recuperado') {
                return acc + (parseFloat(curr.cantidad || 0) * parseFloat(curr.costo || 0));
            }
            return acc;
        }, 0);
        const recuperados = rows.filter(r => r.estado === 'Recuperado').reduce((acc, curr) => acc + parseFloat(curr.cantidad || 0), 0);

        res.json({
            success: true,
            data: rows,
            stats: { totalItems, valorPerdida, recuperados }
        });

    } catch (err) {
        console.error('getAverias error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener averías' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Crear nueva avería (Resta inventario + Inserta Avería)
exports.crearAveria = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const { producto_id, sucursal_id, cantidad, motivo, estado } = req.body;

        if (!producto_id || !sucursal_id || !cantidad || !motivo) {
            return res.status(400).json({ success: false, message: 'Datos incompletos' });
        }

        await clientConn.beginTransaction();

        // 1. Verificar Stock
        const [inv] = await clientConn.query('SELECT cant_actual FROM inventario_sucursales WHERE producto_id = ? AND sucursal_id = ? FOR UPDATE', [producto_id, sucursal_id]);
        const stockActual = inv.length > 0 ? parseFloat(inv[0].cant_actual) : 0;
        const cantidadAveria = parseFloat(cantidad);

        if (stockActual < cantidadAveria) {
            throw new Error(`Stock insuficiente en la sucursal (Actual: ${stockActual})`);
        }

        // 2. Obtener datos producto para historial y costo
        const [prod] = await clientConn.query('SELECT costo, stock_actual FROM productos WHERE id = ?', [producto_id]);
        const costo = prod[0].costo || 0;

        // 3. Restar Inventario Sucursal
        const nuevoStock = stockActual - cantidadAveria;
        await clientConn.query('UPDATE inventario_sucursales SET cant_actual = ? WHERE producto_id = ? AND sucursal_id = ?', [nuevoStock, producto_id, sucursal_id]);

        // 4. Actualizar Stock Global
        // (Optional: depending on logic, averias might still be "in stock" but non-sellable, 
        // usually they are removed from active stock count)
        const nuevoStockGlobal = (parseFloat(prod[0].stock_actual) || 0) - cantidadAveria;
        await clientConn.query('UPDATE productos SET stock_actual = ? WHERE id = ?', [nuevoStockGlobal, producto_id]);

        // 5. Registrar Movimiento Inventario (SALIDA_AVERIA)
        await clientConn.query(`
            INSERT INTO movimientos_inventario 
            (producto_id, sucursal_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, costo_unitario, usuario_id)
            VALUES (?, ?, 'SALIDA_AVERIA', ?, ?, ?, ?, ?, ?)
        `, [producto_id, sucursal_id, cantidadAveria, stockActual, nuevoStock, motivo, costo, req.user.id || null]);

        // 6. Insertar en tabla Averias
        await clientConn.query(`
            INSERT INTO averias 
            (producto_id, sucursal_origen_id, cantidad, motivo_descripcion, estado, usuario_reporto_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [producto_id, sucursal_id, cantidadAveria, motivo, estado || 'Pendiente', req.user.id || null]);

        await clientConn.commit();

        res.json({ success: true, message: 'Avería registrada y descontada del inventario' });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('crearAveria error:', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
