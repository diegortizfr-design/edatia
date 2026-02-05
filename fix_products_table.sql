-- ERPod Migration: Add stock_inicial to productos table
-- This column is required by the current backend logic but was missing in some database versions.

ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock_inicial INT DEFAULT 0 AFTER stock_actual;

-- Also ensuring stock_actual is consistent
ALTER TABLE productos MODIFY COLUMN stock_actual DECIMAL(15,2) DEFAULT 0;
