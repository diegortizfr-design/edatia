import { IsEmail, IsString, IsNotEmpty, IsArray } from 'class-validator';

export class GuardarCarteraDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsEmail()
  correo!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsNotEmpty()
  datosJson!: any;
}

export class RecuperarCarteraDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsEmail()
  correo!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
