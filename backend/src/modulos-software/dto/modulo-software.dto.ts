import { IsString, IsOptional, IsNumber, IsPositive, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateModuloSoftwareDto {
  @ApiProperty({ example: 'Inventario' })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiProperty({ example: 'inventario' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icono?: string;

  @ApiProperty({ example: 1200000 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  precioAnual!: number;
}

export class UpdateModuloSoftwareDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  precioAnual?: number;
}
