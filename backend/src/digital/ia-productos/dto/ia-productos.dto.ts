import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';

export class CrearProductoIaDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(1, { message: 'El precio debe ser mayor a 0' })
  precio: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notas?: string;
}

export class RegenerarImagenIaDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2)
  indice: number;

  @IsIn(['ia', 'original'])
  modo: 'ia' | 'original';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  instruccion?: string;
}

export class ActualizarBorradorIaDto {
  @IsOptional()
  @IsString()
  @MaxLength(70)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(130)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  descripcionWeb?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  precio?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoriaId?: number;
}

export class ProcesarImagenEstudioDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class GenerarInfoPublicacionDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class RegistrarCompartidoDto {
  @IsIn(['whatsapp', 'instagram', 'tiktok', 'marketplace'])
  red: 'whatsapp' | 'instagram' | 'tiktok' | 'marketplace';
}

