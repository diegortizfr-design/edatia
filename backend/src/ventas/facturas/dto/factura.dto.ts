import { IsString, IsOptional, IsNumber, IsArray, IsDateString, ValidateNested, IsIn, IsBoolean } from 'class-validator'
import { Type } from 'class-transformer'

export class FacturaItemDto {
  @IsNumber() @Type(() => Number) productoId!: number
  @IsString() descripcion!: string
  @IsString() @IsOptional() unidad?: string
  @IsNumber() @Type(() => Number) cantidad!: number
  @IsNumber() @Type(() => Number) precioUnitario!: number
  @IsNumber() @IsOptional() @Type(() => Number) descuentoPct?: number
  @IsIn(['IVA_19', 'IVA_5', 'IVA_0', 'EXCLUIDO']) tipoIva!: string
  @IsNumber() @IsOptional() @Type(() => Number) orden?: number
}

export class CreateFacturaDto {
  @IsNumber() @Type(() => Number) clienteId!: number
  @IsNumber() @Type(() => Number) bodegaId!: number
  @IsNumber() @IsOptional() @Type(() => Number) cotizacionId?: number

  @IsDateString() fecha!: string
  @IsDateString() @IsOptional() fechaVencimiento?: string

  @IsIn(['CONTADO', 'CREDITO']) formaPago!: string
  @IsIn(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA_CREDITO', 'TARJETA_DEBITO'])
  medioPago!: string

  // Retenciones aplicadas por el cliente agente retenedor
  @IsNumber() @IsOptional() @Type(() => Number) retefuente?: number
  @IsNumber() @IsOptional() @Type(() => Number) reteiva?: number
  @IsNumber() @IsOptional() @Type(() => Number) reteica?: number

  @IsArray() @ValidateNested({ each: true }) @Type(() => FacturaItemDto)
  items!: FacturaItemDto[]

  @IsString() @IsOptional() notas?: string

  // Si true, genera CUFE y XML DIAN (requiere resolución activa configurada)
  @IsBoolean() @IsOptional() emitirDian?: boolean
}
