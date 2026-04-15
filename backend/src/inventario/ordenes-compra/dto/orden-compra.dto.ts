import { IsString, IsOptional, IsInt, IsNumber, IsArray, ValidateNested, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrdenCompraItemDto {
  @IsInt()
  productoId!: number;

  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001)
  cantidad!: number;

  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  costoUnitario!: number;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  descuentoPct?: number;
}

export class CreateOrdenCompraDto {
  @IsInt()
  proveedorId!: number;

  @IsInt()
  bodegaId!: number;

  @IsOptional() @IsDateString()
  fechaEsperada?: string;

  @IsOptional() @IsString()
  notas?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrdenCompraItemDto)
  items!: CreateOrdenCompraItemDto[];
}

export class UpdateOrdenCompraDto {
  @IsOptional() @IsInt()
  proveedorId?: number;

  @IsOptional() @IsInt()
  bodegaId?: number;

  @IsOptional() @IsDateString()
  fechaEsperada?: string;

  @IsOptional() @IsString()
  notas?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrdenCompraItemDto)
  items?: CreateOrdenCompraItemDto[];
}

export class RecibirItemDto {
  @IsInt()
  ordenCompraItemId!: number;

  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001)
  cantidadRecibida!: number;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)
  costoUnitario?: number;
}

export class RecibirOrdenCompraDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => RecibirItemDto)
  items!: RecibirItemDto[];

  @IsOptional() @IsString()
  notas?: string;
}
