
CREATE TABLE IF NOT EXISTS categorias_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo TINYINT(1) DEFAULT 1,
    empresa_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Populate from existing distinct categories if table is empty
INSERT IGNORE INTO categorias_productos (nombre)
SELECT DISTINCT categoria FROM productos 
WHERE categoria IS NOT NULL AND categoria != '' AND categoria NOT IN (SELECT nombre FROM categorias_productos);
