import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum TipoNotificacion {
  ALERTA = 'ALERTA',
  INFO = 'INFO',
  ADVERTENCIA = 'ADVERTENCIA',
  ERROR = 'ERROR',
}

export class CreateNotificacionDto {
  @IsEnum(TipoNotificacion, {
    message: 'tipo debe ser uno de: ALERTA, INFO, ADVERTENCIA, ERROR',
  })
  @IsNotEmpty()
  tipo: TipoNotificacion;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titulo: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  modulo?: string;

  @IsNumber()
  @IsOptional()
  usuarioId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  accionUrl?: string;
}
