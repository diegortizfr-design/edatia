import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt } from 'class-validator'

export class CreateDocumentoConfigDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsString()
  @IsNotEmpty()
  sigla: string

  @IsString()
  @IsNotEmpty()
  prefijo: string

  @IsString()
  @IsNotEmpty()
  tipoOperacion: string

  @IsString()
  @IsOptional()
  plantillaImpresion?: string

  @IsBoolean()
  @IsOptional()
  esElectronico?: boolean

  @IsString()
  @IsOptional()
  estado?: string

  @IsInt()
  @IsOptional()
  consecutivoInicial?: number

  @IsInt()
  @IsOptional()
  consecutivoSiguiente?: number

  @IsString()
  @IsOptional()
  resolucionDian?: string

  @IsString()
  @IsOptional()
  fechaResolucion?: string

  @IsInt()
  @IsOptional()
  vigenciaMeses?: number

  @IsInt()
  @IsOptional()
  rangoDesde?: number

  @IsInt()
  @IsOptional()
  rangoHasta?: number

  @IsInt()
  @IsOptional()
  sucursalId?: number
}

export class UpdateDocumentoConfigDto {
  @IsString()
  @IsOptional()
  nombre?: string

  @IsString()
  @IsOptional()
  prefijo?: string

  @IsString()
  @IsOptional()
  tipoOperacion?: string

  @IsString()
  @IsOptional()
  plantillaImpresion?: string

  @IsBoolean()
  @IsOptional()
  esElectronico?: boolean

  @IsString()
  @IsOptional()
  estado?: string

  @IsInt()
  @IsOptional()
  consecutivoSiguiente?: number

  @IsString()
  @IsOptional()
  resolucionDian?: string

  @IsString()
  @IsOptional()
  fechaResolucion?: string

  @IsInt()
  @IsOptional()
  vigenciaMeses?: number

  @IsInt()
  @IsOptional()
  rangoDesde?: number

  @IsInt()
  @IsOptional()
  rangoHasta?: number

  @IsInt()
  @IsOptional()
  sucursalId?: number
}

export class DeleteDocumentoConfigDto {
  @IsString()
  @IsNotEmpty()
  codigoAutorizacion: string
}
