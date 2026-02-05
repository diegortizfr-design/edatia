CREATE TABLE IF NOT EXISTS cajas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    sucursal_id INT,
    documento_id INT,
    impresora_config JSON,
    estado ENUM('Activa', 'Inactiva') DEFAULT 'Activa',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS caja_sesiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    sucursal_id INT,
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
    caja_id INT,
    FOREIGN KEY (caja_id) REFERENCES cajas(id)
);

CREATE TABLE IF NOT EXISTS caja_movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sesion_id INT NOT NULL,
    tipo_movimiento ENUM('Ingreso', 'Egreso', 'Venta') NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    motivo VARCHAR(255),
    metodo_pago VARCHAR(50),
    referencia_id INT, -- ID de la factura o recibo
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sesion_id) REFERENCES caja_sesiones(id)
);

-- Add sesion_caja_id to facturas if it doesn't exist
-- Note: In a real multi-tenant migration, this would run on the client DB.
-- I'll create this file as a reference for the DDL that will be executed programmatically if needed,
-- or I will update the controller to handle it.
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS caja_sesion_id INT NULL;
