import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateCierreDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['DIARIO', 'MENSUAL', 'ANUAL'])
  tipo: string;

  @IsString()
  @IsNotEmpty()
  periodo: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
