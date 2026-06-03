import { IsString, IsOptional } from 'class-validator';

export class CerrarPeriodoDto {
  @IsString()
  @IsOptional()
  observaciones?: string;
}
