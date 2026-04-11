import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan Carlos Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Mi biografía profesional' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'MiNuevoPassword123!', description: 'Nueva contraseña (mínimo 8 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class UpdateUserRolDto {
  @ApiPropertyOptional({ enum: ['admin', 'user', 'manager'], example: 'manager' })
  @IsEnum(['admin', 'user', 'manager'], { message: 'El rol debe ser admin, user o manager' })
  rol!: string;
}
