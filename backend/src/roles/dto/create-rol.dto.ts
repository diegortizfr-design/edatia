import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRolDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres.' })
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descripción no puede superar los 500 caracteres.' })
  descripcion?: string;

  @IsArray({ message: 'Los permisos deben ser un arreglo de cadenas.' })
  @ArrayNotEmpty({ message: 'El arreglo de permisos no puede estar vacío.' })
  @IsString({ each: true, message: 'Cada permiso debe ser una cadena de texto.' })
  @Matches(/^[a-z_]+\.[a-z_]+$/, {
    each: true,
    message:
      "Cada permiso debe tener el formato 'modulo.accion' (ej. 'ventas.crear').",
  })
  permisos: string[];

  @IsOptional()
  @IsBoolean({ message: 'esAdmin debe ser un valor booleano.' })
  esAdmin?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'activo debe ser un valor booleano.' })
  activo?: boolean;
}
