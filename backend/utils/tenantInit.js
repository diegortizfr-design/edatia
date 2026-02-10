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
                es_colaborador BOOLEAN DEFAULT 0,
                cargo_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_documento (documento)
            )
        `);

        // Mini-migration for TERCEROS
        const [terColumns] = await clientConn.query('SHOW COLUMNS FROM terceros');
        const terColNames = terColumns.map(c => c.Field);
        if (!terColNames.includes('es_colaborador')) {
            try { await clientConn.query('ALTER TABLE terceros ADD COLUMN es_colaborador BOOLEAN DEFAULT 0'); } catch (e) { }
        }
        if (!terColNames.includes('cargo_id')) {
            try { await clientConn.query('ALTER TABLE terceros ADD COLUMN cargo_id INT'); } catch (e) { }
        }
        if (terColNames.includes('es_empleado')) {
            try { await clientConn.query('UPDATE terceros SET es_colaborador = 1 WHERE es_empleado = 1'); } catch (e) { }
        }
        // Geographic fields
        if (!terColNames.includes('pais_id')) {
            try { await clientConn.query('ALTER TABLE terceros ADD COLUMN pais_id INT'); } catch (e) { }
        }
        if (!terColNames.includes('departamento_id')) {
            try { await clientConn.query('ALTER TABLE terceros ADD COLUMN departamento_id INT'); } catch (e) { }
        }
        if (!terColNames.includes('ciudad_id')) {
            try { await clientConn.query('ALTER TABLE terceros ADD COLUMN ciudad_id INT'); } catch (e) { }
        }
        if (!terColNames.includes('direccion_adicional')) {
            try { await clientConn.query('ALTER TABLE terceros ADD COLUMN direccion_adicional VARCHAR(255)'); } catch (e) { }
        }

        // --- 3. ROLES ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // --- 4. CARGOS ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS cargos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                rol_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL
            )
        `);

        // Mini-migration for CARGOS
        const [cargoColumns] = await clientConn.query('SHOW COLUMNS FROM cargos');
        const cargoColNames = cargoColumns.map(c => c.Field);
        if (!cargoColNames.includes('descripcion')) {
            try { await clientConn.query('ALTER TABLE cargos ADD COLUMN descripcion TEXT'); } catch (e) { }
        }
        if (!cargoColNames.includes('rol_id')) {
            try { await clientConn.query('ALTER TABLE cargos ADD COLUMN rol_id INT'); } catch (e) { }
        }

        // --- 5. USUARIOS ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100),
                usuario VARCHAR(50), 
                email VARCHAR(100),
                telefono VARCHAR(50),
                contraseña VARCHAR(255),
                password VARCHAR(255),
                rol_id INT,
                cargo_id INT,
                tercero_id INT,
                estado VARCHAR(20) DEFAULT 'Activo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Mini-migration for USUARIOS
        const [usuColumns] = await clientConn.query('SHOW COLUMNS FROM usuarios');
        const usuColNames = usuColumns.map(c => c.Field);
        const usuNewCols = [
            { name: 'rol_id', def: 'INT NULL' },
            { name: 'cargo_id', def: 'INT NULL' },
            { name: 'tercero_id', def: 'INT NULL' },
            { name: 'telefono', def: 'VARCHAR(50) NULL' },
            { name: 'estado', def: "VARCHAR(20) DEFAULT 'Activo'" }
        ];
        for (const col of usuNewCols) {
            if (!usuColNames.includes(col.name)) {
                try { await clientConn.query(`ALTER TABLE usuarios ADD COLUMN ${col.name} ${col.def}`); } catch (e) { }
            }
        }

        // Seed default roles and cargos for new tenant
        const [rolesCount] = await clientConn.query('SELECT COUNT(*) as total FROM roles');
        if (rolesCount[0].total === 0) {
            await clientConn.query(`
                INSERT INTO roles (nombre, descripcion) VALUES 
                ('Administrador', 'Acceso total al sistema'),
                ('Vendedor', 'Acceso a POS, Facturación y Clientes'),
                ('Cajero', 'Acceso a POS y Recibos de Caja'),
                ('Almacenista', 'Gestión de Inventarios y Productos'),
                ('Contador', 'Acceso a Reportes y Contabilidad')
            `);
        }

        const [cargosCount] = await clientConn.query('SELECT COUNT(*) as total FROM cargos');
        if (cargosCount[0].total === 0) {
            await clientConn.query(`
                INSERT INTO cargos (nombre) VALUES 
                ('Gerente'), ('Vendedor Mostrador'), ('Cajero'), ('Bodeguero'), ('Contador Externo')
            `);
        }

        // --- 6. DOCUMENTOS ---
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

        // Mini-migration for documentos
        const [docColumns] = await clientConn.query('SHOW COLUMNS FROM documentos');
        const docColNames = docColumns.map(c => c.Field);
        const docNewCols = [
            { name: 'resolucion_fecha_vencimiento', def: 'DATE' },
            { name: 'tipo_doc_electronico', def: 'VARCHAR(50)' },
            { name: 'documento_equivalente', def: 'VARCHAR(50)' },
            { name: 'excluir_impuestos', def: 'BOOLEAN DEFAULT 0' },
            { name: 'resolucion_rango_inicial', def: 'INT' },
            { name: 'resolucion_rango_final', def: 'INT' },
            { name: 'resolucion_texto', def: 'TEXT' }
        ];
        for (const col of docNewCols) {
            if (!docColNames.includes(col.name)) {
                try { await clientConn.query(`ALTER TABLE documentos ADD COLUMN ${col.name} ${col.def}`); } catch (e) { }
            }
        }

        // --- 6.5. CATEGORIAS ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS categorias_productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                activo TINYINT(1) DEFAULT 1,
                empresa_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Populate from existing products if empty
        const [catCount] = await clientConn.query('SELECT COUNT(*) as total FROM categorias_productos');
        if (catCount[0].total === 0) {
            // Check if products table exists first to avoid error on fresh install
            const [prodExists] = await clientConn.query("SHOW TABLES LIKE 'productos'");
            if (prodExists.length > 0) {
                await clientConn.query(`
                    INSERT IGNORE INTO categorias_productos (nombre)
                    SELECT DISTINCT categoria FROM productos 
                    WHERE categoria IS NOT NULL AND categoria != ''
                `);
            }
        }

        // --- 7. PRODUCTOS ---
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
                stock_inicial INT DEFAULT 0,
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
            { name: 'costo', def: 'DECIMAL(15,2) DEFAULT 0' },
            { name: 'stock_inicial', def: 'INT DEFAULT 0' }
        ];

        for (const col of prodNewCols) {
            if (!prodColNames.includes(col.name)) {
                try {
                    await clientConn.query(`ALTER TABLE productos ADD COLUMN ${col.name} ${col.def}`);
                    console.log(`Added column ${col.name} to productos`);
                } catch (e) { console.log(`Column ${col.name} maybe exists or error`, e.message); }
            }
        }

        // --- 8. COMPRAS ---
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
                metodo_pago VARCHAR(50) DEFAULT 'Contado',
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
            { name: 'factura_url', def: 'TEXT' },
            { name: 'metodo_pago', def: "VARCHAR(50) DEFAULT 'Contado'" }
        ];
        for (const col of compNewCols) {
            if (!compColNames.includes(col.name)) {
                try { await clientConn.query(`ALTER TABLE compras ADD COLUMN ${col.name} ${col.def}`); } catch (e) { }
            }
        }

        // --- 9. COMPRAS DETALLE ---
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

        // --- 10. FACTURAS ---
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


        // --- 11. FACTURA DETALLE ---
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

        // --- 12. RECIBOS CAJA ---
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

        // --- 13. INVENTARIO (Sucursales & Movimientos) ---
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

        // --- 14. NOTAS CRÉDITO ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS notas_credito (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero_nc VARCHAR(50) UNIQUE,
                prefijo VARCHAR(20),
                documento_id INT,
                factura_id INT,
                cliente_id INT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                subtotal DECIMAL(15,2) DEFAULT 0,
                impuesto_total DECIMAL(15,2) DEFAULT 0,
                total DECIMAL(15,2) DEFAULT 0,
                motivo TEXT,
                usuario_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE SET NULL
            )
        `);

        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS nota_credito_detalle (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nota_credito_id INT,
                producto_id INT,
                cantidad DECIMAL(15,2),
                precio_unitario DECIMAL(15,2),
                impuesto_porcentaje DECIMAL(5,2),
                subtotal DECIMAL(15,2),
                FOREIGN KEY (nota_credito_id) REFERENCES notas_credito(id) ON DELETE CASCADE
            )
        `);

        // --- 15. CAJAS ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS cajas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                sucursal_id INT,
                documento_id INT,
                impresora_config JSON,
                codigo_acceso VARCHAR(50),
                codigo_puc VARCHAR(20),
                cliente_defecto_id INT,
                estado ENUM('Activa', 'Inactiva') DEFAULT 'Activa',
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS caja_sesiones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                sucursal_id INT,
                caja_id INT,
                fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_cierre DATETIME,
                base_inicial DECIMAL(15,2) DEFAULT 0,
                monto_total_esperado DECIMAL(15,2) DEFAULT 0,
                monto_real_cierre DECIMAL(15,2) DEFAULT 0,
                diferencia DECIMAL(15,2) DEFAULT 0,
                estado ENUM('Abierta', 'Cerrada') DEFAULT 'Abierta',
                observaciones TEXT,
                FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE SET NULL
            )
        `);

        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS caja_movimientos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                caja_sesion_id INT,
                tipo_movimiento ENUM('Ingreso', 'Egreso') NOT NULL,
                monto DECIMAL(15,2) NOT NULL,
                concepto VARCHAR(255),
                documento_referencia VARCHAR(100),
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (caja_sesion_id) REFERENCES caja_sesiones(id) ON DELETE CASCADE
            )
        `);

        // Add caja_sesion_id to facturas if not exists
        const [facColsForCaja] = await clientConn.query("SHOW COLUMNS FROM facturas LIKE 'caja_sesion_id'");
        if (facColsForCaja.length === 0) {
            await clientConn.query("ALTER TABLE facturas ADD COLUMN caja_sesion_id INT NULL");
        }

        // --- GEOGRAPHIC TABLES ---
        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS paises (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                codigo VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS departamentos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pais_id INT NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                codigo VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE CASCADE
            )
        `);

        await clientConn.query(`
            CREATE TABLE IF NOT EXISTS ciudades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                departamento_id INT NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                codigo VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE CASCADE
            )
        `);

        // Seed Colombia data if paises table is empty
        const [existingCountries] = await clientConn.query('SELECT COUNT(*) as count FROM paises');
        if (existingCountries[0].count === 0) {
            // Insert Colombia
            const [colombiaResult] = await clientConn.query(`
                INSERT INTO paises (nombre, codigo) VALUES ('Colombia', 'CO')
            `);
            const colombiaId = colombiaResult.insertId;

            // Insert Colombian departments
            const departamentos = [
                'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá',
                'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare',
                'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo',
                'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
                'Valle del Cauca', 'Vaupés', 'Vichada', 'Bogotá D.C.'
            ];

            for (const dept of departamentos) {
                await clientConn.query(`
                    INSERT INTO departamentos (pais_id, nombre) VALUES (?, ?)
                `, [colombiaId, dept]);
            }

            // Insert major cities for key departments
            const [antioquia] = await clientConn.query('SELECT id FROM departamentos WHERE nombre = "Antioquia"');
            if (antioquia.length > 0) {
                const cities = ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro'];
                for (const city of cities) {
                    await clientConn.query('INSERT INTO ciudades (departamento_id, nombre) VALUES (?, ?)', [antioquia[0].id, city]);
                }
            }

            const [bogota] = await clientConn.query('SELECT id FROM departamentos WHERE nombre = "Bogotá D.C."');
            if (bogota.length > 0) {
                await clientConn.query('INSERT INTO ciudades (departamento_id, nombre) VALUES (?, ?)', [bogota[0].id, 'Bogotá']);
            }

            const [valle] = await clientConn.query('SELECT id FROM departamentos WHERE nombre = "Valle del Cauca"');
            if (valle.length > 0) {
                const cities = ['Cali', 'Palmira', 'Buenaventura', 'Tuluá'];
                for (const city of cities) {
                    await clientConn.query('INSERT INTO ciudades (departamento_id, nombre) VALUES (?, ?)', [valle[0].id, city]);
                }
            }

            const [atlantico] = await clientConn.query('SELECT id FROM departamentos WHERE nombre = "Atlántico"');
            if (atlantico.length > 0) {
                const cities = ['Barranquilla', 'Soledad', 'Malambo'];
                for (const city of cities) {
                    await clientConn.query('INSERT INTO ciudades (departamento_id, nombre) VALUES (?, ?)', [atlantico[0].id, city]);
                }
            }

            const [santander] = await clientConn.query('SELECT id FROM departamentos WHERE nombre = "Santander"');
            if (santander.length > 0) {
                const cities = ['Bucaramanga', 'Floridablanca', 'Girón'];
                for (const city of cities) {
                    await clientConn.query('INSERT INTO ciudades (departamento_id, nombre) VALUES (?, ?)', [santander[0].id, city]);
                }
            }
        }

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
