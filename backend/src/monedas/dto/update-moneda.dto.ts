import { PartialType } from '@nestjs/mapped-types';
import { CreateMonedaDto } from './create-moneda.dto';

export class UpdateMonedaDto extends PartialType(CreateMonedaDto) {}
