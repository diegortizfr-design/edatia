const { connectToClientDB } = require('../config/dbFactory');

/**
 * Initializes or updates the schema for a specific client database.
 * This should be called when creating a company or explicitly requesting a migration.
 * @param {Object} dbConfig - Database configuration for the client
 */
async function initializeTenantDB(dbConfig) {
    let clientConn = null;
    try {
        clientConn = await connectToClientDB(dbConfig);
        console.log(`Starting schema initialization for database: ${dbConfig.db_name}`);

        // --- 1. SUCURSALES ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS sucursales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                direccion VARCHAR(255) NOT NULL,
                telefono VARCHAR(50),
                estado VARCHAR(20) DEFAULT 'Activa',
                es_principal BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // --- 2. TERCEROS ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS terceros (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre_comercial VARCHAR(255),
                razon_social VARCHAR(255),
                tipo_documento VARCHAR(20),
                documento VARCHAR(50),
                direccion VARCHAR(255),
                telefono VARCHAR(50),
                email VARCHAR(100),
                es_cliente BOOLEAN DEFAULT 0,
                es_proveedor BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_documento (documento)
            )
        `);

        // --- 3. USUARIOS ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100),
                usuario VARCHAR(50), 
                email VARCHAR(100),
                contraseña VARCHAR(255),
                password VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // --- 4. DOCUMENTOS ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS documentos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sucursal_id INT NOT NULL,
                categoria VARCHAR(50),
                nombre VARCHAR(100) NOT NULL,
                prefijo VARCHAR(20),
                consecutivo_actual INT DEFAULT 1,
                resolucion_numero VARCHAR(100),
                resolucion_fecha DATE,
                resolucion_fecha_vencimiento DATE,
                resolucion_rango_inicial INT,
                resolucion_rango_final INT,
                resolucion_texto TEXT,
                documento_equivalente VARCHAR(50),
                tipo_doc_electronico VARCHAR(50),
                excluir_impuestos BOOLEAN DEFAULT 0,
                estado BOOLEAN DEFAULT 1,
                FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
            )
        `);

        // --- 5. PRODUCTOS ---
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

        // Add missing columns for PRODUCTOS
        const [prodColumns] = await clientConn.query('SHOW COLUMNS FROM productos');
        const prodColNames = prodColumns.map(c => c.Field);

        const prodNewCols = [
            { name: 'mostrar_en_tienda', def: 'BOOLEAN DEFAULT 0' },
            { name: 'ecommerce_descripcion', def: 'TEXT' },
            { name: 'ecommerce_imagenes', def: 'TEXT' },
            { name: 'ecommerce_afecta_inventario', def: 'BOOLEAN DEFAULT 0' },
            { name: 'stock_actual', def: 'INT DEFAULT 0' }, // Ensure types match
            { name: 'costo', def: 'DECIMAL(15,2) DEFAULT 0' }
        ];

        for (const col of prodNewCols) {
            if (!prodColNames.includes(col.name)) {
                try {
                    await clientConn.query(`ALTER TABLE productos ADD COLUMN ${col.name} ${col.def}`);
                    console.log(`Added column ${col.name} to productos`);
                } catch (e) { console.log(`Column ${col.name} maybe exists or error`, e.message); }
            }
        }

        // --- 6. COMPRAS ---
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Mini-migration for compras columns
        const [compColumns] = await clientConn.query('SHOW COLUMNS FROM compras');
        const compColNames = compColumns.map(c => c.Field);
        const compNewCols = [
            { name: 'documento_id', def: 'INT' },
            { name: 'numero_comprobante', def: 'VARCHAR(50)' },
            { name: 'sucursal_id', def: 'INT' },
            { name: 'estado_pago', def: "VARCHAR(50) DEFAULT 'Debe'" },
            { name: 'usuario_id', def: 'INT' },
            { name: 'factura_referencia', def: 'VARCHAR(100)' },
            { name: 'factura_url', def: 'TEXT' }
        ];
        for (const col of compNewCols) {
            if (!compColNames.includes(col.name)) {
                try { await clientConn.query(`ALTER TABLE compras ADD COLUMN ${col.name} ${col.def}`); } catch (e) { }
            }
        }

        // --- 7. COMPRAS DETALLE ---
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

        // --- 8. FACTURAS ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS facturas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero_factura VARCHAR(50) UNIQUE,
                prefijo VARCHAR(20),
                documento_id INT,
                cliente_id INT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                subtotal DECIMAL(15,2) DEFAULT 0,
                impuesto_total DECIMAL(15,2) DEFAULT 0,
                total DECIMAL(15,2) DEFAULT 0,
                tipo_pago VARCHAR(20), 
                metodo_pago VARCHAR(50),
                monto_pagado DECIMAL(15,2) DEFAULT 0,
                devuelta DECIMAL(15,2) DEFAULT 0,
                estado VARCHAR(20) DEFAULT 'Pagada',
                vendedor_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Mini-migration for facturas
        const [facColumns] = await clientConn.query('SHOW COLUMNS FROM facturas');
        const facColNames = facColumns.map(c => c.Field);
        if (!facColNames.includes('tipo_pago')) try { await clientConn.query("ALTER TABLE facturas ADD COLUMN tipo_pago VARCHAR(20)"); } catch (e) { }
        if (!facColNames.includes('monto_pagado')) try { await clientConn.query("ALTER TABLE facturas ADD COLUMN monto_pagado DECIMAL(15,2) DEFAULT 0"); } catch (e) { }
        if (!facColNames.includes('devuelta')) try { await clientConn.query("ALTER TABLE facturas ADD COLUMN devuelta DECIMAL(15,2) DEFAULT 0"); } catch (e) { }


        // --- 9. FACTURA DETALLE ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS factura_detalle (
                id INT AUTO_INCREMENT PRIMARY KEY,
                factura_id INT,
                producto_id INT,
                cantidad DECIMAL(15,2),
                precio_unitario DECIMAL(15,2),
                impuesto_porcentaje DECIMAL(5,2),
                subtotal DECIMAL(15,2),
                FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
            )
        `);

        // --- 10. RECIBOS CAJA ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS recibos_caja (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero_recibo VARCHAR(50),
                documento_id INT,
                factura_id INT, 
                cliente_id INT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                monto DECIMAL(15,2),
                concepto VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // --- 11. INVENTARIO (Sucursales & Movimientos) ---
        await clientConn.query(`
             CREATE TABLE IF NOT EXISTS inventario_sucursales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                producto_id INT NOT NULL,
                sucursal_id INT NOT NULL,
                cant_actual DECIMAL(15,2) DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_prod_suc (producto_id, sucursal_id)
            )
        `);

        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS movimientos_inventario (
                id INT AUTO_INCREMENT PRIMARY KEY,
                producto_id INT NOT NULL,
                sucursal_id INT DEFAULT NULL,
                tipo_movimiento VARCHAR(50) NOT NULL,
                cantidad DECIMAL(15,2) NOT NULL,
                stock_anterior DECIMAL(15,2) DEFAULT 0,
                stock_nuevo DECIMAL(15,2) NOT NULL,
                motivo VARCHAR(255),
                documento_referencia VARCHAR(100) DEFAULT NULL,
                costo_unitario DECIMAL(15,2) DEFAULT 0,
                usuario_id INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (producto_id),
                INDEX (created_at)
            )
        `);

        console.log(`Schema initialization completed for: ${dbConfig.db_name}`);
        return { success: true };

    } catch (err) {
        console.error('Error initializing tenant DB:', err);
        throw err;
    } finally {
        if (clientConn) await clientConn.end();
    }
}

module.exports = { initializeTenantDB };
