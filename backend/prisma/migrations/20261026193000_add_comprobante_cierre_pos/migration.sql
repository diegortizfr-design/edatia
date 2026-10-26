-- AlterTable CajaPos: add documentoCierreConfigId
ALTER TABLE "CajaPos" ADD COLUMN IF NOT EXISTS "documentoCierreConfigId" INTEGER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CajaPos_documentoCierreConfigId_fkey') THEN
    ALTER TABLE "CajaPos" ADD CONSTRAINT "CajaPos_documentoCierreConfigId_fkey" FOREIGN KEY ("documentoCierreConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AlterTable SesionCaja: add numeroCierre and documentoCierreConfigId
ALTER TABLE "SesionCaja" ADD COLUMN IF NOT EXISTS "numeroCierre" TEXT;
ALTER TABLE "SesionCaja" ADD COLUMN IF NOT EXISTS "documentoCierreConfigId" INTEGER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SesionCaja_documentoCierreConfigId_fkey') THEN
    ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_documentoCierreConfigId_fkey" FOREIGN KEY ("documentoCierreConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
