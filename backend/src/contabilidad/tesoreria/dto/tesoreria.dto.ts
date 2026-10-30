import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateEgresoDto {
  @IsOptional()
  @IsNumber()
  documentoConfigId?: number;

  @IsNotEmpty()
  @IsString()
  fecha: string;

  @IsOptional()
  @IsNumber()
  terceroId?: number;

  @IsOptional()
  @IsString()
  beneficiarioNombre?: string;

  @IsOptional()
  @IsString()
  beneficiarioDoc?: string;

  @IsNotEmpty()
  @IsString()
  categoriaGasto: string; // ARRIENDO | SERVICIOS | HONORARIOS | MANTENIMIENTO | DIVERSOS | CAJA_MENOR | OTRO

  @IsNotEmpty()
  @IsString()
  concepto: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsNotEmpty()
  @IsNumber()
  cuentaGastoId: number;

  @IsOptional()
  @IsNumber()
  cajaBancoId?: number;

  @IsOptional()
  @IsString()
  medioPago?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  monto: number;

  @IsOptional()
  @IsBoolean()
  aplicaRetencion?: boolean;

  @IsOptional()
  @IsNumber()
  tarifaRetencion?: number;

  @IsOptional()
  @IsNumber()
  valorRetencion?: number;

  @IsOptional()
  @IsNumber()
  cuentaRetencionId?: number;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class CreateCajaMenorDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  codigo: string;

  @IsNotEmpty()
  @IsString()
  responsable: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1000)
  montoAsignado: number;

  @IsOptional()
  @IsString()
  cuentaPUC?: string;

  @IsOptional()
  @IsNumber()
  cajaBancoId?: number;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdateCajaMenorDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  responsable?: string;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  montoAsignado?: number;

  @IsOptional()
  @IsString()
  cuentaPUC?: string;

  @IsOptional()
  @IsNumber()
  cajaBancoId?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class CreateGastoCajaMenorDto {
  @IsNotEmpty()
  @IsString()
  fecha: string;

  @IsOptional()
  @IsString()
  numeroRecibo?: string;

  @IsNotEmpty()
  @IsString()
  beneficiario: string;

  @IsOptional()
  @IsString()
  beneficiarioDoc?: string;

  @IsNotEmpty()
  @IsString()
  concepto: string;

  @IsNotEmpty()
  @IsString()
  categoriaGasto: string;

  @IsNotEmpty()
  @IsNumber()
  cuentaGastoId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  valor: number;
}

export class ReembolsoCajaMenorDto {
  @IsOptional()
  @IsString()
  fecha?: string;

  @IsOptional()
  @IsNumber()
  origenCajaBancoId?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

