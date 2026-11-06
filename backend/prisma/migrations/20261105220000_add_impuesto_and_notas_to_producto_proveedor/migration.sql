-- AlterTable
ALTER TABLE "ProductoProveedor" ADD COLUMN IF NOT EXISTS "impuestoId" INTEGER;
ALTER TABLE "ProductoProveedor" ADD COLUMN IF NOT EXISTS "notas" TEXT;

-- Normalizar slugs vacíos a NULL para evitar colisiones en @@unique([empresaId, slug])
UPDATE "Producto" SET "slug" = NULL WHERE "slug" = '' OR TRIM("slug") = '';

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductoProveedor_impuestoId_fkey'
  ) THEN
    ALTER TABLE "ProductoProveedor" ADD CONSTRAINT "ProductoProveedor_impuestoId_fkey" FOREIGN KEY ("impuestoId") REFERENCES "Impuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

