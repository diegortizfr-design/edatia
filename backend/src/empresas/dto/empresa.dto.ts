import { IsString, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty({ example: '900123456-7', description: 'NIT de la empresa (único)' })
  @IsString()
  @MinLength(5)
  nit: string;

  @ApiProperty({ example: 'Empresa SAS' })
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiPropertyOptional({ example: 'Calle 123 # 45-67, Bogotá' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  @Matches(/^[\d\s\+\-\(\)]{7,20}$/, { message: 'Teléfono inválido' })
  telefono?: string;
}

export class UpdateEmpresaDto {
  @ApiPropertyOptional({ example: 'Empresa Actualizada SAS' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Nueva dirección' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: '+57 301 987 6543' })
  @IsOptional()
  @IsString()
  @Matches(/^[\d\s\+\-\(\)]{7,20}$/, { message: 'Teléfono inválido' })
  telefono?: string;
}
