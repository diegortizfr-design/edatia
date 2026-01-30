-- TABLA PARA EL ASISTENTE sofIA
-- Gestiona compromisos, tareas y recordatorios

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
    color VARCHAR(20) DEFAULT '#4F46E5', -- Color para el calendario
    es_todo_el_dia BOOLEAN DEFAULT FALSE,
    recordatorio_minutos INT DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Indices para optimizar búsquedas por rango de fecha
CREATE INDEX idx_eventos_fecha ON eventos_sofia(fecha_inicio, fecha_fin);
CREATE INDEX idx_eventos_usuario ON eventos_sofia(usuario_id);
