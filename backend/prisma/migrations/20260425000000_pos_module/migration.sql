-- Migration: 20260425000000_pos_module
-- Módulo POS: CajaPos, SesionCaja, VentaPos, VentaPosItem, MovimientoCaja, ArqueoCaja

CREATE TABLE IF NOT EXISTS "CajaPos" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "cuentaPUCId" INTEGER,
    "vendedorId" INTEGER,
    "vendedorNombre" TEXT,
    "impresora" TEXT,
    "tipoConexion" TEXT DEFAULT 'NINGUNA',
    "anchoPapel" INTEGER NOT NULL DEFAULT 80,
    "permiteCreditoPos" BOOLEAN NOT NULL DEFAULT false,
    "permiteDescuento" BOOLEAN NOT NULL DEFAULT true,
    "maxDescuento" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CajaPos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CajaPos_empresaId_nombre_key" ON "CajaPos"("empresaId","nombre");
CREATE INDEX IF NOT EXISTS "CajaPos_empresaId_idx" ON "CajaPos"("empresaId");
ALTER TABLE "CajaPos" ADD CONSTRAINT "CajaPos_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "CajaPos" ADD CONSTRAINT "CajaPos_bodegaId_fkey"
    FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "CajaPos" ADD CONSTRAINT "CajaPos_cuentaPUCId_fkey"
    FOREIGN KEY ("cuentaPUCId") REFERENCES "CuentaPUC"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "SesionCaja" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "cajaId" INTEGER NOT NULL,
    "vendedorId" INTEGER,
    "vendedorNombre" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "montoInicial" DECIMAL(15,2) NOT NULL,
    "totalVentas" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "numTransacciones" INTEGER NOT NULL DEFAULT 0,
    "totalEfectivo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalTarjeta" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalTransferencia" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalNequi" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAnuladas" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montoFinalDeclarado" DECIMAL(15,2),
    "diferencia" DECIMAL(15,2),
    "observacionesCierre" TEXT,
    "abiertaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradaAt" TIMESTAMP(3),
    CONSTRAINT "SesionCaja_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SesionCaja_empresaId_estado_idx" ON "SesionCaja"("empresaId","estado");
CREATE INDEX IF NOT EXISTS "SesionCaja_empresaId_cajaId_idx" ON "SesionCaja"("empresaId","cajaId");
ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_cajaId_fkey"
    FOREIGN KEY ("cajaId") REFERENCES "CajaPos"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "VentaPos" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sesionId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" INTEGER,
    "clienteNombre" TEXT NOT NULL DEFAULT 'Consumidor Final',
    "clienteDoc" TEXT,
    "vendedorId" INTEGER,
    "vendedorNombre" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "descuento" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "baseIva19" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "iva19" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "baseIva5" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "iva5" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "pagoEfectivo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pagoTarjetaDebito" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pagoTarjetaCredito" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pagoTransferencia" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pagoNequi" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cambio" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'COMPLETADA',
    "motivoAnulacion" TEXT,
    "facturaId" INTEGER,
    "comprobanteId" INTEGER,
    CONSTRAINT "VentaPos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "VentaPos_empresaId_numero_key" ON "VentaPos"("empresaId","numero");
CREATE INDEX IF NOT EXISTS "VentaPos_empresaId_sesionId_idx" ON "VentaPos"("empresaId","sesionId");
CREATE INDEX IF NOT EXISTS "VentaPos_empresaId_fecha_idx" ON "VentaPos"("empresaId","fecha");
CREATE INDEX IF NOT EXISTS "VentaPos_empresaId_estado_idx" ON "VentaPos"("empresaId","estado");
ALTER TABLE "VentaPos" ADD CONSTRAINT "VentaPos_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "VentaPos" ADD CONSTRAINT "VentaPos_sesionId_fkey"
    FOREIGN KEY ("sesionId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "VentaPos" ADD CONSTRAINT "VentaPos_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "ClienteERP"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "VentaPosItem" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "sku" TEXT,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "precioUnitario" DECIMAL(15,2) NOT NULL,
    "descuentoPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "descuentoValor" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tipoIva" TEXT NOT NULL DEFAULT 'IVA_19',
    "baseIva" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ivaValor" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "costoUnitario" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "costoTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "VentaPosItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "VentaPosItem" ADD CONSTRAINT "VentaPosItem_ventaId_fkey"
    FOREIGN KEY ("ventaId") REFERENCES "VentaPos"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "VentaPosItem" ADD CONSTRAINT "VentaPosItem_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "MovimientoCaja" (
    "id" SERIAL NOT NULL,
    "sesionId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovimientoCaja_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MovimientoCaja_sesionId_idx" ON "MovimientoCaja"("sesionId");
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_sesionId_fkey"
    FOREIGN KEY ("sesionId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "ArqueoCaja" (
    "id" SERIAL NOT NULL,
    "sesionId" INTEGER NOT NULL,
    "b100000" INTEGER NOT NULL DEFAULT 0,
    "b50000" INTEGER NOT NULL DEFAULT 0,
    "b20000" INTEGER NOT NULL DEFAULT 0,
    "b10000" INTEGER NOT NULL DEFAULT 0,
    "b5000" INTEGER NOT NULL DEFAULT 0,
    "b2000" INTEGER NOT NULL DEFAULT 0,
    "b1000" INTEGER NOT NULL DEFAULT 0,
    "m1000" INTEGER NOT NULL DEFAULT 0,
    "m500" INTEGER NOT NULL DEFAULT 0,
    "m200" INTEGER NOT NULL DEFAULT 0,
    "m100" INTEGER NOT NULL DEFAULT 0,
    "m50" INTEGER NOT NULL DEFAULT 0,
    "totalContado" DECIMAL(15,2) NOT NULL,
    "totalSistema" DECIMAL(15,2) NOT NULL,
    "diferencia" DECIMAL(15,2) NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArqueoCaja_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ArqueoCaja_sesionId_key" ON "ArqueoCaja"("sesionId");
ALTER TABLE "ArqueoCaja" ADD CONSTRAINT "ArqueoCaja_sesionId_fkey"
    FOREIGN KEY ("sesionId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
