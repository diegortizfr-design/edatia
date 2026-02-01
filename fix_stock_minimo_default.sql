-- Script para actualizar el valor por defecto de stock_minimo
-- Ejecutar en la base de datos del cliente

-- Cambiar el DEFAULT de la columna stock_minimo de 0 a 5
ALTER TABLE productos 
MODIFY COLUMN stock_minimo INT DEFAULT 5;

-- Opcional: Actualizar productos existentes que tengan stock_minimo en 0
-- (Descomenta la siguiente línea si quieres actualizar los productos existentes)
-- UPDATE productos SET stock_minimo = 5 WHERE stock_minimo = 0;
