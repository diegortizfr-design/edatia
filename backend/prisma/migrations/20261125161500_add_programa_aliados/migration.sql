-- AlterTable ConfiguracionTienda
ALTER TABLE "ConfiguracionTienda" ADD COLUMN IF NOT EXISTS "configAliados" JSONB;

-- CreateTable AliadoComercial
CREATE TABLE IF NOT EXISTS "AliadoComercial" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL DEFAULT 'CC',
    "numeroDocumento" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "ciudad" TEXT,
    "medioPago" TEXT NOT NULL DEFAULT 'NEQUI',
    "cuentaPago" TEXT NOT NULL,
    "codigoReferido" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "porcentajeUtilidad" DECIMAL(5,2),
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "aceptaTerminos" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AliadoComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable ComisionAliado
CREATE TABLE IF NOT EXISTS "ComisionAliado" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "aliadoId" INTEGER NOT NULL,
    "pedidoId" INTEGER,
    "pedidoNumero" TEXT,
    "origen" TEXT NOT NULL DEFAULT 'LINK_WEB',
    "clienteNombre" TEXT NOT NULL,
    "clienteTelefono" TEXT NOT NULL,
    "montoVenta" DECIMAL(14,2) NOT NULL,
    "costoTotal" DECIMAL(14,2) NOT NULL,
    "utilidadNeta" DECIMAL(14,2) NOT NULL,
    "porcentajeAplicado" DECIMAL(5,2) NOT NULL,
    "valorComision" DECIMAL(14,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "detalleItems" JSONB,
    "comprobantePago" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "fechaPago" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComisionAliado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AliadoComercial_empresaId_codigoReferido_key" ON "AliadoComercial"("empresaId", "codigoReferido");
CREATE UNIQUE INDEX IF NOT EXISTS "AliadoComercial_empresaId_numeroDocumento_key" ON "AliadoComercial"("empresaId", "numeroDocumento");
CREATE UNIQUE INDEX IF NOT EXISTS "AliadoComercial_empresaId_telefono_key" ON "AliadoComercial"("empresaId", "telefono");
CREATE INDEX IF NOT EXISTS "AliadoComercial_empresaId_estado_idx" ON "AliadoComercial"("empresaId", "estado");

CREATE INDEX IF NOT EXISTS "ComisionAliado_empresaId_estado_idx" ON "ComisionAliado"("empresaId", "estado");
CREATE INDEX IF NOT EXISTS "ComisionAliado_empresaId_aliadoId_idx" ON "ComisionAliado"("empresaId", "aliadoId");
CREATE INDEX IF NOT EXISTS "ComisionAliado_pedidoId_idx" ON "ComisionAliado"("pedidoId");

-- AddForeignKeys (idempotentes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AliadoComercial_empresaId_fkey') THEN
        ALTER TABLE "AliadoComercial" ADD CONSTRAINT "AliadoComercial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ComisionAliado_empresaId_fkey') THEN
        ALTER TABLE "ComisionAliado" ADD CONSTRAINT "ComisionAliado_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ComisionAliado_aliadoId_fkey') THEN
        ALTER TABLE "ComisionAliado" ADD CONSTRAINT "ComisionAliado_aliadoId_fkey" FOREIGN KEY ("aliadoId") REFERENCES "AliadoComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ComisionAliado_pedidoId_fkey') THEN
        ALTER TABLE "ComisionAliado" ADD CONSTRAINT "ComisionAliado_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoVenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

