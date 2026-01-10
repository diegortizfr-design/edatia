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

        // DDL Removed


        // Fetch movements with Branch Name
        const [rows] = await clientConn.query(`
            SELECT m.*, s.nombre as sucursal_nombre
            FROM movimientos_inventario m
            LEFT JOIN sucursales s ON m.sucursal_id = s.id
            WHERE m.producto_id = ? 
            ORDER BY m.created_at DESC 
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

        if (!producto_id || !cantidad || !tipo) {
            return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
        }

        // Default Branch: If not provided, try to find "Principal", else ID 1
        let targetSucursal = sucursal_id;
        if (!targetSucursal) {
            const [sucs] = await clientConn.query("SELECT id FROM sucursales WHERE es_principal = 1 LIMIT 1");
            if (sucs.length > 0) targetSucursal = sucs[0].id;
            else {
                // Fallback to first one
                const [first] = await clientConn.query("SELECT id FROM sucursales LIMIT 1");
                if (first.length > 0) targetSucursal = first[0].id;
                else throw new Error('No hay sucursales configuradas');
            }
        }

        await clientConn.beginTransaction();

        // 1. Get Global Product Data
        const [prods] = await clientConn.query('SELECT * FROM productos WHERE id = ? FOR UPDATE', [producto_id]);
        if (prods.length === 0) throw new Error('Producto no encontrado');
        const prod = prods[0];

        // 2. Get Branch Specific Stock
        const [invSuc] = await clientConn.query('SELECT cant_actual FROM inventario_sucursales WHERE producto_id = ? AND sucursal_id = ? FOR UPDATE', [producto_id, targetSucursal]);

        const currentBranchStock = invSuc.length > 0 ? parseFloat(invSuc[0].cant_actual) : 0;
        const cantidadNum = parseFloat(cantidad);

        let newBranchStock = currentBranchStock;
        let globalStockChange = 0; // To update master product table

        if (tipo === 'AJUSTE_ENTRADA') {
            newBranchStock += cantidadNum;
            globalStockChange = cantidadNum;
        } else if (tipo === 'AJUSTE_SALIDA') {
            newBranchStock -= cantidadNum;
            globalStockChange = -cantidadNum;
        } else {
            throw new Error('Tipo de ajuste inválido');
        }

        // 3. Upsert Branch Stock
        if (invSuc.length > 0) {
            await clientConn.query('UPDATE inventario_sucursales SET cant_actual = ? WHERE id = ?', [newBranchStock, invSuc[0].id || 0]); // Note: invSuc[0] might not have ID if selected only cant_actual? fix query
            // Correction: Re-select ID or just Update by unique key
            await clientConn.query('UPDATE inventario_sucursales SET cant_actual = ? WHERE producto_id = ? AND sucursal_id = ?', [newBranchStock, producto_id, targetSucursal]);
        } else {
            await clientConn.query('INSERT INTO inventario_sucursales (producto_id, sucursal_id, cant_actual) VALUES (?, ?, ?)', [producto_id, targetSucursal, newBranchStock]);
        }

        // 4. Update Global Stock (Cache)
        const newGlobalStock = (parseFloat(prod.stock_actual) || 0) + globalStockChange;
        await clientConn.query('UPDATE productos SET stock_actual = ? WHERE id = ?', [newGlobalStock, producto_id]);

        // 5. Record Movement
        await clientConn.query(`
            INSERT INTO movimientos_inventario 
            (producto_id, sucursal_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, costo_unitario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            producto_id,
            targetSucursal,
            tipo,
            cantidadNum,
            currentBranchStock, // Keeping track of BRANCH stock in history, or global? Standard is usually specific context. Let's record BRANCH stock here.
            newBranchStock,
            motivo || 'Ajuste Manual',
            prod.costo || 0
        ]);

        await clientConn.commit();
        res.json({ success: true, message: 'Ajuste realizado exitosamente', nuevo_stock_sucursal: newBranchStock, nuevo_stock_global: newGlobalStock });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('crearAjuste error:', err);
        res.status(500).json({ success: false, message: 'Error al realizar el ajuste: ' + err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
