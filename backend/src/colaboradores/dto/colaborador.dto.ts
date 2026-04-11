import { IsString, IsEmail, IsOptional, IsEnum, MinLength, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateColaboradorDto {
  @ApiProperty({ example: 'juan@edatia.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: ['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'] })
  @IsEnum(['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'])
  rol!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  perfilCargoId?: number;
}

export class UpdateColaboradorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'])
  rol?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  perfilCargoId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
