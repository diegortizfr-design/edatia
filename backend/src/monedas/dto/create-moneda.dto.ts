import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateMonedaDto {
  @IsString()
  @Length(3, 3, { message: 'El código ISO 4217 debe tener exactamente 3 caracteres' })
  codigo: string;

  @IsString()
  @Length(1, 100)
  nombre: string;

  @IsString()
  @Length(1, 10)
  simbolo: string;

  @IsOptional()
  @IsNumber({}, { message: 'La tasa de cambio debe ser un número' })
  @Min(0, { message: 'La tasa de cambio no puede ser negativa' })
  tasaCambio?: number;

  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
