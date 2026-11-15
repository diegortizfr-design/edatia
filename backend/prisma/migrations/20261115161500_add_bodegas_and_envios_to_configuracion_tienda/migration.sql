-- AlterTable
ALTER TABLE "ConfiguracionTienda" ADD COLUMN IF NOT EXISTS "bodegasIds" INTEGER[] DEFAULT '{}';
ALTER TABLE "ConfiguracionTienda" ADD COLUMN IF NOT EXISTS "bodegaDespachoId" INTEGER;
ALTER TABLE "ConfiguracionTienda" ADD COLUMN IF NOT EXISTS "montoEnvioGratis" DECIMAL(14,2) DEFAULT 150000;

