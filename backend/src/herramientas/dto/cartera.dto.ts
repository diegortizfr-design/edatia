import { IsEmail, IsString, IsNotEmpty, IsArray } from 'class-validator';

export class GuardarCarteraDto {
  @IsEmail()
  correo: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsArray()
  datosJson: any[];
}

export class RecuperarCarteraDto {
  @IsEmail()
  correo: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
