-- CreateTable
CREATE TABLE "FormaPago" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormaPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedioPago" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedioPago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormaPago_empresaId_codigo_key" ON "FormaPago"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "FormaPago_empresaId_idx" ON "FormaPago"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "MedioPago_empresaId_codigo_key" ON "MedioPago"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "MedioPago_empresaId_idx" ON "MedioPago"("empresaId");

-- AddForeignKey
ALTER TABLE "FormaPago" ADD CONSTRAINT "FormaPago_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedioPago" ADD CONSTRAINT "MedioPago_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
