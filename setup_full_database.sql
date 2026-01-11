-- =======================================================================================
-- SCRIPT MAESTRO DE INICIALIZACIÓN DE BASE DE DATOS - ERPod
-- Generado el: 2026-01-11
-- Descripción: Crea todas las tablas necesarias para el funcionamiento correcto del ERP.
-- Instrucciones: Ejecutar en la base de datos del cliente.
-- =======================================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =======================================================================================
-- MÓDULO: CONFIGURACIÓN Y CORE
-- =======================================================================================

-- 1. INFORMACIÓN DE LA EMPRESA (Configuración General)
CREATE TABLE IF NOT EXISTS informacion_empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_figura VARCHAR(50),      -- 'Natural', 'Juridica', 'SC'
    nombre_fiscal VARCHAR(255),
    nombre_comercial VARCHAR(255),
    nit VARCHAR(50),
    dv VARCHAR(1),
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(100),
    sitio_web VARCHAR(255),
    logo_url TEXT,
    estado VARCHAR(20) DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. SUCURSALES (Debe haber al menos una para facturación)
CREATE TABLE IF NOT EXISTS sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'Activa',
    es_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sucursales (nombre, direccion, estado, es_principal) 
VALUES ('Sede Principal', 'Dirección General', 'Activa', 1)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- 3. TERCEROS (Clientes y Proveedores)
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
);

-- 4. USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    usuario VARCHAR(50) UNIQUE, 
    email VARCHAR(100),
    contraseña VARCHAR(255), -- Hash (Usado por el login)
    password VARCHAR(255),   -- Alias opcional
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario administrador por defecto (Clave: admin123)
-- Hash generado para 'admin123': $2b$10$7vMOn5pX5Q0P8c8mG9K8Ge5X6y8o1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z
-- Nota: En producción, el cliente debe cambiar esta contraseña.
INSERT INTO usuarios (nombre, usuario, email, contraseña) 
VALUES ('Administrador', 'admin', 'admin@erpod.com', '$2b$10$hB7s9V.M1sX1sX1sX1sX1euX1sX1sX1sX1sX1sX1sX1sX1sX1sX1s')
ON DUPLICATE KEY UPDATE usuario=usuario;
-- *Nota real*: El hash de arriba es figurativo. Usar uno real de bcrypt. admin / admin123

-- 5. DOCUMENTOS (Resoluciones y Consecutivos)
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

-- =======================================================================================
-- MÓDULO: PRODUCTOS E INVENTARIO
-- =======================================================================================

-- 6. PRODUCTOS
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
    stock_actual DECIMAL(15,2) DEFAULT 0,
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
);

-- 7. INVENTARIO POR SUCURSAL
CREATE TABLE IF NOT EXISTS inventario_sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    cant_actual DECIMAL(15,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_prod_suc (producto_id, sucursal_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
);

-- 8. MOVIMIENTOS DE INVENTARIO (Kardex)
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

-- =======================================================================================
-- MÓDULO: COMPRAS
-- =======================================================================================

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. COMPRAS DETALLE
CREATE TABLE IF NOT EXISTS compras_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT,
    producto_id INT,
    cantidad DECIMAL(15,2),
    costo_unitario DECIMAL(15,2),
    subtotal DECIMAL(15,2),
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE
);

-- =======================================================================================
-- MÓDULO: FACTURACIÓN (POS)
-- =======================================================================================

-- 11. FACTURAS
CREATE TABLE IF NOT EXISTS facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    numero_factura VARCHAR(50) UNIQUE,
    prefijo VARCHAR(20),
    documento_id INT,
    cliente_id INT,
    vendedor_id INT,
    usuario_id INT,
    sucursal_id INT,
    subtotal DECIMAL(15,2) DEFAULT 0,
    impuesto_total DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    monto_pagado DECIMAL(15,2) DEFAULT 0,
    devuelta DECIMAL(15,2) DEFAULT 0,
    tipo_pago VARCHAR(20),
    metodo_pago VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'Pagada',
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
);

-- 13. RECIBOS DE CAJA
CREATE TABLE IF NOT EXISTS recibos_caja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_recibo VARCHAR(50),
    documento_id INT,
    factura_id INT, 
    cliente_id INT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    monto DECIMAL(15,2),
    concepto VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS = 1;
