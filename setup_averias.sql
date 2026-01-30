-- =======================================================================================
-- MÓDULO: GESTIÓN DE AVERÍAS
-- =======================================================================================

-- 15. AVERÍAS
-- Tabla para registrar productos no aptos para la venta regular (dañados, defectuosos, etc.)
-- Estos productos se retiran del inventario activo de la sucursal y pasan a este registro.

CREATE TABLE IF NOT EXISTS averias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    sucursal_origen_id INT NOT NULL, -- Sucursal donde se detectó o de donde salió el producto
    cantidad DECIMAL(15,2) NOT NULL,
    fecha_reporte DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo_descripcion TEXT, -- Razón de la avería (ej. "Golpe", "Vencido", "Caja rota")
    estado VARCHAR(50) DEFAULT 'Pendiente', -- Estados sugeridos: 'Pendiente', 'Para Remate', 'Para Regalo', 'Desechado', 'Recuperado'
    usuario_reporto_id INT, -- Usuario que reportó la avería
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (sucursal_origen_id) REFERENCES sucursales(id) ON DELETE CASCADE
);

-- Notas de uso:
-- 1. Al insertar en esta tabla, se DEBE restar la cantidad correspondiente de 'inventario_sucursales'.
-- 2. El 'estado' permite filtrar qué hacer con ellos posteriormente (Remate, Obsequio, etc.).
