import {
  IsString, IsOptional, IsBoolean, IsNumber, IsInt, IsIn,
  MinLength, MaxLength, Min, IsArray
} from 'class-validator';

const TIPOS_IVA = ['EXENTO', 'EXCLUIDO', 'GRAVADO_5', 'GRAVADO_19'];

export class CreateProductoDto {
  @IsString() @MinLength(1) @MaxLength(60)
  sku!: string;

  @IsString() @MinLength(1) @MaxLength(200)
  nombre!: string;

  @IsOptional() @IsString()
  codigoBarras?: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsString()
  referencia?: string;

  @IsOptional() @IsInt()
  categoriaId?: number;

  @IsOptional() @IsInt()
  marcaId?: number;

  @IsOptional() @IsInt()
  unidadMedidaId?: number;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  precioBase?: number;

  @IsOptional() @IsIn(TIPOS_IVA)
  tipoIva?: string;

  @IsOptional() @IsBoolean()
  manejaBodega?: boolean;

  @IsOptional() @IsBoolean()
  manejaLotes?: boolean;

  @IsOptional() @IsBoolean()
  manejaSerial?: boolean;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0)
  stockMinimo?: number;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0)
  stockMaximo?: number;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0)
  puntoReorden?: number;

  @IsOptional() @IsString()
  imagen?: string;

  // ── Nuevos campos del plan de reestructuración ──
  @IsOptional() @IsString()
  codigoAlterno?: string;

  @IsOptional() @IsString()
  referenciaFabricante?: string;

  @IsOptional() @IsString()
  descripcionAlterna?: string;

  @IsOptional() @IsNumber()
  comisionValor?: number;

  @IsOptional() @IsNumber()
  comisionPct?: number;

  @IsOptional() @IsString()
  ubicacion1?: string;

  @IsOptional() @IsString()
  ubicacion2?: string;

  @IsOptional() @IsString()
  presentacion?: string;

  @IsOptional() @IsNumber()
  pesoUnidad?: number;

  @IsOptional() @IsString()
  paca?: string;

  @IsOptional() @IsNumber()
  pacaCantidad?: number;

  @IsOptional() @IsString()
  dimensiones?: string;

  @IsOptional() @IsNumber()
  multiploVenta?: number;

  @IsOptional() @IsNumber()
  pacaAlto?: number;

  @IsOptional() @IsNumber()
  pacaAncho?: number;

  @IsOptional() @IsNumber()
  pacaProfundidad?: number;

  @IsOptional() @IsNumber()
  cubicaje?: number;

  @IsOptional() @IsBoolean()
  esRegalo?: boolean;

  @IsOptional() @IsBoolean()
  esKit?: boolean;

  @IsOptional() @IsBoolean()
  esImportado?: boolean;

  @IsOptional() @IsBoolean()
  esDescargable?: boolean;

  @IsOptional() @IsBoolean()
  bolsaP?: boolean;

  @IsOptional() @IsBoolean()
  esFacturable?: boolean;

  @IsOptional() @IsBoolean()
  esAjustable?: boolean;

  @IsOptional() @IsBoolean()
  receta?: boolean;

  @IsOptional() @IsBoolean()
  noAutoAddPos?: boolean;

  @IsOptional() @IsInt()
  grupoId?: number;

  @IsOptional() @IsInt()
  subgrupoId?: number;

  @IsOptional() @IsInt()
  colorId?: number;

  @IsOptional() @IsInt()
  tallaId?: number;

  @IsOptional() @IsInt()
  clasificacionId?: number;

  @IsOptional() @IsString()
  productoGrupo?: string;

  @IsOptional() @IsString()
  centroCosto?: string;

  @IsOptional() @IsString()
  tipoProducto?: string;

  @IsOptional() @IsString()
  aplicaTalla?: string;

  @IsOptional() @IsString()
  aplicaColor?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  selectedTags?: string[];

  @IsOptional() @IsNumber()
  costo?: number;

  @IsOptional() @IsNumber()
  costoUltimo?: number;

  @IsOptional() @IsNumber()
  costoI?: number;

  @IsOptional() @IsBoolean()
  promocionActiva?: boolean;

  @IsOptional() @IsNumber()
  promocionDescuentoPct?: number;

  @IsOptional() @IsNumber()
  promocionDescuentoValor?: number;

  @IsOptional() @IsString()
  promocionFechaLimite?: string;

  @IsOptional()
  precios?: any;

  @IsOptional() @IsString()
  observacion?: string;

  @IsOptional() @IsBoolean()
  liquidarIva?: boolean;

  @IsOptional() @IsBoolean()
  productoExentoIva?: boolean;

  @IsOptional() @IsArray() @IsString({ each: true })
  appliedTaxIds?: string[];

  @IsOptional()
  documentos?: any;

  @IsOptional()
  costeo?: any;

  // Web / Digital
  @IsOptional() @IsBoolean()
  esDigital?: boolean;

  @IsOptional() @IsString()
  nombreWeb?: string;

  @IsOptional()
  imagenes?: any;

  @IsOptional() @IsString()
  etiquetaSeo?: string;

  @IsOptional() @IsString()
  metaDescripcion?: string;

  @IsOptional() @IsInt()
  ordenMostrar?: number;

  @IsOptional() @IsString()
  urlDescarga?: string;
}

export class UpdateProductoDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(60)
  sku?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(200)
  nombre?: string;

  @IsOptional() @IsString()
  codigoBarras?: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsString()
  referencia?: string;

  @IsOptional() @IsInt()
  categoriaId?: number | null;

  @IsOptional() @IsInt()
  marcaId?: number | null;

  @IsOptional() @IsInt()
  unidadMedidaId?: number | null;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  precioBase?: number;

  @IsOptional() @IsIn(TIPOS_IVA)
  tipoIva?: string;

  @IsOptional() @IsBoolean()
  manejaBodega?: boolean;

  @IsOptional() @IsBoolean()
  manejaLotes?: boolean;

  @IsOptional() @IsBoolean()
  manejaSerial?: boolean;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0)
  stockMinimo?: number;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0)
  stockMaximo?: number;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0)
  puntoReorden?: number;

  @IsOptional() @IsBoolean()
  activo?: boolean;

  @IsOptional() @IsString()
  imagen?: string;

  // ── Nuevos campos en actualización ──
  @IsOptional() @IsString()
  codigoAlterno?: string;

  @IsOptional() @IsString()
  referenciaFabricante?: string;

  @IsOptional() @IsString()
  descripcionAlterna?: string;

  @IsOptional() @IsNumber()
  comisionValor?: number;

  @IsOptional() @IsNumber()
  comisionPct?: number;

  @IsOptional() @IsString()
  ubicacion1?: string;

  @IsOptional() @IsString()
  ubicacion2?: string;

  @IsOptional() @IsString()
  presentacion?: string;

  @IsOptional() @IsNumber()
  pesoUnidad?: number;

  @IsOptional() @IsString()
  paca?: string;

  @IsOptional() @IsNumber()
  pacaCantidad?: number;

  @IsOptional() @IsString()
  dimensiones?: string;

  @IsOptional() @IsNumber()
  multiploVenta?: number;

  @IsOptional() @IsNumber()
  pacaAlto?: number;

  @IsOptional() @IsNumber()
  pacaAncho?: number;

  @IsOptional() @IsNumber()
  pacaProfundidad?: number;

  @IsOptional() @IsNumber()
  cubicaje?: number;

  @IsOptional() @IsBoolean()
  esRegalo?: boolean;

  @IsOptional() @IsBoolean()
  esKit?: boolean;

  @IsOptional() @IsBoolean()
  esImportado?: boolean;

  @IsOptional() @IsBoolean()
  esDescargable?: boolean;

  @IsOptional() @IsBoolean()
  bolsaP?: boolean;

  @IsOptional() @IsBoolean()
  esFacturable?: boolean;

  @IsOptional() @IsBoolean()
  esAjustable?: boolean;

  @IsOptional() @IsBoolean()
  receta?: boolean;

  @IsOptional() @IsBoolean()
  noAutoAddPos?: boolean;

  @IsOptional() @IsInt()
  grupoId?: number | null;

  @IsOptional() @IsInt()
  subgrupoId?: number | null;

  @IsOptional() @IsInt()
  colorId?: number | null;

  @IsOptional() @IsInt()
  tallaId?: number | null;

  @IsOptional() @IsInt()
  clasificacionId?: number | null;

  @IsOptional() @IsString()
  productoGrupo?: string;

  @IsOptional() @IsString()
  centroCosto?: string;

  @IsOptional() @IsString()
  tipoProducto?: string;

  @IsOptional() @IsString()
  aplicaTalla?: string;

  @IsOptional() @IsString()
  aplicaColor?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  selectedTags?: string[];

  @IsOptional() @IsNumber()
  costo?: number;

  @IsOptional() @IsNumber()
  costoUltimo?: number;

  @IsOptional() @IsNumber()
  costoI?: number;

  @IsOptional() @IsBoolean()
  promocionActiva?: boolean;

  @IsOptional() @IsNumber()
  promocionDescuentoPct?: number;

  @IsOptional() @IsNumber()
  promocionDescuentoValor?: number;

  @IsOptional() @IsString()
  promocionFechaLimite?: string;

  @IsOptional()
  precios?: any;

  @IsOptional() @IsString()
  observacion?: string;

  @IsOptional() @IsBoolean()
  liquidarIva?: boolean;

  @IsOptional() @IsBoolean()
  productoExentoIva?: boolean;

  @IsOptional() @IsArray() @IsString({ each: true })
  appliedTaxIds?: string[];

  @IsOptional()
  documentos?: any;

  @IsOptional()
  costeo?: any;

  // Web / Digital
  @IsOptional() @IsBoolean()
  esDigital?: boolean;

  @IsOptional() @IsString()
  nombreWeb?: string;

  @IsOptional()
  imagenes?: any;

  @IsOptional() @IsString()
  etiquetaSeo?: string;

  @IsOptional() @IsString()
  metaDescripcion?: string;

  @IsOptional() @IsInt()
  ordenMostrar?: number;

  @IsOptional() @IsString()
  urlDescarga?: string;
}
