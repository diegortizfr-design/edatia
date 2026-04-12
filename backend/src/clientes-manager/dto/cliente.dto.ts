import {
  IsString, IsOptional, IsEmail, IsEnum, IsInt,
  IsBoolean, IsNumber, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClienteDto {
  // ── Identificación ──────────────────────────────
  @ApiPropertyOptional({ enum: ['NATURAL', 'JURIDICA'] })
  @IsOptional()
  @IsEnum(['NATURAL', 'JURIDICA'])
  tipoPersona?: string;

  @ApiPropertyOptional({ enum: ['NIT', 'CC', 'CE', 'PASAPORTE', 'TI', 'RUT'] })
  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @ApiProperty({ example: '900123456' })
  @IsString()
  @MinLength(5)
  nit!: string;

  @ApiPropertyOptional({ example: '7' })
  @IsOptional()
  @IsString()
  digitoVerificacion?: string;

  @ApiProperty({ example: 'Distribuidora XYZ SAS' })
  @IsString()
  @MinLength(2)
  nombre!: string;

  // ── Ubicación ────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pais?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departamento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoPostal?: string;

  // ── Contacto ─────────────────────────────────────
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
  telefonoAlternativo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paginaWeb?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contacto?: string;

  // ── Comercial ────────────────────────────────────
  @ApiPropertyOptional({ enum: ['MINORISTA', 'MAYORISTA', 'VIP', 'DISTRIBUIDOR'] })
  @IsOptional()
  @IsString()
  tipoCliente?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  listaPrecios?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cupoCredito?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condicionesPago?: string;

  @ApiPropertyOptional({ enum: ['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'] })
  @IsOptional()
  @IsEnum(['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'])
  estado?: string;

  // ── Tributario ────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  regimenTributario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsabilidadFiscal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actividadEconomica?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  granContribuyente?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autorretenedor?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  agenteRetencion?: boolean;

  // ── Financiero ────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banco?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoCuenta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  numeroCuenta?: string;

  // ── Interno ───────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  segmento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  // ── Relaciones ────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  planBaseId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  asesorId?: number;
}

export class UpdateClienteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  nit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoPersona?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  digitoVerificacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pais?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departamento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoPostal?: string;

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
  telefonoAlternativo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paginaWeb?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contacto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoCliente?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  listaPrecios?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cupoCredito?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condicionesPago?: string;

  @ApiPropertyOptional({ enum: ['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'] })
  @IsOptional()
  @IsEnum(['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'])
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  regimenTributario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsabilidadFiscal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actividadEconomica?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  granContribuyente?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autorretenedor?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  agenteRetencion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banco?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoCuenta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  numeroCuenta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  segmento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  planBaseId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  asesorId?: number;
}

export class AsignarModuloDto {
  @ApiProperty()
  @IsInt()
  moduloId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  precioNegociado?: number;
}
