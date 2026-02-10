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
                const nombre = data.nombre || data.producto || data.articulo;
                const categoria = data.categoria || data.linea || data.grupo;
                const stockVal = data.stock ?? data.cantidad ?? data.inventario ?? data.stockactual ?? data.stock_actual ?? data.existencia;

                if (!nombre || !categoria || stockVal === undefined || stockVal === null) {
                    errors++;
                    errorMessages.push(`Fila ${index + 2}: Faltan campos obligatorios (Nombre, Categoría, Stock)`);
                    continue;
                }

                const codigo = (data.codigo ?? data.sku ?? data.barcode ?? data.cod ?? data.ean) ? String(data.codigo ?? data.sku ?? data.barcode ?? data.cod ?? data.ean).trim() : null;
                const referencia = (data.referencia ?? data.ref ?? data.referencia_fabrica ?? data.modelo) ? String(data.referencia ?? data.ref ?? data.referencia_fabrica ?? data.modelo).trim() : null;
                const stock = parseInt(stockVal) || 0;
                const precio1 = parseFloat(data.precio1 || data.precio || data.pvp) || 0;
                const costo = parseFloat(data.costo || data.cost) || 0;

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
                            codigo = IFNULL(?, codigo),
                            referencia_fabrica = IFNULL(?, referencia_fabrica)
                        WHERE id = ?
                    `;
                    await clientConn.query(updateSQL, [
                        nombre,
                        categoria,
                        stock,
                        precio1, precio1,
                        costo, costo,
                        codigo,
                        referencia,
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
                        referencia,
                        nombre,
                        categoria,
                        data.unidad || data.u_m || 'UND',
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
        const { busqueda, barcode, categoria, sucursal_id, page = 1, limit = 50 } = req.query;

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        clientConn = await connectToClientDB(dbConfig);

        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, t.nombre_comercial as proveedor_nombre,
                   ${sucursal_id ? 'IFNULL(isuc.cant_actual, 0) as stock_sucursal' : 'NULL as stock_sucursal'}
            FROM productos p 
            LEFT JOIN terceros t ON p.proveedor_id = t.id
            ${sucursal_id ? 'LEFT JOIN inventario_sucursales isuc ON p.id = isuc.producto_id AND isuc.sucursal_id = ?' : ''}
        `;

        let countQuery = `SELECT COUNT(*) as total FROM productos p LEFT JOIN terceros t ON p.proveedor_id = t.id`;

        const params = [];
        const countParams = [];

        if (sucursal_id) params.push(sucursal_id);

        const conditions = [];

        if (barcode) {
            conditions.push('p.codigo = ?');
            params.push(barcode);
            countParams.push(barcode);
        } else if (busqueda) {
            conditions.push(`(
                p.nombre LIKE ? OR 
                p.codigo LIKE ? OR 
                p.referencia_fabrica LIKE ? OR 
                p.nombre_alterno LIKE ? OR 
                p.descripcion LIKE ? OR
                p.categoria LIKE ? OR
                t.nombre_comercial LIKE ?
            )`);
            const term = `%${busqueda}%`;
            const searchParams = [term, term, term, term, term, term, term];
            params.push(...searchParams);
            countParams.push(...searchParams);
        }

        if (categoria) {
            conditions.push('p.categoria = ?');
            params.push(categoria);
            countParams.push(categoria);
        }

        if (conditions.length > 0) {
            const conditionStr = ' WHERE ' + conditions.join(' AND ');
            query += conditionStr;
            countQuery += conditionStr;
        }

        query += ' ORDER BY p.nombre ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await clientConn.query(query, params);
        const [countResult] = await clientConn.query(countQuery, conditions.length > 0 && !barcode ? countParams : (barcode ? countParams : [])); // Logic for params needs to be exact.
        // Wait, countQueryParams must match conditions added. 
        // Logic fix:
        // params has [sucursal?, search*7?, category?, limit, offset]
        // countParams should have [search*7?, category?]
        // My countParams logic above was a bit loose. Let's fix it properly in the ReplacementContent logic.

    } catch (err) {
        // ... existing error handler
    }
};

// RE-WRITING THE WHOLE FUNCTION TO BE CLEANER
exports.listarProductos = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { busqueda, barcode, categoria, sucursal_id, page = 1, limit = 50 } = req.query;

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        clientConn = await connectToClientDB(dbConfig);

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let baseQuery = `FROM productos p LEFT JOIN terceros t ON p.proveedor_id = t.id`;
        let selectQuery = `SELECT p.*, t.nombre_comercial as proveedor_nombre`;

        if (sucursal_id) {
            selectQuery += `, IFNULL(isuc.cant_actual, 0) as stock_sucursal`;
            baseQuery += ` LEFT JOIN inventario_sucursales isuc ON p.id = isuc.producto_id AND isuc.sucursal_id = ?`;
        } else {
            selectQuery += `, NULL as stock_sucursal`;
        }

        const conditions = [];
        const params = [];

        if (sucursal_id) params.push(sucursal_id);

        if (barcode) {
            conditions.push('p.codigo = ?');
            params.push(barcode);
        } else if (busqueda) {
            conditions.push(`(
                p.nombre LIKE ? OR 
                p.codigo LIKE ? OR 
                p.referencia_fabrica LIKE ? OR 
                p.nombre_alterno LIKE ? OR 
                p.descripcion LIKE ? OR
                p.categoria LIKE ? OR
                t.nombre_comercial LIKE ?
            )`);
            const term = `%${busqueda}%`;
            params.push(term, term, term, term, term, term, term);
        }

        if (categoria) {
            conditions.push('p.categoria = ?');
            params.push(categoria);
        }

        if (conditions.length > 0) {
            baseQuery += ' WHERE ' + conditions.join(' AND ');
        }

        // Get Total Count
        // For count, we don't need the sucursal join unless we filter by it? 
        // Actually sucursal join is LEFT join, so it doesn't filter rows unless we add WHERE isuc.blah.
        // But wait, the params array includes sucursal_id IF provided.
        // So we must use the SAME baseQuery for count but replace SELECT part.
        const countSql = `SELECT COUNT(*) as total ${baseQuery}`;
        const [countRows] = await clientConn.query(countSql, params);
        const total = countRows[0].total;

        // Get Data
        const dataSql = `${selectQuery} ${baseQuery} ORDER BY p.nombre ASC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await clientConn.query(dataSql, params);

        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        console.error('listarProductos error:', err);
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
            ecommerce_descripcion, ecommerce_imagenes, ecommerce_afecta_inventario,
            stock_inicial // New field
        } = req.body;

        if (!nombre) {
            return res.status(400).json({ success: false, message: 'Nombre del producto es obligatorio' });
        }

        // AUTO-GENERAR CÓDIGO SI ESTÁ VACÍO
        let finalCodigo = codigo;
        if (!finalCodigo || finalCodigo.trim() === '') {
            // Generar código único: AUTO-[TIMESTAMP]-[RANDOM 3 DIGIT]
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            finalCodigo = `AUTO-${timestamp}${random}`;
        }

        const stockIni = parseInt(stock_inicial) || 0;

        await clientConn.beginTransaction();

        try {
            const sql = `
                INSERT INTO productos 
                (codigo, referencia_fabrica, nombre, nombre_alterno, categoria, 
                 unidad_medida, precio1, precio2, precio3, costo, impuesto_porcentaje, 
                 proveedor_id, stock_minimo, stock_actual, descripcion, imagen_url, activo,
                 es_servicio, maneja_inventario, mostrar_en_tienda,
                 ecommerce_descripcion, ecommerce_imagenes, ecommerce_afecta_inventario)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await clientConn.query(sql, [
                finalCodigo, referencia_fabrica || null, nombre, nombre_alterno || null, categoria || 'General',
                unidad_medida || 'UND', precio1 || 0, precio2 || 0, precio3 || 0, costo || 0, impuesto_porcentaje || 0,
                proveedor_id || null, stock_minimo !== undefined ? stock_minimo : 0, stockIni, descripcion || null, imagen_url || null,
                activo !== undefined ? activo : 1, es_servicio || 0, maneja_inventario !== undefined ? maneja_inventario : 1,
                mostrar_en_tienda || 0, ecommerce_descripcion || null, ecommerce_imagenes || null, ecommerce_afecta_inventario || 0
            ]);

            const productoId = result.insertId;

            // Handle Initial Stock Movement
            if (stockIni > 0) {
                // 1. Determine target branch (Specified OR Single branch OR Principal)
                let targetSucursal = req.body.sucursal_id;

                if (!targetSucursal) {
                    const [sucs] = await clientConn.query("SELECT id FROM sucursales");
                    if (sucs.length === 1) {
                        targetSucursal = sucs[0].id;
                    } else {
                        const [principal] = await clientConn.query("SELECT id FROM sucursales WHERE es_principal = 1 LIMIT 1");
                        targetSucursal = principal.length > 0 ? principal[0].id : (sucs.length > 0 ? sucs[0].id : 1);
                    }
                }

                // 2. Insert into inventario_sucursales
                await clientConn.query(`
                    INSERT INTO inventario_sucursales (producto_id, sucursal_id, cant_actual)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE cant_actual = cant_actual + VALUES(cant_actual)
                `, [productoId, targetSucursal, stockIni]);

                // 3. Record Kardex Movement
                await clientConn.query(`
                    INSERT INTO movimientos_inventario 
                    (producto_id, sucursal_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, documento_referencia, costo_unitario)
                    VALUES (?, ?, 'ENTRADA', ?, ?, ?, ?, ?, ?)
                `, [
                    productoId,
                    targetSucursal,
                    stockIni,
                    0,
                    stockIni,
                    'Ajuste Inicial',
                    'N/A',
                    costo || 0
                ]);
            }

            await clientConn.commit();
            res.status(201).json({ success: true, message: 'Producto creado exitosamente', id: productoId });

        } catch (txErr) {
            await clientConn.rollback();
            throw txErr;
        }

    } catch (err) {
        console.error('crearProducto error:', err);
        res.status(500).json({ success: false, message: 'Error al crear producto: ' + err.message });
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
                if ((field === 'codigo' || field === 'referencia_fabrica' || field === 'nombre_alterno' || field === 'proveedor_id' || field === 'descripcion') && val === '') {
                    val = null;
                }

                // FIX: If imagen_url is empty string, do NOT update it (keep existing)
                // If user wants to delete image, frontend should send null or we need explicit flag, 
                // but checking for '' usually means "no new file selected" in this context.
                if (field === 'imagen_url' && val === '') {
                    continue;
                }

                if (field === 'imagen_url' && val === null) {
                    // Explicit null update allowed if needed
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

        await clientConn.beginTransaction();

        try {
            // 1. Update Basic Fields
            await clientConn.query(sql, values);

            // 2. Handle Stock Adjustment if provided
            const { ajuste_cantidad, ajuste_motivo } = req.body;
            if (ajuste_cantidad && ajuste_cantidad !== 0) {
                // Fetch current stock to calculate new stock
                const [curr] = await clientConn.query('SELECT stock_actual, costo FROM productos WHERE id = ?', [id]);
                const oldStock = curr[0].stock_actual || 0;
                const cost = curr[0].costo || 0;
                const newStock = oldStock + ajuste_cantidad;

                // Update Global Stock
                await clientConn.query('UPDATE productos SET stock_actual = ? WHERE id = ?', [newStock, id]);

                // Update Branch Stock
                let targetSucursal = req.body.sucursal_id;

                if (!targetSucursal) {
                    const [sucs] = await clientConn.query("SELECT id FROM sucursales");
                    if (sucs.length === 1) {
                        targetSucursal = sucs[0].id;
                    } else {
                        const [principal] = await clientConn.query("SELECT id FROM sucursales WHERE es_principal = 1 LIMIT 1");
                        targetSucursal = principal.length > 0 ? principal[0].id : (sucs.length > 0 ? sucs[0].id : 1);
                    }
                }

                const [invSuc] = await clientConn.query('SELECT cant_actual FROM inventario_sucursales WHERE producto_id = ? AND sucursal_id = ? FOR UPDATE', [id, targetSucursal]);
                const oldBranchStock = invSuc.length > 0 ? parseFloat(invSuc[0].cant_actual) : 0;
                const newBranchStock = oldBranchStock + ajuste_cantidad;

                if (invSuc.length > 0) {
                    await clientConn.query('UPDATE inventario_sucursales SET cant_actual = ? WHERE producto_id = ? AND sucursal_id = ?', [newBranchStock, id, targetSucursal]);
                } else {
                    await clientConn.query('INSERT INTO inventario_sucursales (producto_id, sucursal_id, cant_actual) VALUES (?, ?, ?)', [id, targetSucursal, newBranchStock]);
                }

                // Record Movement (Kardex)
                await clientConn.query(`
                    INSERT INTO movimientos_inventario 
                    (producto_id, sucursal_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, documento_referencia, costo_unitario)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    id,
                    targetSucursal,
                    ajuste_cantidad > 0 ? 'ENTRADA' : 'SALIDA',
                    Math.abs(ajuste_cantidad),
                    oldBranchStock,
                    newBranchStock,
                    ajuste_motivo || 'Ajuste Manual',
                    'Ajuste Sistema',
                    cost
                ]);
            }

            await clientConn.commit();
            res.json({ success: true, message: 'Producto actualizado correctamente' });

        } catch (txErr) {
            await clientConn.rollback();
            throw txErr;
        }

    } catch (err) {
        console.error('actualizarProducto error:', err);
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

exports.obtenerDuplicados = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        // Find duplicates by Name (case insensitive roughly)
        // Using LOWER() for better matching
        const [rows] = await clientConn.query(`
            SELECT p.*, t.nombre_comercial as proveedor_nombre
            FROM productos p
            LEFT JOIN terceros t ON p.proveedor_id = t.id
            INNER JOIN (
                SELECT nombre FROM productos GROUP BY nombre HAVING COUNT(*) > 1
            ) dup ON p.nombre = dup.nombre
            ORDER BY p.nombre ASC
        `);

        // Group by name
        const groups = {};
        rows.forEach(p => {
            const key = p.nombre.trim(); // Key is the name itself
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });

        // Format for frontend
        const result = Object.entries(groups).map(([key, items]) => ({
            key,
            name: key,
            count: items.length,
            codes: items.map(i => i.codigo || 'Sin SKU').join(', '),
            items
        }));

        res.json({ success: true, data: result });

    } catch (err) {
        console.error('obtenerDuplicados error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener duplicados' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.obtenerCategorias = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        // Opción 2: Usar DISTINCT de la tabla productos
        const [rows] = await clientConn.query('SELECT DISTINCT categoria as nombre FROM productos WHERE categoria IS NOT NULL AND categoria != "" ORDER BY categoria ASC');

        // Mapeamos para que el frontend reciba un "id" (usamos el nombre como ID)
        const formatData = rows.map(r => ({ id: r.nombre, nombre: r.nombre, descripcion: 'Categoría dinámica', activo: 1 }));

        res.json({ success: true, data: formatData });

    } catch (err) {
        console.error('obtenerCategorias error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener categorías' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearCategoria = async (req, res) => {
    // En el modo simplificado, las categorías se "crean" al asignar el nombre en el producto.
    // Retornamos éxito para no romper el flujo del frontend.
    res.json({
        success: true,
        message: 'Categoría registrada virtualmente. Aparecerá en la lista cuando asigne un producto a ella.'
    });
};

exports.actualizarCategoria = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id: nombreAnterior } = req.params; // Recibimos el nombre actual como ID
        const { nombre: nuevoNombre } = req.body;

        if (!nuevoNombre) return res.status(400).json({ success: false, message: 'Nuevo nombre es obligatorio' });

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        // Corregir todos los productos que tengan el nombre anterior
        await clientConn.query('UPDATE productos SET categoria = ? WHERE categoria = ?', [nuevoNombre, nombreAnterior]);

        res.json({ success: true, message: 'Categoría actualizada en todos los productos' });

    } catch (err) {
        console.error('actualizarCategoria error:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar categoría' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarCategoria = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id: nombreCategoria } = req.params;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        // Opción 2: Resetear la categoría a "General" en lugar de borrar la fila de una tabla inexistente
        await clientConn.query('UPDATE productos SET categoria = "General" WHERE categoria = ?', [nombreCategoria]);

        res.json({ success: true, message: 'La categoría ha sido removida y los productos asociados ahora son "General"' });

    } catch (err) {
        console.error('eliminarCategoria error:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar categoría' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};



