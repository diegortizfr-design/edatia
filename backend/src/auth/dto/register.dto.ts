import { IsEmail, IsString, MinLength, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@empresa.com' })
  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @ApiProperty({ example: 'jdoe' })
  @IsString()
  @MinLength(3, { message: 'El usuario debe tener mínimo 3 caracteres' })
  usuario!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener mínimo 2 caracteres' })
  nombre!: string;

  @ApiProperty({ example: 'MiPassword123!' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  password!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  empresaId?: number;
}
