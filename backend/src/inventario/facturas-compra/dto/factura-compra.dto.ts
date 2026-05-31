import { IsString, IsOptional, IsInt, IsNumber, IsDateString, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FacturaCompraItemDto {
  @IsInt()
  productoId!: number;

  @IsNumber() @Min(0.001)
  cantidad!: number;

  @IsNumber() @Min(0)
  costoUnitario!: number;

  @IsNumber() @Min(0)
  subtotal!: number;
}

export class CreateFacturaCompraDto {
  @IsOptional() @IsString()
  prefijoProveedor?: string;

  @IsString()
  consecutivoProveedor!: string;

  @IsInt()
  proveedorId!: number;

  @IsDateString()
  fechaEmision!: string;

  @IsOptional() @IsDateString()
  fechaVencimiento?: string;

  @IsNumber() @Min(0)
  subtotal!: number;

  @IsOptional() @IsNumber() @Min(0)
  descuento?: number;

  @IsOptional() @IsNumber() @Min(0)
  iva?: number;

  @IsNumber() @Min(0)
  total!: number;

  @IsOptional() @IsString()
  xmlAdjunto?: string;

  @IsOptional() @IsString()
  recepcionId?: string;

  @IsOptional() @IsString()
  notas?: string;

  @IsOptional() @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacturaCompraItemDto)
  items?: FacturaCompraItemDto[];
}

export class UpdateFacturaCompraDto {
  @IsOptional() @IsString()
  prefijoProveedor?: string;

  @IsOptional() @IsString()
  consecutivoProveedor?: string;

  @IsOptional() @IsInt()
  proveedorId?: number;

  @IsOptional() @IsDateString()
  fechaEmision?: string;

  @IsOptional() @IsDateString()
  fechaVencimiento?: string;

  @IsOptional() @IsNumber() @Min(0)
  subtotal?: number;

  @IsOptional() @IsNumber() @Min(0)
  descuento?: number;

  @IsOptional() @IsNumber() @Min(0)
  iva?: number;

  @IsOptional() @IsNumber() @Min(0)
  total?: number;

  @IsOptional() @IsString()
  xmlAdjunto?: string;

  @IsOptional() @IsString()
  recepcionId?: string;

  @IsOptional() @IsString()
  notas?: string;
}
