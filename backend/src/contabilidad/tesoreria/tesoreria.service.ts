import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComprobantesService } from '../comprobantes/comprobantes.service';
import { AuditoriaErpService } from '../../auditoria-erp/auditoria-erp.service';
import {
  CreateEgresoDto,
  CreateCajaMenorDto,
  UpdateCajaMenorDto,
  CreateGastoCajaMenorDto,
  ReembolsoCajaMenorDto,
  CreateCategoriaGastoDto,
  UpdateCategoriaGastoDto,
} from './dto/tesoreria.dto';

@Injectable()
export class TesoreriaService implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Egreso" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "empresaId" INTEGER NOT NULL,
            "numero" TEXT NOT NULL,
            "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "terceroId" INTEGER,
            "beneficiarioNombre" TEXT,
            "beneficiarioDoc" TEXT,
            "categoriaGasto" TEXT NOT NULL,
            "concepto" TEXT NOT NULL,
            "referencia" TEXT,
            "cuentaGastoId" INTEGER NOT NULL,
            "cajaBancoId" INTEGER,
            "medioPago" TEXT NOT NULL DEFAULT 'TRANSFERENCIA',
            "monto" DECIMAL(15,2) NOT NULL,
            "aplicaRetencion" BOOLEAN NOT NULL DEFAULT false,
            "tarifaRetencion" DECIMAL(5,2) NOT NULL DEFAULT 0,
            "valorRetencion" DECIMAL(15,2) NOT NULL DEFAULT 0,
            "cuentaRetencionId" INTEGER,
            "montoNeto" DECIMAL(15,2) NOT NULL,
            "comprobanteId" INTEGER,
            "documentoConfigId" INTEGER,
            "estado" TEXT NOT NULL DEFAULT 'APROBADO',
            "notas" TEXT,
            "usuarioId" INTEGER,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "CajaMenor" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "empresaId" INTEGER NOT NULL,
            "nombre" TEXT NOT NULL,
            "codigo" TEXT NOT NULL,
            "responsable" TEXT NOT NULL,
            "montoAsignado" DECIMAL(15,2) NOT NULL,
            "cuentaPUC" TEXT NOT NULL DEFAULT '110510',
            "cajaBancoId" INTEGER,
            "activo" BOOLEAN NOT NULL DEFAULT true,
            "notas" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "GastoCajaMenor" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "cajaMenorId" INTEGER NOT NULL,
            "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "numeroRecibo" TEXT,
            "beneficiario" TEXT NOT NULL,
            "beneficiarioDoc" TEXT,
            "concepto" TEXT NOT NULL,
            "categoriaGasto" TEXT NOT NULL,
            "cuentaGastoId" INTEGER NOT NULL,
            "valor" DECIMAL(15,2) NOT NULL,
            "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
            "reembolsoId" INTEGER,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "ReembolsoCajaMenor" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "cajaMenorId" INTEGER NOT NULL,
            "consecutivo" TEXT NOT NULL,
            "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "totalReembolsado" DECIMAL(15,2) NOT NULL,
            "origenCajaBancoId" INTEGER,
            "comprobanteId" INTEGER,
            "observaciones" TEXT,
            "usuarioId" INTEGER,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "CategoriaGasto" (
            "id" SERIAL NOT NULL PRIMARY KEY,
            "empresaId" INTEGER NOT NULL,
            "nombre" TEXT NOT NULL,
            "descripcion" TEXT,
            "cuentaPUCId" INTEGER,
            "activo" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE "Egreso" ADD COLUMN IF NOT EXISTS "documentoConfigId" INTEGER;
        ALTER TABLE "Egreso" ADD COLUMN IF NOT EXISTS "categoriaGastoId" INTEGER;
      `);
    } catch (err) {
      console.warn('Advertencia asegurando tablas de Tesorería:', err);
    }
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly comprobantes: ComprobantesService,
    private readonly auditoria: AuditoriaErpService,
  ) {}

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. COMPROBANTES DE EGRESO (PAGOS Y GASTOS GENERALES)
  // ═════════════════════════════════════════════════════════════════════════════

  async findAllEgresos(empresaId: number, params?: { desde?: string; hasta?: string; categoria?: string; cajaBancoId?: number; query?: string }) {
    const where: any = { empresaId };

    if (params?.categoria) {
      where.categoriaGasto = params.categoria;
    }
    if (params?.cajaBancoId) {
      where.cajaBancoId = Number(params.cajaBancoId);
    }
    if (params?.desde || params?.hasta) {
      where.fecha = {};
      if (params.desde) where.fecha.gte = new Date(params.desde);
      if (params.hasta) {
        const hastaDate = new Date(params.hasta);
        hastaDate.setHours(23, 59, 59, 999);
        where.fecha.lte = hastaDate;
      }
    }
    if (params?.query) {
      where.OR = [
        { numero: { contains: params.query, mode: 'insensitive' } },
        { concepto: { contains: params.query, mode: 'insensitive' } },
        { beneficiarioNombre: { contains: params.query, mode: 'insensitive' } },
        { referencia: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    return this.prisma.egreso.findMany({
      where,
      include: {
        tercero: { select: { id: true, nombre: true, numeroDocumento: true, telefono: true } },
        cuentaGasto: { select: { id: true, codigo: true, nombre: true } },
        cuentaRetencion: { select: { id: true, codigo: true, nombre: true } },
        cajaBanco: { select: { id: true, nombre: true, tipo: true, cuentaPUC: true } },
        comprobante: { select: { id: true, numero: true, estado: true } },
        documentoConfig: { select: { id: true, nombre: true, prefijo: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async findOneEgreso(id: number, empresaId: number) {
    const egreso = await this.prisma.egreso.findFirst({
      where: { id, empresaId },
      include: {
        tercero: true,
        cuentaGasto: true,
        cuentaRetencion: true,
        cajaBanco: true,
        documentoConfig: true,
        comprobante: {
          include: {
            lineas: {
              include: { cuenta: { select: { codigo: true, nombre: true } } },
              orderBy: { orden: 'asc' },
            },
          },
        },
      },
    });

    if (!egreso) throw new NotFoundException('Comprobante de egreso no encontrado');
    return egreso;
  }

  async createEgreso(empresaId: number, dto: CreateEgresoDto, usuarioId?: number) {
    const monto = Number(dto.monto);
    if (monto <= 0) throw new BadRequestException('El monto del gasto debe ser mayor a 0');

    // 1. Validar cuenta de gasto
    const cuentaGasto = await this.prisma.cuentaPUC.findFirst({
      where: { id: dto.cuentaGastoId, empresaId, activo: true },
    });
    if (!cuentaGasto) throw new NotFoundException('Cuenta contable de gasto no encontrada en su catálogo PUC');

    // 2. Resolver Tercero / Beneficiario
    let terceroNombre = dto.beneficiarioNombre;
    let terceroDoc = dto.beneficiarioDoc;

    if (dto.terceroId) {
      const tercero = await this.prisma.tercero.findFirst({
        where: { id: dto.terceroId, empresaId },
      });
      if (tercero) {
        terceroNombre = terceroNombre || tercero.nombre;
        terceroDoc = terceroDoc || tercero.numeroDocumento;
      }
    }

    // 3. Resolver cuenta de salida (Caja / Banco) estrictamente desde CajaBanco.cuentaPUC
    if (!dto.cajaBancoId) {
      throw new BadRequestException('Debe seleccionar la Caja o Banco desde donde se realiza el egreso.');
    }

    const cajaBanco = await this.prisma.cajaBanco.findFirst({
      where: { id: dto.cajaBancoId, empresaId, activo: true },
    });
    if (!cajaBanco) {
      throw new NotFoundException('La cuenta de Caja o Banco seleccionada no existe o no está activa.');
    }

    if (!cajaBanco.cuentaPUC || !cajaBanco.cuentaPUC.trim()) {
      throw new BadRequestException(
        `La caja/banco "${cajaBanco.nombre}" no tiene configurada una cuenta PUC contable. Por favor configúrela en Configuración ➔ Cajas y Bancos.`
      );
    }

    const cuentaSalida = await this.prisma.cuentaPUC.findFirst({
      where: { empresaId, codigo: cajaBanco.cuentaPUC.trim(), activo: true },
    });
    if (!cuentaSalida) {
      throw new BadRequestException(
        `La cuenta contable PUC ${cajaBanco.cuentaPUC} asignada a "${cajaBanco.nombre}" no existe en su catálogo de cuentas PUC o está inactiva.`
      );
    }
    const cuentaSalidaId = cuentaSalida.id;

    // 4. Calcular Retención en la fuente si aplica
    const tarifaRet = dto.aplicaRetencion ? Number(dto.tarifaRetencion || 0) : 0;
    const valRet = dto.aplicaRetencion
      ? (dto.valorRetencion !== undefined ? Number(dto.valorRetencion) : Math.round(monto * (tarifaRet / 100)))
      : 0;
    const neto = Math.max(0, monto - valRet);

    let cuentaRetencion = null;
    if (valRet > 0) {
      if (dto.cuentaRetencionId) {
        cuentaRetencion = await this.prisma.cuentaPUC.findFirst({
          where: { id: dto.cuentaRetencionId, empresaId, activo: true },
        });
      }
      if (!cuentaRetencion) {
        cuentaRetencion = await this.prisma.cuentaPUC.findFirst({
          where: {
            empresaId,
            codigo: { in: ['236530', '236525', '2365'] },
            activo: true,
          },
        });
      }
      if (!cuentaRetencion) {
        throw new BadRequestException('Configure una cuenta de retención en la fuente (2365) en su PUC para aplicar retención.');
      }
    }

    // 5. Iniciar Transacción para generar Consecutivo, Comprobante Contable y Egreso
    return this.prisma.$transaction(async (tx) => {
      const fecha = new Date(dto.fecha || Date.now());
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;

      // Resolver Configuración de Documento (DocumentoConfig) con sigla CE estricta desde configuración
      if (!dto.documentoConfigId) {
        throw new BadRequestException('Debe seleccionar la resolución del documento Comprobante de Egreso (CE).');
      }

      const docConfig = await tx.documentoConfig.findFirst({
        where: {
          id: dto.documentoConfigId,
          empresaId,
          sigla: 'CE',
          estado: 'ACTIVO',
          deletedAt: null,
        },
      });

      if (!docConfig) {
        throw new BadRequestException(
          'La resolución seleccionada no corresponde a un Comprobante de Egreso (sigla CE) activo. Verifique en Configuración ➔ Documentos.'
        );
      }

      // Resolver categoría de gasto
      let categoriaNombre = dto.categoriaGasto;
      let categoriaGastoId: number | null = dto.categoriaGastoId || null;
      if (categoriaGastoId) {
        const cat = await tx.categoriaGasto.findFirst({
          where: { id: categoriaGastoId, empresaId, activo: true },
        });
        if (cat) {
          categoriaNombre = cat.nombre;
        }
      }

      // Incrementar consecutivo en DocumentoConfig
      const updatedDoc = await tx.documentoConfig.update({
        where: { id: docConfig.id },
        data: { consecutivoSiguiente: { increment: 1 } },
      });

      const numDcto = updatedDoc.consecutivoSiguiente - 1;
      const prefijoStr = (docConfig.prefijo || docConfig.sigla || 'CE').trim();
      const numero = prefijoStr.endsWith('-') ? `${prefijoStr}${numDcto}` : `${prefijoStr}-${numDcto}`;

      // Líneas contables
      const lineas: any[] = [];

      // Débito al gasto (51xx / 52xx)
      lineas.push({
        cuentaId: cuentaGasto.id,
        descripcion: `${dto.concepto} - ${terceroNombre || 'Gasto Operativo'}`,
        debito: monto,
        credito: 0,
        terceroNit: terceroDoc,
        terceroNombre: terceroNombre,
        orden: 0,
      });

      // Crédito a Retención en la Fuente (2365) si aplica
      if (valRet > 0 && cuentaRetencion) {
        lineas.push({
          cuentaId: cuentaRetencion.id,
          descripcion: `Retención en la fuente (${tarifaRet}%) - ${numero}`,
          debito: 0,
          credito: valRet,
          terceroNit: terceroDoc,
          terceroNombre: terceroNombre,
          orden: 1,
        });
      }

      // Crédito a Caja / Banco por el valor neto pagado (11xx)
      lineas.push({
        cuentaId: cuentaSalidaId as number,
        descripcion: `Pago egreso ${numero} - ${cajaBanco?.nombre || 'Tesorería'}`,
        debito: 0,
        credito: neto,
        terceroNit: terceroDoc,
        terceroNombre: terceroNombre,
        orden: lineas.length,
      });

      // Período contable
      const periodo = await tx.periodoContable.upsert({
        where: { empresaId_anio_mes: { empresaId, anio, mes } },
        create: { empresaId, anio, mes },
        update: {},
      });

      if (periodo.estado === 'CERRADO') {
        throw new BadRequestException(`El período contable ${mes}/${anio} está cerrado`);
      }

      // Crear Comprobante Contable oficial (Libro Diario)
      const comprobante = await tx.comprobante.create({
        data: {
          empresaId,
          numero: numero,
          tipo: 'CP', // Comprobante de Pago / Egreso
          concepto: `Egreso ${numero} - ${dto.concepto} [${dto.categoriaGasto}]`,
          fecha,
          periodoId: periodo.id,
          referenciaTipo: 'EGRESO',
          usuarioId,
          lineas: {
            create: lineas.map((l, idx) => ({ ...l, orden: idx })),
          },
        },
      });

      // Crear registro de Egreso
      const egreso = await tx.egreso.create({
        data: {
          empresaId,
          numero,
          fecha,
          terceroId: dto.terceroId || null,
          beneficiarioNombre: terceroNombre,
          beneficiarioDoc: terceroDoc,
          categoriaGasto: categoriaNombre,
          categoriaGastoId: categoriaGastoId,
          concepto: dto.concepto,
          referencia: dto.referencia,
          cuentaGastoId: cuentaGasto.id,
          cajaBancoId: dto.cajaBancoId || null,
          medioPago: dto.medioPago || 'TRANSFERENCIA',
          monto,
          aplicaRetencion: Boolean(dto.aplicaRetencion),
          tarifaRetencion: tarifaRet,
          valorRetencion: valRet,
          cuentaRetencionId: cuentaRetencion ? cuentaRetencion.id : null,
          montoNeto: neto,
          comprobanteId: comprobante.id,
          documentoConfigId: docConfig.id,
          estado: 'APROBADO',
          notas: dto.notas,
          usuarioId,
        },
        include: {
          tercero: true,
          cuentaGasto: true,
          cuentaRetencion: true,
          cajaBanco: true,
          comprobante: true,
          documentoConfig: true,
        },
      });

      // Actualizar referencia en el comprobante
      await tx.comprobante.update({
        where: { id: comprobante.id },
        data: { referenciaId: egreso.id },
      });

      return egreso;
    });
  }

  async anularEgreso(id: number, empresaId: number, usuarioId?: number) {
    const egreso = await this.findOneEgreso(id, empresaId);
    if (egreso.estado === 'ANULADO') throw new BadRequestException('El egreso ya se encuentra anulado');

    return this.prisma.$transaction(async (tx) => {
      if (egreso.comprobanteId) {
        await tx.comprobante.update({
          where: { id: egreso.comprobanteId },
          data: { estado: 'ANULADO' },
        });
      }

      const updated = await tx.egreso.update({
        where: { id },
        data: { estado: 'ANULADO' },
      });

      await this.auditoria.log(empresaId, {
        modulo: 'TESORERIA',
        accion: 'EGRESO_ANULAR',
        entidad: 'Egreso',
        entidadId: String(id),
        descripcion: `Comprobante de egreso ${egreso.numero} anulado.`,
        usuarioId,
      });

      return updated;
    });
  }

  // ─── Categorías de Gasto Dinámicas (Configuración Tesorería) ───────────────

  async findAllCategorias(empresaId: number) {
    return this.prisma.categoriaGasto.findMany({
      where: { empresaId },
      include: {
        cuentaPUC: { select: { id: true, codigo: true, nombre: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOneCategoria(id: number, empresaId: number) {
    const cat = await this.prisma.categoriaGasto.findFirst({
      where: { id, empresaId },
      include: {
        cuentaPUC: { select: { id: true, codigo: true, nombre: true } },
      },
    });
    if (!cat) throw new NotFoundException('Categoría de gasto no encontrada');
    return cat;
  }

  async createCategoria(empresaId: number, dto: CreateCategoriaGastoDto) {
    const nombre = dto.nombre?.trim();
    if (!nombre) throw new BadRequestException('El nombre de la categoría es requerido');

    const existe = await this.prisma.categoriaGasto.findFirst({
      where: { empresaId, nombre: { equals: nombre, mode: 'insensitive' } },
    });
    if (existe) throw new BadRequestException(`Ya existe una categoría de gasto con el nombre "${nombre}"`);

    if (dto.cuentaPUCId) {
      const cPuc = await this.prisma.cuentaPUC.findFirst({
        where: { id: dto.cuentaPUCId, empresaId, activo: true },
      });
      if (!cPuc) {
        throw new NotFoundException('La cuenta contable PUC asignada no existe en su catálogo o está inactiva');
      }
    }

    return this.prisma.categoriaGasto.create({
      data: {
        empresaId,
        nombre,
        descripcion: dto.descripcion?.trim() || null,
        cuentaPUCId: dto.cuentaPUCId || null,
        activo: dto.activo !== undefined ? dto.activo : true,
      },
      include: {
        cuentaPUC: { select: { id: true, codigo: true, nombre: true } },
      },
    });
  }

  async updateCategoria(id: number, empresaId: number, dto: UpdateCategoriaGastoDto) {
    const cat = await this.prisma.categoriaGasto.findFirst({
      where: { id, empresaId },
    });
    if (!cat) throw new NotFoundException('Categoría de gasto no encontrada');

    if (dto.nombre) {
      const nombre = dto.nombre.trim();
      const existe = await this.prisma.categoriaGasto.findFirst({
        where: {
          empresaId,
          nombre: { equals: nombre, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (existe) throw new BadRequestException(`Ya existe otra categoría de gasto con el nombre "${nombre}"`);
    }

    if (dto.cuentaPUCId) {
      const cPuc = await this.prisma.cuentaPUC.findFirst({
        where: { id: dto.cuentaPUCId, empresaId, activo: true },
      });
      if (!cPuc) {
        throw new NotFoundException('La cuenta contable PUC asignada no existe en su catálogo o está inactiva');
      }
    }

    return this.prisma.categoriaGasto.update({
      where: { id },
      data: {
        ...(dto.nombre ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion?.trim() || null } : {}),
        ...(dto.cuentaPUCId !== undefined ? { cuentaPUCId: dto.cuentaPUCId || null } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
      },
      include: {
        cuentaPUC: { select: { id: true, codigo: true, nombre: true } },
      },
    });
  }

  async deleteCategoria(id: number, empresaId: number) {
    const cat = await this.prisma.categoriaGasto.findFirst({
      where: { id, empresaId },
    });
    if (!cat) throw new NotFoundException('Categoría de gasto no encontrada');

    const egresosCount = await this.prisma.egreso.count({
      where: { categoriaGastoId: id },
    });

    if (egresosCount > 0) {
      // Si tiene egresos asociados, desactivar en lugar de borrar para preservar integridad
      return this.prisma.categoriaGasto.update({
        where: { id },
        data: { activo: false },
      });
    }

    return this.prisma.categoriaGasto.delete({
      where: { id },
    });
  }

  async getCuentasGastoPUC(empresaId: number) {
    return this.prisma.cuentaPUC.findMany({
      where: {
        empresaId,
        activo: true,
        OR: [
          { tipo: { in: ['GASTO', 'COSTO'] } },
          { codigo: { startsWith: '5' } },
          { codigo: { startsWith: '6' } },
        ],
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        nivel: true,
        tipo: true,
      },
      orderBy: { codigo: 'asc' },
    });
  }

  // Catálogo dinámico de categorías y cuentas PUC para Tesorería
  async getCategoriasGasto(empresaId: number) {
    const [categorias, cuentasPUC] = await Promise.all([
      this.findAllCategorias(empresaId),
      this.getCuentasGastoPUC(empresaId),
    ]);

    return {
      categorias,
      cuentasPUC,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. CAJA MENOR (FONDO FIJO, GASTOS MENORES Y REEMBOLSO)
  // ═════════════════════════════════════════════════════════════════════════════

  async findAllCajasMenores(empresaId: number) {
    const list = await this.prisma.cajaMenor.findMany({
      where: { empresaId },
      include: {
        cajaBanco: { select: { id: true, nombre: true } },
        gastos: {
          where: { estado: 'PENDIENTE' },
          select: { id: true, valor: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    return list.map((cm) => {
      const montoAsignado = Number(cm.montoAsignado);
      const totalGastosPendientes = cm.gastos.reduce((acc, g) => acc + Number(g.valor), 0);
      const saldoDisponible = Math.max(0, montoAsignado - totalGastosPendientes);

      return {
        id: cm.id,
        nombre: cm.nombre,
        codigo: cm.codigo,
        responsable: cm.responsable,
        montoAsignado,
        cuentaPUC: cm.cuentaPUC,
        cajaBancoId: cm.cajaBancoId,
        cajaBancoNombre: cm.cajaBanco?.nombre,
        activo: cm.activo,
        notas: cm.notas,
        totalGastosPendientes,
        saldoDisponible,
        conteoGastosPendientes: cm.gastos.length,
      };
    });
  }

  async createCajaMenor(empresaId: number, dto: CreateCajaMenorDto) {
    const existe = await this.prisma.cajaMenor.findFirst({
      where: { empresaId, codigo: dto.codigo },
    });
    if (existe) throw new BadRequestException(`Ya existe una caja menor con el código ${dto.codigo}`);

    return this.prisma.cajaMenor.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        codigo: dto.codigo,
        responsable: dto.responsable,
        montoAsignado: dto.montoAsignado,
        cuentaPUC: dto.cuentaPUC || '110510',
        cajaBancoId: dto.cajaBancoId || null,
        notas: dto.notas,
      },
    });
  }

  async updateCajaMenor(id: number, empresaId: number, dto: UpdateCajaMenorDto) {
    const cm = await this.prisma.cajaMenor.findFirst({ where: { id, empresaId } });
    if (!cm) throw new NotFoundException('Caja menor no encontrada');

    return this.prisma.cajaMenor.update({
      where: { id },
      data: dto,
    });
  }

  async getGastosCajaMenor(cajaMenorId: number, empresaId: number, estado?: string) {
    const cm = await this.prisma.cajaMenor.findFirst({ where: { id: cajaMenorId, empresaId } });
    if (!cm) throw new NotFoundException('Caja menor no encontrada');

    return this.prisma.gastoCajaMenor.findMany({
      where: {
        cajaMenorId,
        ...(estado ? { estado } : {}),
      },
      include: {
        cuentaGasto: { select: { id: true, codigo: true, nombre: true } },
        reembolso: { select: { id: true, consecutivo: true, fecha: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async createGastoCajaMenor(cajaMenorId: number, empresaId: number, dto: CreateGastoCajaMenorDto) {
    const cm = await this.prisma.cajaMenor.findFirst({
      where: { id: cajaMenorId, empresaId },
      include: {
        gastos: { where: { estado: 'PENDIENTE' }, select: { valor: true } },
      },
    });
    if (!cm) throw new NotFoundException('Caja menor no encontrada');

    const totalGastosPendientes = cm.gastos.reduce((acc, g) => acc + Number(g.valor), 0);
    const saldoDisponible = Math.max(0, Number(cm.montoAsignado) - totalGastosPendientes);

    if (Number(dto.valor) > saldoDisponible) {
      throw new BadRequestException(
        `El valor del gasto ($${Number(dto.valor).toLocaleString('es-CO')}) excede el saldo disponible de la caja menor ($${saldoDisponible.toLocaleString('es-CO')}). Realice un reembolso para continuar.`
      );
    }

    return this.prisma.gastoCajaMenor.create({
      data: {
        cajaMenorId,
        fecha: new Date(dto.fecha),
        numeroRecibo: dto.numeroRecibo,
        beneficiario: dto.beneficiario,
        beneficiarioDoc: dto.beneficiarioDoc,
        concepto: dto.concepto,
        categoriaGasto: dto.categoriaGasto,
        cuentaGastoId: dto.cuentaGastoId,
        valor: dto.valor,
        estado: 'PENDIENTE',
      },
      include: {
        cuentaGasto: true,
      },
    });
  }

  async deleteGastoCajaMenor(gastoId: number, empresaId: number) {
    const gasto = await this.prisma.gastoCajaMenor.findUnique({
      where: { id: gastoId },
      include: { cajaMenor: true },
    });
    if (!gasto || gasto.cajaMenor.empresaId !== empresaId) {
      throw new NotFoundException('Gasto de caja menor no encontrado');
    }
    if (gasto.estado !== 'PENDIENTE') {
      throw new BadRequestException('No se puede eliminar un gasto que ya ha sido reembolsado');
    }

    return this.prisma.gastoCajaMenor.delete({
      where: { id: gastoId },
    });
  }

  async reembolsarCajaMenor(cajaMenorId: number, empresaId: number, dto: ReembolsoCajaMenorDto, usuarioId?: number) {
    const cm = await this.prisma.cajaMenor.findFirst({
      where: { id: cajaMenorId, empresaId },
      include: {
        gastos: {
          where: { estado: 'PENDIENTE' },
          include: { cuentaGasto: true },
          orderBy: { fecha: 'asc' },
        },
      },
    });
    if (!cm) throw new NotFoundException('Caja menor no encontrada');

    if (cm.gastos.length === 0) {
      throw new BadRequestException('No hay gastos pendientes de reembolso en esta caja menor');
    }

    const totalReembolso = cm.gastos.reduce((acc, g) => acc + Number(g.valor), 0);

    // Resolver cuenta de banco/caja principal de origen
    let cuentaOrigenPUCId: number | null = null;
    let origenCajaBanco = null;
    const origenId = dto.origenCajaBancoId || cm.cajaBancoId;

    if (origenId) {
      origenCajaBanco = await this.prisma.cajaBanco.findFirst({
        where: { id: origenId, empresaId, activo: true },
      });
      if (origenCajaBanco?.cuentaPUC) {
        const cPuc = await this.prisma.cuentaPUC.findFirst({
          where: { empresaId, codigo: origenCajaBanco.cuentaPUC, activo: true },
        });
        if (cPuc) cuentaOrigenPUCId = cPuc.id;
      }
    }

    if (!cuentaOrigenPUCId) {
      const cuentaDefault = await this.prisma.cuentaPUC.findFirst({
        where: { empresaId, codigo: { in: ['111005', '110505', '1110'] }, activo: true },
      });
      if (!cuentaDefault) {
        throw new BadRequestException('No se encontró una cuenta contable de Banco (1110) o Caja (1105) para debitar el reembolso');
      }
      cuentaOrigenPUCId = cuentaDefault.id;
    }

    return this.prisma.$transaction(async (tx) => {
      const fecha = new Date(dto.fecha || Date.now());
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;

      // Consecutivo del reembolso desde DocumentoConfig
      let consecutivo: string;
      const docConfigReem = await tx.documentoConfig.findFirst({
        where: { empresaId, sigla: 'REE', estado: 'ACTIVO', deletedAt: null },
      });
      if (docConfigReem) {
        const updated = await tx.documentoConfig.update({
          where: { id: docConfigReem.id },
          data: { consecutivoSiguiente: { increment: 1 } },
        });
        const n = updated.consecutivoSiguiente - 1;
        const pref = (docConfigReem.prefijo || 'REE').trim();
        consecutivo = pref.endsWith('-') ? `${pref}${n}` : `${pref}-${n}`;
      } else {
        const countReem = await tx.reembolsoCajaMenor.count({
          where: { cajaMenor: { empresaId } },
        });
        consecutivo = `REE-${countReem + 1}`;
      }

      // Agrupar gastos por cuenta contable
      const cuentasMap = new Map<number, { cuentaId: number; total: number; concepto: string }>();
      for (const g of cm.gastos) {
        const cId = g.cuentaGastoId;
        if (!cuentasMap.has(cId)) {
          cuentasMap.set(cId, { cuentaId: cId, total: 0, concepto: g.concepto });
        }
        cuentasMap.get(cId)!.total += Number(g.valor);
      }

      // Líneas contables
      const lineas: any[] = [];
      let idx = 0;

      // Débitos a cada cuenta de gasto
      for (const item of Array.from(cuentasMap.values())) {
        lineas.push({
          cuentaId: item.cuentaId,
          descripcion: `Reembolso ${cm.nombre} - ${item.concepto}`,
          debito: item.total,
          credito: 0,
          orden: idx++,
        });
      }

      // Crédito a Banco / Caja principal por el total
      lineas.push({
        cuentaId: cuentaOrigenPUCId as number,
        descripcion: `Giro reposición ${consecutivo} - ${cm.nombre}`,
        debito: 0,
        credito: totalReembolso,
        orden: idx++,
      });

      // Período
      const periodo = await tx.periodoContable.upsert({
        where: { empresaId_anio_mes: { empresaId, anio, mes } },
        create: { empresaId, anio, mes },
        update: {},
      });

      // Comprobante contable
      const comprobante = await tx.comprobante.create({
        data: {
          empresaId,
          numero: consecutivo,
          tipo: 'CP', // Comprobante de Pago / Reembolso
          concepto: `Reembolso de ${cm.nombre} (${cm.gastos.length} vales) - ${consecutivo}`,
          fecha,
          periodoId: periodo.id,
          referenciaTipo: 'REEMBOLSO_CAJA_MENOR',
          usuarioId,
          lineas: {
            create: lineas,
          },
        },
      });

      // Crear Reembolso
      const reembolso = await tx.reembolsoCajaMenor.create({
        data: {
          cajaMenorId,
          consecutivo,
          fecha,
          totalReembolsado: totalReembolso,
          origenCajaBancoId: origenId || null,
          comprobanteId: comprobante.id,
          observaciones: dto.observaciones || `Reposición de ${cm.gastos.length} gastos menores.`,
          usuarioId,
        },
      });

      // Marcar gastos como REEMBOLSADOS
      await tx.gastoCajaMenor.updateMany({
        where: { id: { in: cm.gastos.map((g) => g.id) } },
        data: {
          estado: 'REEMBOLSADO',
          reembolsoId: reembolso.id,
        },
      });

      return reembolso;
    });
  }

  async getReembolsosCajaMenor(cajaMenorId: number, empresaId: number) {
    const cm = await this.prisma.cajaMenor.findFirst({ where: { id: cajaMenorId, empresaId } });
    if (!cm) throw new NotFoundException('Caja menor no encontrada');

    return this.prisma.reembolsoCajaMenor.findMany({
      where: { cajaMenorId },
      include: {
        origenCajaBanco: { select: { id: true, nombre: true } },
        comprobante: { select: { id: true, numero: true } },
        gastos: {
          include: { cuentaGasto: { select: { codigo: true, nombre: true } } },
        },
      },
      orderBy: { fecha: 'desc' },
    });
  }
}

