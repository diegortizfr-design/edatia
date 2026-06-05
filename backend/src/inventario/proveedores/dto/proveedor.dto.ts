import { IsString, IsOptional, IsInt, IsNumber, IsIn, MinLength, MaxLength, Min, IsBoolean, IsArray } from 'class-validator';

export class CreateProveedorDto {
  @IsOptional() @IsIn(['NIT','CC','CE','PASAPORTE','PEP'])
  tipoDocumento?: string;

  @IsOptional() @IsString()
  numeroDocumento?: string;

  @IsString() @MinLength(2) @MaxLength(200)
  nombre!: string;

  @IsOptional() @IsString()
  nombreComercial?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  telefono?: string;

  @IsOptional() @IsString()
  contactoNombre?: string;

  @IsOptional() @IsString()
  direccion?: string;

  @IsOptional() @IsString()
  ciudad?: string;

  @IsOptional() @IsString()
  pais?: string;

  @IsOptional() @IsInt() @Min(1)
  plazoEntregaDias?: number;

  @IsOptional() @IsString()
  condicionesPago?: string;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  descuentoBase?: number;

  @IsOptional() @IsString()
  moneda?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;

  @IsOptional() @IsString()
  notas?: string;

  @IsOptional() @IsArray()
  sucursales?: any[];
}

export class UpdateProveedorDto extends CreateProveedorDto {}
