-- CreateTable CategoriaGasto
CREATE TABLE IF NOT EXISTS "CategoriaGasto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "cuentaPUCId" INTEGER,
    "terceroId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoriaGasto_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CategoriaGasto" ADD COLUMN IF NOT EXISTS "terceroId" INTEGER;
ALTER TABLE "CategoriaGasto" ADD COLUMN IF NOT EXISTS "cuentaPUCId" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "CategoriaGasto_empresaId_nombre_key" ON "CategoriaGasto"("empresaId", "nombre");
CREATE INDEX IF NOT EXISTS "CategoriaGasto_empresaId_idx" ON "CategoriaGasto"("empresaId");
CREATE INDEX IF NOT EXISTS "CategoriaGasto_terceroId_idx" ON "CategoriaGasto"("terceroId");

DO $$ BEGIN
    ALTER TABLE "CategoriaGasto" ADD CONSTRAINT "CategoriaGasto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CategoriaGasto" ADD CONSTRAINT "CategoriaGasto_cuentaPUCId_fkey" FOREIGN KEY ("cuentaPUCId") REFERENCES "CuentaPUC"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CategoriaGasto" ADD CONSTRAINT "CategoriaGasto_terceroId_fkey" FOREIGN KEY ("terceroId") REFERENCES "Tercero"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Egreso" ADD COLUMN IF NOT EXISTS "categoriaGastoId" INTEGER;
    ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_categoriaGastoId_fkey" FOREIGN KEY ("categoriaGastoId") REFERENCES "CategoriaGasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

