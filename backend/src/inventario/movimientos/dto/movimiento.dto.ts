import { IsString, IsOptional, IsInt, IsNumber, IsIn, Min, IsArray, IsDateString } from 'class-validator';

const CONCEPTOS_MANUALES = ['AJUSTE_FISICO', 'MERMA', 'OTRO', 'APERTURA', 'PRODUCCION'];

export class EntradaManualDto {
  @IsInt()
  productoId!: number;

  @IsInt()
  bodegaId!: number;

  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001)
  cantidad!: number;

  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  costoUnitario!: number;

  @IsOptional() @IsIn(CONCEPTOS_MANUALES)
  concepto?: string;

  @IsOptional() @IsString()
  notas?: string;

  @IsOptional() @IsString()
  loteNumero?: string;

  @IsOptional() @IsDateString()
  fechaVencimiento?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  seriales?: string[];
}

export class SalidaManualDto {
  @IsInt()
  productoId!: number;

  @IsInt()
  bodegaId!: number;

  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001)
  cantidad!: number;

  @IsOptional() @IsIn(CONCEPTOS_MANUALES)
  concepto?: string;

  @IsOptional() @IsString()
  notas?: string;

  @IsOptional() @IsString()
  loteNumero?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  seriales?: string[];
}

export class AjusteDto {
  @IsInt()
  productoId!: number;

  @IsInt()
  bodegaId!: number;

  /** Puede ser positivo o negativo */
  @IsNumber({ maxDecimalPlaces: 3 })
  cantidad!: number;

  @IsOptional() @IsString()
  notas?: string;

  @IsOptional() @IsString()
  loteNumero?: string;

  @IsOptional() @IsDateString()
  fechaVencimiento?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  seriales?: string[];

  @IsOptional() @IsString()
  motivo?: string;

  @IsOptional() @IsNumber()
  costoUnitario?: number;

  @IsOptional() @IsInt()
  documentoId?: number;
}

export class TrasladoDto {
  @IsInt()
  productoId!: number;

  @IsInt()
  bodegaOrigenId!: number;

  @IsInt()
  bodegaDestinoId!: number;

  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001)
  cantidad!: number;

  @IsOptional() @IsString()
  notas?: string;

  @IsOptional() @IsString()
  loteNumero?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  seriales?: string[];

  @IsOptional() @IsInt()
  documentoId?: number;
}

export class DevolucionProveedorDto {
  @IsInt()
  productoId!: number;

  @IsInt()
  bodegaId!: number;

  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001)
  cantidad!: number;

  @IsOptional() @IsString()
  referenciaId?: string;   // número OC o recepción original

  @IsOptional() @IsString()
  notas?: string;

  @IsOptional() @IsString()
  loteNumero?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  seriales?: string[];
}

export class DevolucionClienteDto {
  @IsInt()
  productoId!: number;

  @IsInt()
  bodegaId!: number;

  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001)
  cantidad!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  costoUnitario?: number;

  @IsOptional() @IsString()
  referenciaId?: string;   // número de factura o documento de venta

  @IsOptional() @IsString()
  notas?: string;
}
