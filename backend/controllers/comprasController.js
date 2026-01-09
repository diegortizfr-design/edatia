const { getPool } = require('../config/db');
const { connectToClientDB } = require('../config/dbFactory');

async function getClientDbConfig(nit) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
    if (rows.length === 0) return null;
    return rows[0];
}

// Helper to ensure schema exists (Mini-migration system)
async function ensureComprasSchema(clientConn) {
    try { await clientConn.query("ALTER TABLE productos ADD COLUMN stock_actual INT DEFAULT 0"); } catch (e) { }
    try { await clientConn.query("ALTER TABLE productos ADD COLUMN costo DECIMAL(15,2) DEFAULT 0"); } catch (e) { }

    await clientConn.query(`
        CREATE TABLE IF NOT EXISTS compras (
            id INT AUTO_INCREMENT PRIMARY KEY,
            proveedor_id INT,
            sucursal_id INT,
            documento_id INT,
            numero_comprobante VARCHAR(50),
            fecha DATE,
            total DECIMAL(15,2),
            estado VARCHAR(50),
            estado_pago VARCHAR(50) DEFAULT 'Debe',
            usuario_id INT,
            factura_referencia VARCHAR(100),
            factura_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    `);

    try { await clientConn.query("ALTER TABLE compras ADD COLUMN documento_id INT"); } catch (e) { }
    try { await clientConn.query("ALTER TABLE compras ADD COLUMN numero_comprobante VARCHAR(50)"); } catch (e) { }
    try { await clientConn.query("ALTER TABLE compras ADD COLUMN sucursal_id INT"); } catch (e) { }
    try { await clientConn.query("ALTER TABLE compras ADD COLUMN estado_pago VARCHAR(50) DEFAULT 'Debe'"); } catch (e) { }
    try { await clientConn.query("ALTER TABLE compras ADD COLUMN usuario_id INT"); } catch (e) { }
    try { await clientConn.query("ALTER TABLE compras ADD COLUMN factura_referencia VARCHAR(100)"); } catch (e) { }
    try { await clientConn.query("ALTER TABLE compras ADD COLUMN factura_url TEXT"); } catch (e) { }

    await clientConn.query(`
        CREATE TABLE IF NOT EXISTS compras_detalle (
            id INT AUTO_INCREMENT PRIMARY KEY,
            compra_id INT,
            producto_id INT,
            cantidad INT,
            costo_unitario DECIMAL(15,2),
            subtotal DECIMAL(15,2),
            FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE
        )
    `);
}

exports.listarCompras = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        if (!dbConfig) return res.status(404).json({ success: false, message: 'Empresa no encontrada' });

        clientConn = await connectToClientDB(dbConfig);

        // Ensure schema exists before querying (prevents 500 if columns missing)
        await ensureComprasSchema(clientConn);

        // JOIN with Terceros and Documentos for full details
        const sql = `
            SELECT c.*, 
                   t.nombre_comercial, t.razon_social, t.documento as proveedor_nit,
                   d.nombre as documento_nombre, d.prefijo as documento_prefijo
            FROM compras c
            LEFT JOIN terceros t ON c.proveedor_id = t.id
            LEFT JOIN documentos d ON c.documento_id = d.id
            ORDER BY c.fecha DESC LIMIT 100
        `;

        const [rows] = await clientConn.query(sql);

        // Map format for frontend convenience
        const mod = rows.map(r => ({
            ...r,
            proveedor_nombre: r.nombre_comercial || r.razon_social || 'Desconocido',
            combo_documento: r.documento_nombre ? `${r.documento_nombre} (${r.numero_comprobante || 'S/N'})` : 'N/A'
        }));

        res.json({ success: true, data: mod });

    } catch (err) {
        console.error('listarCompras error:', err);
        res.status(500).json({ success: false, message: 'Error interno: ' + err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.actualizarCompra = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);
        const { id } = req.params;
        const { estado, estado_pago } = req.body;

        // Validar que la orden existe
        const [ordenes] = await clientConn.query('SELECT * FROM compras WHERE id = ?', [id]);
        if (ordenes.length === 0) return res.status(404).json({ success: false, message: 'Orden no encontrada' });

        const ordenActual = ordenes[0];

        // LOGIC: Stock Movement (If transitioning TO 'Completada')
        if (estado === 'Completada' && ordenActual.estado !== 'Completada') {

            // Get items
            const [items] = await clientConn.query('SELECT * FROM compras_detalle WHERE compra_id = ?', [id]);

            await clientConn.beginTransaction();

            // Update Stock
            for (const item of items) {
                await clientConn.query(`
                    UPDATE productos 
                    SET stock_actual = stock_actual + ?, costo = ?
                    WHERE id = ?
                `, [item.cantidad, item.costo_unitario, item.producto_id]);
            }

            // Update Header
            await clientConn.query('UPDATE compras SET estado = ? WHERE id = ?', [estado, id]);
            await clientConn.commit();

        } else if (estado) {
            await clientConn.query('UPDATE compras SET estado = ? WHERE id = ?', [estado, id]);
        }

        // Update Invoice Details if provided (e.g., in Realizada state)
        if (req.body.factura_referencia || req.file || req.body.factura_url) {
            const updates = [];
            const params = [];
            if (req.body.factura_referencia) { updates.push('factura_referencia = ?'); params.push(req.body.factura_referencia); }

            // Handle file upload
            if (req.file) {
                const fileUrl = `/uploads/facturas/${req.file.filename}`;
                updates.push('factura_url = ?');
                params.push(fileUrl);
            } else if (req.body.factura_url) {
                // Fallback if URL is sent manually
                updates.push('factura_url = ?');
                params.push(req.body.factura_url);
            }

            if (updates.length > 0) {
                params.push(id);
                await clientConn.query(`UPDATE compras SET ${updates.join(', ')} WHERE id = ?`, params);
            }
        }


        if (estado_pago) {
            await clientConn.query('UPDATE compras SET estado_pago = ? WHERE id = ?', [estado_pago, id]);
        }

        res.json({ success: true, message: 'Orden actualizada' });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('actualizarCompra error:', err);
        res.status(500).json({ success: false, message: 'Error actualizando compra' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.crearCompra = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const {
            proveedor_id, sucursal_id, fecha, total, estado, items,
            documento_id, factura_referencia // cruce logic
        } = req.body;

        // --- MIGRATIONS: Ensure columns exist ---
        try { await clientConn.query("ALTER TABLE productos ADD COLUMN stock_actual INT DEFAULT 0"); } catch (e) { }
        try { await clientConn.query("ALTER TABLE productos ADD COLUMN costo DECIMAL(15,2) DEFAULT 0"); } catch (e) { }

        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS compras (
                id INT AUTO_INCREMENT PRIMARY KEY,
                proveedor_id INT,
                sucursal_id INT,
                documento_id INT,
                numero_comprobante VARCHAR(50),
                fecha DATE,
                total DECIMAL(15,2),
                estado VARCHAR(50),
                estado_pago VARCHAR(50) DEFAULT 'Debe',
                usuario_id INT,
                factura_referencia VARCHAR(100),
                factura_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )
        `);
        // Alter for new columns
        try { await clientConn.query("ALTER TABLE compras ADD COLUMN documento_id INT"); } catch (e) { }
        try { await clientConn.query("ALTER TABLE compras ADD COLUMN numero_comprobante VARCHAR(50)"); } catch (e) { }
        try { await clientConn.query("ALTER TABLE compras ADD COLUMN sucursal_id INT"); } catch (e) { }
        try { await clientConn.query("ALTER TABLE compras ADD COLUMN estado_pago VARCHAR(50) DEFAULT 'Debe'"); } catch (e) { }
        try { await clientConn.query("ALTER TABLE compras ADD COLUMN usuario_id INT"); } catch (e) { }
        try { await clientConn.query("ALTER TABLE compras ADD COLUMN factura_referencia VARCHAR(100)"); } catch (e) { }
        try { await clientConn.query("ALTER TABLE compras ADD COLUMN factura_url TEXT"); } catch (e) { }

        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS compras_detalle (
                id INT AUTO_INCREMENT PRIMARY KEY,
                compra_id INT,
                producto_id INT,
                cantidad INT,
                costo_unitario DECIMAL(15,2),
                subtotal DECIMAL(15,2),
                FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE
            )
        `);

        // Start transaction
        await clientConn.beginTransaction();

        let numero_comprobante = '';

        // 1. Process Document (Consecutive Logic)
        if (documento_id) {
            const [docs] = await clientConn.query('SELECT * FROM documentos WHERE id = ? FOR UPDATE', [documento_id]);
            if (docs.length === 0) {
                await clientConn.rollback();
                return res.status(400).json({ success: false, message: 'Documento no válido' });
            }
            const doc = docs[0];
            numero_comprobante = `${doc.prefijo || ''}${doc.consecutivo_actual}`;

            // Increment consecutive
            await clientConn.query('UPDATE documentos SET consecutivo_actual = consecutivo_actual + 1 WHERE id = ?', [documento_id]);
        }

        // 2. Insert Header
        const [result] = await clientConn.query(`
            INSERT INTO compras 
            (proveedor_id, sucursal_id, documento_id, numero_comprobante, fecha, total, estado, estado_pago, usuario_id, factura_referencia, factura_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            proveedor_id, sucursal_id || null, documento_id || null, numero_comprobante,
            fecha, total, estado || 'Orden de Compra', 'Debe',
            req.user.id, factura_referencia || null, null
        ]);

        const compraId = result.insertId;

        // 3. Insert Items
        if (items && items.length > 0) {
            for (const item of items) {
                await clientConn.query(`
                    INSERT INTO compras_detalle (compra_id, producto_id, cantidad, costo_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                `, [compraId, item.producto_id, item.cantidad, item.costo, item.subtotal]);
            }
        }

        await clientConn.commit();
        res.status(201).json({ success: true, message: 'Orden de compra creada', id: compraId, comprobante: numero_comprobante });

    } catch (err) {
        if (clientConn) await clientConn.rollback();
        console.error('crearCompra error:', err);
        res.status(500).json({ success: false, message: 'Error al procesar la compra: ' + err.message });
    } finally {
        if (clientConn) await clientConn.end();
    }
};

exports.obtenerDetallesCompra = async (req, res) => {
    let clientConn = null;
    try {
        const { nit } = req.user;
        const dbConfig = await getClientDbConfig(nit);
        clientConn = await connectToClientDB(dbConfig);

        const { id } = req.params;

        const [items] = await clientConn.query(`
            SELECT d.*, p.nombre as nombre_producto 
            FROM compras_detalle d 
            JOIN productos p ON d.producto_id = p.id 
            WHERE d.compra_id = ?
        `, [id]);

        res.json({ success: true, data: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error obteniendo detalles' });
    } finally {
        if (clientConn) await clientConn.end();
    }
};
