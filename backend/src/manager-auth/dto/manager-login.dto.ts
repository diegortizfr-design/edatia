import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManagerLoginDto {
  @ApiProperty({ example: 'admin@edatia.com' })
  @IsString()
  identifier!: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @MinLength(6)
  password!: string;
}
