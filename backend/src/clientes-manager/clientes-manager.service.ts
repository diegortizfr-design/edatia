import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto, AsignarModuloDto } from './dto/cliente.dto';

// Contexto del usuario autenticado pasado desde el controller
export interface UserCtx {
  sub: number;
  rol: string;
}

@Injectable()
export class ClientesManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters?: { estado?: string; asesorId?: number },
    userCtx?: UserCtx,
  ) {
    const where: Record<string, unknown> = {};

    if (filters?.estado) {
      where['estado'] = filters.estado;
    }

    if (userCtx?.rol === 'COMERCIAL') {
      // COMERCIAL solo ve sus propios clientes — no se puede sobrescribir con query param
      where['asesorId'] = userCtx.sub;
    } else if (filters?.asesorId) {
      // ADMIN / COORDINACION / OPERACION pueden filtrar por asesor
      where['asesorId'] = filters.asesorId;
    }

    const clientes = await (this.prisma as any).clienteManager.findMany({
      where,
      include: {
        planBase: true,
        asesor: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        modulosActivos: {
          include: { modulo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clientes.map((c: any) => ({
      ...c,
      planBase: c.planBase
        ? { ...c.planBase, precioBase: Number(c.planBase.precioBase) }
        : null,
      modulosActivos: c.modulosActivos.map((ma: any) => ({
        ...ma,
        precioNegociado: ma.precioNegociado !== null ? Number(ma.precioNegociado) : null,
        modulo: { ...ma.modulo, precioAnual: Number(ma.modulo.precioAnual) },
      })),
    }));
  }

  async findOne(id: number, userCtx?: UserCtx) {
    const cliente = await (this.prisma as any).clienteManager.findUnique({
      where: { id },
      include: {
        planBase: true,
        asesor: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        modulosActivos: {
          include: { modulo: true },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente #${id} no encontrado`);
    }

    // COMERCIAL solo puede ver sus propios clientes
    if (userCtx?.rol === 'COMERCIAL' && cliente.asesorId !== userCtx.sub) {
      throw new ForbiddenException('No tienes acceso a este cliente');
    }

    return {
      ...cliente,
      planBase: cliente.planBase
        ? { ...cliente.planBase, precioBase: Number(cliente.planBase.precioBase) }
        : null,
      modulosActivos: cliente.modulosActivos.map((ma: any) => ({
        ...ma,
        precioNegociado: ma.precioNegociado !== null ? Number(ma.precioNegociado) : null,
        modulo: { ...ma.modulo, precioAnual: Number(ma.modulo.precioAnual) },
      })),
    };
  }

  async create(dto: CreateClienteDto, userCtx?: UserCtx) {
    const existing = await (this.prisma as any).clienteManager.findFirst({
      where: { nit: dto.nit },
    });

    if (existing) {
      throw new ConflictException('Ya existe un cliente con ese NIT');
    }

    const data: Record<string, unknown> = {
      nit: dto.nit,
      nombre: dto.nombre,
      estado: dto.estado ?? 'PROSPECTO',
    };

    // COMERCIAL siempre crea clientes asignados a sí mismo
    if (userCtx?.rol === 'COMERCIAL') {
      data.asesorId = userCtx.sub;
    } else if (dto.asesorId !== undefined) {
      data.asesorId = dto.asesorId;
    }

    // Identificación
    if (dto.tipoPersona !== undefined) data.tipoPersona = dto.tipoPersona;
    if (dto.tipoDocumento !== undefined) data.tipoDocumento = dto.tipoDocumento;
    if (dto.digitoVerificacion !== undefined) data.digitoVerificacion = dto.digitoVerificacion;
    // Ubicación
    if (dto.pais !== undefined) data.pais = dto.pais;
    if (dto.departamento !== undefined) data.departamento = dto.departamento;
    if (dto.ciudad !== undefined) data.ciudad = dto.ciudad;
    if (dto.direccion !== undefined) data.direccion = dto.direccion;
    if (dto.codigoPostal !== undefined) data.codigoPostal = dto.codigoPostal;
    // Contacto
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.telefono !== undefined) data.telefono = dto.telefono;
    if (dto.telefonoAlternativo !== undefined) data.telefonoAlternativo = dto.telefonoAlternativo;
    if (dto.paginaWeb !== undefined) data.paginaWeb = dto.paginaWeb;
    if (dto.contacto !== undefined) data.contacto = dto.contacto;
    // Comercial
    if (dto.tipoCliente !== undefined) data.tipoCliente = dto.tipoCliente;
    if (dto.listaPrecios !== undefined) data.listaPrecios = dto.listaPrecios;
    if (dto.cupoCredito !== undefined) data.cupoCredito = dto.cupoCredito;
    if (dto.condicionesPago !== undefined) data.condicionesPago = dto.condicionesPago;
    // Tributario
    if (dto.regimenTributario !== undefined) data.regimenTributario = dto.regimenTributario;
    if (dto.responsabilidadFiscal !== undefined) data.responsabilidadFiscal = dto.responsabilidadFiscal;
    if (dto.actividadEconomica !== undefined) data.actividadEconomica = dto.actividadEconomica;
    if (dto.granContribuyente !== undefined) data.granContribuyente = dto.granContribuyente;
    if (dto.autorretenedor !== undefined) data.autorretenedor = dto.autorretenedor;
    if (dto.agenteRetencion !== undefined) data.agenteRetencion = dto.agenteRetencion;
    // Financiero
    if (dto.banco !== undefined) data.banco = dto.banco;
    if (dto.tipoCuenta !== undefined) data.tipoCuenta = dto.tipoCuenta;
    if (dto.numeroCuenta !== undefined) data.numeroCuenta = dto.numeroCuenta;
    // Interno
    if (dto.segmento !== undefined) data.segmento = dto.segmento;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;
    // Relaciones (excepto asesorId, ya manejado arriba)
    if (dto.planBaseId !== undefined) data.planBaseId = dto.planBaseId;

    return (this.prisma as any).clienteManager.create({ data });
  }

  async update(id: number, dto: UpdateClienteDto, userCtx?: UserCtx) {
    // findOne ya valida que COMERCIAL solo acceda a sus propios clientes
    await this.findOne(id, userCtx);

    const data: Record<string, unknown> = {};

    // Identificación
    if (dto.nit !== undefined) data.nit = dto.nit;
    if (dto.tipoPersona !== undefined) data.tipoPersona = dto.tipoPersona;
    if (dto.tipoDocumento !== undefined) data.tipoDocumento = dto.tipoDocumento;
    if (dto.digitoVerificacion !== undefined) data.digitoVerificacion = dto.digitoVerificacion;
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    // Ubicación
    if (dto.pais !== undefined) data.pais = dto.pais;
    if (dto.departamento !== undefined) data.departamento = dto.departamento;
    if (dto.ciudad !== undefined) data.ciudad = dto.ciudad;
    if (dto.direccion !== undefined) data.direccion = dto.direccion;
    if (dto.codigoPostal !== undefined) data.codigoPostal = dto.codigoPostal;
    // Contacto
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.telefono !== undefined) data.telefono = dto.telefono;
    if (dto.telefonoAlternativo !== undefined) data.telefonoAlternativo = dto.telefonoAlternativo;
    if (dto.paginaWeb !== undefined) data.paginaWeb = dto.paginaWeb;
    if (dto.contacto !== undefined) data.contacto = dto.contacto;
    // Comercial
    if (dto.tipoCliente !== undefined) data.tipoCliente = dto.tipoCliente;
    if (dto.listaPrecios !== undefined) data.listaPrecios = dto.listaPrecios;
    if (dto.cupoCredito !== undefined) data.cupoCredito = dto.cupoCredito;
    if (dto.condicionesPago !== undefined) data.condicionesPago = dto.condicionesPago;
    if (dto.estado !== undefined) data.estado = dto.estado;
    // Tributario
    if (dto.regimenTributario !== undefined) data.regimenTributario = dto.regimenTributario;
    if (dto.responsabilidadFiscal !== undefined) data.responsabilidadFiscal = dto.responsabilidadFiscal;
    if (dto.actividadEconomica !== undefined) data.actividadEconomica = dto.actividadEconomica;
    if (dto.granContribuyente !== undefined) data.granContribuyente = dto.granContribuyente;
    if (dto.autorretenedor !== undefined) data.autorretenedor = dto.autorretenedor;
    if (dto.agenteRetencion !== undefined) data.agenteRetencion = dto.agenteRetencion;
    // Financiero
    if (dto.banco !== undefined) data.banco = dto.banco;
    if (dto.tipoCuenta !== undefined) data.tipoCuenta = dto.tipoCuenta;
    if (dto.numeroCuenta !== undefined) data.numeroCuenta = dto.numeroCuenta;
    // Interno
    if (dto.segmento !== undefined) data.segmento = dto.segmento;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;
    // Relaciones
    if (dto.planBaseId !== undefined) data.planBaseId = dto.planBaseId;
    // COMERCIAL no puede reasignar clientes a otro asesor
    if (dto.asesorId !== undefined && userCtx?.rol !== 'COMERCIAL') {
      data.asesorId = dto.asesorId;
    }

    return (this.prisma as any).clienteManager.update({ where: { id }, data });
  }

  async stats() {
    const total = await (this.prisma as any).clienteManager.count();

    const porEstadoRaw = await (this.prisma as any).clienteManager.groupBy({
      by: ['estado'],
      _count: { estado: true },
    });

    const porEstado: Record<string, number> = {
      PROSPECTO: 0,
      ACTIVO: 0,
      SUSPENDIDO: 0,
      CANCELADO: 0,
    };

    for (const item of porEstadoRaw) {
      porEstado[item.estado] = item._count.estado;
    }

    // Ingresos mensuales = sum(precioNegociado ?? modulo.precioAnual) / 12
    const planesActivos = await (this.prisma as any).planCliente.findMany({
      where: { activo: true },
      include: { modulo: { select: { precioAnual: true } } },
    });

    const ingresosMensuales = planesActivos.reduce((acc: number, plan: any) => {
      const precio =
        plan.precioNegociado !== null
          ? Number(plan.precioNegociado)
          : Number(plan.modulo.precioAnual);
      return acc + precio / 12;
    }, 0);

    return {
      total,
      porEstado,
      ingresosMensuales: Math.round(ingresosMensuales),
    };
  }

  async asignarModulo(clienteId: number, dto: AsignarModuloDto) {
    await this.findOne(clienteId);

    const existingPlan = await (this.prisma as any).planCliente.findFirst({
      where: {
        clienteId,
        moduloId: dto.moduloId,
        activo: true,
      },
    });

    if (existingPlan) {
      throw new ConflictException('El módulo ya está activo para este cliente');
    }

    const data: Record<string, unknown> = {
      clienteId,
      moduloId: dto.moduloId,
      activo: true,
    };

    if (dto.precioNegociado !== undefined) {
      data.precioNegociado = dto.precioNegociado;
    }

    const plan = await (this.prisma as any).planCliente.create({
      data,
      include: { modulo: true },
    });

    return {
      ...plan,
      precioNegociado: plan.precioNegociado !== null ? Number(plan.precioNegociado) : null,
      modulo: { ...plan.modulo, precioAnual: Number(plan.modulo.precioAnual) },
    };
  }

  async desactivarModulo(clienteId: number, moduloId: number) {
    await this.findOne(clienteId);

    const plan = await (this.prisma as any).planCliente.findFirst({
      where: { clienteId, moduloId, activo: true },
    });

    if (!plan) {
      throw new NotFoundException('El módulo no está activo para este cliente');
    }

    return (this.prisma as any).planCliente.update({
      where: { id: plan.id },
      data: { activo: false },
    });
  }
}
