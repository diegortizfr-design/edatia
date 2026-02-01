-- Tabla de comprobantes contables
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_numero (numero),
    INDEX idx_fecha (fecha),
    INDEX idx_tipo (tipo),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de movimientos (débitos y créditos)
CREATE TABLE IF NOT EXISTS contabilidad_movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comprobante_id INT NOT NULL,
    cuenta_codigo VARCHAR(20) NOT NULL,
    tercero_id INT,
    descripcion TEXT,
    debito DECIMAL(15,2) DEFAULT 0,
    credito DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comprobante_id) REFERENCES contabilidad_comprobantes(id) ON DELETE CASCADE,
    INDEX idx_comprobante (comprobante_id),
    INDEX idx_cuenta (cuenta_codigo),
    INDEX idx_tercero (tercero_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
