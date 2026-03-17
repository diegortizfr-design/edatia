-- ALTER TABLE SCRIPTS PARA ACTUALIZACIÓN A v2.1 (Global DB)

-- 1. Actualización de Planes
ALTER TABLE saas_planes ADD COLUMN descripcion TEXT AFTER slug;
ALTER TABLE saas_planes ADD COLUMN trial_days INT DEFAULT 14 AFTER precio_mensual;

-- 2. Actualización de Suscripciones
ALTER TABLE saas_suscripciones MODIFY COLUMN estado ENUM('FREE', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED') DEFAULT 'FREE';
ALTER TABLE saas_suscripciones ADD COLUMN next_billing_date DATE AFTER trial_ends_at;
CREATE INDEX idx_sub_empresa ON saas_suscripciones(empresa_id);

-- 3. Actualización de Facturas
ALTER TABLE saas_facturas ADD COLUMN fecha_pago DATETIME AFTER estado;
ALTER TABLE saas_facturas ADD COLUMN payment_attempts INT DEFAULT 0 AFTER fecha_pago;
ALTER TABLE saas_facturas ADD COLUMN last_attempt_at DATETIME AFTER payment_attempts;
CREATE INDEX idx_factura_sub ON saas_facturas(suscripcion_id);
CREATE INDEX idx_factura_vencimiento ON saas_facturas(fecha_vencimiento);

-- 4. Actualización de Pagos
CREATE INDEX idx_pago_factura ON saas_pagos(factura_id);
