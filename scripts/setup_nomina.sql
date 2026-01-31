-- frontend/modules/nomina/configuraciones/setup_nomina.sql

CREATE TABLE IF NOT EXISTS nomina_cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar algunos cargos por defecto
INSERT INTO nomina_cargos (nombre, descripcion) VALUES 
('Vendedor', 'Personal encargado de las ventas'),
('Cajero', 'Personal encargado de la caja y cobros'),
('Administrador', 'Personal con acceso total al sistema'),
('Almacenista', 'Personal encargado de bodega e inventario')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Añadir columna rol_id a terceros si no existe
ALTER TABLE terceros ADD COLUMN IF NOT EXISTS es_empleado BOOLEAN DEFAULT 0;
ALTER TABLE terceros ADD COLUMN IF NOT EXISTS cargo_id INT DEFAULT NULL;
ALTER TABLE terceros ADD CONSTRAINT fk_tercero_cargo FOREIGN KEY (cargo_id) REFERENCES nomina_cargos(id) ON DELETE SET NULL;
