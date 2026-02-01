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
        let updated = 0;
        let errors = 0;
        const errorMessages = [];

        // Pre-fetch existing products to minimize DB hits and handle "Duplicate by Name" check
        const [existingProducts] = await clientConn.query('SELECT id, codigo, nombre FROM productos');

        // Map by Code (Normalized)
        const productsByCode = new Map();
        existingProducts.forEach(p => {
            if (p.codigo) productsByCode.set(p.codigo.trim().toLowerCase(), p);
        });

        // Map by Name (Normalized) - Fallback
        const productsByName = new Map();
        existingProducts.forEach(p => {
            if (p.nombre) productsByName.set(p.nombre.trim().toLowerCase(), p);
        });

        for (const [index, row] of rows.entries()) {
            try {
                // Normalizar claves
                const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                const data = {};
                for (const key in row) {
                    data[normalize(key)] = row[key];
                }

                // 1. Validate Mandatory Columns
                const nombre = data.nombre || data.producto;
                const categoria = data.categoria;
                // Stock can be: stock, cantidad, inventario, stock_actual, stockactual
                const stockVal = data.stock ?? data.cantidad ?? data.inventario ?? data.stockactual ?? data.stock_actual;

                if (!nombre || !categoria || stockVal === undefined || stockVal === null) {
                    errors++;
                    errorMessages.push(`Fila ${index + 2}: Faltan campos obligatorios (Nombre, Categoría, Stock)`);
                    continue;
                }

                const codigo = data.codigo ? String(data.codigo).trim() : null;
                const stock = parseInt(stockVal) || 0;
                const precio1 = parseFloat(data.precio1 || data.precio) || 0;
                const costo = parseFloat(data.costo) || 0;

                // 2. Duplicate Detection Strategy
                let productToUpdate = null;

                // A. Try match by Code
                if (codigo && productsByCode.has(codigo.toLowerCase())) {
                    productToUpdate = productsByCode.get(codigo.toLowerCase());
                }

                // B. If no code match (or logic allows), Try match by Name
                if (!productToUpdate) {
                    const nameKey = String(nombre).trim().toLowerCase();
                    if (productsByName.has(nameKey)) {
                        productToUpdate = productsByName.get(nameKey);
                    }
                }

                if (productToUpdate) {
                    // UPDATE
                    const updateSQL = `
                        UPDATE productos SET
                            nombre = ?, 
                            categoria = ?, 
                            stock_actual = ?,
                            precio1 = IF(? > 0, ?, precio1),
                            costo = IF(? > 0, ?, costo),
                            codigo = IFNULL(?, codigo) -- Update code only if provided
                        WHERE id = ?
                    `;
                    await clientConn.query(updateSQL, [
                        nombre,
                        categoria,
                        stock, // Replace stock as per standard upload behavior
                        precio1, precio1,
                        costo, costo,
                        codigo,
                        productToUpdate.id
                    ]);
                    updated++;
                } else {
                    // INSERT
                    const insertSQL = `
                        INSERT INTO productos 
                        (codigo, referencia_fabrica, nombre, categoria, unidad_medida, 
                         precio1, precio2, costo, impuesto_porcentaje, stock_minimo, stock_actual, activo)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    await clientConn.query(insertSQL, [
                        codigo,
                        data.referencia || null,
                        nombre,
                        categoria,
                        data.unidad || 'UND',
                        precio1,
                        parseFloat(data.precio2) || 0,
                        costo,
                        parseFloat(data.impuesto) || 0,
                        parseInt(data.stockminimo) || 0,
                        stock,
                        1
                    ]);
                    counting++;
                }

            } catch (err) {
                console.error('Error procesando fila:', err, row);
                errors++;
                errorMessages.push(`Fila ${index + 2}: Error interno`);
            }
        }

        res.json({
            success: true,
            message: `Proceso completado. ${counting} creados, ${updated} actualizados. ${errors} errores.`,
            details: errorMessages,
            count: counting,
            updated: updated,
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
            conditions.push('(p.nombre LIKE ? OR p.codigo LIKE ? OR p.referencia_fabrica LIKE ? OR p.nombre_alterno LIKE ?)');
            params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
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
            const { initializeTenantDB } = require('../utils/tenantInit');
            await initializeTenantDB(await getClientDbConfig(req.user.nit));
            return res.status(500).json({ success: false, message: 'Base de datos inicializada. Intente de nuevo.' });
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
            proveedor_id || null, stock_minimo !== undefined ? stock_minimo : 0, descripcion || null, imagen_url || null,
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

        const allowedFields = [
            'codigo', 'referencia_fabrica', 'nombre', 'nombre_alterno', 'categoria',
            'unidad_medida', 'precio1', 'precio2', 'precio3', 'costo', 'impuesto_porcentaje',
            'proveedor_id', 'stock_minimo', 'descripcion', 'imagen_url', 'activo',
            'es_servicio', 'maneja_inventario', 'mostrar_en_tienda',
            'ecommerce_descripcion', 'ecommerce_imagenes', 'ecommerce_afecta_inventario'
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                let val = req.body[field];

                // Sanitize empty strings to NULL for optional text fields
                if ((field === 'codigo' || field === 'referencia_fabrica' || field === 'nombre_alterno' || field === 'proveedor_id' || field === 'imagen_url' || field === 'descripcion') && val === '') {
                    val = null;
                }

                // Sanitize numeric fields - ensure they are 0 if empty string or null
                // Note: precio1 is required usually, but we safeguard here.
                if ((field === 'stock_minimo' || field === 'impuesto_porcentaje' || field === 'precio1' || field === 'precio2' || field === 'precio3' || field === 'costo') && (val === '' || val === null)) {
                    val = 0;
                }

                updates.push(`${field} = ?`);
                values.push(val);
            }
        }

        if (updates.length === 0) {
            return res.json({ success: true, message: 'Nada que actualizar' });
        }

        const sql = `UPDATE productos SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);

        await clientConn.query(sql, values);
        res.json({ success: true, message: 'Producto actualizado' });

    } catch (err) {
        console.error('actualizarProducto error:', err);

        // Handle Duplicate Entry Error (e.g. reused Code)
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'El Código o Referencia ya está en uso por otro producto.' });
        }

        // Return actual error message for debugging
        res.status(500).json({ success: false, message: 'Error al actualizar: ' + err.message });
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

exports.unificarProductos = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { principal_id, duplicados_ids, sumar_stock } = req.body;

        if (!principal_id || !duplicados_ids || !Array.isArray(duplicados_ids) || duplicados_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Datos incompletos para unificación' });
        }

        // Validate that principal is not in duplicates
        if (duplicados_ids.includes(principal_id)) {
            return res.status(400).json({ success: false, message: 'El producto principal no puede ser uno de los duplicados a eliminar' });
        }

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.beginTransaction();

        try {
            // 1. Calculate stock to add (if requested)
            if (sumar_stock) {
                // Get stock sum of duplicates
                const [stockRes] = await clientConn.query(
                    `SELECT SUM(stock_actual) as total_stock FROM productos WHERE id IN (?)`,
                    [duplicados_ids]
                );
                const stockToAdd = stockRes[0].total_stock || 0;

                if (stockToAdd > 0) {
                    await clientConn.query(
                        `UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?`,
                        [stockToAdd, principal_id]
                    );
                }
            }

            // 2. Re-assign dependencies (This is critical: Facturas, Compras, Movimientos)
            // Note: This matches foreign key naming in typical ER schemas.
            // If table doesn't exist or column is diff, this might fail, so we wrap.

            const tablesToUpdate = [
                { table: 'factura_detalle', col: 'producto_id' },
                { table: 'compras_detalle', col: 'producto_id' },
                { table: 'movimientos_inventario', col: 'producto_id' },
                { table: 'inventario_sucursales', col: 'producto_id' }, // Multi-branch stock
                { table: 'ajuste_inventario', col: 'producto_id' }
            ];

            for (const t of tablesToUpdate) {
                // Check if table exists first to avoid crashes on partial migrations? 
                // Alternatively, just try catch specific update
                try {
                    await clientConn.query(
                        `UPDATE ${t.table} SET ${t.col} = ? WHERE ${t.col} IN (?)`,
                        [principal_id, duplicados_ids]
                    );
                } catch (ignore) {
                    // Ignore table not found, but log it
                    console.warn(`Table ${t.table} possibly missing or not needing update during unification.`);
                }
            }

            // 3. Delete Duplicates
            // Force delete even if they have other constraints? Re-assignment should have cleared FKs.
            await clientConn.query('DELETE FROM productos WHERE id IN (?)', [duplicados_ids]);

            await clientConn.commit();
            res.json({ success: true, message: 'Productos unificados correctamente' });

        } catch (err) {
            await clientConn.rollback();
            throw err;
        }

    } catch (err) {
        console.error('unificarProductos error:', err);
        res.status(500).json({ success: false, message: 'Error durante la unificación: ' + err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
