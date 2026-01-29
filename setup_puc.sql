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
    INDEX idx_codigo (codigo),
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
