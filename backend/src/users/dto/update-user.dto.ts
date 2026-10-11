import { IsString, IsOptional, IsEnum, MinLength, IsEmail, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'juan.perez' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  usuario?: string;

  @ApiPropertyOptional({ example: 'Juan Carlos Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({ example: 'juan@edatia.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string;

  @ApiPropertyOptional({ example: 'Mi biografía profesional' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'MiNuevoPassword123!', description: 'Nueva contraseña (mínimo 6 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ enum: ['admin', 'user', 'manager'], example: 'admin' })
  @IsOptional()
  @IsString()
  rol?: string;
}

export class UpdateUserRolDto {
  @ApiPropertyOptional({ enum: ['admin', 'user', 'manager'], example: 'manager' })
  @IsEnum(['admin', 'user', 'manager'], { message: 'El rol debe ser admin, user o manager' })
  rol!: string;
}
