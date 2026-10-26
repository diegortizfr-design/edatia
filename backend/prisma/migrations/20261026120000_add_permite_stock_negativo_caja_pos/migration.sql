-- AlterTable
ALTER TABLE "CajaPos" ADD COLUMN IF NOT EXISTS "permiteStockNegativo" BOOLEAN NOT NULL DEFAULT false;
