import { IsString, IsOptional, IsEmail, IsEnum, IsInt, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty({ example: '900123456-7' })
  @IsString()
  @MinLength(5)
  nit!: string;

  @ApiProperty({ example: 'Distribuidora XYZ SAS' })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contacto?: string;

  @ApiPropertyOptional({ enum: ['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'] })
  @IsOptional()
  @IsEnum(['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'])
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  planBaseId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  asesorId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class UpdateClienteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contacto?: string;

  @ApiPropertyOptional({ enum: ['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'] })
  @IsOptional()
  @IsEnum(['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'])
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  planBaseId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  asesorId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class AsignarModuloDto {
  @ApiProperty()
  @IsInt()
  moduloId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  precioNegociado?: number;
}
