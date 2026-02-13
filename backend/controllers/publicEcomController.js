const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

exports.getCatalog = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.params;
        if (!nit) {
            return res.status(400).json({ success: false, message: 'NIT de empresa es requerido' });
        }

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) {
            return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        }

        clientConn = await connectToClientDB(dbConfig);

        // Lazy Migration: Check for ecommerce columns
        const [columns] = await clientConn.query("SHOW COLUMNS FROM productos");
        const columnNames = columns.map(c => c.Field);

        const missingColumns = [];
        if (!columnNames.includes('ecommerce_descripcion')) missingColumns.push("ADD COLUMN ecommerce_descripcion TEXT AFTER imagen_url");
        if (!columnNames.includes('ecommerce_imagenes')) missingColumns.push("ADD COLUMN ecommerce_imagenes TEXT AFTER ecommerce_descripcion");
        if (!columnNames.includes('ecommerce_afecta_inventario')) missingColumns.push("ADD COLUMN ecommerce_afecta_inventario BOOLEAN DEFAULT 0 AFTER ecommerce_imagenes");
        if (!columnNames.includes('mostrar_en_tienda')) missingColumns.push("ADD COLUMN mostrar_en_tienda BOOLEAN DEFAULT 0 AFTER ecommerce_afecta_inventario");
        if (!columnNames.includes('stock_inicial')) missingColumns.push("ADD COLUMN stock_inicial INT DEFAULT 0 AFTER stock_actual");

        if (missingColumns.length > 0) {
            console.log(`Running lazy migration for ${nit}: adding ${missingColumns.length} columns`);
            await clientConn.query(`ALTER TABLE productos ${missingColumns.join(', ')}`);
        }

        // --- LAZY MIGRATION FOR WEB ORDERS ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS pedidos_web (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero_pedido VARCHAR(50) UNIQUE,
                prefijo VARCHAR(10),
                documento_id INT,
                cliente_id INT,
                subtotal DECIMAL(15,2),
                impuesto_total DECIMAL(15,2) DEFAULT 0,
                total DECIMAL(15,2),
                estado ENUM('Pendiente', 'Preparado', 'Enviado', 'Facturado', 'Cancelado') DEFAULT 'Pendiente',
                observaciones TEXT,
                delivery_info TEXT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS pedidos_web_detalle (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pedido_id INT,
                producto_id INT,
                cantidad DECIMAL(15,2),
                precio_unitario DECIMAL(15,2),
                impuesto_porcentaje DECIMAL(5,2) DEFAULT 0,
                subtotal DECIMAL(15,2),
                FOREIGN KEY (pedido_id) REFERENCES pedidos_web(id) ON DELETE CASCADE
            )
        `);

        // Fetch only products marked for store
        const sql = `
            SELECT id, codigo, nombre, referencia_fabrica, categoria, precio1, 
                   stock_actual, descripcion, imagen_url, 
                   ecommerce_descripcion, ecommerce_imagenes, ecommerce_afecta_inventario
            FROM productos 
            WHERE mostrar_en_tienda = 1 AND activo = 1
        `;

        const [products] = await clientConn.query(sql);

        // Map and format data for the store
        const catalog = products.map(p => {
            const extraImages = (p.ecommerce_imagenes || '').split(',').map(s => s.trim()).filter(s => s);
            const isOutOfStock = p.ecommerce_afecta_inventario && p.stock_actual <= 0;

            return {
                id: p.id,
                sku: p.codigo,
                nombre: p.nombre,
                referencia: p.referencia_fabrica,
                precio: parseFloat(p.precio1),
                categoria: p.categoria,
                stock_real: p.stock_actual,
                descripcion: p.ecommerce_descripcion || p.descripcion,
                imagen_principal: p.imagen_url || (extraImages.length > 0 ? extraImages[0] : null),
                imagenes: extraImages,
                afecta_inventario: !!p.ecommerce_afecta_inventario,
                agotado: isOutOfStock,
                disponible: !isOutOfStock
            };
        });

        res.json({
            success: true,
            empresa: dbConfig.nombre_comercial,
            count: catalog.length,
            data: catalog
        });

    } catch (err) {
        console.error('Public Catalog API Error:', err);
        res.status(500).json({ success: false, message: 'Error interno al obtener catálogo' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.createOrder = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.params;
        const { cliente, items, delivery } = req.body;

        if (!nit) return res.status(400).json({ success: false, message: 'NIT requerido' });
        if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Carrito vacío' });
        if (!cliente || !cliente.nombre || !cliente.telefono) {
            return res.status(400).json({ success: false, message: 'Datos del cliente incompletos' });
        }

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);
        await clientConn.beginTransaction();

        // 1. Gestionar Cliente (Tercero)
        let clienteId = null;
        const documentoCliente = cliente.documento || cliente.telefono.replace(/\D/g, '');

        const [existingClient] = await clientConn.query('SELECT id FROM terceros WHERE documento = ? OR telefono = ?', [documentoCliente, cliente.telefono]);

        if (existingClient.length > 0) {
            clienteId = existingClient[0].id;
            await clientConn.query(`
                UPDATE terceros 
                SET direccion = ?, direccion_adicional = ?, telefono = ?, email = ?, 
                    tipo_documento = ?, pais_id = ?, departamento_id = ?, ciudad_id = ?
                WHERE id = ?
            `, [
                cliente.direccion, cliente.direccion_adicional, cliente.telefono, cliente.email,
                cliente.tipo_documento, cliente.pais_id, cliente.departamento_id, cliente.ciudad_id,
                clienteId
            ]);
        } else {
            const [resCli] = await clientConn.query(`
                INSERT INTO terceros 
                (nombre_comercial, razon_social, tipo_documento, documento, direccion, direccion_adicional, 
                 telefono, email, pais_id, departamento_id, ciudad_id, es_cliente, es_proveedor)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
            `, [
                cliente.nombre, cliente.nombre, cliente.tipo_documento || 'CC', documentoCliente,
                cliente.direccion || '', cliente.direccion_adicional || '', cliente.telefono, cliente.email || '',
                cliente.pais_id || null, cliente.departamento_id || null, cliente.ciudad_id || null
            ]);
            clienteId = resCli.insertId;
        }

        // 2. Obtener Consecutivo de Pedido Web
        let [docs] = await clientConn.query(`
            SELECT id, prefijo, consecutivo_actual, sucursal_id 
            FROM documentos 
            WHERE categoria IN ('Pedido', 'Pedido Web') AND estado = 1 
            ORDER BY (categoria = 'Pedido Web') DESC 
            LIMIT 1 FOR UPDATE
        `);

        if (docs.length === 0) {
            // AUTO-INIT: Create a default 'Pedido Web' document if none exists
            const [suc] = await clientConn.query("SELECT id FROM sucursales WHERE es_principal = 1 LIMIT 1");
            const sucId = suc.length > 0 ? suc[0].id : 1;

            const [newDoc] = await clientConn.query(`
                INSERT INTO documentos (sucursal_id, categoria, nombre, prefijo, consecutivo_actual, estado)
                VALUES (?, 'Pedido Web', 'Pedidos Tienda Online', 'PW', 1, 1)
            `, [sucId]);

            docs = [{ id: newDoc.insertId, prefijo: 'PW', consecutivo_actual: 1, sucursal_id: sucId }];
        }

        const docConfig = docs[0];
        const numeroPedido = `${docConfig.prefijo || ''}${docConfig.consecutivo_actual}`;
        const sucursalId = docConfig.sucursal_id;

        await clientConn.query('UPDATE documentos SET consecutivo_actual = consecutivo_actual + 1 WHERE id = ?', [docConfig.id]);

        // 3. Procesar Items y Stock (Reserva preventivamente)
        let subtotalTotal = 0;
        let totalFinal = 0;

        for (const item of items) {
            let prodId = item.id;
            let prod = null;

            if (prodId) {
                const [prods] = await clientConn.query('SELECT * FROM productos WHERE id = ? FOR UPDATE', [prodId]);
                if (prods.length > 0) prod = prods[0];
            }

            if (!prod) {
                const [prodsByName] = await clientConn.query('SELECT * FROM productos WHERE nombre = ? LIMIT 1 FOR UPDATE', [item.name]);
                if (prodsByName.length > 0) {
                    prod = prodsByName[0];
                    prodId = prod.id;
                }
            }

            if (!prod) throw new Error(`Producto no encontrado: ${item.name}`);

            const cantidad = parseFloat(item.quantity);
            const precio = parseFloat(prod.precio1);
            const subtotalItem = precio * cantidad;

            subtotalTotal += subtotalItem;
            totalFinal += subtotalItem;

            if (prod.ecommerce_afecta_inventario) {
                if (prod.stock_actual < cantidad) {
                    throw new Error(`Stock insuficiente para ${prod.nombre}`);
                }

                // Update Stock Global
                await clientConn.query('UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?', [cantidad, prodId]);

                // Update Stock Sucursal
                if (sucursalId) {
                    const [invSuc] = await clientConn.query('SELECT cant_actual FROM inventario_sucursales WHERE producto_id = ? AND sucursal_id = ?', [prodId, sucursalId]);
                    if (invSuc.length > 0) {
                        await clientConn.query('UPDATE inventario_sucursales SET cant_actual = cant_actual - ? WHERE producto_id = ? AND sucursal_id = ?', [cantidad, prodId, sucursalId]);
                    } else {
                        await clientConn.query('INSERT INTO inventario_sucursales (producto_id, sucursal_id, cant_actual) VALUES (?, ?, ?)', [prodId, sucursalId, -cantidad]);
                    }
                }

                // Movement record as 'RESERVA_WEB'
                await clientConn.query(`
                    INSERT INTO movimientos_inventario 
                    (producto_id, sucursal_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, documento_referencia, costo_unitario)
                    VALUES (?, ?, 'ENTRADA', ?, ?, ?, ?, ?, ?)
                `, [
                    prodId, sucursalId, -cantidad, // Usamos negativo en entrada para representar reserva/salida
                    prod.stock_actual,
                    prod.stock_actual - cantidad,
                    'Reserva Pedido Web', numeroPedido, prod.costo
                ]);
            }

            item.dbProd = prod;
            item.dbPrecio = precio;
            item.dbSubtotal = subtotalItem;
        }

        // 4. Insertar Header de Pedido Web (NUEVO TRABAJO)
        const [resPed] = await clientConn.query(`
            INSERT INTO pedidos_web 
            (numero_pedido, prefijo, documento_id, cliente_id, subtotal, impuesto_total, total, estado, observaciones, delivery_info)
            VALUES (?, ?, ?, ?, ?, 0, ?, 'Pendiente', ?, ?)
        `, [
            numeroPedido, docConfig.prefijo, docConfig.id, clienteId,
            subtotalTotal, totalFinal,
            `Pedido generado desde E-commerce`,
            JSON.stringify(delivery || {})
        ]);

        const pedidoId = resPed.insertId;

        // 5. Insertar Detalles de Pedido Web
        for (const item of items) {
            await clientConn.query(`
                INSERT INTO pedidos_web_detalle (pedido_id, producto_id, cantidad, precio_unitario, impuesto_porcentaje, subtotal)
                VALUES (?, ?, ?, ?, 0, ?)
            `, [pedidoId, item.dbProd.id, item.quantity, item.dbPrecio, item.dbSubtotal]);
        }

        await clientConn.commit();

        res.json({
            success: true,
            numero_pedido: numeroPedido,
            total: totalFinal,
            message: 'Pedido recibido correctamente. Pronto nos contactaremos para finalizar el despacho.'
        });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('Create Order Error:', err);
        res.status(500).json({ success: false, message: err.message || 'Error al procesar el pedido' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.getPhysicalStores = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.params;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Tienda no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        // Lazy Migration: Check if es_tienda_fisica column exists
        const [columns] = await clientConn.query("SHOW COLUMNS FROM sucursales LIKE 'es_tienda_fisica'");
        if (columns.length === 0) {
            await clientConn.query("ALTER TABLE sucursales ADD COLUMN es_tienda_fisica TINYINT(1) DEFAULT 0 AFTER direccion");
            // Set 'Principal' as physical store by default if it exists
            await clientConn.query("UPDATE sucursales SET es_tienda_fisica = 1 WHERE nombre LIKE '%Principal%' OR es_principal = 1");
        }

        const [rows] = await clientConn.query("SELECT id, nombre, direccion, telefono FROM sucursales WHERE es_tienda_fisica = 1 AND (estado = 'Activo' OR estado IS NULL)");

        // If no physical stores found, return at least one fallback if available or empty
        if (rows.length === 0) {
            // Fallback: return principal
            const [principal] = await clientConn.query("SELECT id, nombre, direccion, telefono FROM sucursales WHERE es_principal = 1");
            return res.json({ success: true, data: principal });
        }

        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('Public Branches API Error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener sucursales' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Get Departments (for checkout form)
exports.getDepartamentos = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.params;
        const { pais_id } = req.query;

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        let query = 'SELECT id, nombre, codigo FROM departamentos';
        const params = [];

        if (pais_id) {
            query += ' WHERE pais_id = ?';
            params.push(pais_id);
        }

        query += ' ORDER BY nombre ASC';
        const [rows] = await clientConn.query(query, params);

        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('Public Departamentos API Error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener departamentos' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

// Get Cities (for checkout form)
exports.getCiudades = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.params;
        const { departamento_id } = req.query;

        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        let query = 'SELECT id, nombre, codigo FROM ciudades';
        const params = [];

        if (departamento_id) {
            query += ' WHERE departamento_id = ?';
            params.push(departamento_id);
        }

        query += ' ORDER BY nombre ASC';
        const [rows] = await clientConn.query(query, params);

        res.json({ success: true, data: rows });

    } catch (err) {
        console.error('Public Ciudades API Error:', err);
        res.status(500).json({ success: false, message: 'Error al obtener ciudades' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
