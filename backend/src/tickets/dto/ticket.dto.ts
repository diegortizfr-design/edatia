import {
  IsString, IsOptional, IsEnum, IsInt, IsBoolean, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ESTADOS   = ['NUEVO', 'SAC', 'DESARROLLO', 'DEVUELTO', 'RESUELTO', 'CALIFICADO'] as const;
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] as const;
const CATEGORIAS  = ['BUG', 'MEJORA', 'CONSULTA', 'CONFIGURACION'] as const;
const ORIGENES    = ['CHAT', 'TICKET_DIRECTO'] as const;

export class CreateTicketDto {
  @ApiProperty() @IsInt()
  clienteId!: number;

  @ApiPropertyOptional({ enum: ORIGENES })
  @IsOptional() @IsEnum(ORIGENES)
  origen?: string;

  @ApiProperty() @IsString() @MinLength(3)
  asunto!: string;

  @ApiProperty() @IsString() @MinLength(5)
  descripcion!: string;

  @ApiPropertyOptional({ enum: PRIORIDADES })
  @IsOptional() @IsEnum(PRIORIDADES)
  prioridad?: string;

  @ApiPropertyOptional({ enum: CATEGORIAS })
  @IsOptional() @IsEnum(CATEGORIAS)
  categoria?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt()
  asesorSacId?: number;
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: ESTADOS })
  @IsOptional() @IsEnum(ESTADOS)
  estado?: string;

  @ApiPropertyOptional({ enum: PRIORIDADES })
  @IsOptional() @IsEnum(PRIORIDADES)
  prioridad?: string;

  @ApiPropertyOptional({ enum: CATEGORIAS })
  @IsOptional() @IsEnum(CATEGORIAS)
  categoria?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt()
  asesorSacId?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt()
  desarrolladorId?: number;

  @ApiPropertyOptional() @IsOptional() @IsString()
  asunto?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  descripcion?: string;
}

export class CalificarTicketDto {
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt()
  calificacion!: number;
}

export class CreateMensajeDto {
  @ApiProperty() @IsString() @MinLength(1)
  contenido!: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  interno?: boolean;
}
