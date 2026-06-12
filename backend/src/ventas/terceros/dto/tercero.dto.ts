import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, MinLength, IsIn, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateTerceroDto {
  @IsOptional() @IsIn(['NATURAL', 'JURIDICA'])
  tipoPersona?: string = 'JURIDICA'

  @IsOptional() @IsIn(['NIT', 'CC', 'CE', 'PASAPORTE', 'PEP'])
  tipoDocumento?: string = 'NIT'

  @IsString() @MinLength(3)
  numeroDocumento!: string

  @IsString() @IsOptional()
  digitoVerificacion?: string

  @IsString() @MinLength(2)
  nombre!: string

  @IsString() @IsOptional()
  nombreComercial?: string

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

  // Roles Flags
  @IsBoolean() @IsOptional()
  esCliente?: boolean

  @IsBoolean() @IsOptional()
  esProveedor?: boolean

  @IsBoolean() @IsOptional()
  esColaborador?: boolean

  @IsBoolean() @IsOptional()
  esVendedor?: boolean

  // Client Specific Fields
  @IsNumber() @IsOptional() @Type(() => Number)
  plazoCredito?: number

  @IsNumber() @IsOptional() @Type(() => Number)
  cupoCredito?: number

  @IsNumber() @IsOptional() @Type(() => Number)
  descuentoCliente?: number

  @IsNumber() @IsOptional() @Type(() => Number)
  vendedorAsignadoId?: number

  // Supplier Specific Fields
  @IsString() @IsOptional()
  contactoNombre?: string

  @IsInt() @IsOptional() @Min(0) @Type(() => Number)
  plazoEntregaDias?: number

  @IsString() @IsOptional()
  condicionesPago?: string

  @IsNumber() @IsOptional() @Type(() => Number)
  descuentoProveedor?: number

  @IsString() @IsOptional()
  monedaProveedor?: string

  // Salesperson/Collaborator Specific Fields
  @IsNumber() @IsOptional() @Type(() => Number)
  comisionPct?: number

  @IsBoolean() @IsOptional()
  activo?: boolean

  @IsString() @IsOptional()
  notas?: string

  // Sucursales Table Nested Write
  @IsArray() @IsOptional()
  sucursales?: any[]

  // Tributario DIAN
  @IsString() @IsOptional()
  regimenFiscal?: string

  @IsArray() @IsOptional()
  responsabilidades?: string[]

  @IsString() @IsOptional()
  actividadEconomica?: string
}

export class UpdateTerceroDto extends CreateTerceroDto {}
