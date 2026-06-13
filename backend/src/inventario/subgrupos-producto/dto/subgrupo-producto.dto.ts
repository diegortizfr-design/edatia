import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class CreateSubgrupoProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsInt()
  @IsNotEmpty()
  grupoId!: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateSubgrupoProductoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsInt()
  @IsOptional()
  grupoId?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
