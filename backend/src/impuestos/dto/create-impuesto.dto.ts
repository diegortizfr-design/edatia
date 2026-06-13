import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateImpuestoDto {
  @IsString()
  nombre: string;

  @IsString()
  tipo: string; // IVA | RETEFUENTE | RETEIVA | RETEICA | OTRO

  @IsNumber()
  tarifa: number;

  @IsOptional()
  @IsString()
  cuentaDebito?: string;

  @IsOptional()
  @IsString()
  cuentaCredito?: string;

  @IsOptional()
  @IsString()
  aplica?: string; // VENTA | COMPRA | AMBOS

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  esDefecto?: boolean;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsString()
  codigo?: string;
}
