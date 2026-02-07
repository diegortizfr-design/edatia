-- =============================================
-- ERPOD - Complete Client Database Schema
-- Generated on: 2026-02-07
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

-- 0. INFORMACION EMPRESA
CREATE TABLE IF NOT EXISTS informacion_empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_figura VARCHAR(50),
    nombre_fiscal VARCHAR(255),
    nombre_comercial VARCHAR(255),
    nit VARCHAR(50),
    dv VARCHAR(5),
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(100),
    sitio_web VARCHAR(100),
    logo_url TEXT,
    estado VARCHAR(20) DEFAULT 'Activo',
    config_inventario JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. SUCURSALES (Branches)
CREATE TABLE IF NOT EXISTS sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'Activa',
    es_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TERCEROS (Third Parties: Clients, Suppliers, Employees)
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
);

-- 3. ROLES
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CARGOS (Job Titles)
CREATE TABLE IF NOT EXISTS cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    rol_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- 5. USUARIOS (System Users)
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
);

-- 6. DOCUMENTOS (Document Configuration / Numbering)
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
);

-- 7. CATEGORIAS PRODUCTOS
CREATE TABLE IF NOT EXISTS categorias_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo TINYINT(1) DEFAULT 1,
    empresa_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. PRODUCTOS
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
);

-- 9. COMPRAS
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
);

-- 10. COMPRAS DETALLE
CREATE TABLE IF NOT EXISTS compras_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT,
    producto_id INT,
    cantidad INT,
    costo_unitario DECIMAL(15,2),
    subtotal DECIMAL(15,2),
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE
);

-- 11. FACTURAS
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
    caja_sesion_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. FACTURA DETALLE
CREATE TABLE IF NOT EXISTS factura_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    factura_id INT,
    producto_id INT,
    cantidad DECIMAL(15,2),
    precio_unitario DECIMAL(15,2),
    impuesto_porcentaje DECIMAL(5,2),
    subtotal DECIMAL(15,2),
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
);

-- 13. RECIBOS CAJA
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
);

-- 14. INVENTARIO SUCURSALES (Multi-branch Stock)
CREATE TABLE IF NOT EXISTS inventario_sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    cant_actual DECIMAL(15,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_prod_suc (producto_id, sucursal_id)
);

-- 15. MOVIMIENTOS INVENTARIO (Kardex)
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
);

-- 16. NOTAS CRÉDITO
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
);

-- 17. NOTA CRÉDITO DETALLE
CREATE TABLE IF NOT EXISTS nota_credito_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nota_credito_id INT,
    producto_id INT,
    cantidad DECIMAL(15,2),
    precio_unitario DECIMAL(15,2),
    impuesto_porcentaje DECIMAL(5,2),
    subtotal DECIMAL(15,2),
    FOREIGN KEY (nota_credito_id) REFERENCES notas_credito(id) ON DELETE CASCADE
);

-- 18. CAJAS (POS Registers)
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
);

-- 19. CAJA SESIONES (Sessions)
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
);

-- 20. CAJA MOVIMIENTOS
CREATE TABLE IF NOT EXISTS caja_movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caja_sesion_id INT,
    tipo_movimiento ENUM('Ingreso', 'Egreso') NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    concepto VARCHAR(255),
    documento_referencia VARCHAR(100),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caja_sesion_id) REFERENCES caja_sesiones(id) ON DELETE CASCADE
);

-- 21. SEED DATA (Default Values)
INSERT IGNORE INTO roles (nombre, descripcion) VALUES 
('Administrador', 'Acceso total al sistema'),
('Vendedor', 'Acceso a POS, Facturación y Clientes'),
('Cajero', 'Acceso a POS y Recibos de Caja'),
('Almacenista', 'Gestión de Inventarios y Productos'),
('Contador', 'Acceso a Reportes y Contabilidad');

INSERT IGNORE INTO cargos (nombre) VALUES 
('Gerente'), ('Vendedor Mostrador'), ('Cajero'), ('Bodeguero'), ('Contador Externo');

SET FOREIGN_KEY_CHECKS = 1;

-- Fin del script
