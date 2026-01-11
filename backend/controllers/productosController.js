const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');
const { initializeTenantDB } = require('../utils/tenantInit');

const XLSX = require('xlsx');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.bulkUpload = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        if (!req.file) return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        // Leer Excel
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (rows.length === 0) return res.status(400).json({ success: false, message: 'El archivo está vacío' });

        let counting = 0;
        let errors = 0;

        // Mapeo sugerido de columnas (Normalizar nombres)
        // Se espera: Codigo/Código, Nombre, Referencia, Categoria/Categoría, Precio1, Precio2, Costo, Impuesto, StockMinimo
        for (const row of rows) {
            try {
                // Normalizar claves (quitar tildes y a minúsculas para encontrar correspondencia)
                const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const data = {};
                for (const key in row) {
                    data[normalize(key)] = row[key];
                }

                const nombre = data.nombre;
                if (!nombre) continue; // Saltar si no hay nombre

                const insertSQL = `
                    INSERT INTO productos 
                    (codigo, referencia_fabrica, nombre, categoria, unidad_medida, 
                     precio1, precio2, costo, impuesto_porcentaje, stock_minimo, activo)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    nombre = VALUES(nombre),
                    referencia_fabrica = VALUES(referencia_fabrica),
                    categoria = VALUES(categoria),
                    precio1 = VALUES(precio1),
                    precio2 = VALUES(precio2),
                    costo = VALUES(costo),
                    impuesto_porcentaje = VALUES(impuesto_porcentaje),
                    stock_minimo = VALUES(stock_minimo)
                `;

                await clientConn.query(insertSQL, [
                    data.codigo || null,
                    data.referencia || null,
                    nombre,
                    data.categoria || 'General',
                    data.unidad || 'UND',
                    parseFloat(data.precio1) || 0,
                    parseFloat(data.precio2) || 0,
                    parseFloat(data.costo) || 0,
                    parseFloat(data.impuesto) || 0,
                    parseInt(data.stockminimo) || 0,
                    1
                ]);
                counting++;
            } catch (err) {
                console.error('Error insertando fila:', err, row);
                errors++;
            }
        }

        res.json({
            success: true,
            message: `Proceso completado. ${counting} productos procesados correctamente. ${errors} errores.`,
            count: counting,
            errors: errors
        });

    } catch (err) {
        console.error('bulkUpload error:', err);
        res.status(500).json({ success: false, message: 'Error interno al procesar el archivo' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.listarProductos = async (req, res) => {

    let clientConn = null;
    try {
        const { nit } = req.user;
        const { busqueda, barcode, categoria, sucursal_id } = req.query;

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        clientConn = await connectToClientDB(dbConfig);

        // DDL Removed - Assuming schema exists or will be handled by lazy init on error


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
        // Lazy Init: If table doesn't exist, try to init and retry (simplified for now)
        if (err.code === 'ER_NO_SUCH_TABLE') {
            // Logic could be added here to auto-initialize, but better to log and explicit init
            // For now, just fail to see performance gain, or we can catch and retry
            console.warn('Table not found, try initializing schema.');
        }
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

        // DDL Removed


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
