import { IsString, IsOptional, IsBoolean, IsNumber, IsIn, IsDateString } from 'class-validator'
import { Type } from 'class-transformer'

export class UpsertConfigDianDto {
  @IsIn(['PRUEBAS', 'PRODUCCION'])
  ambiente!: string

  @IsString() @IsOptional() softwareId?: string
  @IsString() @IsOptional() softwarePin?: string
  @IsString() @IsOptional() certificadoPath?: string
  @IsString() @IsOptional() certificadoPass?: string
  @IsString() @IsOptional() proveedorTec?: string
  @IsString() @IsOptional() proveedorApiKey?: string
  @IsString() @IsOptional() proveedorUrl?: string
  @IsBoolean() @IsOptional() activo?: boolean
}

export class CreateResolucionDto {
  @IsString() @IsOptional() tipoDocumento?: string
  @IsString() prefijo!: string
  @IsNumber() @Type(() => Number) numeroInicial!: number
  @IsNumber() @Type(() => Number) numeroFinal!: number
  @IsDateString() fechaResolucion!: string
  @IsDateString() fechaVigencia!: string
  @IsString() numeroResolucion!: string
  @IsString() claveTecnica!: string
}
