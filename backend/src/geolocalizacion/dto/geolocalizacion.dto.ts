import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator'

export class CreatePaisDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsString()
  @IsNotEmpty()
  codigo: string

  @IsString()
  @IsOptional()
  codigoDianExogena?: string

  @IsString()
  @IsOptional()
  indicativoTelefonico?: string
}

export class CreateDepartamentoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsString()
  @IsNotEmpty()
  codigo: string

  @IsInt()
  @IsNotEmpty()
  paisId: number
}

export class CreateCiudadDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsString()
  @IsOptional()
  codigoDian?: string

  @IsInt()
  @IsNotEmpty()
  departamentoId: number
}

export class CreateComunaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsInt()
  @IsNotEmpty()
  ciudadId: number
}

export class CreateBarrioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsInt()
  @IsNotEmpty()
  ciudadId: number

  @IsInt()
  @IsOptional()
  comunaId?: number
}
