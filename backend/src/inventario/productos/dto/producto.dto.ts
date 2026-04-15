import {
  IsString, IsOptional, IsBoolean, IsNumber, IsInt, IsIn,
  MinLength, MaxLength, Min,
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
}
