-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT,
    "usuario" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "loginFallidosConsecutivos" INTEGER NOT NULL DEFAULT 0,
    "loginBloqueadoHasta" TIMESTAMP(3),
    "refreshTokenHash" VARCHAR(128),
    "refreshTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "bio" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nit" TEXT NOT NULL,
    "digitoVerificacion" TEXT,
    "nombre" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "tipoPersona" TEXT DEFAULT 'JURIDICA',
    "representanteLegal" TEXT,
    "representanteLegalDoc" TEXT,
    "matriculaMercantil" TEXT,
    "fechaMatriculaMercantil" TIMESTAMP(3),
    "ciudadMatricula" TEXT,
    "regimenFiscal" TEXT DEFAULT '48',
    "actividadEconomica" TEXT,
    "responsabilidades" TEXT[],
    "granContribuyente" BOOLEAN NOT NULL DEFAULT false,
    "autoretenedor" BOOLEAN NOT NULL DEFAULT false,
    "agenteRetencion" BOOLEAN NOT NULL DEFAULT false,
    "direccion" TEXT,
    "municipio" TEXT,
    "departamento" TEXT,
    "codigoDane" TEXT,
    "codigoPostal" TEXT,
    "pais" TEXT DEFAULT 'CO',
    "telefono" TEXT,
    "email" TEXT,
    "correoFacturacion" TEXT,
    "web" TEXT,
    "logo" TEXT,
    "colorPrimario" TEXT DEFAULT '#4F46E5',
    "slogan" TEXT,
    "permiteStockNegativo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT,
    "direccion" TEXT NOT NULL,
    "pais" TEXT NOT NULL DEFAULT 'CO',
    "departamento" TEXT,
    "municipio" TEXT,
    "codigoDane" TEXT,
    "codigoPostal" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoConfig" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "prefijo" TEXT NOT NULL,
    "tipoOperacion" TEXT NOT NULL,
    "plantillaImpresion" TEXT NOT NULL DEFAULT 'CARTA',
    "esElectronico" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "consecutivoInicial" INTEGER NOT NULL DEFAULT 1,
    "consecutivoSiguiente" INTEGER NOT NULL DEFAULT 1,
    "sucursalId" INTEGER,
    "resolucionDian" TEXT,
    "fechaResolucion" TIMESTAMP(3),
    "vigenciaMeses" INTEGER,
    "rangoDesde" INTEGER,
    "rangoHasta" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionERP" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "cuentaVentas" TEXT DEFAULT '413505',
    "cuentaIva" TEXT DEFAULT '240805',
    "cuentaRete" TEXT DEFAULT '135515',
    "cuentaCaja" TEXT DEFAULT '110505',
    "metodoCosteo" TEXT DEFAULT 'PROMEDIO',
    "margenUtilidadBase" TEXT DEFAULT '30',
    "bloquearBajoCosto" BOOLEAN NOT NULL DEFAULT false,
    "incluirFletes" BOOLEAN NOT NULL DEFAULT false,
    "skuAutogenerado" BOOLEAN NOT NULL DEFAULT true,
    "skuLength" TEXT DEFAULT '8',
    "permitirDuplicadoBarras" BOOLEAN NOT NULL DEFAULT false,
    "unidadMedidaDefecto" TEXT DEFAULT 'UND',
    "consecutivoPrefijo" TEXT DEFAULT 'SETT',
    "permitirCotizacionesVencidas" BOOLEAN NOT NULL DEFAULT false,
    "terminosDefecto" TEXT DEFAULT 'Gracias por su compra.',
    "plantillaImpresion" TEXT DEFAULT 'TIRILLA_80',
    "limiteCreditoDefecto" TEXT DEFAULT '1000000',
    "plazoPagoDefecto" TEXT DEFAULT '30',
    "tasaInteresMora" TEXT DEFAULT '1.5',
    "bloquearClientesMora" BOOLEAN NOT NULL DEFAULT false,
    "entornoDian" TEXT DEFAULT 'PRUEBAS',
    "softwarePinDian" TEXT,
    "softwareIdDian" TEXT,
    "notificarEmisionEmail" BOOLEAN NOT NULL DEFAULT true,
    "codeEliminarDocumento" TEXT DEFAULT 'EDATIA123',
    "codeEliminarSucursal" TEXT DEFAULT 'SUCURSAL123',
    "codeModificarConsecutivo" TEXT DEFAULT 'ADMIN123',
    "codeAnularTransaccion" TEXT DEFAULT 'SUPER99',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionERP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormatoImpresion" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "margenSup" INTEGER NOT NULL DEFAULT 10,
    "margenInf" INTEGER NOT NULL DEFAULT 10,
    "margenIzq" INTEGER NOT NULL DEFAULT 10,
    "margenDer" INTEGER NOT NULL DEFAULT 10,
    "colorAcento" TEXT DEFAULT '#4F46E5',
    "mostrarLogo" BOOLEAN NOT NULL DEFAULT true,
    "mostrarFirma" BOOLEAN NOT NULL DEFAULT false,
    "encabezado" TEXT,
    "piePagina" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormatoImpresion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegimenFiscal" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegimenFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodigoCIIU" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodigoCIIU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsabilidadFiscal" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponsabilidadFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoIdentificacion" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigoDian" TEXT NOT NULL,
    "nombreCorto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipoIdentificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilCargo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "responsabilidades" TEXT,
    "correoPrincipal" TEXT,
    "subcorreos" TEXT[],
    "permisos" TEXT[],
    "documentoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilCargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colaborador" (
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
    "habilidadesTecnicas" TEXT[],
    "habilidadesBlandas" TEXT[],
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

-- CreateTable
CREATE TABLE "PlanBase" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioBase" DECIMAL(12,2) NOT NULL,
    "limiteUsuarios" INTEGER,
    "descuentoDefinitivo" DECIMAL(5,2) DEFAULT 0,
    "descuentoParcial" DECIMAL(5,2) DEFAULT 0,
    "mesesDescuentoParcial" INTEGER DEFAULT 0,
    "precioAnualFinal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "precioMensualFinal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanBaseModulo" (
    "planBaseId" INTEGER NOT NULL,
    "moduloId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanBaseModulo_pkey" PRIMARY KEY ("planBaseId","moduloId")
);

-- CreateTable
CREATE TABLE "ModuloSoftware" (
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

-- CreateTable
CREATE TABLE "ClienteManager" (
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
    "empresaId" INTEGER,
    "planBaseId" INTEGER,
    "asesorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanCliente" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "moduloId" INTEGER NOT NULL,
    "precioNegociado" DECIMAL(12,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
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

-- CreateTable
CREATE TABLE "TicketMensaje" (
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

-- CreateTable
CREATE TABLE "Categoria" (
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

-- CreateTable
CREATE TABLE "Marca" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadMedida" (
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

-- CreateTable
CREATE TABLE "Producto" (
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
    "publicadoWeb" BOOLEAN NOT NULL DEFAULT false,
    "precioWeb" DECIMAL(14,2),
    "slug" TEXT,
    "descripcionWeb" TEXT,
    "esDestacado" BOOLEAN NOT NULL DEFAULT false,
    "metadataWeb" JSONB,
    "codigoAlterno" TEXT,
    "referenciaFabricante" TEXT,
    "descripcionAlterna" TEXT,
    "comisionValor" DECIMAL(14,2) DEFAULT 0,
    "comisionPct" DECIMAL(5,2) DEFAULT 0,
    "ubicacion1" TEXT,
    "ubicacion2" TEXT,
    "presentacion" TEXT,
    "pesoUnidad" DECIMAL(12,3) DEFAULT 0,
    "paca" TEXT,
    "pacaCantidad" DECIMAL(12,3) DEFAULT 0,
    "dimensiones" TEXT,
    "multiploVenta" DECIMAL(12,3) DEFAULT 1,
    "pacaAlto" DECIMAL(12,3) DEFAULT 0,
    "pacaAncho" DECIMAL(12,3) DEFAULT 0,
    "pacaProfundidad" DECIMAL(12,3) DEFAULT 0,
    "cubicaje" DECIMAL(12,6) DEFAULT 0,
    "esRegalo" BOOLEAN NOT NULL DEFAULT false,
    "esKit" BOOLEAN NOT NULL DEFAULT false,
    "esImportado" BOOLEAN NOT NULL DEFAULT false,
    "esDescargable" BOOLEAN NOT NULL DEFAULT false,
    "bolsaP" BOOLEAN NOT NULL DEFAULT false,
    "esFacturable" BOOLEAN NOT NULL DEFAULT true,
    "esAjustable" BOOLEAN NOT NULL DEFAULT true,
    "receta" BOOLEAN NOT NULL DEFAULT false,
    "noAutoAddPos" BOOLEAN NOT NULL DEFAULT false,
    "grupoId" INTEGER,
    "subgrupoId" INTEGER,
    "colorId" INTEGER,
    "tallaId" INTEGER,
    "clasificacionId" INTEGER,
    "productoGrupo" TEXT,
    "centroCosto" TEXT,
    "tipoProducto" TEXT DEFAULT 'Inventario',
    "aplicaTalla" TEXT DEFAULT 'No',
    "aplicaColor" TEXT DEFAULT 'No',
    "selectedTags" TEXT[],
    "costo" DECIMAL(14,4) DEFAULT 0,
    "costoUltimo" DECIMAL(14,4) DEFAULT 0,
    "costoI" DECIMAL(14,4) DEFAULT 0,
    "promocionActiva" BOOLEAN NOT NULL DEFAULT false,
    "promocionDescuentoPct" DECIMAL(5,2) DEFAULT 0,
    "promocionDescuentoValor" DECIMAL(14,2) DEFAULT 0,
    "promocionFechaLimite" TEXT,
    "precios" JSONB,
    "observacion" TEXT,
    "liquidarIva" BOOLEAN NOT NULL DEFAULT true,
    "productoExentoIva" BOOLEAN NOT NULL DEFAULT false,
    "appliedTaxIds" TEXT[],
    "costeo" JSONB,
    "documentos" JSONB,
    "unspscCodigo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionTienda" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombreTienda" TEXT,
    "slugTienda" TEXT NOT NULL,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "colorPrimario" TEXT NOT NULL DEFAULT '#4F46E5',
    "whatsappVentas" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "metodosPago" JSONB,
    "costoEnvioBase" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionTienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bodega" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'ALMACEN',
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "permiteStockNegativo" BOOLEAN NOT NULL DEFAULT false,
    "sucursalId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bodega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "cantidadReservada" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
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
    "estado" TEXT DEFAULT 'COMPLETADO',
    "fechaMovimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentoConfigId" INTEGER,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaCompra" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "documentoConfigId" INTEGER,
    "numero" TEXT NOT NULL,
    "prefijoProveedor" TEXT,
    "consecutivoProveedor" TEXT NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "subtotal" DECIMAL(14,2) NOT NULL,
    "descuento" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "xmlAdjunto" TEXT,
    "recepcionId" TEXT,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'REGISTRADA',
    "ordenCompraId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacturaCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaCompraItem" (
    "id" SERIAL NOT NULL,
    "facturaCompraId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "costoUnitario" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacturaCompraItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenCompra" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "documentoConfigId" INTEGER,
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
    "aprobadoPorId" INTEGER,
    "fechaAprobacion" TIMESTAMP(3),
    "notasAprobacion" TEXT,
    "rechazadoPorId" INTEGER,
    "fechaRechazo" TIMESTAMP(3),
    "notasRechazo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdenCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenCompraItem" (
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

-- CreateTable
CREATE TABLE "RecepcionMercancia" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "ordenCompraId" INTEGER NOT NULL,
    "documentoConfigId" INTEGER,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER,
    "notas" TEXT,
    "inventarioAfectado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecepcionMercancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecepcionItem" (
    "id" SERIAL NOT NULL,
    "recepcionId" INTEGER NOT NULL,
    "ordenCompraItemId" INTEGER NOT NULL,
    "cantidadRecibida" DECIMAL(12,3) NOT NULL,
    "costoUnitario" DECIMAL(14,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecepcionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lote" (
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

-- CreateTable
CREATE TABLE "NumeroSerie" (
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

-- CreateTable
CREATE TABLE "VarianteProducto" (
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

-- CreateTable
CREATE TABLE "StockVariante" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "cantidadReservada" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockVariante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tercero" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipoPersona" TEXT NOT NULL DEFAULT 'JURIDICA',
    "tipoDocumento" TEXT NOT NULL DEFAULT 'NIT',
    "numeroDocumento" TEXT NOT NULL,
    "digitoVerificacion" TEXT,
    "nombre" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "celular" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'CO',
    "departamento" TEXT,
    "municipio" TEXT,
    "codigoDane" TEXT,
    "codigoPostal" TEXT,
    "direccion" TEXT,
    "esCliente" BOOLEAN NOT NULL DEFAULT false,
    "esProveedor" BOOLEAN NOT NULL DEFAULT false,
    "esColaborador" BOOLEAN NOT NULL DEFAULT false,
    "esVendedor" BOOLEAN NOT NULL DEFAULT false,
    "plazoCredito" INTEGER NOT NULL DEFAULT 0,
    "cupoCredito" DECIMAL(15,2),
    "descuentoCliente" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "vendedorAsignadoId" INTEGER,
    "contactoNombre" TEXT,
    "plazoEntregaDias" INTEGER,
    "condicionesPago" TEXT,
    "descuentoProveedor" DECIMAL(5,2),
    "monedaProveedor" TEXT NOT NULL DEFAULT 'COP',
    "comisionPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "regimenFiscal" TEXT NOT NULL DEFAULT '49',
    "responsabilidades" TEXT[],
    "actividadEconomica" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tercero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SucursalTercero" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "terceroId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "ciudad" TEXT,
    "departamento" TEXT,
    "pais" TEXT DEFAULT 'COLOMBIA',
    "contacto" TEXT,
    "cargo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SucursalTercero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionDIAN" (
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

-- CreateTable
CREATE TABLE "ResolucionDIAN" (
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

-- CreateTable
CREATE TABLE "Cotizacion" (
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

-- CreateTable
CREATE TABLE "CotizacionItem" (
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

-- CreateTable
CREATE TABLE "FacturaVenta" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "cotizacionId" INTEGER,
    "pedidoId" INTEGER,
    "vendedorNombre" TEXT,
    "vendedorId" INTEGER,
    "atendidoPor" TEXT,
    "canal" TEXT,
    "nivel" TEXT,
    "imprimeDcto" BOOLEAN NOT NULL DEFAULT true,
    "tipoDocumento" TEXT NOT NULL DEFAULT 'FV',
    "direccion" TEXT,
    "sucursalCliente" TEXT,
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

-- CreateTable
CREATE TABLE "FacturaVentaItem" (
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

-- CreateTable
CREATE TABLE "NotaCredito" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "facturaId" INTEGER,
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

-- CreateTable
CREATE TABLE "NotaCreditoItem" (
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

-- CreateTable
CREATE TABLE "ReciboCaja" (
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

-- CreateTable
CREATE TABLE "ReciboCajaFactura" (
    "id" SERIAL NOT NULL,
    "reciboId" INTEGER NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "ReciboCajaFactura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaPUC" (
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

-- CreateTable
CREATE TABLE "PeriodoContable" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "fechaCierre" TIMESTAMP(3),

    CONSTRAINT "PeriodoContable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comprobante" (
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

-- CreateTable
CREATE TABLE "ComprobanteLinea" (
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

-- CreateTable
CREATE TABLE "CajaPos" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "cuentaPUCId" INTEGER,
    "vendedorId" INTEGER,
    "vendedorNombre" TEXT,
    "impresora" TEXT,
    "tipoConexion" TEXT DEFAULT 'NETWORK',
    "anchoPapel" INTEGER NOT NULL DEFAULT 80,
    "permiteCreditoPos" BOOLEAN NOT NULL DEFAULT false,
    "permiteDescuento" BOOLEAN NOT NULL DEFAULT true,
    "maxDescuento" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CajaPos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SesionCaja" (
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

-- CreateTable
CREATE TABLE "VentaPos" (
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

-- CreateTable
CREATE TABLE "VentaPosItem" (
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

-- CreateTable
CREATE TABLE "MovimientoCaja" (
    "id" SERIAL NOT NULL,
    "sesionId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArqueoCaja" (
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

-- CreateTable
CREATE TABLE "AuditLog" (
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

-- CreateTable
CREATE TABLE "Impuesto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tarifa" DECIMAL(8,4) NOT NULL,
    "cuentaDebito" TEXT,
    "cuentaCredito" TEXT,
    "aplica" TEXT NOT NULL DEFAULT 'VENTA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "esDefecto" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "codigo" TEXT,
    "vigenciaDesde" TIMESTAMP(3),
    "vigenciaHasta" TIMESTAMP(3),
    "tarifaFija" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Impuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Moneda" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,
    "tasaCambio" DECIMAL(16,6) NOT NULL DEFAULT 1,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Moneda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CajaBanco" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "banco" TEXT,
    "numeroCuenta" TEXT,
    "tipoCuenta" TEXT,
    "cuentaPUC" TEXT,
    "sucursalId" INTEGER,
    "saldoInicial" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CajaBanco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "permisos" TEXT[],
    "esAdmin" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupoProducto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "contable" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrupoProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodoCierreERP" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "fechaCierre" TIMESTAMP(3),
    "cerradoPor" INTEGER,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodoCierreERP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogERP" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "entidad" TEXT,
    "entidadId" TEXT,
    "descripcion" TEXT,
    "valorAntes" JSONB,
    "valorDespues" JSONB,
    "usuarioId" INTEGER,
    "usuarioNombre" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogERP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "modulo" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" INTEGER,
    "accionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leidaAt" TIMESTAMP(3),

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HerramientaCartera" (
    "id" SERIAL NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "datosJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HerramientaCartera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoVenta" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "bodegaId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
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

    CONSTRAINT "PedidoVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoVentaItem" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
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

    CONSTRAINT "PedidoVentaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pais" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigoDianExogena" TEXT,
    "indicativoTelefonico" TEXT,

    CONSTRAINT "Pais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" SERIAL NOT NULL,
    "paisId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ciudad" (
    "id" SERIAL NOT NULL,
    "departamentoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigoDian" TEXT,

    CONSTRAINT "Ciudad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comuna" (
    "id" SERIAL NOT NULL,
    "ciudadId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Comuna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barrio" (
    "id" SERIAL NOT NULL,
    "ciudadId" INTEGER NOT NULL,
    "comunaId" INTEGER,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Barrio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubgrupoProducto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubgrupoProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorProducto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColorProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TallaProducto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TallaProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClasificacionContable" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "pucCuenta" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClasificacionContable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagProducto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoImpuesto" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "impuestoId" INTEGER NOT NULL,
    "baseGravable" DECIMAL(5,2) NOT NULL DEFAULT 100,

    CONSTRAINT "ProductoImpuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UNSPSC" (
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,

    CONSTRAINT "UNSPSC_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "ConversionUnidad" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "unidadOrigenId" INTEGER NOT NULL,
    "unidadDestinoId" INTEGER NOT NULL,
    "factor" DECIMAL(14,6) NOT NULL,

    CONSTRAINT "ConversionUnidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodigoBarras" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "varianteId" INTEGER,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'EAN13',
    "descripcion" TEXT,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CodigoBarras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListaPrecio" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'COP',
    "vigenciaDesde" TIMESTAMP(3),
    "vigenciaHasta" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ListaPrecio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrecioProducto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "varianteId" INTEGER,
    "listaPrecioId" INTEGER NOT NULL,
    "precio" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "PrecioProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponenteReceta" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "productoPadreId" INTEGER NOT NULL,
    "productoHijoId" INTEGER NOT NULL,
    "varianteHijoId" INTEGER,
    "cantidad" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "ComponenteReceta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoProveedor" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "codigoProveedor" TEXT,
    "precioCompra" DECIMAL(14,2) NOT NULL,
    "tiempoEntregaDias" INTEGER,
    "prioridad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProductoProveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaProducto" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "usuarioNombre" TEXT NOT NULL,
    "campoModificado" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormaPago" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "generaCartera" BOOLEAN NOT NULL DEFAULT true,
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
    "cajaBancoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedioPago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_usuario_key" ON "User"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nit_key" ON "Empresa"("nit");

-- CreateIndex
CREATE INDEX "Sucursal_empresaId_idx" ON "Sucursal"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Sucursal_empresaId_codigo_key" ON "Sucursal"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "DocumentoConfig_empresaId_idx" ON "DocumentoConfig"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentoConfig_empresaId_prefijo_key" ON "DocumentoConfig"("empresaId", "prefijo");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionERP_empresaId_key" ON "ConfiguracionERP"("empresaId");

-- CreateIndex
CREATE INDEX "FormatoImpresion_empresaId_idx" ON "FormatoImpresion"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "FormatoImpresion_empresaId_tipo_key" ON "FormatoImpresion"("empresaId", "tipo");

-- CreateIndex
CREATE INDEX "RegimenFiscal_empresaId_idx" ON "RegimenFiscal"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "RegimenFiscal_empresaId_codigo_key" ON "RegimenFiscal"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "CodigoCIIU_empresaId_idx" ON "CodigoCIIU"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "CodigoCIIU_empresaId_codigo_key" ON "CodigoCIIU"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "ResponsabilidadFiscal_empresaId_idx" ON "ResponsabilidadFiscal"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsabilidadFiscal_empresaId_codigo_key" ON "ResponsabilidadFiscal"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "TipoIdentificacion_empresaId_idx" ON "TipoIdentificacion"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoIdentificacion_empresaId_codigoDian_key" ON "TipoIdentificacion"("empresaId", "codigoDian");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilCargo_nombre_key" ON "PerfilCargo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_email_key" ON "Colaborador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlanBase_nombre_key" ON "PlanBase"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ModuloSoftware_nombre_key" ON "ModuloSoftware"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ModuloSoftware_slug_key" ON "ModuloSoftware"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteManager_nit_key" ON "ClienteManager"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteManager_empresaId_key" ON "ClienteManager"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_numero_key" ON "Ticket"("numero");

-- CreateIndex
CREATE INDEX "Categoria_empresaId_idx" ON "Categoria"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_empresaId_slug_key" ON "Categoria"("empresaId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Marca_empresaId_nombre_key" ON "Marca"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadMedida_empresaId_abreviatura_key" ON "UnidadMedida"("empresaId", "abreviatura");

-- CreateIndex
CREATE INDEX "Producto_empresaId_idx" ON "Producto"("empresaId");

-- CreateIndex
CREATE INDEX "Producto_empresaId_codigoBarras_idx" ON "Producto"("empresaId", "codigoBarras");

-- CreateIndex
CREATE INDEX "Producto_empresaId_activo_idx" ON "Producto"("empresaId", "activo");

-- CreateIndex
CREATE INDEX "Producto_empresaId_publicadoWeb_idx" ON "Producto"("empresaId", "publicadoWeb");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_empresaId_sku_key" ON "Producto"("empresaId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_empresaId_slug_key" ON "Producto"("empresaId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionTienda_empresaId_key" ON "ConfiguracionTienda"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionTienda_slugTienda_key" ON "ConfiguracionTienda"("slugTienda");

-- CreateIndex
CREATE INDEX "Bodega_empresaId_idx" ON "Bodega"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Bodega_empresaId_codigo_key" ON "Bodega"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "Stock_empresaId_idx" ON "Stock"("empresaId");

-- CreateIndex
CREATE INDEX "Stock_empresaId_productoId_idx" ON "Stock"("empresaId", "productoId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_productoId_bodegaId_key" ON "Stock"("productoId", "bodegaId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimientoInventario_numero_key" ON "MovimientoInventario"("numero");

-- CreateIndex
CREATE INDEX "MovimientoInventario_empresaId_productoId_idx" ON "MovimientoInventario"("empresaId", "productoId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_empresaId_productoId_fechaMovimiento_idx" ON "MovimientoInventario"("empresaId", "productoId", "fechaMovimiento");

-- CreateIndex
CREATE INDEX "MovimientoInventario_empresaId_tipo_idx" ON "MovimientoInventario"("empresaId", "tipo");

-- CreateIndex
CREATE INDEX "MovimientoInventario_empresaId_fechaMovimiento_idx" ON "MovimientoInventario"("empresaId", "fechaMovimiento");

-- CreateIndex
CREATE INDEX "MovimientoInventario_referenciaId_referenciaTipo_idx" ON "MovimientoInventario"("referenciaId", "referenciaTipo");

-- CreateIndex
CREATE INDEX "FacturaCompra_empresaId_idx" ON "FacturaCompra"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "FacturaCompra_empresaId_proveedorId_consecutivoProveedor_key" ON "FacturaCompra"("empresaId", "proveedorId", "consecutivoProveedor");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenCompra_numero_key" ON "OrdenCompra"("numero");

-- CreateIndex
CREATE INDEX "OrdenCompra_empresaId_estado_idx" ON "OrdenCompra"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "OrdenCompra_empresaId_proveedorId_idx" ON "OrdenCompra"("empresaId", "proveedorId");

-- CreateIndex
CREATE UNIQUE INDEX "RecepcionMercancia_numero_key" ON "RecepcionMercancia"("numero");

-- CreateIndex
CREATE INDEX "Lote_empresaId_productoId_idx" ON "Lote"("empresaId", "productoId");

-- CreateIndex
CREATE INDEX "Lote_empresaId_fechaVencimiento_idx" ON "Lote"("empresaId", "fechaVencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "Lote_empresaId_productoId_bodegaId_numero_key" ON "Lote"("empresaId", "productoId", "bodegaId", "numero");

-- CreateIndex
CREATE INDEX "NumeroSerie_empresaId_productoId_idx" ON "NumeroSerie"("empresaId", "productoId");

-- CreateIndex
CREATE INDEX "NumeroSerie_empresaId_estado_idx" ON "NumeroSerie"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "NumeroSerie_movimientoEntradaId_idx" ON "NumeroSerie"("movimientoEntradaId");

-- CreateIndex
CREATE INDEX "NumeroSerie_movimientoSalidaId_idx" ON "NumeroSerie"("movimientoSalidaId");

-- CreateIndex
CREATE UNIQUE INDEX "NumeroSerie_empresaId_productoId_serial_key" ON "NumeroSerie"("empresaId", "productoId", "serial");

-- CreateIndex
CREATE INDEX "VarianteProducto_empresaId_productoId_idx" ON "VarianteProducto"("empresaId", "productoId");

-- CreateIndex
CREATE UNIQUE INDEX "VarianteProducto_empresaId_sku_key" ON "VarianteProducto"("empresaId", "sku");

-- CreateIndex
CREATE INDEX "StockVariante_empresaId_idx" ON "StockVariante"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "StockVariante_varianteId_bodegaId_key" ON "StockVariante"("varianteId", "bodegaId");

-- CreateIndex
CREATE INDEX "Tercero_empresaId_idx" ON "Tercero"("empresaId");

-- CreateIndex
CREATE INDEX "Tercero_empresaId_activo_idx" ON "Tercero"("empresaId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "Tercero_empresaId_tipoDocumento_numeroDocumento_key" ON "Tercero"("empresaId", "tipoDocumento", "numeroDocumento");

-- CreateIndex
CREATE INDEX "SucursalTercero_empresaId_idx" ON "SucursalTercero"("empresaId");

-- CreateIndex
CREATE INDEX "SucursalTercero_terceroId_idx" ON "SucursalTercero"("terceroId");

-- CreateIndex
CREATE UNIQUE INDEX "SucursalTercero_empresaId_terceroId_codigo_key" ON "SucursalTercero"("empresaId", "terceroId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionDIAN_empresaId_key" ON "ConfiguracionDIAN"("empresaId");

-- CreateIndex
CREATE INDEX "Cotizacion_empresaId_estado_idx" ON "Cotizacion"("empresaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_empresaId_numero_key" ON "Cotizacion"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "FacturaVenta_empresaId_estado_idx" ON "FacturaVenta"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "FacturaVenta_empresaId_clienteId_idx" ON "FacturaVenta"("empresaId", "clienteId");

-- CreateIndex
CREATE INDEX "FacturaVenta_empresaId_fecha_idx" ON "FacturaVenta"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "FacturaVenta_empresaId_estadoDIAN_idx" ON "FacturaVenta"("empresaId", "estadoDIAN");

-- CreateIndex
CREATE UNIQUE INDEX "FacturaVenta_empresaId_numero_key" ON "FacturaVenta"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "NotaCredito_empresaId_idx" ON "NotaCredito"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "NotaCredito_empresaId_numero_key" ON "NotaCredito"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "ReciboCaja_empresaId_idx" ON "ReciboCaja"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "ReciboCaja_empresaId_numero_key" ON "ReciboCaja"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "CuentaPUC_empresaId_nivel_idx" ON "CuentaPUC"("empresaId", "nivel");

-- CreateIndex
CREATE INDEX "CuentaPUC_empresaId_codigoPadre_idx" ON "CuentaPUC"("empresaId", "codigoPadre");

-- CreateIndex
CREATE UNIQUE INDEX "CuentaPUC_empresaId_codigo_key" ON "CuentaPUC"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoContable_empresaId_anio_mes_key" ON "PeriodoContable"("empresaId", "anio", "mes");

-- CreateIndex
CREATE INDEX "Comprobante_empresaId_tipo_idx" ON "Comprobante"("empresaId", "tipo");

-- CreateIndex
CREATE INDEX "Comprobante_empresaId_fecha_idx" ON "Comprobante"("empresaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Comprobante_empresaId_numero_key" ON "Comprobante"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "CajaPos_empresaId_idx" ON "CajaPos"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "CajaPos_empresaId_nombre_key" ON "CajaPos"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "SesionCaja_empresaId_estado_idx" ON "SesionCaja"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "SesionCaja_empresaId_cajaId_idx" ON "SesionCaja"("empresaId", "cajaId");

-- CreateIndex
CREATE INDEX "VentaPos_empresaId_sesionId_idx" ON "VentaPos"("empresaId", "sesionId");

-- CreateIndex
CREATE INDEX "VentaPos_empresaId_fecha_idx" ON "VentaPos"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "VentaPos_empresaId_estado_idx" ON "VentaPos"("empresaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "VentaPos_empresaId_numero_key" ON "VentaPos"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "MovimientoCaja_sesionId_idx" ON "MovimientoCaja"("sesionId");

-- CreateIndex
CREATE UNIQUE INDEX "ArqueoCaja_sesionId_key" ON "ArqueoCaja"("sesionId");

-- CreateIndex
CREATE INDEX "AuditLog_accion_idx" ON "AuditLog"("accion");

-- CreateIndex
CREATE INDEX "AuditLog_colaboradorId_idx" ON "AuditLog"("colaboradorId");

-- CreateIndex
CREATE INDEX "AuditLog_colaboradorEmail_idx" ON "AuditLog"("colaboradorEmail");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Impuesto_empresaId_tipo_idx" ON "Impuesto"("empresaId", "tipo");

-- CreateIndex
CREATE INDEX "Impuesto_empresaId_activo_idx" ON "Impuesto"("empresaId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "Impuesto_empresaId_nombre_key" ON "Impuesto"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "Moneda_empresaId_idx" ON "Moneda"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Moneda_empresaId_codigo_key" ON "Moneda"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "CajaBanco_empresaId_tipo_idx" ON "CajaBanco"("empresaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "CajaBanco_empresaId_nombre_key" ON "CajaBanco"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "Rol_empresaId_idx" ON "Rol"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_empresaId_nombre_key" ON "Rol"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "GrupoProducto_empresaId_idx" ON "GrupoProducto"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoProducto_empresaId_nombre_key" ON "GrupoProducto"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "PeriodoCierreERP_empresaId_estado_idx" ON "PeriodoCierreERP"("empresaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoCierreERP_empresaId_tipo_periodo_key" ON "PeriodoCierreERP"("empresaId", "tipo", "periodo");

-- CreateIndex
CREATE INDEX "AuditLogERP_empresaId_accion_idx" ON "AuditLogERP"("empresaId", "accion");

-- CreateIndex
CREATE INDEX "AuditLogERP_empresaId_modulo_idx" ON "AuditLogERP"("empresaId", "modulo");

-- CreateIndex
CREATE INDEX "AuditLogERP_empresaId_createdAt_idx" ON "AuditLogERP"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLogERP_empresaId_usuarioId_idx" ON "AuditLogERP"("empresaId", "usuarioId");

-- CreateIndex
CREATE INDEX "Notificacion_empresaId_leida_idx" ON "Notificacion"("empresaId", "leida");

-- CreateIndex
CREATE INDEX "Notificacion_empresaId_usuarioId_idx" ON "Notificacion"("empresaId", "usuarioId");

-- CreateIndex
CREATE INDEX "Notificacion_empresaId_createdAt_idx" ON "Notificacion"("empresaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HerramientaCartera_correo_key" ON "HerramientaCartera"("correo");

-- CreateIndex
CREATE INDEX "PedidoVenta_empresaId_estado_idx" ON "PedidoVenta"("empresaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "PedidoVenta_empresaId_numero_key" ON "PedidoVenta"("empresaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Pais_codigo_key" ON "Pais"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_paisId_codigo_key" ON "Departamento"("paisId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Ciudad_departamentoId_nombre_key" ON "Ciudad"("departamentoId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Comuna_ciudadId_nombre_key" ON "Comuna"("ciudadId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Barrio_ciudadId_comunaId_nombre_key" ON "Barrio"("ciudadId", "comunaId", "nombre");

-- CreateIndex
CREATE INDEX "SubgrupoProducto_empresaId_idx" ON "SubgrupoProducto"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "SubgrupoProducto_empresaId_grupoId_nombre_key" ON "SubgrupoProducto"("empresaId", "grupoId", "nombre");

-- CreateIndex
CREATE INDEX "ColorProducto_empresaId_idx" ON "ColorProducto"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "ColorProducto_empresaId_nombre_key" ON "ColorProducto"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "TallaProducto_empresaId_idx" ON "TallaProducto"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "TallaProducto_empresaId_nombre_key" ON "TallaProducto"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "ClasificacionContable_empresaId_idx" ON "ClasificacionContable"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "ClasificacionContable_empresaId_nombre_key" ON "ClasificacionContable"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "TagProducto_empresaId_idx" ON "TagProducto"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "TagProducto_empresaId_nombre_key" ON "TagProducto"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoImpuesto_productoId_impuestoId_key" ON "ProductoImpuesto"("productoId", "impuestoId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversionUnidad_empresaId_unidadOrigenId_unidadDestinoId_key" ON "ConversionUnidad"("empresaId", "unidadOrigenId", "unidadDestinoId");

-- CreateIndex
CREATE INDEX "CodigoBarras_productoId_idx" ON "CodigoBarras"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "CodigoBarras_empresaId_codigo_key" ON "CodigoBarras"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ListaPrecio_empresaId_nombre_key" ON "ListaPrecio"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "PrecioProducto_productoId_varianteId_listaPrecioId_key" ON "PrecioProducto"("productoId", "varianteId", "listaPrecioId");

-- CreateIndex
CREATE UNIQUE INDEX "ComponenteReceta_productoPadreId_productoHijoId_varianteHij_key" ON "ComponenteReceta"("productoPadreId", "productoHijoId", "varianteHijoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoProveedor_productoId_proveedorId_key" ON "ProductoProveedor"("productoId", "proveedorId");

-- CreateIndex
CREATE INDEX "AuditoriaProducto_productoId_idx" ON "AuditoriaProducto"("productoId");

-- CreateIndex
CREATE INDEX "AuditoriaProducto_empresaId_createdAt_idx" ON "AuditoriaProducto"("empresaId", "createdAt");

-- CreateIndex
CREATE INDEX "FormaPago_empresaId_idx" ON "FormaPago"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "FormaPago_empresaId_codigo_key" ON "FormaPago"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "MedioPago_empresaId_idx" ON "MedioPago"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "MedioPago_empresaId_codigo_key" ON "MedioPago"("empresaId", "codigo");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sucursal" ADD CONSTRAINT "Sucursal_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoConfig" ADD CONSTRAINT "DocumentoConfig_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionERP" ADD CONSTRAINT "ConfiguracionERP_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormatoImpresion" ADD CONSTRAINT "FormatoImpresion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegimenFiscal" ADD CONSTRAINT "RegimenFiscal_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodigoCIIU" ADD CONSTRAINT "CodigoCIIU_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsabilidadFiscal" ADD CONSTRAINT "ResponsabilidadFiscal_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoIdentificacion" ADD CONSTRAINT "TipoIdentificacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_perfilCargoId_fkey" FOREIGN KEY ("perfilCargoId") REFERENCES "PerfilCargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanBaseModulo" ADD CONSTRAINT "PlanBaseModulo_planBaseId_fkey" FOREIGN KEY ("planBaseId") REFERENCES "PlanBase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanBaseModulo" ADD CONSTRAINT "PlanBaseModulo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloSoftware"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteManager" ADD CONSTRAINT "ClienteManager_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteManager" ADD CONSTRAINT "ClienteManager_planBaseId_fkey" FOREIGN KEY ("planBaseId") REFERENCES "PlanBase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteManager" ADD CONSTRAINT "ClienteManager_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCliente" ADD CONSTRAINT "PlanCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteManager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCliente" ADD CONSTRAINT "PlanCliente_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloSoftware"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteManager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_asesorSacId_fkey" FOREIGN KEY ("asesorSacId") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_desarrolladorId_fkey" FOREIGN KEY ("desarrolladorId") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMensaje" ADD CONSTRAINT "TicketMensaje_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marca" ADD CONSTRAINT "Marca_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadMedida" ADD CONSTRAINT "UnidadMedida_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_unidadMedidaId_fkey" FOREIGN KEY ("unidadMedidaId") REFERENCES "UnidadMedida"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_subgrupoId_fkey" FOREIGN KEY ("subgrupoId") REFERENCES "SubgrupoProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "ColorProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_tallaId_fkey" FOREIGN KEY ("tallaId") REFERENCES "TallaProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_clasificacionId_fkey" FOREIGN KEY ("clasificacionId") REFERENCES "ClasificacionContable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_unspscCodigo_fkey" FOREIGN KEY ("unspscCodigo") REFERENCES "UNSPSC"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionTienda" ADD CONSTRAINT "ConfiguracionTienda_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bodega" ADD CONSTRAINT "Bodega_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bodega" ADD CONSTRAINT "Bodega_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_bodegaOrigenId_fkey" FOREIGN KEY ("bodegaOrigenId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_bodegaDestinoId_fkey" FOREIGN KEY ("bodegaDestinoId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_documentoConfigId_fkey" FOREIGN KEY ("documentoConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaCompra" ADD CONSTRAINT "FacturaCompra_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaCompra" ADD CONSTRAINT "FacturaCompra_documentoConfigId_fkey" FOREIGN KEY ("documentoConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaCompra" ADD CONSTRAINT "FacturaCompra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaCompra" ADD CONSTRAINT "FacturaCompra_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "OrdenCompra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaCompraItem" ADD CONSTRAINT "FacturaCompraItem_facturaCompraId_fkey" FOREIGN KEY ("facturaCompraId") REFERENCES "FacturaCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaCompraItem" ADD CONSTRAINT "FacturaCompraItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_documentoConfigId_fkey" FOREIGN KEY ("documentoConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_rechazadoPorId_fkey" FOREIGN KEY ("rechazadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompraItem" ADD CONSTRAINT "OrdenCompraItem_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "OrdenCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompraItem" ADD CONSTRAINT "OrdenCompraItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecepcionMercancia" ADD CONSTRAINT "RecepcionMercancia_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecepcionMercancia" ADD CONSTRAINT "RecepcionMercancia_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "OrdenCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecepcionMercancia" ADD CONSTRAINT "RecepcionMercancia_documentoConfigId_fkey" FOREIGN KEY ("documentoConfigId") REFERENCES "DocumentoConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecepcionItem" ADD CONSTRAINT "RecepcionItem_recepcionId_fkey" FOREIGN KEY ("recepcionId") REFERENCES "RecepcionMercancia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecepcionItem" ADD CONSTRAINT "RecepcionItem_ordenCompraItemId_fkey" FOREIGN KEY ("ordenCompraItemId") REFERENCES "OrdenCompraItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumeroSerie" ADD CONSTRAINT "NumeroSerie_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumeroSerie" ADD CONSTRAINT "NumeroSerie_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumeroSerie" ADD CONSTRAINT "NumeroSerie_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumeroSerie" ADD CONSTRAINT "NumeroSerie_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumeroSerie" ADD CONSTRAINT "NumeroSerie_movimientoEntradaId_fkey" FOREIGN KEY ("movimientoEntradaId") REFERENCES "MovimientoInventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumeroSerie" ADD CONSTRAINT "NumeroSerie_movimientoSalidaId_fkey" FOREIGN KEY ("movimientoSalidaId") REFERENCES "MovimientoInventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VarianteProducto" ADD CONSTRAINT "VarianteProducto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VarianteProducto" ADD CONSTRAINT "VarianteProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockVariante" ADD CONSTRAINT "StockVariante_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockVariante" ADD CONSTRAINT "StockVariante_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tercero" ADD CONSTRAINT "Tercero_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tercero" ADD CONSTRAINT "Tercero_vendedorAsignadoId_fkey" FOREIGN KEY ("vendedorAsignadoId") REFERENCES "Tercero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SucursalTercero" ADD CONSTRAINT "SucursalTercero_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SucursalTercero" ADD CONSTRAINT "SucursalTercero_terceroId_fkey" FOREIGN KEY ("terceroId") REFERENCES "Tercero"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionDIAN" ADD CONSTRAINT "ConfiguracionDIAN_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolucionDIAN" ADD CONSTRAINT "ResolucionDIAN_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ConfiguracionDIAN"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionItem" ADD CONSTRAINT "CotizacionItem_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionItem" ADD CONSTRAINT "CotizacionItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoVenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaVenta" ADD CONSTRAINT "FacturaVenta_resolucionId_fkey" FOREIGN KEY ("resolucionId") REFERENCES "ResolucionDIAN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaVentaItem" ADD CONSTRAINT "FacturaVentaItem_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "FacturaVenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaVentaItem" ADD CONSTRAINT "FacturaVentaItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCredito" ADD CONSTRAINT "NotaCredito_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCredito" ADD CONSTRAINT "NotaCredito_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "FacturaVenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCredito" ADD CONSTRAINT "NotaCredito_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCredito" ADD CONSTRAINT "NotaCredito_resolucionId_fkey" FOREIGN KEY ("resolucionId") REFERENCES "ResolucionDIAN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCreditoItem" ADD CONSTRAINT "NotaCreditoItem_notaCreditoId_fkey" FOREIGN KEY ("notaCreditoId") REFERENCES "NotaCredito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboCaja" ADD CONSTRAINT "ReciboCaja_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboCaja" ADD CONSTRAINT "ReciboCaja_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboCajaFactura" ADD CONSTRAINT "ReciboCajaFactura_reciboId_fkey" FOREIGN KEY ("reciboId") REFERENCES "ReciboCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboCajaFactura" ADD CONSTRAINT "ReciboCajaFactura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "FacturaVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaPUC" ADD CONSTRAINT "CuentaPUC_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoContable" ADD CONSTRAINT "PeriodoContable_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "PeriodoContable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComprobanteLinea" ADD CONSTRAINT "ComprobanteLinea_comprobanteId_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "Comprobante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComprobanteLinea" ADD CONSTRAINT "ComprobanteLinea_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaPUC"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaPos" ADD CONSTRAINT "CajaPos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaPos" ADD CONSTRAINT "CajaPos_bodegaId_fkey" FOREIGN KEY ("bodegaId") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaPos" ADD CONSTRAINT "CajaPos_cuentaPUCId_fkey" FOREIGN KEY ("cuentaPUCId") REFERENCES "CuentaPUC"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "CajaPos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaPos" ADD CONSTRAINT "VentaPos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaPos" ADD CONSTRAINT "VentaPos_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaPos" ADD CONSTRAINT "VentaPos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Tercero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaPosItem" ADD CONSTRAINT "VentaPosItem_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "VentaPos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaPosItem" ADD CONSTRAINT "VentaPosItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArqueoCaja" ADD CONSTRAINT "ArqueoCaja_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impuesto" ADD CONSTRAINT "Impuesto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moneda" ADD CONSTRAINT "Moneda_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaBanco" ADD CONSTRAINT "CajaBanco_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rol" ADD CONSTRAINT "Rol_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoProducto" ADD CONSTRAINT "GrupoProducto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoCierreERP" ADD CONSTRAINT "PeriodoCierreERP_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogERP" ADD CONSTRAINT "AuditLogERP_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVenta" ADD CONSTRAINT "PedidoVenta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVenta" ADD CONSTRAINT "PedidoVenta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVentaItem" ADD CONSTRAINT "PedidoVentaItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoVenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoVentaItem" ADD CONSTRAINT "PedidoVentaItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departamento" ADD CONSTRAINT "Departamento_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "Pais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ciudad" ADD CONSTRAINT "Ciudad_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comuna" ADD CONSTRAINT "Comuna_ciudadId_fkey" FOREIGN KEY ("ciudadId") REFERENCES "Ciudad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Barrio" ADD CONSTRAINT "Barrio_ciudadId_fkey" FOREIGN KEY ("ciudadId") REFERENCES "Ciudad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Barrio" ADD CONSTRAINT "Barrio_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "Comuna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubgrupoProducto" ADD CONSTRAINT "SubgrupoProducto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubgrupoProducto" ADD CONSTRAINT "SubgrupoProducto_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoProducto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColorProducto" ADD CONSTRAINT "ColorProducto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TallaProducto" ADD CONSTRAINT "TallaProducto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClasificacionContable" ADD CONSTRAINT "ClasificacionContable_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagProducto" ADD CONSTRAINT "TagProducto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoImpuesto" ADD CONSTRAINT "ProductoImpuesto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoImpuesto" ADD CONSTRAINT "ProductoImpuesto_impuestoId_fkey" FOREIGN KEY ("impuestoId") REFERENCES "Impuesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionUnidad" ADD CONSTRAINT "ConversionUnidad_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionUnidad" ADD CONSTRAINT "ConversionUnidad_unidadOrigenId_fkey" FOREIGN KEY ("unidadOrigenId") REFERENCES "UnidadMedida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionUnidad" ADD CONSTRAINT "ConversionUnidad_unidadDestinoId_fkey" FOREIGN KEY ("unidadDestinoId") REFERENCES "UnidadMedida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodigoBarras" ADD CONSTRAINT "CodigoBarras_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodigoBarras" ADD CONSTRAINT "CodigoBarras_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaPrecio" ADD CONSTRAINT "ListaPrecio_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecioProducto" ADD CONSTRAINT "PrecioProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecioProducto" ADD CONSTRAINT "PrecioProducto_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "VarianteProducto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecioProducto" ADD CONSTRAINT "PrecioProducto_listaPrecioId_fkey" FOREIGN KEY ("listaPrecioId") REFERENCES "ListaPrecio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteReceta" ADD CONSTRAINT "ComponenteReceta_productoPadreId_fkey" FOREIGN KEY ("productoPadreId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteReceta" ADD CONSTRAINT "ComponenteReceta_productoHijoId_fkey" FOREIGN KEY ("productoHijoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoProveedor" ADD CONSTRAINT "ProductoProveedor_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoProveedor" ADD CONSTRAINT "ProductoProveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaProducto" ADD CONSTRAINT "AuditoriaProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormaPago" ADD CONSTRAINT "FormaPago_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedioPago" ADD CONSTRAINT "MedioPago_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedioPago" ADD CONSTRAINT "MedioPago_cajaBancoId_fkey" FOREIGN KEY ("cajaBancoId") REFERENCES "CajaBanco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

