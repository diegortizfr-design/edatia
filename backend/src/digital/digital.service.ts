import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from './mercadopago.service';

@Injectable()
export class DigitalService {
  private readonly logger = new Logger(DigitalService.name);

  constructor(private prisma: PrismaService, private mp: MercadoPagoService) {}

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
            sku: "PAN-WINNY-E0-50",
            nombre: "Pañal Winny Sensitive Etapa 0 (RN) x 50 Unidades",
            descripcion: "Cuidado superior con indicador de humedad y tela supersuavecita para recién nacido.",
            descripcionWeb: "Pañal Winny Sensitive Etapa 0 (RN) especialmente diseñado para la piel ultrasensible del recién nacido (hasta 4.5 Kg / 10 lbs). Cuenta con indicador de humedad que cambia de color cuando es momento del cambio, tela supersuavecita, diseño anatómico y corte especial para el cuidado del cordón umbilical.",
            precioBase: 41000,
            precioWeb: 41000,
            publicadoWeb: true,
            slug: "panal-winny-sensitive-etapa-0-50",
            imagen: "/productos/winny-sensitive-etapa-0-50.jpg",
            esDestacado: true
          },
          {
            sku: "PAN-WINNY-PANTS-E5-50",
            nombre: "Pañal Winny Pants Etapa 5 (XXG) x 50 Unidades",
            descripcion: "Pañal tipo calzoncito ultra absorbente con fibra natural, fácil de poner y quitar.",
            descripcionWeb: "Pañal Winny Pants Etapa 5 (XXG) diseñado como ropita interior para bebés de más de 14 Kg (más de 30 lbs). Ofrece máxima absorción con fibra natural, cintura elástica 360° ultra suave que se adapta a cada movimiento del bebé y laterales fáciles de rasgar para un cambio rápido y cómodo.",
            precioBase: 75000,
            precioWeb: 75000,
            publicadoWeb: true,
            slug: "panal-winny-pants-etapa-5-50",
            imagen: "/productos/winny-pants-etapa-5-50.jpg",
            esDestacado: true
          },
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
        metadataWeb: true,
        categoria: {
          select: {
            nombre: true,
            parent: {
              select: {
                nombre: true
              }
            }
          }
        },
      }
    });
  }

  // Zonas de cobertura local directa (Cali y alrededores con domiciliario propio)
  private readonly ZONAS_LOCALES = [
    'cali',
    'candelaria',
    'palmira',
    'jamundi',
    'jamundí',
    'yumbo',
    'ciudad del campo',
    'poblado campestre',
  ];

  public esZonaLocal(ciudad?: string | null): boolean {
    if (!ciudad) return false;
    const norm = String(ciudad).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return this.ZONAS_LOCALES.some((z) => norm.includes(z.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
  }

  // Regla de envío: Local es $8.000 (gratis >= $150.000). Nacional es $0 en la tienda (flete al cobro por transportadora).
  private calcularEnvio(subtotal: number, ciudad?: string | null) {
    if (ciudad && !this.esZonaLocal(ciudad)) {
      return 0; // Nacional: Flete al cobro directamente a la transportadora
    }
    return subtotal >= 150000 ? 0 : 8000;
  }

  private sanitizeText(v: unknown, max: number): string {
    return String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
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

    // ── Validación de entrada (nunca confiar en el navegador) ──
    const nombre = this.sanitizeText(dto?.nombre, 120);
    const telefono = this.sanitizeText(dto?.telefono, 30).replace(/[^\d+ ]/g, '');
    const ciudad = this.sanitizeText(dto?.ciudad, 80);
    const direccion = this.sanitizeText(dto?.direccion, 400);
    const email = this.sanitizeText(dto?.email, 120);
    const medioPago = this.sanitizeText(dto?.medioPago, 80);
    const metodoCodigo = ['contra_entrega', 'transferencia', 'mercadopago', 'credito'].includes(dto?.metodoPagoCodigo)
      ? dto.metodoPagoCodigo
      : (medioPago.includes('Contra Entrega') ? 'contra_entrega' : (medioPago.toLowerCase().includes('crédito') || medioPago.toLowerCase().includes('credito') ? 'credito' : 'transferencia'));

    const rawDocumento = this.sanitizeText(dto?.documento || dto?.numeroDocumento, 30).replace(/[^\w-]/g, '');
    const esConsumidorFinal = Boolean(dto?.esConsumidorFinal) || rawDocumento === '222222222222';
    const tipoDocumento = ['CC', 'NIT', 'CE', 'PASAPORTE', 'TI'].includes(dto?.tipoDocumento)
      ? dto.tipoDocumento
      : (esConsumidorFinal ? 'NIT' : 'CC');
    const numeroDocumento = esConsumidorFinal ? '222222222222' : rawDocumento;

    if (!nombre || telefono.replace(/\D/g, '').length < 7 || !direccion || !ciudad) {
      throw new BadRequestException('Datos de entrega incompletos');
    }
    if (!Array.isArray(dto?.items) || dto.items.length === 0 || dto.items.length > 100) {
      throw new BadRequestException('El carrito está vacío o es inválido');
    }

    // Agrupar cantidades por producto
    const cantidades = new Map<number, number>();
    for (const it of dto.items) {
      const id = Number(it?.productoId);
      const cant = Number(it?.cantidad);
      if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(cant) || cant < 1 || cant > 999) {
        throw new BadRequestException('Producto o cantidad inválida');
      }
      cantidades.set(id, (cantidades.get(id) ?? 0) + cant);
    }

    // Precios SIEMPRE desde la base de datos
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: [...cantidades.keys()] }, empresaId, publicadoWeb: true, activo: true },
      select: { id: true, nombre: true, precioWeb: true, precioBase: true },
    });
    if (productos.length !== cantidades.size) {
      throw new BadRequestException('Uno o más productos ya no están disponibles');
    }
    const lineas = productos.map((p) => {
      const web = Number(p.precioWeb ?? 0);
      const precio = web > 0 ? web : Number(p.precioBase ?? 0);
      const cantidad = cantidades.get(p.id)!;
      return { productoId: p.id, nombre: p.nombre, precio, cantidad, total: precio * cantidad };
    });
    if (lineas.some((l) => !(l.precio > 0))) {
      throw new BadRequestException('Uno o más productos no tienen precio configurado');
    }

    if (metodoCodigo === 'contra_entrega' && !this.esZonaLocal(ciudad)) {
      throw new BadRequestException(
        'El pago contra entrega en efectivo solo está disponible para Cali y alrededores (Cali, Candelaria, Ciudad del Campo, Poblado Campestre, Palmira, Jamundí y Yumbo). Para envíos nacionales, por favor selecciona Transferencia o Mercado Pago.'
      );
    }

    const subtotal = lineas.reduce((s, l) => s + l.total, 0);
    const envio = this.calcularEnvio(subtotal, ciudad);
    const total = subtotal;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Encontrar o Crear el Tercero (Cliente)
      let cliente: any = null;

      if (esConsumidorFinal) {
        cliente = await tx.tercero.findFirst({
          where: {
            empresaId,
            numeroDocumento: '222222222222',
          }
        });

        if (!cliente) {
          cliente = await tx.tercero.create({
            data: {
              empresaId,
              nombre: 'Consumidor Final',
              nombreComercial: nombre || 'Consumidor Final Web',
              tipoPersona: 'NATURAL',
              tipoDocumento: 'NIT',
              numeroDocumento: '222222222222',
              email: email || null,
              telefono,
              direccion,
              municipio: ciudad,
              esCliente: true,
              activo: true,
              notas: 'Cliente Consumidor Final registrado desde Tienda Web',
            }
          });
        }
      } else {
        if (numeroDocumento) {
          cliente = await tx.tercero.findFirst({
            where: {
              empresaId,
              numeroDocumento,
            }
          });
        }

        if (!cliente && (email || telefono)) {
          cliente = await tx.tercero.findFirst({
            where: {
              empresaId,
              OR: [
                ...(email ? [{ email }] : []),
                ...(telefono ? [{ telefono }] : [])
              ]
            }
          });
        }

        if (cliente) {
          const updateData: any = {};
          if (!cliente.esCliente) updateData.esCliente = true;
          if (!cliente.email && email) updateData.email = email;
          if (!cliente.telefono && telefono) updateData.telefono = telefono;
          if (!cliente.direccion && direccion) updateData.direccion = direccion;
          if (!cliente.municipio && ciudad) updateData.municipio = ciudad;

          if (Object.keys(updateData).length > 0) {
            cliente = await tx.tercero.update({
              where: { id: cliente.id },
              data: updateData,
            });
          }
        } else {
          const doc = numeroDocumento || `WEB-${1000 + await tx.tercero.count({ where: { empresaId } })}`;
          cliente = await tx.tercero.create({
            data: {
              empresaId,
              nombre,
              tipoPersona: 'NATURAL',
              tipoDocumento,
              numeroDocumento: doc,
              email: email || null,
              telefono,
              direccion,
              municipio: ciudad,
              esCliente: true,
              activo: true,
              notas: 'Cliente registrado desde la Tienda Virtual (Web)',
            }
          });
        }
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

      // 3. Verificar si viene un orderId previo en estado PENDIENTE para reutilizarlo
      let order: any = null;
      let orderNum = '';

      if (dto.orderId && Number.isInteger(Number(dto.orderId))) {
        const existing = await (tx as any).pedidoVenta.findFirst({
          where: { id: Number(dto.orderId), empresaId, estado: 'PENDIENTE' },
        });
        if (existing) {
          order = existing;
          orderNum = existing.numero;
        }
      }

      const tipoEnvioTexto = this.esZonaLocal(ciudad)
      ? `Domicilio Local ($${envio === 0 ? 'Gratis' : envio})`
      : 'Nacional por Transportadora (Flete al Cobro)';
    const notasPedido = `Pedido recibido desde tienda virtual. Ciudad: ${ciudad}. Dirección: ${direccion}. Teléfono: ${telefono}. Método de pago: ${medioPago || metodoCodigo}. Tipo de Envío: ${tipoEnvioTexto}.`;
      const condicionesPago = metodoCodigo === 'contra_entrega'
        ? 'CONTRA_ENTREGA'
        : metodoCodigo === 'mercadopago'
        ? 'MERCADOPAGO_PENDIENTE'
        : metodoCodigo === 'credito'
        ? 'CREDITO_PENDIENTE'
        : 'ANTICIPADO';

      if (order) {
        // Reutilizar y actualizar pedido existente
        await (tx as any).pedidoVentaItem.deleteMany({ where: { pedidoId: order.id } });
        order = await (tx as any).pedidoVenta.update({
          where: { id: order.id },
          data: {
            clienteId: cliente.id,
            notas: notasPedido,
            condicionesPago,
            subtotal,
            total,
            items: {
              create: lineas.map((l, idx) => ({
                productoId: l.productoId,
                descripcion: l.nombre,
                unidad: 'UND',
                cantidad: l.cantidad,
                precioUnitario: l.precio,
                descuentoPct: 0,
                descuentoValor: 0,
                tipoIva: 'EXCLUIDO',
                baseIva: l.total,
                ivaValor: 0,
                subtotal: l.total,
                total: l.total,
                orden: idx
              }))
            }
          }
        });
      } else {
        // Generar nuevo consecutivo de pedido (PedidoVenta)
        const lastOrder = await (tx as any).pedidoVenta.findFirst({
          where: { empresaId },
          orderBy: { id: 'desc' }
        });
        const seq = lastOrder ? parseInt(lastOrder.numero.split('-').pop() ?? '0') + 1 : 1;
        orderNum = `PED-${seq.toString().padStart(6, '0')}`;

        // 4. Crear PedidoVenta
        order = await (tx as any).pedidoVenta.create({
          data: {
            empresaId,
            numero: orderNum,
            clienteId: cliente.id,
            bodegaId: bodega.id,
            fecha: new Date(),
            notas: notasPedido,
            condicionesPago,
            subtotal,
            total,
            descuento: 0,
            baseIva19: 0,
            iva19: 0,
            baseIva5: 0,
            iva5: 0,
            estado: 'PENDIENTE',
            items: {
              create: lineas.map((l, idx) => ({
                productoId: l.productoId,
                descripcion: l.nombre,
                unidad: 'UND',
                cantidad: l.cantidad,
                precioUnitario: l.precio,
                descuentoPct: 0,
                descuentoValor: 0,
                tipoIva: 'EXCLUIDO',
                baseIva: l.total,
                ivaValor: 0,
                subtotal: l.total,
                total: l.total,
                orden: idx
              }))
            }
          }
        });

        // 5. Crear Notificación de Campana en el ERP
        await (tx as any).notificacion.create({
          data: {
            empresaId,
            tipo: 'INFO',
            titulo: 'Nuevo Pedido Web',
            mensaje: `Se ha recibido el pedido ${orderNum} de ${nombre} por valor de ${this.cop(total + envio)} (${medioPago || metodoCodigo}).`,
            leida: false,
          }
        });
      }

      return { orderId: order.id, numero: orderNum };
    });

    // 6. Mercado Pago: se crea la preferencia FUERA de la transacción (llamada externa)
    let checkoutUrl: string | null = null;
    if (metodoCodigo === 'mercadopago' && this.mp.isEnabled(config.slugTienda)) {
      const items = lineas.map((l) => ({
        id: String(l.productoId),
        title: l.nombre.slice(0, 250),
        quantity: l.cantidad,
        unit_price: l.precio,
      }));
      if (envio > 0) items.push({ id: 'ENVIO', title: 'Envío a domicilio', quantity: 1, unit_price: envio });

      const pref = await this.mp.createPreference({
        slug: config.slugTienda,
        dominioPropio: (config as any).dominioPropio,
        orderId: result.orderId,
        orderNumero: result.numero,
        items,
        payerName: nombre,
      });
      checkoutUrl = pref?.initPoint ?? null;
    }

    return {
      success: true,
      orderId: result.orderId,
      numero: result.numero,
      subtotal,
      envio,
      total: total + envio,
      checkoutUrl,
    };
  }

  private cop(v: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
  }

  /**
   * Webhook de Mercado Pago. Nunca se confía en el cuerpo: se consulta el pago
   * en la API de MP con el token de la tienda y se valida tienda, pedido y monto.
   */
  async procesarWebhookMercadoPago(slug: string, query: any, body: any, headers: Record<string, any>) {
    const tipo = String(body?.type ?? body?.topic ?? query?.type ?? query?.topic ?? '');
    const dataId = String(body?.data?.id ?? query?.['data.id'] ?? query?.id ?? '');

    if (tipo !== 'payment' || !/^\d{1,20}$/.test(dataId)) {
      return { received: true, ignored: true };
    }

    const config = await this.prisma.configuracionTienda.findFirst({ where: { slugTienda: slug } });
    if (!config || !this.mp.isEnabled(slug)) return { received: true, ignored: true };

    if (!this.mp.verifySignature(slug, headers, dataId)) {
      throw new UnauthorizedException('Firma inválida');
    }

    const pago = await this.mp.getPayment(slug, dataId);
    if (!pago) return { received: true, ignored: true };

    const orderId = Number(pago.external_reference);
    if (!Number.isInteger(orderId) || orderId <= 0) return { received: true, ignored: true };

    const pedido = await this.prisma.pedidoVenta.findFirst({
      where: { id: orderId, empresaId: config.empresaId },
      include: { cliente: true },
    });
    if (!pedido) return { received: true, ignored: true };

    const esperado = Number(pedido.total) + this.calcularEnvio(Number(pedido.total), pedido.cliente?.municipio);
    const marca = `[MP pago ${pago.id}]`;

    // Idempotencia: si ya se registró este pago aprobado, no repetir
    if (pedido.condicionesPago === 'MERCADOPAGO_APROBADO') return { received: true };

    if (pago.status === 'approved') {
      if (pago.currency_id !== 'COP' || Math.round(pago.transaction_amount) < Math.round(esperado)) {
        this.logger.warn(`Pago MP ${pago.id} con monto/moneda inesperados para pedido ${pedido.numero}`);
        await this.prisma.notificacion.create({
          data: {
            empresaId: config.empresaId, tipo: 'ADVERTENCIA', titulo: 'Revisar pago Mercado Pago',
            mensaje: `El pago ${pago.id} del pedido ${pedido.numero} no coincide con el total esperado (${this.cop(esperado)}).`,
            leida: false,
          },
        });
        return { received: true };
      }

      await this.prisma.pedidoVenta.update({
        where: { id: pedido.id },
        data: {
          estado: 'APROBADO',
          condicionesPago: 'MERCADOPAGO_APROBADO',
          notas: `${pedido.notas ?? ''}\n${marca} APROBADO ${this.cop(pago.transaction_amount)} (${pago.payment_method_id ?? ''}).`,
        },
      });
      await this.prisma.notificacion.create({
        data: {
          empresaId: config.empresaId, tipo: 'ALERTA', titulo: '💳 Pago recibido (Mercado Pago)',
          mensaje: `El pedido ${pedido.numero} fue pagado: ${this.cop(pago.transaction_amount)}.`,
          leida: false,
        },
      });
    } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(pago.status)) {
      if (!(pedido.notas ?? '').includes(`${marca} ${pago.status}`)) {
        await this.prisma.pedidoVenta.update({
          where: { id: pedido.id },
          data: {
            condicionesPago: 'MERCADOPAGO_RECHAZADO',
            notas: `${pedido.notas ?? ''}\n${marca} ${pago.status} (${pago.status_detail}).`,
          },
        });
      }
    }

    return { received: true };
  }

  /**
   * Permite al cliente cambiar la forma de pago de un pedido pendiente desde la web.
   * Si cambia a Mercado Pago, genera la preferencia para que pueda pagar de inmediato.
   */
  async cambiarMetodoPagoWeb(slug: string, orderId: number, body: { metodoCodigo: string; medioPago?: string }) {
    const config = await this.prisma.configuracionTienda.findFirst({ where: { slugTienda: slug } });
    if (!config) throw new NotFoundException('Tienda no encontrada');

    const pedido = await (this.prisma as any).pedidoVenta.findFirst({
      where: { id: orderId, empresaId: config.empresaId },
      include: { items: true, cliente: true },
    });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    // Solo permitir si el pedido está en estado PENDIENTE
    if (pedido.estado !== 'PENDIENTE') {
      return { success: false, message: 'El pedido ya no está pendiente de pago.' };
    }

    const metodoCodigo = String(body?.metodoCodigo || '').trim().toLowerCase();
    const medioPago = String(body?.medioPago || metodoCodigo).slice(0, 100);

    if (metodoCodigo === 'contra_entrega' && !this.esZonaLocal(pedido.cliente?.municipio)) {
      throw new BadRequestException(
        'El pago contra entrega en efectivo solo está disponible para Cali y alrededores (Cali, Candelaria, Ciudad del Campo, Poblado Campestre, Palmira, Jamundí y Yumbo).'
      );
    }

    const condicionesPago = metodoCodigo === 'contra_entrega'
      ? 'CONTRA_ENTREGA'
      : metodoCodigo === 'mercadopago'
      ? 'MERCADOPAGO_PENDIENTE'
      : metodoCodigo === 'credito'
      ? 'CREDITO_PENDIENTE'
      : 'ANTICIPADO';

    const notaCambio = `[Forma de pago cambiada a: ${medioPago}]`;
    const notasActuales = pedido.notas || '';
    const notas = notasActuales.includes(notaCambio) ? notasActuales : `${notasActuales}\n${notaCambio}`;

    await (this.prisma as any).pedidoVenta.update({
      where: { id: pedido.id },
      data: {
        condicionesPago,
        notas,
      },
    });

    let checkoutUrl: string | null = null;
    if (metodoCodigo === 'mercadopago' && this.mp.isEnabled(config.slugTienda)) {
      const envio = this.calcularEnvio(Number(pedido.total), pedido.cliente?.municipio);
      const items = (pedido.items || []).map((it: any) => ({
        id: String(it.productoId),
        title: String(it.descripcion || 'Producto').slice(0, 250),
        quantity: Number(it.cantidad || 1),
        unit_price: Number(it.precioUnitario || 0),
      }));
      if (envio > 0) items.push({ id: 'ENVIO', title: 'Envío a domicilio', quantity: 1, unit_price: envio });

      const pref = await this.mp.createPreference({
        slug: config.slugTienda,
        dominioPropio: (config as any).dominioPropio,
        orderId: pedido.id,
        orderNumero: pedido.numero,
        items,
        payerName: pedido.cliente?.nombreRazonSocial || 'Cliente',
      });
      checkoutUrl = pref?.initPoint ?? null;
    }

    return {
      success: true,
      orderId: pedido.id,
      numero: pedido.numero,
      condicionesPago,
      checkoutUrl,
    };
  }
}
