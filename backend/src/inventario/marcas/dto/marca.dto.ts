import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateMarcaDto {
  @IsString() @MinLength(1) @MaxLength(100)
  nombre!: string;
}

export class UpdateMarcaDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100)
  nombre?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
