-- AlterTable
ALTER TABLE "MovimientoInventario" ADD COLUMN "documentoConfigId" INTEGER;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_documentoConfigId_fkey" FOREIGN KEY ("documentoConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
