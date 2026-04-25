-- Migration: 20260407000001_full_schema
-- Adds all columns/tables missing from the initial migration

-- ─── Patch Empresa ───────────────────────────────────────────────────────────
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "municipio" TEXT;
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "departamento" TEXT;
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "codigoDane" TEXT;
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "codigoPostal" TEXT;
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "regimenFiscal" TEXT DEFAULT '48';
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "actividadEconomica" TEXT;
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "responsabilidades" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "tipoPersona" TEXT DEFAULT 'JURIDICA';
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "digitoVerificacion" TEXT;
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "logo" TEXT;
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "permiteStockNegativo" BOOLEAN NOT NULL DEFAULT false;

-- ─── Manager ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PerfilCargo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "responsabilidades" TEXT,
    "correoPrincipal" TEXT,
    "subcorreos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permisos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documentoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PerfilCargo_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PerfilCargo_nombre_key" ON "PerfilCargo"("nombre");

CREATE TABLE IF NOT EXISTS "Colaborador" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "nombre" TEXT NOT NULL,
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "sexo" TEXT,
    "nacionalidad" TEXT,
    "estadoCivil" TEXT,
    "telefonoPersonal" TEXT,
    "emailPersonal" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "pais" TEXT DEFAULT 'Colombia',
    "cargo" TEXT,
    "area" TEXT,
    "tipoContrato" TEXT,
    "fechaIngreso" TIMESTAMP(3),
    "salario" DECIMAL(12,2),
    "jornadaLaboral" TEXT,
    "jefeDirecto" TEXT,
    "telefonoCorporativo" TEXT,
    "nivelEducativo" TEXT,
    "titulo" TEXT,
    "institucion" TEXT,
    "anoGraduacion" INTEGER,
    "empresaAnterior" TEXT,
    "cargoAnterior" TEXT,
    "tiempoTrabajado" TEXT,
    "funcionesAnteriores" TEXT,
    "habilidadesTecnicas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "habilidadesBlandas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "idiomas" JSONB,
    "eps" TEXT,
    "fondoPension" TEXT,
    "arl" TEXT,
    "cajaCompensacion" TEXT,
    "banco" TEXT,
    "tipoCuenta" TEXT,
    "numeroCuenta" TEXT,
    "emergenciaNombre" TEXT,
    "emergenciaRelacion" TEXT,
    "emergenciaTelefono" TEXT,
    "cedulaArchivo" TEXT,
    "hojaVidaArchivo" TEXT,
    "refreshTokenHash" VARCHAR(128),
    "refreshTokenExpiry" TIMESTAMP(3),
    "loginFallidosConsecutivos" INTEGER NOT NULL DEFAULT 0,
    "loginBloqueadoHasta" TIMESTAMP(3),
    "perfilCargoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Colaborador_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Colaborador_email_key" ON "Colaborador"("email");
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_perfilCargoId_fkey"
    FOREIGN KEY ("perfilCargoId") REFERENCES "PerfilCargo"("id") ON DELETE SET NULL ON UPDATE CASCADE
    NOT VALID;

CREATE TABLE IF NOT EXISTS "PlanBase" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioBase" DECIMAL(12,2) NOT NULL,
    "limiteUsuarios" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlanBase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PlanBase_nombre_key" ON "PlanBase"("nombre");

CREATE TABLE IF NOT EXISTS "ModuloSoftware" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "icono" TEXT,
    "precioAnual" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ModuloSoftware_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ModuloSoftware_nombre_key" ON "ModuloSoftware"("nombre");
CREATE UNIQUE INDEX IF NOT EXISTS "ModuloSoftware_slug_key" ON "ModuloSoftware"("slug");

CREATE TABLE IF NOT EXISTS "ClienteManager" (
    "id" SERIAL NOT NULL,
    "tipoPersona" TEXT,
    "tipoDocumento" TEXT,
    "nit" TEXT NOT NULL,
    "digitoVerificacion" TEXT,
    "nombre" TEXT NOT NULL,
    "pais" TEXT,
    "departamento" TEXT,
    "ciudad" TEXT,
    "direccion" TEXT,
    "codigoPostal" TEXT,
    "email" TEXT,
    "telefonoAlternativo" TEXT,
    "telefono" TEXT,
    "paginaWeb" TEXT,
    "contacto" TEXT,
    "tipoCliente" TEXT,
    "listaPrecios" TEXT,
    "cupoCredito" DECIMAL(14,2),
    "condicionesPago" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PROSPECTO',
    "regimenTributario" TEXT,
    "responsabilidadFiscal" TEXT,
    "actividadEconomica" TEXT,
    "granContribuyente" BOOLEAN NOT NULL DEFAULT false,
    "autorretenedor" BOOLEAN NOT NULL DEFAULT false,
    "agenteRetencion" BOOLEAN NOT NULL DEFAULT false,
    "banco" TEXT,
    "tipoCuenta" TEXT,
    "numeroCuenta" TEXT,
    "segmento" TEXT,
    "observaciones" TEXT,
    "planBaseId" INTEGER,
    "asesorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClienteManager_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClienteManager_nit_key" ON "ClienteManager"("nit");
ALTER TABLE "ClienteManager" ADD CONSTRAINT "ClienteManager_planBaseId_fkey"
    FOREIGN KEY ("planBaseId") REFERENCES "PlanBase"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "ClienteManager" ADD CONSTRAINT "ClienteManager_asesorId_fkey"
    FOREIGN KEY ("asesorId") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "PlanCliente" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "moduloId" INTEGER NOT NULL,
    "precioNegociado" DECIMAL(12,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlanCliente_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PlanCliente" ADD CONSTRAINT "PlanCliente_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "ClienteManager"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "PlanCliente" ADD CONSTRAINT "PlanCliente_moduloId_fkey"
    FOREIGN KEY ("moduloId") REFERENCES "ModuloSoftware"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "Ticket" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "categoria" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'NUEVO',
    "asesorSacId" INTEGER,
    "desarrolladorId" INTEGER,
    "calificacion" INTEGER,
    "calificadoAt" TIMESTAMP(3),
    "calificacionAuto" BOOLEAN NOT NULL DEFAULT false,
    "venceCalifAt" TIMESTAMP(3),
    "resueltoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_numero_key" ON "Ticket"("numero");
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "ClienteManager"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_asesorSacId_fkey"
    FOREIGN KEY ("asesorSacId") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_desarrolladorId_fkey"
    FOREIGN KEY ("desarrolladorId") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "TicketMensaje" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "autor" TEXT NOT NULL,
    "autorId" INTEGER,
    "nombre" TEXT,
    "contenido" TEXT NOT NULL,
    "interno" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketMensaje_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "TicketMensaje" ADD CONSTRAINT "TicketMensaje_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- ─── Inventario ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Categoria" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "parentId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Categoria_empresaId_slug_key" ON "Categoria"("empresaId","slug");
CREATE INDEX IF NOT EXISTS "Categoria_empresaId_idx" ON "Categoria"("empresaId");
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "Marca" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Marca_empresaId_nombre_key" ON "Marca"("empresaId","nombre");
ALTER TABLE "Marca" ADD CONSTRAINT "Marca_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "UnidadMedida" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "abreviatura" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'UNIDAD',
    "factorBase" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UnidadMedida_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UnidadMedida_empresaId_abreviatura_key" ON "UnidadMedida"("empresaId","abreviatura");
ALTER TABLE "UnidadMedida" ADD CONSTRAINT "UnidadMedida_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "Producto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "referencia" TEXT,
    "categoriaId" INTEGER,
    "marcaId" INTEGER,
    "unidadMedidaId" INTEGER,
    "costoPromedio" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "precioBase" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tipoIva" TEXT NOT NULL DEFAULT 'GRAVADO_19',
    "manejaBodega" BOOLEAN NOT NULL DEFAULT true,
    "manejaLotes" BOOLEAN NOT NULL DEFAULT false,
    "manejaSerial" BOOLEAN NOT NULL DEFAULT false,
    "stockMinimo" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "stockMaximo" DECIMAL(12,3),
    "puntoReorden" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "diasRotacion" INTEGER,
    "claseAbc" TEXT,
    "claseAbcFecha" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "imagen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Producto_empresaId_sku_key" ON "Producto"("empresaId","sku");
CREATE INDEX IF NOT EXISTS "Producto_empresaId_idx" ON "Producto"("empresaId");
CREATE INDEX IF NOT EXISTS "Producto_empresaId_codigoBarras_idx" ON "Producto"("empresaId","codigoBarras");
CREATE INDEX IF NOT EXISTS "Producto_empresaId_activo_idx" ON "Producto"("empresaId","activo");
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoriaId_fkey"
    FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_marcaId_fkey"
    FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_unidadMedidaId_fkey"
    FOREIGN KEY ("unidadMedidaId") REFERENCES "UnidadMedida"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "Bodega" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'ALMACEN',
    "direccion" TEXT,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Bodega_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Bodega_empresaId_codigo_key" ON "Bodega"("empresaId","codigo");
CREATE INDEX IF NOT EXISTS "Bodega_empresaId_idx" ON "Bodega"("empresaId");
ALTER TABLE "Bodega" ADD CONSTRAINT "Bodega_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "Stock" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "cantidadReservada" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Stock_productoId_bodegaId_key" ON "Stock"("productoId","bodegaId");
CREATE INDEX IF NOT EXISTS "Stock_empresaId_idx" ON "Stock"("empresaId");
CREATE INDEX IF NOT EXISTS "Stock_empresaId_productoId_idx" ON "Stock"("empresaId","productoId");
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_bodegaId_fkey"
    FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "MovimientoInventario" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "productoId" INTEGER NOT NULL,
    "bodegaOrigenId" INTEGER,
    "bodegaDestinoId" INTEGER,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "costoUnitario" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "costoTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "saldoCantidad" DECIMAL(12,3) NOT NULL,
    "saldoCostoTotal" DECIMAL(14,2) NOT NULL,
    "saldoCpp" DECIMAL(14,4) NOT NULL,
    "usuarioId" INTEGER,
    "referenciaId" TEXT,
    "referenciaTipo" TEXT,
    "movimientoParId" INTEGER,
    "notas" TEXT,
    "fechaMovimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MovimientoInventario_numero_key" ON "MovimientoInventario"("numero");
CREATE INDEX IF NOT EXISTS "MovimientoInventario_empresaId_productoId_idx" ON "MovimientoInventario"("empresaId","productoId");
CREATE INDEX IF NOT EXISTS "MovimientoInventario_empresaId_productoId_fechaMovimiento_idx" ON "MovimientoInventario"("empresaId","productoId","fechaMovimiento");
CREATE INDEX IF NOT EXISTS "MovimientoInventario_empresaId_tipo_idx" ON "MovimientoInventario"("empresaId","tipo");
CREATE INDEX IF NOT EXISTS "MovimientoInventario_empresaId_fechaMovimiento_idx" ON "MovimientoInventario"("empresaId","fechaMovimiento");
CREATE INDEX IF NOT EXISTS "MovimientoInventario_referenciaId_referenciaTipo_idx" ON "MovimientoInventario"("referenciaId","referenciaTipo");
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_bodegaOrigenId_fkey"
    FOREIGN KEY ("bodegaOrigenId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_bodegaDestinoId_fkey"
    FOREIGN KEY ("bodegaDestinoId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "Proveedor" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT,
    "nombre" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "contactoNombre" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'Colombia',
    "plazoEntregaDias" INTEGER,
    "condicionesPago" TEXT,
    "descuentoBase" DECIMAL(5,2),
    "moneda" TEXT NOT NULL DEFAULT 'COP',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Proveedor_empresaId_idx" ON "Proveedor"("empresaId");
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "OrdenCompra" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEsperada" TIMESTAMP(3),
    "fechaRecepcion" TIMESTAMP(3),
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "usuarioId" INTEGER,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrdenCompra_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrdenCompra_numero_key" ON "OrdenCompra"("numero");
CREATE INDEX IF NOT EXISTS "OrdenCompra_empresaId_estado_idx" ON "OrdenCompra"("empresaId","estado");
CREATE INDEX IF NOT EXISTS "OrdenCompra_empresaId_proveedorId_idx" ON "OrdenCompra"("empresaId","proveedorId");
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_proveedorId_fkey"
    FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_bodegaId_fkey"
    FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "OrdenCompraItem" (
    "id" SERIAL NOT NULL,
    "ordenCompraId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "cantidadRecibida" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "costoUnitario" DECIMAL(14,4) NOT NULL,
    "descuentoPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "ivaValor" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrdenCompraItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "OrdenCompraItem" ADD CONSTRAINT "OrdenCompraItem_ordenCompraId_fkey"
    FOREIGN KEY ("ordenCompraId") REFERENCES "OrdenCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "OrdenCompraItem" ADD CONSTRAINT "OrdenCompraItem_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "RecepcionMercancia" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "ordenCompraId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecepcionMercancia_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RecepcionMercancia_numero_key" ON "RecepcionMercancia"("numero");
ALTER TABLE "RecepcionMercancia" ADD CONSTRAINT "RecepcionMercancia_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "RecepcionMercancia" ADD CONSTRAINT "RecepcionMercancia_ordenCompraId_fkey"
    FOREIGN KEY ("ordenCompraId") REFERENCES "OrdenCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "RecepcionItem" (
    "id" SERIAL NOT NULL,
    "recepcionId" INTEGER NOT NULL,
    "ordenCompraItemId" INTEGER NOT NULL,
    "cantidadRecibida" DECIMAL(12,3) NOT NULL,
    "costoUnitario" DECIMAL(14,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecepcionItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "RecepcionItem" ADD CONSTRAINT "RecepcionItem_recepcionId_fkey"
    FOREIGN KEY ("recepcionId") REFERENCES "RecepcionMercancia"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "RecepcionItem" ADD CONSTRAINT "RecepcionItem_ordenCompraItemId_fkey"
    FOREIGN KEY ("ordenCompraItemId") REFERENCES "OrdenCompraItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "Lote" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "fechaFabricacion" TIMESTAMP(3),
    "proveedor" TEXT,
    "cantidadInicial" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "cantidad" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Lote_empresaId_productoId_bodegaId_numero_key" ON "Lote"("empresaId","productoId","bodegaId","numero");
CREATE INDEX IF NOT EXISTS "Lote_empresaId_productoId_idx" ON "Lote"("empresaId","productoId");
CREATE INDEX IF NOT EXISTS "Lote_empresaId_fechaVencimiento_idx" ON "Lote"("empresaId","fechaVencimiento");
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_bodegaId_fkey"
    FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "NumeroSerie" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "bodegaId" INTEGER,
    "loteId" INTEGER,
    "serial" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "notas" TEXT,
    "movimientoEntradaId" INTEGER,
    "movimientoSalidaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NumeroSerie_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NumeroSerie_empresaId_productoId_serial_key" ON "NumeroSerie"("empresaId","productoId","serial");
CREATE INDEX IF NOT EXISTS "NumeroSerie_empresaId_productoId_idx" ON "NumeroSerie"("empresaId","productoId");
CREATE INDEX IF NOT EXISTS "NumeroSerie_empresaId_estado_idx" ON "NumeroSerie"("empresaId","estado");
ALTER TABLE "NumeroSerie" ADD CONSTRAINT "NumeroSerie_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "NumeroSerie" ADD CONSTRAINT "NumeroSerie_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "NumeroSerie" ADD CONSTRAINT "NumeroSerie_bodegaId_fkey"
    FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "NumeroSerie" ADD CONSTRAINT "NumeroSerie_loteId_fkey"
    FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "VarianteProducto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "atributos" JSONB NOT NULL,
    "costoPromedio" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "precioBase" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "codigoBarras" TEXT,
    "imagen" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VarianteProducto_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "VarianteProducto_empresaId_sku_key" ON "VarianteProducto"("empresaId","sku");
CREATE INDEX IF NOT EXISTS "VarianteProducto_empresaId_productoId_idx" ON "VarianteProducto"("empresaId","productoId");
ALTER TABLE "VarianteProducto" ADD CONSTRAINT "VarianteProducto_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "VarianteProducto" ADD CONSTRAINT "VarianteProducto_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "StockVariante" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "cantidadReservada" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StockVariante_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StockVariante_varianteId_bodegaId_key" ON "StockVariante"("varianteId","bodegaId");
CREATE INDEX IF NOT EXISTS "StockVariante_empresaId_idx" ON "StockVariante"("empresaId");
ALTER TABLE "StockVariante" ADD CONSTRAINT "StockVariante_varianteId_fkey"
    FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "StockVariante" ADD CONSTRAINT "StockVariante_bodegaId_fkey"
    FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- ─── Ventas ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ClienteERP" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipoPersona" TEXT NOT NULL DEFAULT 'JURIDICA',
    "tipoDocumento" TEXT NOT NULL DEFAULT 'NIT',
    "numeroDocumento" TEXT NOT NULL,
    "digitoVerificacion" TEXT,
    "nombre" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "regimenFiscal" TEXT NOT NULL DEFAULT '49',
    "responsabilidades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "actividadEconomica" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "celular" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'CO',
    "departamento" TEXT,
    "municipio" TEXT,
    "codigoDane" TEXT,
    "codigoPostal" TEXT,
    "direccion" TEXT,
    "plazoCredito" INTEGER NOT NULL DEFAULT 0,
    "cupoCredito" DECIMAL(15,2),
    "descuentoBase" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "vendedorId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClienteERP_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClienteERP_empresaId_tipoDocumento_numeroDocumento_key" ON "ClienteERP"("empresaId","tipoDocumento","numeroDocumento");
CREATE INDEX IF NOT EXISTS "ClienteERP_empresaId_idx" ON "ClienteERP"("empresaId");
CREATE INDEX IF NOT EXISTS "ClienteERP_empresaId_activo_idx" ON "ClienteERP"("empresaId","activo");
ALTER TABLE "ClienteERP" ADD CONSTRAINT "ClienteERP_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "ConfiguracionDIAN" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "ambiente" TEXT NOT NULL DEFAULT 'PRUEBAS',
    "softwareId" TEXT,
    "softwarePin" TEXT,
    "certificadoPath" TEXT,
    "certificadoPass" TEXT,
    "proveedorTec" TEXT,
    "proveedorApiKey" TEXT,
    "proveedorUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConfiguracionDIAN_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ConfiguracionDIAN_empresaId_key" ON "ConfiguracionDIAN"("empresaId");
ALTER TABLE "ConfiguracionDIAN" ADD CONSTRAINT "ConfiguracionDIAN_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "ResolucionDIAN" (
    "id" SERIAL NOT NULL,
    "configId" INTEGER NOT NULL,
    "tipoDocumento" TEXT NOT NULL DEFAULT '01',
    "prefijo" TEXT NOT NULL DEFAULT '',
    "numeroCurrent" INTEGER NOT NULL DEFAULT 0,
    "numeroInicial" INTEGER NOT NULL,
    "numeroFinal" INTEGER NOT NULL,
    "fechaResolucion" TIMESTAMP(3) NOT NULL,
    "fechaVigencia" TIMESTAMP(3) NOT NULL,
    "numeroResolucion" TEXT NOT NULL,
    "claveTecnica" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ResolucionDIAN_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ResolucionDIAN" ADD CONSTRAINT "ResolucionDIAN_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "ConfiguracionDIAN"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "Cotizacion" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "baseIva19" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "iva19" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "baseIva5" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "iva5" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "condicionesPago" TEXT,
    "usuarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Cotizacion_empresaId_numero_key" ON "Cotizacion"("empresaId","numero");
CREATE INDEX IF NOT EXISTS "Cotizacion_empresaId_estado_idx" ON "Cotizacion"("empresaId","estado");
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "ClienteERP"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "CotizacionItem" (
    "id" SERIAL NOT NULL,
    "cotizacionId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'UND',
    "cantidad" DECIMAL(15,4) NOT NULL,
    "precioUnitario" DECIMAL(15,2) NOT NULL,
    "descuentoPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "descuentoValor" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tipoIva" TEXT NOT NULL DEFAULT 'IVA_19',
    "baseIva" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ivaValor" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CotizacionItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "CotizacionItem" ADD CONSTRAINT "CotizacionItem_cotizacionId_fkey"
    FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "CotizacionItem" ADD CONSTRAINT "CotizacionItem_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "FacturaVenta" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "cotizacionId" INTEGER,
    "resolucionId" INTEGER,
    "prefijoDIAN" TEXT,
    "numeroDIAN" INTEGER,
    "cufe" TEXT,
    "qrUrl" TEXT,
    "xmlDIAN" TEXT,
    "respuestaDIAN" JSONB,
    "estadoDIAN" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "formaPago" TEXT NOT NULL DEFAULT 'CREDITO',
    "medioPago" TEXT NOT NULL DEFAULT 'TRANSFERENCIA',
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "retefuente" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "reteiva" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "reteica" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "baseIva19" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "iva19" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "baseIva5" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "iva5" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPagado" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "saldo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "usuarioId" INTEGER,
    "comprobanteId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FacturaVenta_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FacturaVenta_empresaId_numero_key" ON "FacturaVenta"("empresaId","numero");
CREATE INDEX IF NOT EXISTS "FacturaVenta_empresaId_estado_idx" ON "FacturaVenta"("empresaId","estado");
CREATE INDEX IF NOT EXISTS "FacturaVenta_empresaId_clienteId_idx" ON "FacturaVenta"("empresaId","clienteId");
CREATE INDEX IF NOT EXISTS "FacturaVenta_empresaId_fecha_idx" ON "FacturaVenta"("empresaId","fecha");
CREATE INDEX IF NOT EXISTS "FacturaVenta_empresaId_estadoDIAN_idx" ON "FacturaVenta"("empresaId","estadoDIAN");
ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "ClienteERP"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_bodegaId_fkey"
    FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_cotizacionId_fkey"
    FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_resolucionId_fkey"
    FOREIGN KEY ("resolucionId") REFERENCES "ResolucionDIAN"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "FacturaVentaItem" (
    "id" SERIAL NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'UND',
    "cantidad" DECIMAL(15,4) NOT NULL,
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
    CONSTRAINT "FacturaVentaItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "FacturaVentaItem" ADD CONSTRAINT "FacturaVentaItem_facturaId_fkey"
    FOREIGN KEY ("facturaId") REFERENCES "FacturaVenta"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "FacturaVentaItem" ADD CONSTRAINT "FacturaVentaItem_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "NotaCredito" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "resolucionId" INTEGER,
    "cufde" TEXT,
    "xmlDIAN" TEXT,
    "estadoDIAN" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "usuarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotaCredito_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NotaCredito_empresaId_numero_key" ON "NotaCredito"("empresaId","numero");
CREATE INDEX IF NOT EXISTS "NotaCredito_empresaId_idx" ON "NotaCredito"("empresaId");
ALTER TABLE "NotaCredito" ADD CONSTRAINT "NotaCredito_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "NotaCredito" ADD CONSTRAINT "NotaCredito_facturaId_fkey"
    FOREIGN KEY ("facturaId") REFERENCES "FacturaVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "NotaCredito" ADD CONSTRAINT "NotaCredito_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "ClienteERP"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "NotaCredito" ADD CONSTRAINT "NotaCredito_resolucionId_fkey"
    FOREIGN KEY ("resolucionId") REFERENCES "ResolucionDIAN"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "NotaCreditoItem" (
    "id" SERIAL NOT NULL,
    "notaCreditoId" INTEGER NOT NULL,
    "productoId" INTEGER,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(15,4) NOT NULL,
    "precioUnitario" DECIMAL(15,2) NOT NULL,
    "tipoIva" TEXT NOT NULL DEFAULT 'IVA_19',
    "ivaValor" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    CONSTRAINT "NotaCreditoItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "NotaCreditoItem" ADD CONSTRAINT "NotaCreditoItem_notaCreditoId_fkey"
    FOREIGN KEY ("notaCreditoId") REFERENCES "NotaCredito"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "ReciboCaja" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concepto" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "medioPago" TEXT NOT NULL,
    "referencia" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "usuarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReciboCaja_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ReciboCaja_empresaId_numero_key" ON "ReciboCaja"("empresaId","numero");
CREATE INDEX IF NOT EXISTS "ReciboCaja_empresaId_idx" ON "ReciboCaja"("empresaId");
ALTER TABLE "ReciboCaja" ADD CONSTRAINT "ReciboCaja_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "ReciboCaja" ADD CONSTRAINT "ReciboCaja_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "ClienteERP"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "ReciboCajaFactura" (
    "id" SERIAL NOT NULL,
    "reciboId" INTEGER NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    CONSTRAINT "ReciboCajaFactura_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ReciboCajaFactura" ADD CONSTRAINT "ReciboCajaFactura_reciboId_fkey"
    FOREIGN KEY ("reciboId") REFERENCES "ReciboCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "ReciboCajaFactura" ADD CONSTRAINT "ReciboCajaFactura_facturaId_fkey"
    FOREIGN KEY ("facturaId") REFERENCES "FacturaVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- ─── Contabilidad ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CuentaPUC" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "codigoPadre" TEXT,
    "naturaleza" TEXT NOT NULL DEFAULT 'DEBITO',
    "tipo" TEXT NOT NULL,
    "ajustable" BOOLEAN NOT NULL DEFAULT false,
    "requiereNit" BOOLEAN NOT NULL DEFAULT false,
    "requiereCentro" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CuentaPUC_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CuentaPUC_empresaId_codigo_key" ON "CuentaPUC"("empresaId","codigo");
CREATE INDEX IF NOT EXISTS "CuentaPUC_empresaId_nivel_idx" ON "CuentaPUC"("empresaId","nivel");
CREATE INDEX IF NOT EXISTS "CuentaPUC_empresaId_codigoPadre_idx" ON "CuentaPUC"("empresaId","codigoPadre");
ALTER TABLE "CuentaPUC" ADD CONSTRAINT "CuentaPUC_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "PeriodoContable" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "fechaCierre" TIMESTAMP(3),
    CONSTRAINT "PeriodoContable_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PeriodoContable_empresaId_anio_mes_key" ON "PeriodoContable"("empresaId","anio","mes");
ALTER TABLE "PeriodoContable" ADD CONSTRAINT "PeriodoContable_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "Comprobante" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "periodoId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'APROBADO',
    "referenciaId" INTEGER,
    "referenciaTipo" TEXT,
    "usuarioId" INTEGER,
    CONSTRAINT "Comprobante_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Comprobante_empresaId_numero_key" ON "Comprobante"("empresaId","numero");
CREATE INDEX IF NOT EXISTS "Comprobante_empresaId_tipo_idx" ON "Comprobante"("empresaId","tipo");
CREATE INDEX IF NOT EXISTS "Comprobante_empresaId_fecha_idx" ON "Comprobante"("empresaId","fecha");
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_periodoId_fkey"
    FOREIGN KEY ("periodoId") REFERENCES "PeriodoContable"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS "ComprobanteLinea" (
    "id" SERIAL NOT NULL,
    "comprobanteId" INTEGER NOT NULL,
    "cuentaId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "debito" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credito" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "terceroNit" TEXT,
    "terceroNombre" TEXT,
    "centroCosto" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ComprobanteLinea_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ComprobanteLinea" ADD CONSTRAINT "ComprobanteLinea_comprobanteId_fkey"
    FOREIGN KEY ("comprobanteId") REFERENCES "Comprobante"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "ComprobanteLinea" ADD CONSTRAINT "ComprobanteLinea_cuentaId_fkey"
    FOREIGN KEY ("cuentaId") REFERENCES "CuentaPUC"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- ─── Audit Log ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" SERIAL NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT,
    "entidadId" INTEGER,
    "colaboradorId" INTEGER,
    "colaboradorEmail" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "detalles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AuditLog_accion_idx" ON "AuditLog"("accion");
CREATE INDEX IF NOT EXISTS "AuditLog_colaboradorId_idx" ON "AuditLog"("colaboradorId");
CREATE INDEX IF NOT EXISTS "AuditLog_colaboradorEmail_idx" ON "AuditLog"("colaboradorEmail");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
