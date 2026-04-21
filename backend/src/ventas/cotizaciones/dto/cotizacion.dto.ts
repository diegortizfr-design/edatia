import { IsString, IsOptional, IsNumber, IsArray, IsDateString, ValidateNested, IsIn } from 'class-validator'
import { Type } from 'class-transformer'

export class CotizacionItemDto {
  @IsNumber() @Type(() => Number) productoId!: number
  @IsString() descripcion!: string
  @IsString() @IsOptional() unidad?: string
  @IsNumber() @Type(() => Number) cantidad!: number
  @IsNumber() @Type(() => Number) precioUnitario!: number
  @IsNumber() @IsOptional() @Type(() => Number) descuentoPct?: number
  @IsIn(['IVA_19', 'IVA_5', 'IVA_0', 'EXCLUIDO']) tipoIva!: string
  @IsNumber() @IsOptional() @Type(() => Number) orden?: number
}

export class CreateCotizacionDto {
  @IsNumber() @Type(() => Number) clienteId!: number
  @IsNumber() @Type(() => Number) bodegaId!: number
  @IsDateString() fecha!: string
  @IsDateString() fechaVencimiento!: string

  @IsArray() @ValidateNested({ each: true }) @Type(() => CotizacionItemDto)
  items!: CotizacionItemDto[]

  @IsString() @IsOptional() notas?: string
  @IsString() @IsOptional() condicionesPago?: string
}

export class UpdateCotizacionDto {
  @IsString() @IsOptional() estado?: string
  @IsString() @IsOptional() notas?: string
  @IsString() @IsOptional() condicionesPago?: string
  @IsDateString() @IsOptional() fechaVencimiento?: string
}
