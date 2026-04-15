import { IsString, IsOptional, IsInt, IsNumber, IsIn, Min } from 'class-validator';

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
}
