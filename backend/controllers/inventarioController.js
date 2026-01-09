const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.verKardex = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { producto_id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        // Ensure table exists
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS movimientos_inventario (
                id INT AUTO_INCREMENT PRIMARY KEY,
                producto_id INT NOT NULL,
                sucursal_id INT DEFAULT NULL,
                tipo_movimiento VARCHAR(50) NOT NULL, -- ENTRADA, SALIDA, VENTA, COMPRA, AJUSTE_ENTRADA, AJUSTE_SALIDA
                cantidad DECIMAL(15,2) NOT NULL,
                stock_anterior DECIMAL(15,2) DEFAULT 0,
                stock_nuevo DECIMAL(15,2) NOT NULL,
                motivo VARCHAR(255),
                documento_referencia VARCHAR(100) DEFAULT NULL, -- Factura #, Compra #
                costo_unitario DECIMAL(15,2) DEFAULT 0,
                usuario_id INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (producto_id),
                INDEX (created_at)
            )
        `);

        // Fetch movements
        const [rows] = await clientConn.query(`
            SELECT * FROM movimientos_inventario 
            WHERE producto_id = ? 
            ORDER BY created_at DESC 
            LIMIT 100
        `, [producto_id]);

        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('verKardex error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener el kardex' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearAjuste = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const { producto_id, tipo, cantidad, motivo, sucursal_id } = req.body;
        // tipo: 'AJUSTE_ENTRADA' or 'AJUSTE_SALIDA'

        if (!producto_id || !cantidad || !tipo) {
            return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
        }

        await clientConn.beginTransaction();

        // 1. Get current product stock
        const [prods] = await clientConn.query('SELECT * FROM productos WHERE id = ? FOR UPDATE', [producto_id]);
        if (prods.length === 0) throw new Error('Producto no encontrado');
        const prod = prods[0];

        const stockAnterior = parseFloat(prod.stock_actual || 0);
        const cantidadNum = parseFloat(cantidad);
        let stockNuevo = stockAnterior;

        if (tipo === 'AJUSTE_ENTRADA') {
            stockNuevo += cantidadNum;
        } else if (tipo === 'AJUSTE_SALIDA') {
            stockNuevo -= cantidadNum;
        } else {
            throw new Error('Tipo de ajuste inválido');
        }

        // 2. Update Product Stock
        await clientConn.query('UPDATE productos SET stock_actual = ? WHERE id = ?', [stockNuevo, producto_id]);

        // 3. Record Movement
        await clientConn.query(`
            INSERT INTO movimientos_inventario 
            (producto_id, sucursal_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, costo_unitario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            producto_id,
            sucursal_id || null,
            tipo,
            cantidadNum,
            stockAnterior,
            stockNuevo,
            motivo || 'Ajuste Manual de Inventario',
            prod.costo || 0
        ]);

        await clientConn.commit();
        res.json({ success: true, message: 'Ajuste realizado exitosamente', nuevo_stock: stockNuevo });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('crearAjuste error:', err);
        res.status(500).json({ success: false, message: 'Error al realizar el ajuste' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
