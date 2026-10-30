-- CreateTable
CREATE TABLE IF NOT EXISTS "Egreso" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terceroId" INTEGER,
    "beneficiarioNombre" TEXT,
    "beneficiarioDoc" TEXT,
    "categoriaGasto" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "referencia" TEXT,
    "cuentaGastoId" INTEGER NOT NULL,
    "cajaBancoId" INTEGER,
    "medioPago" TEXT NOT NULL DEFAULT 'TRANSFERENCIA',
    "monto" DECIMAL(15,2) NOT NULL,
    "aplicaRetencion" BOOLEAN NOT NULL DEFAULT false,
    "tarifaRetencion" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "valorRetencion" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cuentaRetencionId" INTEGER,
    "montoNeto" DECIMAL(15,2) NOT NULL,
    "comprobanteId" INTEGER,
    "documentoConfigId" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'APROBADO',
    "notas" TEXT,
    "usuarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Egreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CajaMenor" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,
    "montoAsignado" DECIMAL(15,2) NOT NULL,
    "cuentaPUC" TEXT NOT NULL DEFAULT '110510',
    "cajaBancoId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CajaMenor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GastoCajaMenor" (
    "id" SERIAL NOT NULL,
    "cajaMenorId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroRecibo" TEXT,
    "beneficiario" TEXT NOT NULL,
    "beneficiarioDoc" TEXT,
    "concepto" TEXT NOT NULL,
    "categoriaGasto" TEXT NOT NULL,
    "cuentaGastoId" INTEGER NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "reembolsoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GastoCajaMenor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReembolsoCajaMenor" (
    "id" SERIAL NOT NULL,
    "cajaMenorId" INTEGER NOT NULL,
    "consecutivo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalReembolsado" DECIMAL(15,2) NOT NULL,
    "origenCajaBancoId" INTEGER,
    "comprobanteId" INTEGER,
    "documentoConfigId" INTEGER,
    "observaciones" TEXT,
    "usuarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReembolsoCajaMenor_pkey" PRIMARY KEY ("id")
);

-- Indices
CREATE UNIQUE INDEX IF NOT EXISTS "Egreso_empresaId_numero_key" ON "Egreso"("empresaId", "numero");
CREATE INDEX IF NOT EXISTS "Egreso_empresaId_fecha_idx" ON "Egreso"("empresaId", "fecha");
CREATE INDEX IF NOT EXISTS "Egreso_empresaId_categoriaGasto_idx" ON "Egreso"("empresaId", "categoriaGasto");
CREATE INDEX IF NOT EXISTS "Egreso_empresaId_estado_idx" ON "Egreso"("empresaId", "estado");

CREATE UNIQUE INDEX IF NOT EXISTS "CajaMenor_empresaId_codigo_key" ON "CajaMenor"("empresaId", "codigo");
CREATE INDEX IF NOT EXISTS "CajaMenor_empresaId_idx" ON "CajaMenor"("empresaId");

CREATE INDEX IF NOT EXISTS "GastoCajaMenor_cajaMenorId_estado_idx" ON "GastoCajaMenor"("cajaMenorId", "estado");
CREATE INDEX IF NOT EXISTS "GastoCajaMenor_cajaMenorId_fecha_idx" ON "GastoCajaMenor"("cajaMenorId", "fecha");

CREATE INDEX IF NOT EXISTS "ReembolsoCajaMenor_cajaMenorId_idx" ON "ReembolsoCajaMenor"("cajaMenorId");

-- Foreign keys
DO $$ BEGIN
    ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_terceroId_fkey" FOREIGN KEY ("terceroId") REFERENCES "Tercero"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_cuentaGastoId_fkey" FOREIGN KEY ("cuentaGastoId") REFERENCES "CuentaPUC"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_cajaBancoId_fkey" FOREIGN KEY ("cajaBancoId") REFERENCES "CajaBanco"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_cuentaRetencionId_fkey" FOREIGN KEY ("cuentaRetencionId") REFERENCES "CuentaPUC"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_comprobanteId_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "Comprobante"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CajaMenor" ADD CONSTRAINT "CajaMenor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CajaMenor" ADD CONSTRAINT "CajaMenor_cajaBancoId_fkey" FOREIGN KEY ("cajaBancoId") REFERENCES "CajaBanco"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "GastoCajaMenor" ADD CONSTRAINT "GastoCajaMenor_cajaMenorId_fkey" FOREIGN KEY ("cajaMenorId") REFERENCES "CajaMenor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "GastoCajaMenor" ADD CONSTRAINT "GastoCajaMenor_cuentaGastoId_fkey" FOREIGN KEY ("cuentaGastoId") REFERENCES "CuentaPUC"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "GastoCajaMenor" ADD CONSTRAINT "GastoCajaMenor_reembolsoId_fkey" FOREIGN KEY ("reembolsoId") REFERENCES "ReembolsoCajaMenor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ReembolsoCajaMenor" ADD CONSTRAINT "ReembolsoCajaMenor_cajaMenorId_fkey" FOREIGN KEY ("cajaMenorId") REFERENCES "CajaMenor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ReembolsoCajaMenor" ADD CONSTRAINT "ReembolsoCajaMenor_origenCajaBancoId_fkey" FOREIGN KEY ("origenCajaBancoId") REFERENCES "CajaBanco"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ReembolsoCajaMenor" ADD CONSTRAINT "ReembolsoCajaMenor_comprobanteId_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "Comprobante"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Egreso" ADD COLUMN IF NOT EXISTS "documentoConfigId" INTEGER;
    ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_documentoConfigId_fkey" FOREIGN KEY ("documentoConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- CreateTable CategoriaGasto
CREATE TABLE IF NOT EXISTS "CategoriaGasto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "cuentaPUCId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoriaGasto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CategoriaGasto_empresaId_nombre_key" ON "CategoriaGasto"("empresaId", "nombre");
CREATE INDEX IF NOT EXISTS "CategoriaGasto_empresaId_idx" ON "CategoriaGasto"("empresaId");

DO $$ BEGIN
    ALTER TABLE "CategoriaGasto" ADD CONSTRAINT "CategoriaGasto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CategoriaGasto" ADD CONSTRAINT "CategoriaGasto_cuentaPUCId_fkey" FOREIGN KEY ("cuentaPUCId") REFERENCES "CuentaPUC"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Egreso" ADD COLUMN IF NOT EXISTS "categoriaGastoId" INTEGER;
    ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_categoriaGastoId_fkey" FOREIGN KEY ("categoriaGastoId") REFERENCES "CategoriaGasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
