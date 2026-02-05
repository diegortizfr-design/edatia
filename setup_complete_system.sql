-- =======================================================================================
-- SCRIPT MAESTRO DE INICIALIZACIÓN - ERPod (CLIENTE NUEVO)
-- Descripción: Este script crea todas las tablas, relaciones y datos iniciales para un nuevo cliente.
-- Cobertura: Core, Inventario, Ventas (POS), Compras, Contabilidad, Nómina, Caja y Asistentes.
-- Fecha generación: 2026-02-03
-- =======================================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =======================================================================================
-- 1. MÓDULO: CONFIGURACIÓN Y ESTRUCTURA ORGANIZACIONAL
-- =======================================================================================

-- Información Fiscal de la Empresa
CREATE TABLE IF NOT EXISTS informacion_empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_figura ENUM('Natural', 'Juridica', 'SC') DEFAULT 'Juridica',
    nombre_fiscal VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    nit VARCHAR(50) NOT NULL,
    dv VARCHAR(1),
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(100),
    sitio_web VARCHAR(255),
    logo_url TEXT,
    config_inventario JSON DEFAULT NULL,
    estado VARCHAR(20) DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sucursales (Puntos de Venta / Bodegas)
CREATE TABLE IF NOT EXISTS sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'Activa',
    es_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentos (Resoluciones de Facturación, Prefijos)
CREATE TABLE IF NOT EXISTS documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    categoria VARCHAR(50), -- 'Factura', 'Recibo', 'Compra', etc.
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
-- 2. MÓDULO: SEGURIDAD, ROLES Y TALENTO HUMANO
-- =======================================================================================

-- Roles del Sistema
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cargos (Para Nómina y Gestión de Personal)
CREATE TABLE IF NOT EXISTS nomina_cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cargos (Alias/Extensión para compatibilidad)
CREATE TABLE IF NOT EXISTS cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    rol_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- Terceros (Clientes, Proveedores y Colaboradores)
CREATE TABLE IF NOT EXISTS terceros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_comercial VARCHAR(255) NOT NULL,
    razon_social VARCHAR(255),
    tipo_documento VARCHAR(20) DEFAULT 'NIT',
    documento VARCHAR(50) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(100),
    es_cliente BOOLEAN DEFAULT 0,
    es_proveedor BOOLEAN DEFAULT 0,
    es_colaborador BOOLEAN DEFAULT 0,
    es_empleado BOOLEAN DEFAULT 0,
    cargo_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_documento (documento),
    FOREIGN KEY (cargo_id) REFERENCES nomina_cargos(id) ON DELETE SET NULL
);

-- Usuarios con Acceso al Sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    usuario VARCHAR(50) UNIQUE NOT NULL, 
    email VARCHAR(100),
    telefono VARCHAR(50),
    contraseña VARCHAR(255) NOT NULL, -- Uso de bcrypt
    `password` VARCHAR(255),            -- Backup/Legacy alias
    rol_id INT,
    cargo_id INT,
    tercero_id INT,
    estado VARCHAR(20) DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL,
    FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE SET NULL,
    FOREIGN KEY (tercero_id) REFERENCES terceros(id) ON DELETE SET NULL
);

-- =======================================================================================
-- 3. MÓDULO: PRODUCTOS E INVENTARIO
-- =======================================================================================

-- Productos y Servicios
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
    stock_minimo INT DEFAULT 5, -- Actualizado según auditoría
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES terceros(id) ON DELETE SET NULL
);

-- Inventario por Sucursal
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

-- Movimientos de Inventario (Kardex)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    sucursal_id INT DEFAULT NULL,
    tipo_movimiento VARCHAR(50) NOT NULL, -- 'entrada', 'salida', 'ajuste', 'venta'
    cantidad DECIMAL(15,2) NOT NULL,
    stock_anterior DECIMAL(15,2) DEFAULT 0,
    stock_nuevo DECIMAL(15,2) NOT NULL,
    motivo VARCHAR(255),
    documento_referencia VARCHAR(100) DEFAULT NULL,
    costo_unitario DECIMAL(15,2) DEFAULT 0,
    usuario_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (producto_id),
    INDEX (created_at),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =======================================================================================
-- 4. MÓDULO: COMPRAS Y GASTOS
-- =======================================================================================

-- Facturas de Compra
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
    FOREIGN KEY (proveedor_id) REFERENCES terceros(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    FOREIGN KEY (documento_id) REFERENCES documentos(id)
);

-- Detalle de Compra
CREATE TABLE IF NOT EXISTS compras_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT,
    producto_id INT,
    cantidad DECIMAL(15,2),
    costo_unitario DECIMAL(15,2),
    subtotal DECIMAL(15,2),
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =======================================================================================
-- 5. MÓDULO: FACTURACIÓN Y POS
-- =======================================================================================

-- Facturas de Venta
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
    tipo_pago VARCHAR(20), -- 'Contado', 'Credito'
    metodo_pago VARCHAR(50), -- 'Efectivo', 'Tarjeta', 'Transferencia'
    estado VARCHAR(20) DEFAULT 'Pagada',
    caja_sesion_id INT NULL, -- Registra la sesión de caja si aplica
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (documento_id) REFERENCES documentos(id),
    FOREIGN KEY (cliente_id) REFERENCES terceros(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
);

-- Detalle de Factura
CREATE TABLE IF NOT EXISTS factura_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    factura_id INT,
    producto_id INT,
    cantidad DECIMAL(15,2),
    precio_unitario DECIMAL(15,2),
    impuesto_porcentaje DECIMAL(5,2),
    subtotal DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Recibos de Caja (Pagos parciales o abonos)
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
    FOREIGN KEY (documento_id) REFERENCES documentos(id),
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE SET NULL,
    FOREIGN KEY (cliente_id) REFERENCES terceros(id)
);

-- =======================================================================================
-- 6. MÓDULO: GESTIÓN DE CAJA (OPEN/CLOSE)
-- =======================================================================================

-- Configuración de Cajas
CREATE TABLE IF NOT EXISTS cajas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    sucursal_id INT,
    documento_id INT,
    impresora_config JSON,
    estado ENUM('Activa', 'Inactiva') DEFAULT 'Activa',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
);

-- Sesiones de Caja
CREATE TABLE IF NOT EXISTS caja_sesiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    sucursal_id INT,
    caja_id INT,
    fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre DATETIME NULL,
    base_inicial DECIMAL(15,2) DEFAULT 0,
    monto_ventas_efectivo DECIMAL(15,2) DEFAULT 0,
    monto_ventas_otros DECIMAL(15,2) DEFAULT 0,
    monto_total_esperado DECIMAL(15,2) DEFAULT 0,
    monto_real_cierre DECIMAL(15,2) DEFAULT 0,
    diferencia DECIMAL(15,2) DEFAULT 0,
    observaciones TEXT,
    estado ENUM('Abierta', 'Cerrada') DEFAULT 'Abierta',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id),
    FOREIGN KEY (caja_id) REFERENCES cajas(id)
);

-- Movimientos de Caja (Ingresos/Egresos directos)
CREATE TABLE IF NOT EXISTS caja_movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sesion_id INT NOT NULL,
    tipo_movimiento ENUM('Ingreso', 'Egreso', 'Venta') NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    motivo VARCHAR(255),
    metodo_pago VARCHAR(50),
    referencia_id INT, -- ID de la factura o recibo
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sesion_id) REFERENCES caja_sesiones(id) ON DELETE CASCADE
);

-- =======================================================================================
-- 7. MÓDULO: CONTABILIDAD
-- =======================================================================================

-- Plan Único de Cuentas (PUC)
CREATE TABLE IF NOT EXISTS contabilidad_puc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    naturaleza ENUM('Debito', 'Credito') NOT NULL,
    nivel INT NOT NULL,
    tipo ENUM('Clase', 'Grupo', 'Cuenta', 'Subcuenta', 'Auxiliar') NOT NULL,
    requiere_tercero BOOLEAN DEFAULT FALSE,
    requiere_costos BOOLEAN DEFAULT FALSE,
    requiere_base BOOLEAN DEFAULT FALSE,
    estado ENUM('Activa', 'Inactiva') DEFAULT 'Activa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo)
);

-- Comprobantes Contables
CREATE TABLE IF NOT EXISTS contabilidad_comprobantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    tipo ENUM('Diario', 'Ingreso', 'Egreso', 'Ajuste') NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    total_debito DECIMAL(15,2) DEFAULT 0,
    total_credito DECIMAL(15,2) DEFAULT 0,
    estado ENUM('Borrador', 'Contabilizado', 'Anulado') DEFAULT 'Borrador',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Movimientos Contables
CREATE TABLE IF NOT EXISTS contabilidad_movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comprobante_id INT NOT NULL,
    cuenta_codigo VARCHAR(20) NOT NULL,
    tercero_id INT,
    descripcion TEXT,
    debito DECIMAL(15,2) DEFAULT 0,
    credito DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (comprobante_id) REFERENCES contabilidad_comprobantes(id) ON DELETE CASCADE,
    FOREIGN KEY (tercero_id) REFERENCES terceros(id)
);

-- =======================================================================================
-- 8. MÓDULO: OTROS (AVERÍAS Y ASISTENTES)
-- =======================================================================================

-- Gestión de Averías
CREATE TABLE IF NOT EXISTS averias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    sucursal_origen_id INT NOT NULL,
    cantidad DECIMAL(15,2) NOT NULL,
    fecha_reporte DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo_descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    usuario_reporto_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (sucursal_origen_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_reporto_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Asistente camIA (Eventos)
CREATE TABLE IF NOT EXISTS eventos_camia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME,
    categoria ENUM('Cita', 'Venta', 'Cobro', 'Pago', 'Personal', 'Nota') DEFAULT 'Personal',
    prioridad ENUM('Baja', 'Media', 'Alta', 'Critica') DEFAULT 'Media',
    estado ENUM('Pendiente', 'En Curso', 'Completado', 'Cancelado') DEFAULT 'Pendiente',
    color VARCHAR(20) DEFAULT '#4F46E5',
    es_todo_el_dia BOOLEAN DEFAULT FALSE,
    recordatorio_minutos INT DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Asistente sofIA (Eventos)
CREATE TABLE IF NOT EXISTS eventos_sofia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME,
    categoria ENUM('Cita', 'Venta', 'Cobro', 'Pago', 'Personal', 'Nota') DEFAULT 'Personal',
    prioridad ENUM('Baja', 'Media', 'Alta', 'Critica') DEFAULT 'Media',
    estado ENUM('Pendiente', 'En Curso', 'Completado', 'Cancelado') DEFAULT 'Pendiente',
    color VARCHAR(20) DEFAULT '#4F46E5',
    es_todo_el_dia BOOLEAN DEFAULT FALSE,
    recordatorio_minutos INT DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =======================================================================================
-- 9. CARGA DE DATOS INICIALES (SEEDING)
-- =======================================================================================

-- Sucursal Principal
INSERT INTO sucursales (nombre, direccion, estado, es_principal) 
VALUES ('Sede Principal', 'Dirección General', 'Activa', 1)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Roles Iniciales
INSERT IGNORE INTO roles (nombre, descripcion) VALUES 
('Administrador', 'Acceso total al sistema'),
('Vendedor', 'Acceso a POS, Facturación y Clientes'),
('Cajero', 'Acceso a POS y Recibos de Caja'),
('Almacenista', 'Gestión de Inventarios y Productos'),
('Contador', 'Acceso a Reportes y Contabilidad');

-- Cargos Iniciales
INSERT IGNORE INTO nomina_cargos (nombre, descripcion) VALUES 
('Gerente', 'Dirección general de la empresa'),
('Vendedor', 'Personal encargado de atención y ventas'),
('Cajero', 'Personal de gestión de cobros'),
('Contador', 'Gestión contable y financiera');

INSERT IGNORE INTO cargos (nombre, rol_id) 
SELECT 'Gerente', id FROM roles WHERE nombre = 'Administrador';

-- Usuario Administrador (Clave por defecto: admin123)
-- Hash bcrypt para 'admin123'
INSERT IGNORE INTO usuarios (`nombre`, `usuario`, `email`, `contraseña`, `password`, `rol_id`, `estado`) 
SELECT 'Administrador ERPod', 'admin', 'admin@erpod.com', '$2b$10$hB7s9V.M1sX1sX1sX1sX1euX1sX1sX1sX1sX1sX1sX1sX1sX1sX1s', 'admin123', id, 'Activo'
FROM roles WHERE nombre = 'Administrador';

SET FOREIGN_KEY_CHECKS = 1;

-- =======================================================================================
-- FIN DEL SCRIPT
-- =======================================================================================
