export class CreateDocumentoConfigDto {
  nombre: string
  sigla: string
  prefijo: string
  tipoOperacion: string
  plantillaImpresion?: string
  esElectronico?: boolean
  estado?: string
  consecutivoInicial?: number
  consecutivoSiguiente?: number
  resolucionDian?: string
  fechaResolucion?: string
  vigenciaMeses?: number
  rangoDesde?: number
  rangoHasta?: number
}

export class UpdateDocumentoConfigDto {
  nombre?: string
  prefijo?: string
  tipoOperacion?: string
  plantillaImpresion?: string
  esElectronico?: boolean
  estado?: string
  consecutivoSiguiente?: number
  resolucionDian?: string
  fechaResolucion?: string
  vigenciaMeses?: number
  rangoDesde?: number
  rangoHasta?: number
}

export class DeleteDocumentoConfigDto {
  codigoAutorizacion: string
}
