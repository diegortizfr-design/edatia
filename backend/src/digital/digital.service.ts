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

  private async autoInitializeGlowxir(slug: string) {
    if (slug !== 'glowxir') return;

    // 1. Validar si ya existe la configuración de la tienda
    let storeConfig = await this.prisma.configuracionTienda.findFirst({
      where: { slugTienda: 'glowxir' }
    });

    if (!storeConfig) {
      // Buscar primera empresa (la de Diego o Demo)
      const firstEmpresa = await this.prisma.empresa.findFirst() || { id: 1 };
      
      storeConfig = await this.prisma.configuracionTienda.create({
        data: {
          empresaId: firstEmpresa.id,
          slugTienda: 'glowxir',
          nombreTienda: 'Glowxir Tienda Virtual',
          colorPrimario: '#9466e0',
          costoEnvioBase: 9500,
          activo: true
        }
      });
      console.log(`🌱 Autoinicializada tienda virtual glowxir para empresaId ${firstEmpresa.id}`);
      
      // 2. Sembrar productos cosméticos si la empresa no tiene ninguno publicado en la web
      const webProductsCount = await this.prisma.producto.count({
        where: { empresaId: firstEmpresa.id, publicadoWeb: true }
      });

      if (webProductsCount === 0) {
        const seedProducts = [
          {
            sku: "LIP-VELVET",
            nombre: "Labial Líquido Mate Velvet",
            descripcion: "Labial mate de alta pigmentación y larga duración sin resecar.",
            descripcionWeb: "Fórmula ultrapigmentada que se desliza como un gloss y se seca dejando un acabado mate aterciopelado impecable. Enriquecido con vitamina E y aceite de aguacate para mantener tus labios hidratados hasta por 12 horas.",
            precioBase: 45000,
            precioWeb: 45000,
            publicadoWeb: true,
            slug: "labial-velvet",
            imagen: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80",
            esDestacado: true
          },
          {
            sku: "BASE-SILK",
            nombre: "Base Hidratante Silk Glow",
            descripcion: "Base fluida con cobertura media y acabado luminoso y natural.",
            descripcionWeb: "Consigue una piel radiante y uniforme al instante. Su fórmula ligera se funde con la piel, hidratando y difuminando imperfecciones para un acabado satinado que dura todo el día.",
            precioBase: 78000,
            precioWeb: 78000,
            publicadoWeb: true,
            slug: "base-silk",
            imagen: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
            esDestacado: true
          },
          {
            sku: "PAL-SUNSET",
            nombre: "Paleta de Sombras Sunset Bloom",
            descripcion: "Paleta con 12 tonos cálidos altamente mezclables en acabados mate y shimmer.",
            descripcionWeb: "Inspirada en los atardeceres mágicos, esta paleta ofrece 12 sombras de alta calidad que van desde tonos tierra neutros hasta corales vibrantes y brillos dorados deslumbrantes.",
            precioBase: 95000,
            precioWeb: 95000,
            publicadoWeb: true,
            slug: "paleta-sunset",
            imagen: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
            esDestacado: true
          },
          {
            sku: "BLUSH-PETAL",
            nombre: "Rubor en Crema Dewy Petal",
            descripcion: "Rubor en crema sedoso que aporta un rubor natural y jugoso a las mejillas.",
            descripcionWeb: "Fórmula innovadora que se transforma de crema a polvo al contacto con la piel. Su textura ligera y traslúcida se aplica de forma uniforme, dejando un aspecto saludable y fresco en el rostro.",
            precioBase: 38000,
            precioWeb: 38000,
            publicadoWeb: true,
            slug: "rubor-petal",
            imagen: "https://images.unsplash.com/photo-1590156546746-c2240b5287bc?w=600&auto=format&fit=crop&q=80",
            esDestacado: false
          },
          {
            sku: "MASC-LASH",
            nombre: "Pestañina Volumen Infinito Lash Up",
            descripcion: "Máscara de pestañas para un volumen dramático y definición extrema sin grumos.",
            descripcionWeb: "Consigue pestañas visiblemente más largas y gruesas. Su cepillo de elastómero abraza cada pestaña desde la raíz hasta la punta, peinándolas y levantándolas al instante.",
            precioBase: 42000,
            precioWeb: 42000,
            publicadoWeb: true,
            slug: "pestanina-lash",
            imagen: "https://images.unsplash.com/photo-1631730359575-38e4755d772b?w=600&auto=format&fit=crop&q=80",
            esDestacado: false
          },
          {
            sku: "KIT-BRUSH",
            nombre: "Kit de Brochas Profesionales Velvet Touch",
            descripcion: "Set de 8 brochas de fibra sintética extrasuave con estuche de viaje.",
            descripcionWeb: "El kit definitivo para un maquillaje profesional en casa. Incluye brochas para base, polvos, rubor y difuminadores de sombras, elaboradas con cerdas de alta densidad que no absorben producto de más.",
            precioBase: 120000,
            precioWeb: 120000,
            publicadoWeb: true,
            slug: "kit-brochas",
            imagen: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
            esDestacado: false
          }
        ];

        for (const p of seedProducts) {
          await this.prisma.producto.create({
            data: {
              empresaId: firstEmpresa.id,
              ...p
            }
          });
        }
        console.log(`🌱 Sembrados 6 productos Glowxir para la empresaId ${firstEmpresa.id}`);
      }
    }
  }

  async getProductosWebPublic(slug: string) {
    await this.autoInitializeGlowxir(slug);

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
