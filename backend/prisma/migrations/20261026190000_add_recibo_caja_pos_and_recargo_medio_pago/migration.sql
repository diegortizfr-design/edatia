-- AlterTable CajaPos
ALTER TABLE "CajaPos" ADD COLUMN IF NOT EXISTS "documentoReciboConfigId" INTEGER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CajaPos_documentoReciboConfigId_fkey') THEN
    ALTER TABLE "CajaPos" ADD CONSTRAINT "CajaPos_documentoReciboConfigId_fkey" FOREIGN KEY ("documentoReciboConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AlterTable MedioPago
ALTER TABLE "MedioPago" ADD COLUMN IF NOT EXISTS "recargoPct" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable VentaPos
ALTER TABLE "VentaPos" ADD COLUMN IF NOT EXISTS "recargoMedioPago" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "VentaPos" ADD COLUMN IF NOT EXISTS "reciboCajaId" INTEGER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VentaPos_reciboCajaId_fkey') THEN
    ALTER TABLE "VentaPos" ADD CONSTRAINT "VentaPos_reciboCajaId_fkey" FOREIGN KEY ("reciboCajaId") REFERENCES "ReciboCaja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
