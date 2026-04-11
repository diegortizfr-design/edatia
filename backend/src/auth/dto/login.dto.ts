import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'usuario@empresa.com', description: 'Email o nombre de usuario' })
  @IsString()
  @MinLength(3)
  identifier!: string;

  @ApiProperty({ example: 'MiPassword123!' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener mínimo 6 caracteres' })
  password!: string;
}
