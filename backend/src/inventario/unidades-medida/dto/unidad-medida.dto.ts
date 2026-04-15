import { IsString, IsOptional, IsBoolean, IsNumber, IsIn, MinLength, MaxLength, Min } from 'class-validator';

const TIPOS = ['UNIDAD', 'PESO', 'VOLUMEN', 'LONGITUD'];

export class CreateUnidadMedidaDto {
  @IsString() @MinLength(1) @MaxLength(60)
  nombre!: string;

  @IsString() @MinLength(1) @MaxLength(10)
  abreviatura!: string;

  @IsOptional() @IsIn(TIPOS)
  tipo?: string;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 6 }) @Min(0.000001)
  factorBase?: number;
}

export class UpdateUnidadMedidaDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(60)
  nombre?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(10)
  abreviatura?: string;

  @IsOptional() @IsIn(TIPOS)
  tipo?: string;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 6 }) @Min(0.000001)
  factorBase?: number;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
