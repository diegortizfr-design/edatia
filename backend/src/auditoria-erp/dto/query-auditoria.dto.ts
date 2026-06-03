import { IsOptional, IsString, IsNumberString, IsDateString } from 'class-validator';

export class QueryAuditoriaDto {
  @IsOptional()
  @IsString()
  modulo?: string;

  @IsOptional()
  @IsString()
  accion?: string;

  /** Fecha inicio (YYYY-MM-DD) */
  @IsOptional()
  @IsString()
  from?: string;

  /** Fecha fin (YYYY-MM-DD) */
  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;
}
