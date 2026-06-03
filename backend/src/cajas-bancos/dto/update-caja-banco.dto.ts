import { PartialType } from '@nestjs/mapped-types';
import { CreateCajaBancoDto } from './create-caja-banco.dto';

export class UpdateCajaBancoDto extends PartialType(CreateCajaBancoDto) {}
