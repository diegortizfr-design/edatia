const XLSX = require('xlsx');
// const eventBus = require('../shared/events'); // Para futuras integraciones asíncronas

exports.bulkUpload = async (req, res) => {
    try {
        const clientConn = req.tenant.db;
        if (!req.file) return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });

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
    try {
        const clientConn = req.tenant.db;
        const { busqueda, barcode, categoria, sucursal_id, page = 1, limit = 50 } = req.query;
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
            conditions.push(`(p.nombre LIKE ? OR p.codigo LIKE ? OR p.referencia_fabrica LIKE ? OR t.nombre_comercial LIKE ?)`);
            const term = `%${busqueda}%`;
            params.push(term, term, term, term);
        }

        if (categoria) {
            conditions.push('p.categoria = ?');
            params.push(categoria);
        }

        if (conditions.length > 0) baseQuery += ' WHERE ' + conditions.join(' AND ');

        const countSql = `SELECT COUNT(*) as total ${baseQuery}`;
        const [countRows] = await clientConn.query(countSql, params);
        const total = countRows[0].total;

        const dataSql = `${selectQuery} ${baseQuery} ORDER BY p.nombre ASC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        const [rows] = await clientConn.query(dataSql, params);

        res.json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        console.error('listarProductos error:', err);
        res.status(500).json({ success: false, message: 'Error al listar productos' });
    }
};

exports.crearProducto = async (req, res) => {
    try {
        const clientConn = req.tenant.db;
        const { codigo, nombre, categoria, precio1, costo, stock_inicial, maneja_inventario } = req.body;
        if (!nombre) return res.status(400).json({ success: false, message: 'Nombre del producto es obligatorio' });

        let finalCodigo = codigo || `AUTO-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const stockIni = parseInt(stock_inicial) || 0;

        await clientConn.beginTransaction();

        const [result] = await clientConn.query(`
            INSERT INTO productos (codigo, nombre, categoria, precio1, costo, stock_actual, maneja_inventario)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [finalCodigo, nombre, categoria || 'General', precio1 || 0, costo || 0, stockIni, maneja_inventario !== undefined ? maneja_inventario : 1]);

        const productoId = result.insertId;

        if (stockIni > 0) {
            const [sucs] = await clientConn.query("SELECT id FROM sucursales WHERE es_principal = 1 LIMIT 1");
            const targetSucursal = sucs.length > 0 ? sucs[0].id : 1;

            await clientConn.query(`INSERT INTO inventario_sucursales (producto_id, sucursal_id, cant_actual) VALUES (?, ?, ?)`, [productoId, targetSucursal, stockIni]);
            await clientConn.query(`INSERT INTO movimientos_inventario (producto_id, sucursal_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo) VALUES (?, ?, 'ENTRADA', ?, 0, ?, 'Ajuste Inicial')`, [productoId, targetSucursal, stockIni, stockIni]);
        }

        // Auditoría
        await clientConn.query(`INSERT INTO audit_log (usuario_id, tabla, registro_id, accion, datos_nuevos) VALUES (?, 'productos', ?, 'INSERT', ?)`, [req.user.id, productoId, JSON.stringify(req.body)]);

        await clientConn.commit();
        res.status(201).json({ success: true, message: 'Producto creado exitosamente', id: productoId });
    } catch (err) {
        if (req.tenant?.db) await req.tenant.db.rollback();
        console.error('crearProducto error:', err);
        res.status(500).json({ success: false, message: 'Error al crear producto' });
    }
};

exports.actualizarProducto = async (req, res) => {
    try {
        const clientConn = req.tenant.db;
        const { id } = req.params;
        const allowedFields = ['codigo', 'nombre', 'categoria', 'precio1', 'costo', 'maneja_inventario', 'activo'];
        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(req.body[field] === '' ? null : req.body[field]);
            }
        }

        if (updates.length > 0) {
            values.push(id);
            await clientConn.beginTransaction();
            await clientConn.query(`UPDATE productos SET ${updates.join(', ')} WHERE id = ?`, values);
            
            // Auditoría
            await clientConn.query(`INSERT INTO audit_log (usuario_id, tabla, registro_id, accion, datos_nuevos) VALUES (?, 'productos', ?, 'UPDATE', ?)`, [req.user.id, id, JSON.stringify(req.body)]);
            
            await clientConn.commit();
        }

        res.json({ success: true, message: 'Producto actualizado correctamente' });
    } catch (err) {
        if (req.tenant?.db) await req.tenant.db.rollback();
        console.error('actualizarProducto error:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar' });
    }
};

exports.eliminarProducto = async (req, res) => {
    try {
        const clientConn = req.tenant.db;
        const { id } = req.params;

        await clientConn.query('DELETE FROM productos WHERE id = ?', [id]);
        
        // Auditoría
        await clientConn.query(`INSERT INTO audit_log (usuario_id, tabla, registro_id, accion) VALUES (?, 'productos', ?, 'DELETE')`, [req.user.id, id]);

        res.json({ success: true, message: 'Producto eliminado' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(400).json({ success: false, message: 'No se puede eliminar: Tiene registros vinculados.' });
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    }
};

exports.unificarProductos = async (req, res) => {
    try {
        const clientConn = req.tenant.db;
        const { principal_id, duplicados_ids, sumar_stock } = req.body;
        if (!principal_id || !duplicados_ids || !Array.isArray(duplicados_ids) || duplicados_ids.length === 0) return res.status(400).json({ success: false, message: 'Datos incompletos' });

        await clientConn.beginTransaction();

        if (sumar_stock) {
            const [stockRes] = await clientConn.query(`SELECT SUM(stock_actual) as total_stock FROM productos WHERE id IN (?)`, [duplicados_ids]);
            if (stockRes[0].total_stock > 0) await clientConn.query(`UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?`, [stockRes[0].total_stock, principal_id]);
        }

        const tables = ['factura_detalle', 'compras_detalle', 'movimientos_inventario', 'inventario_sucursales'];
        for (const t of tables) {
            try { await clientConn.query(`UPDATE ${t} SET producto_id = ? WHERE producto_id IN (?)`, [principal_id, duplicados_ids]); } catch (e) {}
        }

        await clientConn.query('DELETE FROM productos WHERE id IN (?)', [duplicados_ids]);
        await clientConn.commit();

        res.json({ success: true, message: 'Productos unificados correctamente' });
    } catch (err) {
        if (req.tenant?.db) await req.tenant.db.rollback();
        res.status(500).json({ success: false, message: 'Error durante la unificación' });
    }
};

exports.obtenerDuplicados = async (req, res) => {
    try {
        const clientConn = req.tenant.db;
        const [rows] = await clientConn.query(`
            SELECT p.*, t.nombre_comercial as proveedor_nombre
            FROM productos p
            LEFT JOIN terceros t ON p.proveedor_id = t.id
            INNER JOIN (SELECT nombre FROM productos GROUP BY nombre HAVING COUNT(*) > 1) dup ON p.nombre = dup.nombre
            ORDER BY p.nombre ASC
        `);

        const groups = {};
        rows.forEach(p => {
            const key = p.nombre.trim();
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });

        res.json({ success: true, data: Object.entries(groups).map(([key, items]) => ({ key, name: key, count: items.length, items })) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener duplicados' });
    }
};

exports.obtenerCategorias = async (req, res) => {
    try {
        const [rows] = await req.tenant.db.query('SELECT * FROM categorias_productos WHERE activo = 1 ORDER BY nombre ASC');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener categorías' });
    }
};

exports.crearCategoria = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { nombre, descripcion } = req.body;
        if (!nombre) return res.status(400).json({ success: false, message: 'Nombre es obligatorio' });

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('INSERT INTO categorias_productos (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
        res.json({ success: true, message: 'Categoría creada' });

    } catch (err) {
        console.error('crearCategoria error:', err);
        if (err.code === 'ER_NO_SUCH_TABLE') {
            try {
                const dbConfig = await getClientDbConfig(req.user.nit);
                await initializeTenantDB(dbConfig);
                // Re-conectar y re-intentar
                clientConn = await connectToClientDB(dbConfig);
                const { nombre, descripcion } = req.body;
                await clientConn.query('INSERT INTO categorias_productos (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
                return res.json({ success: true, message: 'Categoría creada tras inicialización' });
            } catch (e) {
                console.error('Auto-migration failed:', e);
            }
        }
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'La categoría ya existe' });
        res.status(500).json({ success: false, message: 'Error al crear categoría' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarCategoria = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;
        const { nombre, descripcion, activo } = req.body;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('UPDATE categorias_productos SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
            [nombre, descripcion, activo !== undefined ? activo : 1, id]);

        res.json({ success: true, message: 'Categoría actualizada' });

    } catch (err) {
        console.error('actualizarCategoria error:', err);
        if (err.code === 'ER_NO_SUCH_TABLE') {
            try {
                const dbConfig = await getClientDbConfig(req.user.nit);
                await initializeTenantDB(dbConfig);
                return res.status(500).json({ success: false, message: 'Tabla creada. Por favor, intente de nuevo.' });
            } catch (e) { }
        }
        res.status(500).json({ success: false, message: 'Error al actualizar categoría' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.eliminarCategoria = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const { id } = req.params;

        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        await clientConn.query('DELETE FROM categorias_productos WHERE id = ?', [id]);
        res.json({ success: true, message: 'Categoría eliminada' });

    } catch (err) {
        console.error('eliminarCategoria error:', err);
        if (err.code === 'ER_NO_SUCH_TABLE') {
            try {
                const dbConfig = await getClientDbConfig(req.user.nit);
                await initializeTenantDB(dbConfig);
                return res.status(500).json({ success: false, message: 'Tabla creada. Por favor, intente de nuevo.' });
            } catch (e) { }
        }
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ success: false, message: 'No se puede eliminar: Tiene registros vinculados.' });
        }
        res.status(500).json({ success: false, message: 'Error al eliminar categoría' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};



