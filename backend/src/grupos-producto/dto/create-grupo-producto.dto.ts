import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateGrupoProductoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsObject()
  @IsOptional()
  contable?: any;
}
