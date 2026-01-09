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
        const { busqueda, barcode, categoria, sucursal_id } = req.query;

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        clientConn = await connectToClientDB(dbConfig);

        // Ensure table and columns exist
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codigo VARCHAR(50) UNIQUE,
                referencia_fabrica VARCHAR(100),
                nombre VARCHAR(255) NOT NULL,
                nombre_alterno VARCHAR(255),
                categoria VARCHAR(100),
                unidad_medida VARCHAR(20) DEFAULT 'UND',
                precio1 DECIMAL(15,2) DEFAULT 0,
                precio2 DECIMAL(15,2) DEFAULT 0,
                precio3 DECIMAL(15,2) DEFAULT 0,
                costo DECIMAL(15,2) DEFAULT 0,
                impuesto_porcentaje DECIMAL(5,2) DEFAULT 0,
                proveedor_id INT,
                stock_minimo INT DEFAULT 0,
                stock_actual INT DEFAULT 0,
                descripcion TEXT,
                imagen_url TEXT,
                activo BOOLEAN DEFAULT 1,
                es_servicio BOOLEAN DEFAULT 0,
                maneja_inventario BOOLEAN DEFAULT 1,
                mostrar_en_tienda BOOLEAN DEFAULT 0,
                ecommerce_descripcion TEXT,
                ecommerce_imagenes TEXT,
                ecommerce_afecta_inventario BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check and add missing columns if table already existed
        const [columns] = await clientConn.query('SHOW COLUMNS FROM productos');
        const colNames = columns.map(c => c.Field);

        if (!colNames.includes('mostrar_en_tienda')) {
            await clientConn.query('ALTER TABLE productos ADD COLUMN mostrar_en_tienda BOOLEAN DEFAULT 0');
        }
        if (!colNames.includes('ecommerce_descripcion')) {
            await clientConn.query('ALTER TABLE productos ADD COLUMN ecommerce_descripcion TEXT');
        }
        if (!colNames.includes('ecommerce_imagenes')) {
            await clientConn.query('ALTER TABLE productos ADD COLUMN ecommerce_imagenes TEXT');
        }
        if (!colNames.includes('ecommerce_afecta_inventario')) {
            await clientConn.query('ALTER TABLE productos ADD COLUMN ecommerce_afecta_inventario BOOLEAN DEFAULT 0');
        }

        let query = `
            SELECT p.*, t.nombre_comercial as proveedor_nombre,
                   ${sucursal_id ? 'IFNULL(isuc.cant_actual, 0) as stock_sucursal' : 'NULL as stock_sucursal'}
            FROM productos p 
            LEFT JOIN terceros t ON p.proveedor_id = t.id
            ${sucursal_id ? 'LEFT JOIN inventario_sucursales isuc ON p.id = isuc.producto_id AND isuc.sucursal_id = ?' : ''}
        `;

        const params = [];
        if (sucursal_id) params.push(sucursal_id);

        const conditions = [];

        if (barcode) {
            conditions.push('p.codigo = ?');
            params.push(barcode);
        } else if (busqueda) {
            conditions.push('(p.nombre LIKE ? OR p.codigo LIKE ? OR p.referencia_fabrica LIKE ?)');
            params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
        }

        if (categoria) {
            conditions.push('p.categoria = ?');
            params.push(categoria);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY p.nombre ASC LIMIT 500';

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

        // Extended schema for Product Configuration
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codigo VARCHAR(50) UNIQUE,
                referencia_fabrica VARCHAR(100),
                nombre VARCHAR(255) NOT NULL,
                nombre_alterno VARCHAR(255),
                categoria VARCHAR(100),
                unidad_medida VARCHAR(20) DEFAULT 'UND',
                precio1 DECIMAL(15,2) DEFAULT 0,
                precio2 DECIMAL(15,2) DEFAULT 0,
                precio3 DECIMAL(15,2) DEFAULT 0,
                costo DECIMAL(15,2) DEFAULT 0,
                impuesto_porcentaje DECIMAL(5,2) DEFAULT 0,
                proveedor_id INT,
                stock_minimo INT DEFAULT 0,
                stock_actual INT DEFAULT 0,
                descripcion TEXT,
                imagen_url TEXT,
                activo BOOLEAN DEFAULT 1,
                es_servicio BOOLEAN DEFAULT 0,
                maneja_inventario BOOLEAN DEFAULT 1,
                mostrar_en_tienda BOOLEAN DEFAULT 0,
                ecommerce_descripcion TEXT,
                ecommerce_imagenes TEXT,
                ecommerce_afecta_inventario BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const {
            codigo, referencia_fabrica, nombre, nombre_alterno, categoria,
            unidad_medida, precio1, precio2, precio3, costo, impuesto_porcentaje,
            proveedor_id, stock_minimo, descripcion, imagen_url, activo,
            es_servicio, maneja_inventario, mostrar_en_tienda,
            ecommerce_descripcion, ecommerce_imagenes, ecommerce_afecta_inventario
        } = req.body;

        if (!nombre) {
            return res.status(400).json({ success: false, message: 'Nombre del producto es obligatorio' });
        }

        const sql = `
            INSERT INTO productos 
            (codigo, referencia_fabrica, nombre, nombre_alterno, categoria, 
             unidad_medida, precio1, precio2, precio3, costo, impuesto_porcentaje, 
             proveedor_id, stock_minimo, descripcion, imagen_url, activo,
             es_servicio, maneja_inventario, mostrar_en_tienda,
             ecommerce_descripcion, ecommerce_imagenes, ecommerce_afecta_inventario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await clientConn.query(sql, [
            codigo || null, referencia_fabrica || null, nombre, nombre_alterno || null, categoria || 'General',
            unidad_medida || 'UND', precio1 || 0, precio2 || 0, precio3 || 0, costo || 0, impuesto_porcentaje || 0,
            proveedor_id || null, stock_minimo || 0, descripcion || null, imagen_url || null,
            activo !== undefined ? activo : 1, es_servicio || 0, maneja_inventario !== undefined ? maneja_inventario : 1,
            mostrar_en_tienda || 0, ecommerce_descripcion || null, ecommerce_imagenes || null, ecommerce_afecta_inventario || 0
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
            codigo, referencia_fabrica, nombre, nombre_alterno, categoria,
            unidad_medida, precio1, precio2, precio3, costo, impuesto_porcentaje,
            proveedor_id, stock_minimo, descripcion, imagen_url, activo,
            es_servicio, maneja_inventario,
            mostrar_en_tienda = 0,
            ecommerce_descripcion = null,
            ecommerce_imagenes = null,
            ecommerce_afecta_inventario = 0
        } = req.body;

        const sql = `
            UPDATE productos
            SET codigo=?, referencia_fabrica=?, nombre=?, nombre_alterno=?, categoria=?, 
                unidad_medida=?, precio1=?, precio2=?, precio3=?, costo=?, impuesto_porcentaje=?, 
                proveedor_id=?, stock_minimo=?, descripcion=?, imagen_url=?, activo=?,
                es_servicio=?, maneja_inventario=?, mostrar_en_tienda=?,
                ecommerce_descripcion=?, ecommerce_imagenes=?, ecommerce_afecta_inventario=?
            WHERE id=?
        `;

        await clientConn.query(sql, [
            codigo || null, referencia_fabrica || null, nombre, nombre_alterno || null, categoria || 'General',
            unidad_medida || 'UND', precio1 || 0, precio2 || 0, precio3 || 0, costo || 0, impuesto_porcentaje || 0,
            proveedor_id || null, stock_minimo || 0, descripcion || null, imagen_url || null,
            activo !== undefined ? activo : 1, es_servicio || 0, maneja_inventario !== undefined ? maneja_inventario : 1,
            mostrar_en_tienda, ecommerce_descripcion, ecommerce_imagenes, ecommerce_afecta_inventario, id
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

        await clientConn.query('DELETE FROM productos WHERE id = ?', [id]);
        res.json({ success: true, message: 'Producto eliminado' });

    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ success: false, message: 'No se puede eliminar: Tiene registros vinculados.' });
        }
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
