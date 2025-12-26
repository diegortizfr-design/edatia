const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.listarProductos = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { busqueda, barcode } = req.query; // barcode is for strict scan

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        clientConn = await connectToClientDB(dbConfig);

        let query = 'SELECT * FROM productos';
        const params = [];

        if (barcode) {
            // Búsqueda exacta para pistola lectora
            query += ' WHERE codigo = ?';
            params.push(barcode);
        } else if (busqueda) {
            // Búsqueda flexible por nombre o código parcial
            query += ' WHERE nombre LIKE ? OR codigo LIKE ?';
            params.push(`%${busqueda}%`, `%${busqueda}%`);
        } else {
            query += ' ORDER BY nombre ASC LIMIT 100'; // Limit prevent massive load
        }

        const [rows] = await clientConn.query(query, params);
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('listarProductos error:', err);
        res.status(500).json({ success: false, message: 'Error al listar productos' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearProducto = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const {
            codigo, nombre, descripcion, precio_compra, precio_venta, impuesto_porcentaje, activo
        } = req.body;

        if (!nombre) {
            return res.status(400).json({ success: false, message: 'Nombre del producto es obligatorio' });
        }

        // Check if code exists (if provided)
        if (codigo) {
            const [exists] = await clientConn.query('SELECT id FROM productos WHERE codigo = ?', [codigo]);
            if (exists.length > 0) {
                return res.status(400).json({ success: false, message: 'Ya existe un producto con ese código' });
            }
        }

        const sql = `
            INSERT INTO productos 
            (codigo, nombre, descripcion, precio_compra, precio_venta, impuesto_porcentaje, activo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await clientConn.query(sql, [
            codigo || null, nombre, descripcion,
            precio_compra || 0, precio_venta || 0, impuesto_porcentaje || 0,
            activo !== undefined ? activo : 1
        ]);

        res.status(201).json({ success: true, message: 'Producto creado exitosamente' });

    } catch (err) {
        console.error('crearProducto error:', err);
        res.status(500).json({ success: false, message: 'Error al crear producto' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarProducto = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const {
            codigo, nombre, descripcion, precio_compra, precio_venta, impuesto_porcentaje, activo
        } = req.body;

        const sql = `
            UPDATE productos
            SET codigo=?, nombre=?, descripcion=?, precio_compra=?, precio_venta=?, impuesto_porcentaje=?, activo=?
            WHERE id=?
        `;

        await clientConn.query(sql, [
            codigo, nombre, descripcion, precio_compra, precio_venta, impuesto_porcentaje, activo, id
        ]);

        res.json({ success: true, message: 'Producto actualizado' });

    } catch (err) {
        console.error('actualizarProducto error:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar producto' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarProducto = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        try {
            await clientConn.query('DELETE FROM productos WHERE id = ?', [id]);
            res.json({ success: true, message: 'Producto eliminado' });
        } catch (fkError) {
            if (fkError.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ success: false, message: 'No se puede eliminar: Tiene historial de compras o ventas.' });
            }
            throw fkError;
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
