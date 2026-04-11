import { IsString, IsOptional, IsArray, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePerfilCargoDto {
  @ApiProperty({ example: 'Asesor Comercial Senior' })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsabilidades?: string;

  @ApiPropertyOptional({ example: 'comercial@edatia.com' })
  @IsOptional()
  @IsString()
  correoPrincipal?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  subcorreos?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  permisos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentoUrl?: string;
}

export class UpdatePerfilCargoDto {
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
  responsabilidades?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correoPrincipal?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  subcorreos?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  permisos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentoUrl?: string;
}
