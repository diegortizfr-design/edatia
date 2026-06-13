import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateClasificacionContableDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  pucCuenta!: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateClasificacionContableDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  pucCuenta?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
