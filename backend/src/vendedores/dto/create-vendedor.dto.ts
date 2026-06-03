import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

export class CreateVendedorDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  documento?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  comisionPct?: number = 0;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsString()
  @IsOptional()
  notas?: string;
}
