-- AlterTable
ALTER TABLE "ReciboCaja" ADD COLUMN "documentoConfigId" INTEGER;

-- AddForeignKey
ALTER TABLE "ReciboCaja" ADD CONSTRAINT "ReciboCaja_documentoConfigId_fkey" FOREIGN KEY ("documentoConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
