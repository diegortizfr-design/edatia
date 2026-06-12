import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToLegacy(p: any) {
    if (!p) return p;
    return {
      ...p,
      descuentoBase: p.descuentoProveedor ? Number(p.descuentoProveedor) : 0,
      moneda: p.monedaProveedor || 'COP',
    };
  }

  async findAll(empresaId: number, q?: string) {
    const where: any = { empresaId, esProveedor: true, activo: true };
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { nombreComercial: { contains: q, mode: 'insensitive' } },
        { numeroDocumento: { contains: q } },
      ];
    }
    const list = await this.prisma.tercero.findMany({
      where,
      include: {
        sucursales: true,
        _count: { select: { ordenesCompra: true } }
      },
      orderBy: { nombre: 'asc' },
    });
    return list.map(p => this.mapToLegacy(p));
  }

  async findOne(id: number, empresaId: number) {
    const p = await this.prisma.tercero.findFirst({
      where: { id, empresaId, esProveedor: true },
      include: {
        sucursales: true,
        ordenesCompra: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, numero: true, estado: true, total: true, fechaEmision: true },
        },
      },
    });
    if (!p) throw new NotFoundException('Proveedor no encontrado');
    return this.mapToLegacy(p);
  }

  async create(dto: CreateProveedorDto, empresaId: number) {
    // Buscar si ya existe un Tercero con ese documento
    let tercero = await this.prisma.tercero.findUnique({
      where: {
        empresaId_tipoDocumento_numeroDocumento: {
          empresaId,
          tipoDocumento: dto.tipoDocumento || 'NIT',
          numeroDocumento: dto.numeroDocumento,
        }
      }
    });

    const { sucursales, moneda, descuentoBase, ...rest } = dto;

    if (tercero) {
      if (tercero.esProveedor) {
        throw new ConflictException('Ya existe un proveedor con ese documento');
      }
      
      // Si existe pero no era proveedor, lo actualizamos para que sea proveedor
      return this.prisma.$transaction(async (tx) => {
        await tx.sucursalTercero.deleteMany({ where: { terceroId: tercero!.id, empresaId } });
        
        const updated = await tx.tercero.update({
          where: { id: tercero!.id },
          data: {
            ...rest,
            esProveedor: true,
            monedaProveedor: moneda || 'COP',
            descuentoProveedor: descuentoBase,
            sucursales: sucursales && sucursales.length > 0 ? {
              create: sucursales.map((s: any) => ({
                empresaId,
                codigo: s.codigo,
                descripcion: s.descripcion,
                direccion: s.direccion || '',
                telefono: s.telefono || '',
                ciudad: s.ciudad || '',
                departamento: s.departamento || '',
                contacto: s.contacto || '',
                cargo: s.cargo || '',
              }))
            } : undefined
          },
          include: { sucursales: true }
        });
        return this.mapToLegacy(updated);
      });
    }

    const created = await this.prisma.tercero.create({
      data: {
        ...rest,
        empresaId,
        esProveedor: true,
        monedaProveedor: moneda || 'COP',
        descuentoProveedor: descuentoBase,
        sucursales: sucursales && sucursales.length > 0 ? {
          create: sucursales.map((s: any) => ({
            empresaId,
            codigo: s.codigo,
            descripcion: s.descripcion,
            direccion: s.direccion || '',
            telefono: s.telefono || '',
            ciudad: s.ciudad || '',
            departamento: s.departamento || '',
            contacto: s.contacto || '',
            cargo: s.cargo || '',
          }))
        } : undefined
      },
      include: { sucursales: true }
    });
    return this.mapToLegacy(created);
  }

  async update(id: number, dto: UpdateProveedorDto, empresaId: number) {
    await this.findOne(id, empresaId);
    const { sucursales, moneda, descuentoBase, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      await tx.sucursalTercero.deleteMany({
        where: { terceroId: id, empresaId }
      });

      const updated = await tx.tercero.update({
        where: { id },
        data: {
          ...rest,
          monedaProveedor: moneda,
          descuentoProveedor: descuentoBase,
          sucursales: sucursales && sucursales.length > 0 ? {
            create: sucursales.map((s: any) => ({
              empresaId,
              codigo: s.codigo,
              descripcion: s.descripcion,
              direccion: s.direccion || '',
              telefono: s.telefono || '',
              ciudad: s.ciudad || '',
              departamento: s.departamento || '',
              contacto: s.contacto || '',
              cargo: s.cargo || '',
            }))
          } : undefined
        },
        include: { sucursales: true }
      });
      return this.mapToLegacy(updated);
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOne(id, empresaId);

    // Verificación de transacciones
    const count = await this.prisma.tercero.findFirst({
      where: { id, empresaId },
      select: {
        _count: {
          select: {
            ordenesCompra: true,
            facturasCompra: true,
          }
        }
      }
    });

    const hasTransactions = count ? Object.values(count._count).some(v => v > 0) : false;

    if (hasTransactions) {
      await this.prisma.tercero.update({
        where: { id },
        data: { activo: false }
      });
      return { message: 'El proveedor tiene historial y ha sido desactivado automáticamente.', softDeleted: true };
    }

    await this.prisma.tercero.delete({ where: { id } });
    return { message: 'Proveedor eliminado exitosamente.', softDeleted: false };
  }
}
