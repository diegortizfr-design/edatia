import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateColorProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateColorProductoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
