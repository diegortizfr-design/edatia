-- AlterTable FacturaVenta
ALTER TABLE "FacturaVenta" ADD COLUMN IF NOT EXISTS "documentoConfigId" INTEGER;
ALTER TABLE "FacturaVenta" ADD COLUMN IF NOT EXISTS "documentoCxcId" INTEGER;
ALTER TABLE "FacturaVenta" ADD COLUMN IF NOT EXISTS "numeroCxc" TEXT;
ALTER TABLE "FacturaVenta" ADD COLUMN IF NOT EXISTS "reciboCajaId" INTEGER;

-- Foreign Keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FacturaVenta_documentoConfigId_fkey'
  ) THEN
    ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_documentoConfigId_fkey" FOREIGN KEY ("documentoConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FacturaVenta_documentoCxcId_fkey'
  ) THEN
    ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_documentoCxcId_fkey" FOREIGN KEY ("documentoCxcId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FacturaVenta_reciboCajaId_fkey'
  ) THEN
    ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_reciboCajaId_fkey" FOREIGN KEY ("reciboCajaId") REFERENCES "ReciboCaja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
