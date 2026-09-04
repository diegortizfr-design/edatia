import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto, AsignarModuloDto, ProvisionarErpDto } from './dto/cliente.dto';
import * as bcrypt from 'bcrypt';

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
        empresa: {
          include: {
            usuarios: {
              select: {
                id: true,
                email: true,
                usuario: true,
                nombre: true,
                activo: true,
                rol: true,
              }
            }
          }
        }
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

    const nuevoCliente = await (this.prisma as any).clienteManager.create({ data });
    
    return nuevoCliente;
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

    const clienteActualizado = await (this.prisma as any).clienteManager.update({ where: { id }, data });

    // Sincronizar automáticamente con la Empresa del ERP si ya está enlazada
    const empresaId = clienteActualizado.empresaId;
    if (empresaId && (dto.nit || dto.nombre || dto.digitoVerificacion || dto.email || dto.telefono || dto.direccion)) {
      const rawNit = dto.nit ? dto.nit.trim() : undefined;
      const nitLimpio = rawNit ? (rawNit.split('-')[0].replace(/\D/g, '') || rawNit) : undefined;

      await this.prisma.empresa.update({
        where: { id: empresaId },
        data: {
          ...(nitLimpio ? { nit: nitLimpio } : {}),
          ...(dto.nombre ? { nombre: dto.nombre } : {}),
          ...(dto.digitoVerificacion !== undefined ? { digitoVerificacion: dto.digitoVerificacion } : {}),
          ...(dto.email !== undefined ? { email: dto.email } : {}),
          ...(dto.telefono !== undefined ? { telefono: dto.telefono } : {}),
          ...(dto.direccion !== undefined ? { direccion: dto.direccion } : {}),
        },
      }).catch(err => {
        console.warn('Advertencia al sincronizar con Empresa:', err?.message);
      });
    }
    
    return clienteActualizado;
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

  /**
   * Crea o actualiza las credenciales de administrador para el cliente en el ERP
   */
  async provisionarErp(clienteId: number, dto: ProvisionarErpDto) {
    const cliente = await this.findOne(clienteId);

    if (!cliente.nit) {
      throw new ConflictException('El cliente debe tener NIT para provisionar en el ERP');
    }

    const rawNit = cliente.nit.trim();
    const nitLimpio = rawNit.split('-')[0].replace(/\D/g, '') || rawNit;

    try {
      // 1. Verificar o crear la Empresa en el ERP
      let empresa: any = null;
      if (cliente.empresaId) {
        empresa = await this.prisma.empresa.findUnique({ where: { id: cliente.empresaId } });
      }

      if (!empresa) {
        // Buscar empresas que coincidan con este NIT
        const existingEmpresas = await this.prisma.empresa.findMany({
          where: {
            OR: [
              { nit: cliente.nit },
              { nit: nitLimpio },
              { nit: { startsWith: nitLimpio } },
            ],
          },
          include: { clienteManager: true },
        });

        // Seleccionar una que no esté enlazada a otro clienteManager o que ya pertenezca a este cliente
        const libreOPropia = existingEmpresas.find(e => !e.clienteManager || e.clienteManager.id === clienteId);
        if (libreOPropia) {
          empresa = libreOPropia;
        }
      }

      if (!empresa) {
        // Generar un NIT único para la empresa si ya estuviese ocupado
        let nitParaEmpresa = nitLimpio;
        const nitOcupado = await this.prisma.empresa.findUnique({ where: { nit: nitParaEmpresa } });
        if (nitOcupado) {
          nitParaEmpresa = `${nitLimpio}-${clienteId}`;
        }

        empresa = await this.prisma.empresa.create({
          data: {
            nit: nitParaEmpresa,
            digitoVerificacion: cliente.digitoVerificacion || undefined,
            nombre: cliente.nombre,
            direccion: cliente.direccion || undefined,
            telefono: cliente.telefono || undefined,
            email: cliente.email || undefined,
          },
        });
      }

      // 2. Enlazar la Empresa al ClienteManager de forma segura
      if (cliente.empresaId !== empresa.id) {
        await (this.prisma as any).clienteManager.update({
          where: { id: clienteId },
          data: { empresaId: empresa.id },
        });
      }

      // 3. Crear o actualizar el Usuario principal dentro de ESTA empresa
      const usuarioClean = dto.usuario.trim();
      const isEmail = usuarioClean.includes('@');
      const fallbackEmail = isEmail ? usuarioClean : (cliente.email || `${usuarioClean}@${nitLimpio}.edatia.com`);

      let existingUser = await this.prisma.user.findFirst({
        where: {
          empresaId: empresa.id,
          OR: [
            { usuario: usuarioClean },
            { email: usuarioClean },
            { email: fallbackEmail },
          ],
        },
      });

      const hash = await bcrypt.hash(dto.password, 12);

      if (existingUser) {
        // Actualizar password y desbloquear por si estaba bloqueado
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            usuario: usuarioClean,
            password: hash,
            activo: true,
            loginFallidosConsecutivos: 0,
            loginBloqueadoHasta: null,
            ...(fallbackEmail ? { email: fallbackEmail } : {}),
          },
        });

        return { message: 'Credenciales del usuario actualizadas correctamente' };
      } else {
        // Garantizar que el email no colisione con el esquema legacy
        let emailFinal = fallbackEmail;
        const emailGlobalUsado = await this.prisma.user.findFirst({ where: { email: emailFinal } });
        if (emailGlobalUsado && emailGlobalUsado.empresaId !== empresa.id) {
          emailFinal = `${usuarioClean}-${empresa.id}@${nitLimpio}.edatia.com`;
        }

        // Crear nuevo usuario admin dentro de la empresa
        await this.prisma.user.create({
          data: {
            usuario: usuarioClean,
            email: emailFinal,
            nombre: 'Admin ' + cliente.nombre,
            password: hash,
            rol: 'admin',
            empresaId: empresa.id,
            activo: true,
            loginFallidosConsecutivos: 0,
            loginBloqueadoHasta: null,
          },
        });

        return { message: 'Inquilino ERP y credenciales creadas correctamente' };
      }
    } catch (err: any) {
      console.error('Error en provisionarErp:', err);
      throw new BadRequestException(err?.message || 'Error al aprovisionar inquilino en el ERP');
    }
  }

  /**
   * Elimina un usuario del ERP asociado a este cliente
   */
  async eliminarUsuarioErp(clienteId: number, userId: number) {
    const cliente = await this.findOne(clienteId);

    if (!cliente.empresaId) {
      throw new ConflictException('El cliente no tiene un inquilino ERP enlazado');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        empresaId: cliente.empresaId,
      }
    });

    if (!user) {
      throw new NotFoundException('El usuario no existe o no pertenece a este cliente');
    }

    await this.prisma.user.delete({ where: { id: userId } });

    return { message: 'Usuario del ERP eliminado exitosamente' };
  }

  /**
   * Valida las credenciales de un comercial usando su número de cédula (código) y contraseña.
   */
  async validateCommercial(code: string, pass: string) {
    const trimmedCode = code.trim();
    
    const colaborador = await (this.prisma as any).colaborador.findFirst({
      where: {
        numeroDocumento: trimmedCode,
        activo: true,
      },
    });

    if (!colaborador) {
      throw new UnauthorizedException('El código comercial (cédula) ingresado no corresponde a ningún colaborador activo.');
    }

    if (colaborador.rol !== 'COMERCIAL' && colaborador.rol !== 'ADMIN') {
      throw new UnauthorizedException('El colaborador encontrado no tiene perfil comercial o administrativo.');
    }

    const passwordValid = await bcrypt.compare(pass, colaborador.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Contraseña del comercial incorrecta.');
    }

    return {
      valid: true,
      advisor: {
        id: colaborador.id,
        nombre: colaborador.nombre,
        email: colaborador.email,
        rol: colaborador.rol,
      },
    };
  }

  /**
   * Registra públicamente un prospecto de cliente con opcional asesor, plan base y módulos.
   */
  async createPublic(dto: any) {
    const existing = await (this.prisma as any).clienteManager.findFirst({
      where: { nit: dto.nit },
    });

    if (existing) {
      throw new ConflictException('Ya existe una empresa o tercero registrado con este número de identificación.');
    }

    const data: Record<string, any> = {
      tipoPersona: dto.tipoPersona || null,
      tipoDocumento: dto.tipoDocumento || null,
      nit: dto.nit,
      digitoVerificacion: dto.digitoVerificacion || null,
      nombre: dto.nombre,
      pais: dto.pais || 'Colombia',
      departamento: dto.departamento || null,
      ciudad: dto.ciudad || null,
      direccion: dto.direccion || null,
      email: dto.email || null,
      telefono: dto.telefono || null,
      contacto: dto.contacto || null,
      estado: 'PROSPECTO',
      regimenTributario: dto.regimenTributario || null,
      responsabilidadFiscal: dto.responsabilidadFiscal || null,
      actividadEconomica: dto.actividadEconomica || null,
      granContribuyente: dto.granContribuyente ?? false,
      autorretenedor: dto.autorretenedor ?? false,
      agenteRetencion: dto.agenteRetencion ?? false,
      observaciones: dto.observaciones || null,
    };

    if (dto.asesorId) {
      data.asesorId = Number(dto.asesorId);
    }
    if (dto.planBaseId) {
      data.planBaseId = Number(dto.planBaseId);
    }

    const nuevoCliente = await (this.prisma as any).clienteManager.create({ data });

    // Vincular módulos si se seleccionaron
    if (dto.modulosIds && Array.isArray(dto.modulosIds)) {
      for (const mId of dto.modulosIds) {
        await (this.prisma as any).planCliente.create({
          data: {
            clienteId: nuevoCliente.id,
            moduloId: Number(mId),
            activo: true,
          },
        });
      }
    }

    return nuevoCliente;
  }
}

