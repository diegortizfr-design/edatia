import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateTallaProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateTallaProductoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
