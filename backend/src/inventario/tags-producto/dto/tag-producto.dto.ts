import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateTagProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateTagProductoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
