export class CreateSucursalDto {
  codigo: string
  nombre: string
  correo?: string
  direccion: string
  pais?: string
  departamento?: string
  municipio?: string
  codigoDane?: string
  codigoPostal?: string
  estado?: string
}

export class UpdateSucursalDto {
  codigo?: string
  nombre?: string
  correo?: string
  direccion?: string
  pais?: string
  departamento?: string
  municipio?: string
  codigoDane?: string
  codigoPostal?: string
  estado?: string
}

export class DeleteSucursalDto {
  codigoAutorizacion: string
}
