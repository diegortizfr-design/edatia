import { IsString, IsOptional, IsInt, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateCategoriaDto {
  @IsString() @MinLength(2) @MaxLength(100)
  nombre!: string;

  @IsString() @MinLength(2) @MaxLength(100)
  slug!: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsInt()
  parentId?: number;
}

export class UpdateCategoriaDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
  nombre?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
  slug?: string;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsInt()
  parentId?: number | null;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
