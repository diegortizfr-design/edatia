-- SQL Migration: SaaS Core Infrastructure
-- Ejecutar este script en cada base de datos de cliente (Tenant)

-- 1. Agregando columnas de trazabilidad a facturas
ALTER TABLE facturas 
ADD COLUMN IF NOT EXISTS cufe VARCHAR(255),
ADD COLUMN IF NOT EXISTS xml_path VARCHAR(512),
ADD COLUMN IF NOT EXISTS xml_enviado TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS xml_respuesta JSON,
ADD COLUMN IF NOT EXISTS qr_code VARCHAR(512),
ADD COLUMN IF NOT EXISTS dian_status ENUM('PENDIENTE', 'PROCESANDO', 'ACEPTADO', 'RECHAZADO') DEFAULT 'PENDIENTE',
ADD COLUMN IF NOT EXISTS fecha_validacion DATETIME,
ADD COLUMN IF NOT EXISTS intentos_envio INT DEFAULT 0;

-- 2. Tablas para el Motor Contable dinámico
CREATE TABLE IF NOT EXISTS contabilidad_cuentas_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alias VARCHAR(50) UNIQUE NOT NULL,
    cuenta_codigo VARCHAR(20) NOT NULL,
    descripcion VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS contabilidad_plantillas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    evento_slug VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS contabilidad_plantilla_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plantilla_id INT,
    cuenta_alias VARCHAR(50), 
    naturaleza ENUM('DEBITO', 'CREDITO') NOT NULL,
    valor_formula VARCHAR(100),
    centro_costo_id INT,
    FOREIGN KEY (plantilla_id) REFERENCES contabilidad_plantillas(id) ON DELETE CASCADE
);

-- 3. Extensión de movimientos contables para trazabilidad de módulo
ALTER TABLE contabilidad_movimientos 
ADD COLUMN IF NOT EXISTS modulo_origen VARCHAR(50), 
ADD COLUMN IF NOT EXISTS referencia_id INT;

-- 4. Registro de Auditoría (Audit Log)
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    tabla VARCHAR(100),
    registro_id INT,
    accion ENUM('INSERT', 'UPDATE', 'DELETE'),
    datos_anteriores JSON,
    datos_nuevos JSON,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Centros de Costo
CREATE TABLE IF NOT EXISTS centros_costo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(100),
    estado BOOLEAN DEFAULT TRUE
);

-- 6. Insertar configuración por defecto para Ventas (Ejemplo básico)
INSERT IGNORE INTO contabilidad_plantillas (nombre, evento_slug, descripcion) 
VALUES ('Venta Estándar POS', 'sale.completed', 'Generación de asiento automático para ventas POS');
