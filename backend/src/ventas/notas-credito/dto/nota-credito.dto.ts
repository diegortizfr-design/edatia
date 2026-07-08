import { IsString, IsOptional, IsNumber, IsArray, IsIn, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class NotaCreditoItemDto {
  @IsNumber() @IsOptional() @Type(() => Number) productoId?: number
  @IsString() descripcion!: string
  @IsNumber() @Type(() => Number) cantidad!: number
  @IsNumber() @Type(() => Number) precioUnitario!: number
  @IsIn(['IVA_19', 'IVA_5', 'IVA_0', 'EXCLUIDO']) tipoIva!: string
}

export class CreateNotaCreditoDto {
  @IsNumber() @IsOptional() @Type(() => Number) facturaId?: number

  @IsNumber() @IsOptional() @Type(() => Number) clienteId?: number

  @IsNumber() @IsOptional() @Type(() => Number) bodegaId?: number

  @IsString() @IsOptional() numero?: string

  @IsIn(['DEVOLUCION', 'DESCUENTO', 'ANULACION', 'OTRO'])
  motivo!: string

  @IsString() descripcion!: string

  @IsArray() @ValidateNested({ each: true }) @Type(() => NotaCreditoItemDto)
  items!: NotaCreditoItemDto[]

  @IsString() @IsOptional() notas?: string
}
