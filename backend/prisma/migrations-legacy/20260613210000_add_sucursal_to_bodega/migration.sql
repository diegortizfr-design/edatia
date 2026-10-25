-- AlterTable
ALTER TABLE "Bodega" DROP COLUMN "direccion",
ADD COLUMN "sucursalId" INTEGER;

-- AddForeignKey
ALTER TABLE "Bodega" ADD CONSTRAINT "Bodega_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
