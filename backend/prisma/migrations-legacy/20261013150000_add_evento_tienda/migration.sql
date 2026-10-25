-- CreateTable
CREATE TABLE "EventoTienda" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "productoId" INTEGER,
    "origen" TEXT,
    "dispositivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoTienda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventoTienda_empresaId_createdAt_idx" ON "EventoTienda"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "EventoTienda_empresaId_tipo_createdAt_idx" ON "EventoTienda"("empresaId", "tipo", "createdAt");

-- CreateIndex
CREATE INDEX "EventoTienda_empresaId_productoId_idx" ON "EventoTienda"("empresaId", "productoId");
