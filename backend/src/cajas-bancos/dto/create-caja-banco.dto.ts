import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCajaBancoDto {
  @IsString()
  @MaxLength(150)
  nombre: string;

  @IsString()
  @IsIn(['CAJA', 'BANCO'])
  tipo: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  banco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroCuenta?: string;

  @IsOptional()
  @IsString()
  @IsIn(['CORRIENTE', 'AHORRO'])
  tipoCuenta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuentaPUC?: string;

  @IsOptional()
  @IsNumber()
  sucursalId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saldoInicial?: number;
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  controlOrden?: number;

  @IsOptional()
  @IsBoolean()
  aplicaRecibos?: boolean;

  @IsOptional()
  @IsBoolean()
  aplicaPagos?: boolean;

  @IsOptional()
  @IsBoolean()
  aplicaControl?: boolean;

  @IsOptional()
  @IsBoolean()
  restringida?: boolean;
}
