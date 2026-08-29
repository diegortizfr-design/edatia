import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DigitalService {
  constructor(private prisma: PrismaService) {}

  async getConfig(empresaId: number) {
    let config = await this.prisma.configuracionTienda.findUnique({
      where: { empresaId },
    });

    if (!config) {
      // Crear configuración inicial si no existe
      const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId } });
      config = await this.prisma.configuracionTienda.create({
        data: {
          empresaId,
          slugTienda: `tienda-${empresaId}-${Math.random().toString(36).substring(7)}`,
          nombreTienda: empresa?.nombre || 'Mi Tienda Virtual',
        },
      });
    }

    return config;
  }

  async updateConfig(empresaId: number, data: any) {
    const { id, empresaId: _, createdAt, empresa, ...updateData } = data;
    try {
      return await this.prisma.configuracionTienda.upsert({
        where: { empresaId },
        update: updateData,
        create: {
          ...updateData,
          empresaId,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target || [];
        if (target.includes('slugTienda')) {
          throw new ConflictException('El identificador de la tienda (slug) ya está en uso por otra empresa.');
        }
        if (target.includes('dominioPropio')) {
          throw new ConflictException('El dominio personalizado ya está registrado por otra empresa.');
        }
        throw new ConflictException('El identificador o dominio ya están en uso.');
      }
      throw error;
    }
  }

  async getProductosWeb(empresaId: number) {
    return this.prisma.producto.findMany({
      where: { empresaId, publicadoWeb: true },
      select: {
        id: true,
        nombre: true,
        sku: true,
        precioBase: true,
        precioWeb: true,
        publicadoWeb: true,
        slug: true,
        imagen: true,
      },
    });
  }

  async toggleProductoWeb(empresaId: number, productoId: number, publicado: boolean) {
    return this.prisma.producto.update({
      where: { id: productoId, empresaId },
      data: { publicadoWeb: publicado },
    });
  }

  // 🌐 Métodos Públicos para la Tienda Virtual (Aislada / SaaS)

  private async autoInitializeBabyWorld(slug: string) {
    if (slug !== 'distribuidorababyworld' && slug !== 'glowxir') return;

    const targetSlug = slug === 'glowxir' ? 'glowxir' : 'distribuidorababyworld';

    // 1. Validar si ya existe la configuración de la tienda
    let storeConfig = await this.prisma.configuracionTienda.findFirst({
      where: { slugTienda: targetSlug }
    });

    if (!storeConfig) {
      const firstEmpresa = await this.prisma.empresa.findFirst() || { id: 1 };
      
      storeConfig = await this.prisma.configuracionTienda.create({
        data: {
          empresaId: firstEmpresa.id,
          slugTienda: targetSlug,
          nombreTienda: 'Distribuidora Baby World',
          colorPrimario: '#0ea5e9',
          costoEnvioBase: 9500,
          activo: true
        }
      });
      console.log(`🌱 Autoinicializada tienda virtual Distribuidora Baby World (${targetSlug}) para empresaId ${firstEmpresa.id}`);
      
      // 2. Sembrar productos para bebés si la empresa no tiene productos publicados en web
      const webProductsCount = await this.prisma.producto.count({
        where: { empresaId: firstEmpresa.id, publicadoWeb: true }
      });

      if (webProductsCount === 0) {
        const seedBabyProducts = [
          {
            sku: "GEND-HUMO-01",
            nombre: "Kit Cañones de Humo Revelación de Género (Dúo Rosa / Azul)",
            descripcion: "Efecto de humo continuo de alta densidad y colores ultrabrillantes para revelación de género.",
            descripcionWeb: "Cañones de humo formulados con polvos de color 100% orgánicos, biodegradables y no tóxicos. El tubo viene con empaque neutro que oculta el color con código secreto.",
            precioBase: 55000,
            precioWeb: 55000,
            publicadoWeb: true,
            slug: "canones-humo-revelacion",
            imagen: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700&auto=format&fit=crop&q=80",
            esDestacado: true
          },
          {
            sku: "SHOW-TORTA-01",
            nombre: "Torta de Pañales Temática 'Oso Soñador' 3 Pisos",
            descripcion: "Espectacular centro de mesa y regalo útil para Baby Shower con 60 pañales y accesorios.",
            descripcionWeb: "Creación artesanal premium elaborada con 60 pañales Huggies/Pampers Etapa 1, decorada con cintas de raso, peluche de apego hipoalergénico y manta térmica.",
            precioBase: 145000,
            precioWeb: 145000,
            publicadoWeb: true,
            slug: "torta-panales-baby-shower",
            imagen: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=700&auto=format&fit=crop&q=80",
            esDestacado: true
          },
          {
            sku: "PAN-HUGGIES-120",
            nombre: "Bulto Pañales Huggies Natural Care x120 Unidades",
            descripcion: "Pañal con tecnología de máxima absorción y suavidad tipo algodón con indicador de humedad.",
            descripcionWeb: "Pañales con absorción reforzada de hasta 12 horas de protección continua. Cuentan con indicador de humedad inteligente y barreras antifugas.",
            precioBase: 94000,
            precioWeb: 94000,
            publicadoWeb: true,
            slug: "bulto-panales-huggies-120",
            imagen: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=700&auto=format&fit=crop&q=80",
            esDestacado: true
          },
          {
            sku: "JUG-PIANO-01",
            nombre: "Gimnasio Sensorial Piano Musical Kick & Play",
            descripcion: "Manta acolchada con arco de estimulación visual y piano musical interactivo.",
            descripcionWeb: "Estimula el desarrollo motriz y sensorial del bebé desde los primeros meses con 5 juguetes colgantes desmontables y piano de 4 teclas luminosas.",
            precioBase: 135000,
            precioWeb: 135000,
            publicadoWeb: true,
            slug: "gimnasio-piano-sensorial",
            imagen: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=700&auto=format&fit=crop&q=80",
            esDestacado: true
          },
          {
            sku: "ROP-AJUAR-PIMA",
            nombre: "Ajuar Completo Primera Puesta 100% Algodón Pima (5 Piezas)",
            descripcion: "Set de bienvenida para la clínica con algodón Pima hipoalergénico ultrasuave.",
            descripcionWeb: "Confeccionado con el algodón Pima más suave del mundo, transpirable y sin costuras que rocen la delicada piel del recién nacido.",
            precioBase: 89000,
            precioWeb: 89000,
            publicadoWeb: true,
            slug: "ajuar-primera-puesta-pima",
            imagen: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=700&auto=format&fit=crop&q=80",
            esDestacado: true
          },
          {
            sku: "PAS-COCHE-COMPACT",
            nombre: "Coche Paseador Ultracompacto Plegado Automático",
            descripcion: "Coche ligero de aluminio aeroespacial apto desde recién nacido hasta los 22kg.",
            descripcionWeb: "Máxima comodidad y practicidad para los padres. Se pliega de forma autónoma con presionar un botón en el manillar.",
            precioBase: 490000,
            precioWeb: 490000,
            publicadoWeb: true,
            slug: "coche-paseador-ultracompacto",
            imagen: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=700&auto=format&fit=crop&q=80",
            esDestacado: true
          }
        ];

        for (const p of seedBabyProducts) {
          await this.prisma.producto.create({
            data: {
              empresaId: firstEmpresa.id,
              ...p
            }
          });
        }
        console.log(`🌱 Sembrados productos Distribuidora Baby World para la empresaId ${firstEmpresa.id}`);
      }
    }
  }

  async getProductosWebPublic(slug: string) {
    await this.autoInitializeBabyWorld(slug);

    const config = await this.prisma.configuracionTienda.findFirst({
      where: {
        OR: [
          { slugTienda: slug },
          { dominioPropio: slug }
        ]
      }
    });
    if (!config || !config.activo) {
      throw new NotFoundException('Tienda no encontrada o inactiva');
    }

    return this.prisma.producto.findMany({
      where: { empresaId: config.empresaId, publicadoWeb: true, activo: true },
      select: {
        id: true,
        nombre: true,
        sku: true,
        precioBase: true,
        precioWeb: true,
        slug: true,
        imagen: true,
        descripcion: true,
        descripcionWeb: true,
        esDestacado: true,
      }
    });
  }

  async crearPedidoWeb(slug: string, dto: any) {
    const config = await this.prisma.configuracionTienda.findFirst({
      where: {
        OR: [
          { slugTienda: slug },
          { dominioPropio: slug }
        ]
      }
    });
    if (!config || !config.activo) {
      throw new NotFoundException('Tienda no encontrada o inactiva');
    }

    const empresaId = config.empresaId;

    return this.prisma.$transaction(async (tx) => {
      // 1. Encontrar o Crear el Tercero (Cliente)
      let cliente = await tx.tercero.findFirst({
        where: {
          empresaId,
          esCliente: true,
          OR: [
            { email: dto.email },
            { telefono: dto.telefono }
          ]
        }
      });

      if (!cliente) {
        const count = await tx.tercero.count({ where: { empresaId } });
        const docNum = `WEB-${1000 + count}`;
        cliente = await tx.tercero.create({
          data: {
            empresaId,
            nombre: dto.nombre,
            tipoDocumento: 'CC',
            numeroDocumento: docNum,
            email: dto.email,
            telefono: dto.telefono,
            direccion: dto.direccion,
            municipio: dto.ciudad,
            esCliente: true,
            activo: true,
          }
        });
      }

      // 2. Encontrar la bodega principal para el pedido
      let bodega = await tx.bodega.findFirst({
        where: { empresaId, esPrincipal: true }
      });
      if (!bodega) {
        bodega = await tx.bodega.findFirst({
          where: { empresaId }
        });
      }
      if (!bodega) {
        bodega = await tx.bodega.create({
          data: {
            empresaId,
            codigo: 'B-PRINCIPAL',
            nombre: 'Bodega Principal',
            esPrincipal: true,
            activo: true,
          }
        });
      }

      // 3. Obtener consecutivo de pedido (PedidoVenta)
      const lastOrder = await tx.pedidoVenta.findFirst({
        where: { empresaId },
        orderBy: { id: 'desc' }
      });
      const seq = lastOrder ? parseInt(lastOrder.numero.split('-').pop() ?? '0') + 1 : 1;
      const orderNum = `PED-${seq.toString().padStart(6, '0')}`;

      // 4. Calcular totales de items
      const subtotal = dto.items.reduce((sum: number, it: any) => sum + (it.precioUnitario * it.cantidad), 0);
      const total = subtotal;

      // 5. Crear PedidoVenta
      const order = await tx.pedidoVenta.create({
        data: {
          empresaId,
          numero: orderNum,
          clienteId: cliente.id,
          bodegaId: bodega.id,
          fecha: new Date(),
          notas: `Pedido recibido desde tienda virtual. Dirección de entrega: ${dto.direccion}, ${dto.ciudad}. Teléfono: ${dto.telefono}. Método de pago: ${dto.medioPago}`,
          condicionesPago: dto.medioPago === 'Contra Entrega' ? 'CONTRA_ENTREGA' : 'ANTICIPADO',
          subtotal,
          total,
          descuento: 0,
          baseIva19: 0,
          iva19: 0,
          baseIva5: 0,
          iva5: 0,
          estado: 'PENDIENTE',
          items: {
            create: dto.items.map((it: any, idx: number) => ({
              productoId: it.productoId,
              descripcion: it.nombre,
              unidad: 'UND',
              cantidad: it.cantidad,
              precioUnitario: it.precioUnitario,
              descuentoPct: 0,
              descuentoValor: 0,
              tipoIva: 'EXCLUIDO',
              baseIva: it.precioUnitario * it.cantidad,
              ivaValor: 0,
              subtotal: it.precioUnitario * it.cantidad,
              total: it.precioUnitario * it.cantidad,
              orden: idx
            }))
          }
        }
      });

      // 6. Crear Notificación de Campana en el ERP
      await tx.notificacion.create({
        data: {
          empresaId,
          tipo: 'INFO',
          titulo: 'Nuevo Pedido Web',
          mensaje: `Se ha recibido el pedido ${orderNum} de ${dto.nombre} por valor de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total)}.`,
          leida: false,
        }
      });

      return {
        success: true,
        orderId: order.id,
        numero: orderNum
      };
    });
  }
}
