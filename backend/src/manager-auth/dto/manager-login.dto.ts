import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManagerLoginDto {
  @ApiProperty({ example: 'admin@edatia.com' })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email!: string;

  @ApiProperty({ example: 'Manager123!' })
  @IsString()
  @MinLength(6)
  password!: string;
}
