import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator'

export class CreateSucursalDto {
  @IsString()
  @IsNotEmpty()
  codigo: string

  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsString()
  @IsEmail()
  @IsOptional()
  correo?: string

  @IsString()
  @IsNotEmpty()
  direccion: string

  @IsString()
  @IsOptional()
  pais?: string

  @IsString()
  @IsOptional()
  departamento?: string

  @IsString()
  @IsOptional()
  municipio?: string

  @IsString()
  @IsOptional()
  codigoDane?: string

  @IsString()
  @IsOptional()
  codigoPostal?: string

  @IsString()
  @IsOptional()
  estado?: string
}

export class UpdateSucursalDto {
  @IsString()
  @IsOptional()
  codigo?: string

  @IsString()
  @IsOptional()
  nombre?: string

  @IsString()
  @IsEmail()
  @IsOptional()
  correo?: string

  @IsString()
  @IsOptional()
  direccion?: string

  @IsString()
  @IsOptional()
  pais?: string

  @IsString()
  @IsOptional()
  departamento?: string

  @IsString()
  @IsOptional()
  municipio?: string

  @IsString()
  @IsOptional()
  codigoDane?: string

  @IsString()
  @IsOptional()
  codigoPostal?: string

  @IsString()
  @IsOptional()
  estado?: string
}

export class DeleteSucursalDto {
  @IsString()
  @IsNotEmpty()
  codigoAutorizacion: string
}

