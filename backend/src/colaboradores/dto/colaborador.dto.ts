import {
  IsString, IsEmail, IsOptional, IsEnum,
  MinLength, IsInt, IsDateString, IsNumber,
  IsArray, IsPositive, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateColaboradorDto {
  // ── Acceso al sistema ──────────────────────────────────────
  @ApiProperty({ example: 'juan@edatia.com', description: 'Correo corporativo = login' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'MiPassword#2026!',
    description: 'Mínimo 12 caracteres, debe incluir mayúscula, minúscula, número y carácter especial',
  })
  @IsString()
  @MinLength(12, { message: 'La contraseña debe tener mínimo 12 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_\-]).{12,}$/, {
    message: 'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&.#_-)',
  })
  password!: string;

  @ApiProperty({ enum: ['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'] })
  @IsEnum(['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'])
  rol!: string;

  // ── Datos personales ───────────────────────────────────────
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiPropertyOptional({ enum: ['CC', 'CE', 'Pasaporte', 'NIT'] })
  @IsOptional() @IsString()
  tipoDocumento?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  numeroDocumento?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional() @IsDateString()
  fechaNacimiento?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  sexo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  nacionalidad?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  estadoCivil?: string;

  // ── Información de contacto ────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  telefonoPersonal?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  emailPersonal?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  ciudad?: string;

  @ApiPropertyOptional({ default: 'Colombia' })
  @IsOptional() @IsString()
  pais?: string;

  // ── Información laboral ────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cargo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tipoContrato?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  fechaIngreso?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber() @IsPositive()
  salario?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  jornadaLaboral?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  jefeDirecto?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  telefonoCorporativo?: string;

  // ── Formación académica ────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  nivelEducativo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  titulo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  institucion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anoGraduacion?: number;

  // ── Experiencia laboral ────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  empresaAnterior?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cargoAnterior?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tiempoTrabajado?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  funcionesAnteriores?: string;

  // ── Habilidades ────────────────────────────────────────────
  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray()
  habilidadesTecnicas?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray()
  habilidadesBlandas?: string[];

  @ApiPropertyOptional({ description: '[{idioma: string, nivel: string}]' })
  @IsOptional()
  idiomas?: { idioma: string; nivel: string }[];

  // ── Seguridad social ───────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  eps?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  fondoPension?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  arl?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cajaCompensacion?: string;

  // ── Información financiera ─────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  banco?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tipoCuenta?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  numeroCuenta?: string;

  // ── Contacto de emergencia ─────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  emergenciaNombre?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  emergenciaRelacion?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  emergenciaTelefono?: string;

  // ── Documentación ─────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cedulaArchivo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  hojaVidaArchivo?: string;

  // ── Asignación de perfil ───────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  perfilCargoId?: number;
}

export class UpdateColaboradorDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'])
  rol?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  perfilCargoId?: number;

  @ApiPropertyOptional({
    description: 'Mínimo 12 caracteres, mayúscula, minúscula, número y carácter especial',
  })
  @IsOptional()
  @IsString()
  @MinLength(12, { message: 'La contraseña debe tener mínimo 12 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_\-]).{12,}$/, {
    message: 'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&.#_-)',
  })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tipoDocumento?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  numeroDocumento?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  fechaNacimiento?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  sexo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  nacionalidad?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  estadoCivil?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  telefonoPersonal?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  emailPersonal?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  ciudad?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  pais?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cargo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tipoContrato?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  fechaIngreso?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber() @IsPositive()
  salario?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  jornadaLaboral?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  jefeDirecto?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  telefonoCorporativo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  nivelEducativo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  titulo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  institucion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anoGraduacion?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  empresaAnterior?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cargoAnterior?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tiempoTrabajado?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  funcionesAnteriores?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray()
  habilidadesTecnicas?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray()
  habilidadesBlandas?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  idiomas?: { idioma: string; nivel: string }[];

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  eps?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  fondoPension?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  arl?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cajaCompensacion?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  banco?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tipoCuenta?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  numeroCuenta?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  emergenciaNombre?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  emergenciaRelacion?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  emergenciaTelefono?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cedulaArchivo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  hojaVidaArchivo?: string;
}
