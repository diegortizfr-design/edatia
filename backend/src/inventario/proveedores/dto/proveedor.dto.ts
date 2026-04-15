import { IsString, IsOptional, IsInt, IsNumber, IsIn, MinLength, MaxLength, Min, IsEmail } from 'class-validator';

export class CreateProveedorDto {
  @IsOptional() @IsIn(['NIT','CC','CE','PASAPORTE'])
  tipoDocumento?: string;

  @IsOptional() @IsString()
  numeroDocumento?: string;

  @IsString() @MinLength(2) @MaxLength(200)
  nombre!: string;

  @IsOptional() @IsString()
  nombreComercial?: string;

  @IsOptional() @IsEmail()
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

  @IsOptional() @IsIn(['CONTADO','30D','60D','90D'])
  condicionesPago?: string;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  descuentoBase?: number;

  @IsOptional() @IsString()
  notas?: string;
}

export class UpdateProveedorDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200)
  nombre?: string;

  @IsOptional() @IsString()
  nombreComercial?: string;

  @IsOptional() @IsEmail()
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

  @IsOptional() @IsIn(['CONTADO','30D','60D','90D'])
  condicionesPago?: string;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  descuentoBase?: number;

  @IsOptional() @IsString()
  notas?: string;

  @IsOptional()
  activo?: boolean;
}
