-- AlterTable FacturaCompra
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "documentoConfigId" INTEGER;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "documentoCxpId" INTEGER;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "numeroCxp" TEXT;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "documentoCeId" INTEGER;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "numeroCe" TEXT;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "cajaBancoId" INTEGER;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "egresoId" INTEGER;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "formaPago" TEXT DEFAULT 'CONTADO';
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "medioPago" TEXT;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "diasCredito" INTEGER DEFAULT 0;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "saldo" DECIMAL(14,2) DEFAULT 0;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "totalPagado" DECIMAL(14,2) DEFAULT 0;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "ordenCompraId" INTEGER;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "recepcionId" TEXT;
ALTER TABLE "FacturaCompra" ADD COLUMN IF NOT EXISTS "estadoRecepcion" TEXT DEFAULT 'PENDIENTE';

-- AlterTable FacturaCompraItem
ALTER TABLE "FacturaCompraItem" ADD COLUMN IF NOT EXISTS "cantidadRecibida" DECIMAL(12,3) DEFAULT 0;

-- AlterTable RecepcionMercancia
ALTER TABLE "RecepcionMercancia" ADD COLUMN IF NOT EXISTS "facturaCompraId" INTEGER;
ALTER TABLE "RecepcionMercancia" ADD COLUMN IF NOT EXISTS "bodegaId" INTEGER;
ALTER TABLE "RecepcionMercancia" ADD COLUMN IF NOT EXISTS "documentoConfigId" INTEGER;
ALTER TABLE "RecepcionMercancia" ADD COLUMN IF NOT EXISTS "inventarioAfectado" BOOLEAN DEFAULT false;
DO $$ BEGIN
  ALTER TABLE "RecepcionMercancia" ALTER COLUMN "ordenCompraId" DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- AlterTable RecepcionItem
ALTER TABLE "RecepcionItem" ADD COLUMN IF NOT EXISTS "productoId" INTEGER;
ALTER TABLE "RecepcionItem" ADD COLUMN IF NOT EXISTS "facturaCompraItemId" INTEGER;
DO $$ BEGIN
  ALTER TABLE "RecepcionItem" ALTER COLUMN "ordenCompraItemId" DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Foreign Keys (Safe check with DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FacturaCompra_documentoConfigId_fkey'
  ) THEN
    ALTER TABLE "FacturaCompra" ADD CONSTRAINT "FacturaCompra_documentoConfigId_fkey"
    FOREIGN KEY ("documentoConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FacturaCompra_cajaBancoId_fkey'
  ) THEN
    ALTER TABLE "FacturaCompra" ADD CONSTRAINT "FacturaCompra_cajaBancoId_fkey"
    FOREIGN KEY ("cajaBancoId") REFERENCES "CajaBanco"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FacturaCompra_ordenCompraId_fkey'
  ) THEN
    ALTER TABLE "FacturaCompra" ADD CONSTRAINT "FacturaCompra_ordenCompraId_fkey"
    FOREIGN KEY ("ordenCompraId") REFERENCES "OrdenCompra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FacturaCompra_egresoId_fkey'
  ) THEN
    ALTER TABLE "FacturaCompra" ADD CONSTRAINT "FacturaCompra_egresoId_fkey"
    FOREIGN KEY ("egresoId") REFERENCES "Egreso"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RecepcionMercancia_facturaCompraId_fkey'
  ) THEN
    ALTER TABLE "RecepcionMercancia" ADD CONSTRAINT "RecepcionMercancia_facturaCompraId_fkey"
    FOREIGN KEY ("facturaCompraId") REFERENCES "FacturaCompra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
