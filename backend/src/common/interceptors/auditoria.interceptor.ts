import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditoriaErpService } from '../../auditoria-erp/auditoria-erp.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditoriaInterceptor.name);

  constructor(
    private readonly auditoriaService: AuditoriaErpService,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const { method, url, user, ip } = req;

    // Solo auditar métodos de escritura en el ERP y usuarios autenticados con empresaId
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) || !user || !user.empresaId) {
      return next.handle();
    }

    const info = this.analizarUrl(url);
    if (!info) {
      // Si la URL no corresponde a una de las entidades a auditar, continuar normalmente
      return next.handle();
    }

    const { modulo, entidad, idParam } = info;
    const id = idParam ? parseInt(idParam, 10) : null;
    const empresaId = user.empresaId;

    let valorAntes: any = null;
    if (id && !isNaN(id) && ['PATCH', 'PUT', 'DELETE'].includes(method)) {
      try {
        valorAntes = await this.obtenerSnapshot(entidad, id, empresaId);
      } catch (err) {
        this.logger.warn(`No se pudo obtener snapshot previo para ${entidad} #${id}: ${String(err)}`);
      }
    }

    const accion = this.determinarAccion(method, url);

    return next.handle().pipe(
      tap({
        next: async (response) => {
          try {
            const entidadId = id ? String(id) : (response?.id ? String(response.id) : undefined);
            await this.auditoriaService.log(empresaId, {
              modulo,
              accion,
              entidad,
              entidadId,
              descripcion: `${accion} en módulo ${modulo} para la entidad ${entidad} (${entidadId || 'nuevo'})`,
              valorAntes: valorAntes ? JSON.parse(JSON.stringify(valorAntes)) : undefined,
              valorDespues: response ? JSON.parse(JSON.stringify(response)) : undefined,
              usuarioId: user.sub,
              usuarioNombre: user.nombre || user.usuario,
              ip,
            });
          } catch (err) {
            this.logger.error(`Error al guardar log de auditoría: ${String(err)}`);
          }
        },
        error: (err) => {
          // No auditar si la petición falló a nivel HTTP (evitar falsos positivos de auditoría)
        }
      })
    );
  }

  private determinarAccion(method: string, url: string): string {
    if (method === 'POST') return 'CREAR';
    if (method === 'DELETE') return 'ELIMINAR';
    if (url.includes('/anular')) return 'ANULAR';
    return 'EDITAR';
  }

  private analizarUrl(url: string): { modulo: string; entidad: string; idParam: string | null } | null {
    // 1. Productos
    // Formato: /inventario/productos o /inventario/productos/:id
    const prodMatch = url.match(/\/inventario\/productos(?:\/(\d+))?/);
    if (prodMatch) {
      return {
        modulo: 'INVENTARIO',
        entidad: 'Producto',
        idParam: prodMatch[1] || null,
      };
    }

    // 2. Bodegas
    const bodegaMatch = url.match(/\/inventario\/bodegas(?:\/(\d+))?/);
    if (bodegaMatch) {
      return {
        modulo: 'INVENTARIO',
        entidad: 'Bodega',
        idParam: bodegaMatch[1] || null,
      };
    }

    // 3. Impuestos
    const impuestoMatch = url.match(/\/impuestos(?:\/(\d+))?/);
    if (impuestoMatch) {
      return {
        modulo: 'CONFIGURACION',
        entidad: 'Impuesto',
        idParam: impuestoMatch[1] || null,
      };
    }

    // 4. Terceros
    const terceroMatch = url.match(/\/terceros(?:\/(\d+))?/);
    if (terceroMatch) {
      return {
        modulo: 'VENTAS',
        entidad: 'Tercero',
        idParam: terceroMatch[1] || null,
      };
    }

    return null;
  }

  private async obtenerSnapshot(entidad: string, id: number, empresaId: number): Promise<any> {
    const key = entidad.charAt(0).toLowerCase() + entidad.slice(1);
    const delegate = (this.prisma as any)[key];
    if (!delegate) return null;
    return delegate.findFirst({
      where: { id, empresaId },
    });
  }
}
