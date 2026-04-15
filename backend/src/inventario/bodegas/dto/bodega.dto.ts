import { IsString, IsOptional, IsBoolean, IsIn, MinLength, MaxLength } from 'class-validator';

const TIPOS_BODEGA = ['ALMACEN', 'PUNTO_VENTA', 'TRANSITO', 'DEVOLUCION', 'VIRTUAL'];

export class CreateBodegaDto {
  @IsString() @MinLength(1) @MaxLength(20)
  codigo!: string;

  @IsString() @MinLength(1) @MaxLength(100)
  nombre!: string;

  @IsOptional() @IsIn(TIPOS_BODEGA)
  tipo?: string;

  @IsOptional() @IsString()
  direccion?: string;

  @IsOptional() @IsBoolean()
  esPrincipal?: boolean;
}

export class UpdateBodegaDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(20)
  codigo?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(100)
  nombre?: string;

  @IsOptional() @IsIn(TIPOS_BODEGA)
  tipo?: string;

  @IsOptional() @IsString()
  direccion?: string;

  @IsOptional() @IsBoolean()
  esPrincipal?: boolean;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
