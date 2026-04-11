import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColaboradorDto, UpdateColaboradorDto } from './dto/colaborador.dto';

// Campos de selección pública (sin password)
const SELECT_PUBLIC = {
  id: true,
  email: true,
  nombre: true,
  rol: true,
  activo: true,
  createdAt: true,
  perfilCargoId: true,
  perfilCargo: { select: { id: true, nombre: true } },
  cargo: true,
  area: true,
  telefonoCorporativo: true,
};

// Campos completos para el detalle de un colaborador
const SELECT_FULL = {
  id: true,
  email: true,
  nombre: true,
  rol: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
  perfilCargoId: true,
  perfilCargo: true,
  // Datos personales
  tipoDocumento: true,
  numeroDocumento: true,
  fechaNacimiento: true,
  sexo: true,
  nacionalidad: true,
  estadoCivil: true,
  // Contacto
  telefonoPersonal: true,
  emailPersonal: true,
  direccion: true,
  ciudad: true,
  pais: true,
  // Laboral
  cargo: true,
  area: true,
  tipoContrato: true,
  fechaIngreso: true,
  salario: true,
  jornadaLaboral: true,
  jefeDirecto: true,
  telefonoCorporativo: true,
  // Formación
  nivelEducativo: true,
  titulo: true,
  institucion: true,
  anoGraduacion: true,
  // Experiencia
  empresaAnterior: true,
  cargoAnterior: true,
  tiempoTrabajado: true,
  funcionesAnteriores: true,
  // Habilidades
  habilidadesTecnicas: true,
  habilidadesBlandas: true,
  idiomas: true,
  // Seguridad social
  eps: true,
  fondoPension: true,
  arl: true,
  cajaCompensacion: true,
  // Financiero
  banco: true,
  tipoCuenta: true,
  numeroCuenta: true,
  // Emergencia
  emergenciaNombre: true,
  emergenciaRelacion: true,
  emergenciaTelefono: true,
  // Documentación
  cedulaArchivo: true,
  hojaVidaArchivo: true,
};

@Injectable()
export class ColaboradoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return (this.prisma as any).colaborador.findMany({
      select: SELECT_PUBLIC,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const colaborador = await (this.prisma as any).colaborador.findUnique({
      where: { id },
      select: SELECT_FULL,
    });

    if (!colaborador) {
      throw new NotFoundException(`Colaborador #${id} no encontrado`);
    }

    // Convertir Decimal a number
    return {
      ...colaborador,
      salario: colaborador.salario !== null ? Number(colaborador.salario) : null,
    };
  }

  async create(dto: CreateColaboradorDto) {
    const existing = await (this.prisma as any).colaborador.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Ya existe un colaborador con ese email');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const colaborador = await (this.prisma as any).colaborador.create({
      data: {
        // Sistema
        email: dto.email,
        password: hashedPassword,
        rol: dto.rol,
        nombre: dto.nombre,
        // Datos personales
        tipoDocumento: dto.tipoDocumento,
        numeroDocumento: dto.numeroDocumento,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
        sexo: dto.sexo,
        nacionalidad: dto.nacionalidad,
        estadoCivil: dto.estadoCivil,
        // Contacto
        telefonoPersonal: dto.telefonoPersonal,
        emailPersonal: dto.emailPersonal,
        direccion: dto.direccion,
        ciudad: dto.ciudad,
        pais: dto.pais ?? 'Colombia',
        // Laboral
        cargo: dto.cargo,
        area: dto.area,
        tipoContrato: dto.tipoContrato,
        fechaIngreso: dto.fechaIngreso ? new Date(dto.fechaIngreso) : undefined,
        salario: dto.salario,
        jornadaLaboral: dto.jornadaLaboral,
        jefeDirecto: dto.jefeDirecto,
        telefonoCorporativo: dto.telefonoCorporativo,
        // Formación
        nivelEducativo: dto.nivelEducativo,
        titulo: dto.titulo,
        institucion: dto.institucion,
        anoGraduacion: dto.anoGraduacion,
        // Experiencia
        empresaAnterior: dto.empresaAnterior,
        cargoAnterior: dto.cargoAnterior,
        tiempoTrabajado: dto.tiempoTrabajado,
        funcionesAnteriores: dto.funcionesAnteriores,
        // Habilidades
        habilidadesTecnicas: dto.habilidadesTecnicas ?? [],
        habilidadesBlandas: dto.habilidadesBlandas ?? [],
        idiomas: dto.idiomas ?? [],
        // Seguridad social
        eps: dto.eps,
        fondoPension: dto.fondoPension,
        arl: dto.arl,
        cajaCompensacion: dto.cajaCompensacion,
        // Financiero
        banco: dto.banco,
        tipoCuenta: dto.tipoCuenta,
        numeroCuenta: dto.numeroCuenta,
        // Emergencia
        emergenciaNombre: dto.emergenciaNombre,
        emergenciaRelacion: dto.emergenciaRelacion,
        emergenciaTelefono: dto.emergenciaTelefono,
        // Documentación
        cedulaArchivo: dto.cedulaArchivo,
        hojaVidaArchivo: dto.hojaVidaArchivo,
        // Perfil
        perfilCargoId: dto.perfilCargoId,
      },
      select: SELECT_PUBLIC,
    });

    return colaborador;
  }

  async update(id: number, dto: UpdateColaboradorDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};

    // Solo incluir campos que vienen en el DTO
    const fields: (keyof UpdateColaboradorDto)[] = [
      'nombre', 'rol', 'perfilCargoId',
      'tipoDocumento', 'numeroDocumento', 'sexo', 'nacionalidad', 'estadoCivil',
      'telefonoPersonal', 'emailPersonal', 'direccion', 'ciudad', 'pais',
      'cargo', 'area', 'tipoContrato', 'salario', 'jornadaLaboral', 'jefeDirecto', 'telefonoCorporativo',
      'nivelEducativo', 'titulo', 'institucion', 'anoGraduacion',
      'empresaAnterior', 'cargoAnterior', 'tiempoTrabajado', 'funcionesAnteriores',
      'habilidadesTecnicas', 'habilidadesBlandas', 'idiomas',
      'eps', 'fondoPension', 'arl', 'cajaCompensacion',
      'banco', 'tipoCuenta', 'numeroCuenta',
      'emergenciaNombre', 'emergenciaRelacion', 'emergenciaTelefono',
      'cedulaArchivo', 'hojaVidaArchivo',
    ];

    for (const field of fields) {
      if (dto[field] !== undefined) {
        data[field] = dto[field];
      }
    }

    if (dto.fechaNacimiento !== undefined) {
      data.fechaNacimiento = dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null;
    }
    if (dto.fechaIngreso !== undefined) {
      data.fechaIngreso = dto.fechaIngreso ? new Date(dto.fechaIngreso) : null;
    }
    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const result = await (this.prisma as any).colaborador.update({
      where: { id },
      data,
      select: SELECT_FULL,
    });

    return {
      ...result,
      salario: result.salario !== null ? Number(result.salario) : null,
    };
  }

  async toggleActivo(id: number) {
    const colaborador = await this.findOne(id);
    return (this.prisma as any).colaborador.update({
      where: { id },
      data: { activo: !colaborador.activo },
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
    });
  }

  async transferir(id: number, nuevoPerfilCargoId: number) {
    await this.findOne(id);
    return (this.prisma as any).colaborador.update({
      where: { id },
      data: { perfilCargoId: nuevoPerfilCargoId },
      select: SELECT_PUBLIC,
    });
  }

  async stats() {
    const total = await (this.prisma as any).colaborador.count();
    const porRolRaw = await (this.prisma as any).colaborador.groupBy({
      by: ['rol'],
      _count: { rol: true },
    });
    const porRol: Record<string, number> = {
      ADMIN: 0, COMERCIAL: 0, COORDINACION: 0, OPERACION: 0,
    };
    for (const item of porRolRaw) {
      porRol[item.rol] = item._count.rol;
    }
    const activos = await (this.prisma as any).colaborador.count({ where: { activo: true } });
    return { total, activos, porRol };
  }
}
