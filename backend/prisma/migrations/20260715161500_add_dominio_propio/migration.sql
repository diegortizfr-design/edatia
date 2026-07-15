-- AlterTable
ALTER TABLE "ConfiguracionTienda" ADD COLUMN "dominioPropio" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionTienda_dominioPropio_key" ON "ConfiguracionTienda"("dominioPropio");
