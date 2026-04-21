import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, MinLength, IsIn } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateClienteDto {
  @IsIn(['NATURAL', 'JURIDICA'])
  tipoPersona: string = 'JURIDICA'

  @IsIn(['NIT', 'CC', 'CE', 'PASAPORTE', 'PEP'])
  tipoDocumento: string = 'NIT'

  @IsString() @MinLength(3)
  numeroDocumento!: string

  @IsString() @IsOptional()
  digitoVerificacion?: string

  @IsString() @MinLength(2)
  nombre!: string

  @IsString() @IsOptional()
  nombreComercial?: string

  @IsString() @IsOptional()
  regimenFiscal?: string

  @IsArray() @IsOptional()
  responsabilidades?: string[]

  @IsString() @IsOptional()
  actividadEconomica?: string

  @IsString() @IsOptional()
  email?: string

  @IsString() @IsOptional()
  telefono?: string

  @IsString() @IsOptional()
  celular?: string

  @IsString() @IsOptional()
  pais?: string

  @IsString() @IsOptional()
  departamento?: string

  @IsString() @IsOptional()
  municipio?: string

  @IsString() @IsOptional()
  codigoDane?: string

  @IsString() @IsOptional()
  codigoPostal?: string

  @IsString() @IsOptional()
  direccion?: string

  @IsNumber() @IsOptional() @Type(() => Number)
  plazoCredito?: number

  @IsNumber() @IsOptional() @Type(() => Number)
  cupoCredito?: number

  @IsNumber() @IsOptional() @Type(() => Number)
  descuentoBase?: number

  @IsBoolean() @IsOptional()
  activo?: boolean

  @IsString() @IsOptional()
  notas?: string
}

export class UpdateClienteDto extends CreateClienteDto {}
