import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const SMASH_SEED_PRODUCTS = [
  // --- RAQUETAS ---
  {
    sku: "793-2TV",
    referencia: "793-2TV",
    nombre: "Raqueta Wilson DAFYER 98 V1 Modelo 2026",
    descripcion: "Raqueta de control y potencia Wilson Dafyer 98 V1 temporada 2026.",
    descripcionWeb: "Raqueta de control y potencia Wilson Dafyer 98 V1 temporada 2026. Aro 98 diseñado para jugadores que buscan máxima precisión y toque milimétrico en cada golpe.",
    categoriaNombre: "Raquetas",
    marcaNombre: "Wilson",
    precioBase: 1250000,
    precioWeb: 1250000,
    slug: "raqueta-wilson-dafyer-98-v1-2026",
    esDestacado: true,
  },
  {
    sku: "794-2TV",
    referencia: "794-2TV",
    nombre: "Raqueta Wilson DAFYER 100 L V1 Modelo 2026",
    descripcion: "Versión ligera 100L de la línea Dafyer 2026 para mayor maniobrabilidad.",
    descripcionWeb: "Versión ligera 100L de la línea Dafyer 2026 para mayor maniobrabilidad y aceleración rápida en swing.",
    categoriaNombre: "Raquetas",
    marcaNombre: "Wilson",
    precioBase: 1150000,
    precioWeb: 1150000,
    slug: "raqueta-wilson-dafyer-100l-v1-2026",
    esDestacado: false,
  },
  {
    sku: "795-2TV",
    referencia: "795-2TV",
    nombre: "Raqueta Wilson DAFYER 100 V1 Modelo 2026",
    descripcion: "Aro 100 con equilibrio perfecto entre potencia y estabilidad.",
    descripcionWeb: "Aro 100 con equilibrio perfecto entre potencia y estabilidad para tenistas de nivel intermedio a avanzado.",
    categoriaNombre: "Raquetas",
    marcaNombre: "Wilson",
    precioBase: 1250000,
    precioWeb: 1250000,
    slug: "raqueta-wilson-dafyer-100-v1-2026",
    esDestacado: true,
  },
  {
    sku: "796-2TV",
    referencia: "796-2TV",
    nombre: "Raqueta Babolat Drive Boost Wim 2026",
    descripcion: "Edición conmemorativa Wimbledon con grafito ligero para nivel intermedio.",
    descripcionWeb: "Edición conmemorativa Wimbledon con grafito ligero para nivel intermedio. Gran maniobrabilidad y sensaciones confortables.",
    categoriaNombre: "Raquetas",
    marcaNombre: "Babolat",
    precioBase: 750000,
    precioWeb: 750000,
    slug: "raqueta-babolat-drive-boost-wim-2026",
    esDestacado: false,
  },
  {
    sku: "797-2TV",
    referencia: "797-2TV",
    nombre: "Raqueta Babolat Pure Drive Wim 2026",
    descripcion: "La legendaria Pure Drive con estética oficial Wimbledon 2026.",
    descripcionWeb: "La legendaria Pure Drive con estética oficial Wimbledon 2026. Explosividad pura y punto dulce amplio.",
    categoriaNombre: "Raquetas",
    marcaNombre: "Babolat",
    precioBase: 1250000,
    precioWeb: 1250000,
    slug: "raqueta-babolat-pure-drive-wim-2026",
    esDestacado: true,
  },
  {
    sku: "798-2TV",
    referencia: "798-2TV",
    nombre: "Raqueta Babolat Pure Aero 98 Gen 9 2026",
    descripcion: "Aro 98 optimizado para spin agresivo y golpes liftados de alta precisión.",
    descripcionWeb: "Aro 98 optimizado para spin agresivo y golpes liftados de alta precisión como Carlos Alcaraz.",
    categoriaNombre: "Raquetas",
    marcaNombre: "Babolat",
    precioBase: 1250000,
    precioWeb: 1250000,
    slug: "raqueta-babolat-pure-aero-98-gen-9-2026",
    esDestacado: true,
  },
  {
    sku: "799-2TV",
    referencia: "799-2TV",
    nombre: "Raqueta Babolat Pure Drive (300 g) Modelo 2025",
    descripcion: "300 gramos, balance y potencia emblemática de Babolat.",
    descripcionWeb: "300 gramos, balance y potencia emblemática de Babolat. Ideal para jugadores de fondo de pista agresivos.",
    categoriaNombre: "Raquetas",
    marcaNombre: "Babolat",
    precioBase: 1250000,
    precioWeb: 1250000,
    slug: "raqueta-babolat-pure-drive-300g-2025",
    esDestacado: true,
  },
  {
    sku: "800-2TV",
    referencia: "800-2TV",
    nombre: "Raqueta Babolat Pure Drive Team (285 g) Modelo 2025",
    descripcion: "285g para jugadores que buscan la potencia de Pure Drive con mayor maniobrabilidad.",
    descripcionWeb: "285g para jugadores que buscan la potencia de Pure Drive con mayor maniobrabilidad y menos exigencia física.",
    categoriaNombre: "Raquetas",
    marcaNombre: "Babolat",
    precioBase: 1250000,
    precioWeb: 1250000,
    slug: "raqueta-babolat-pure-drive-team-285g-2025",
    esDestacado: false,
  },
  {
    sku: "802-2TV",
    referencia: "802-2TV",
    nombre: "Raqueta Head Speed MP Modelo 2026",
    descripcion: "La raqueta elegida por Jannik Sinner con tecnología Auxetic 2.0.",
    descripcionWeb: "La raqueta elegida por Jannik Sinner con tecnología Auxetic 2.0 para una sensación de impacto sensacional y velocidad en cada tiro.",
    categoriaNombre: "Raquetas",
    marcaNombre: "Head",
    precioBase: 1250000,
    precioWeb: 1250000,
    slug: "raqueta-head-speed-mp-2026",
    esDestacado: true,
  },
  {
    sku: "804-2TV",
    referencia: "804-2TV",
    nombre: "Raqueta Wilson Blade 98 V10 Modelo 2026",
    descripcion: "La raqueta de control número 1 del circuito profesional en su décima generación.",
    descripcionWeb: "La raqueta de control número 1 del circuito profesional en su décima generación con flexibilidad y estabilidad perfeccionadas.",
    categoriaNombre: "Raquetas",
    marcaNombre: "Wilson",
    precioBase: 1290000,
    precioWeb: 1290000,
    slug: "raqueta-wilson-blade-98-v10-2026",
    esDestacado: true,
  },
  {
    sku: "805-2TV",
    referencia: "805-2TV",
    nombre: "Raqueta Yonex EZONE 100 Modelo 2025",
    descripcion: "Forma Isométrica distintiva con un sweetspot 7% más amplio.",
    descripcionWeb: "Forma Isométrica distintiva con un sweetspot 7% más amplio y sensación ultra suave para mitigar vibraciones.",
    categoriaNombre: "Raquetas",
    marcaNombre: "Yonex",
    precioBase: 1290000,
    precioWeb: 1290000,
    slug: "raqueta-yonex-ezone-100-2025",
    esDestacado: true,
  },

  // --- CALZADO DEPORTIVO ---
  {
    sku: "810-2TV",
    referencia: "810-2TV",
    nombre: "Zapatillas Asics Solution Speed FF 3 Clay",
    descripcion: "Calzado de alta gama para arcilla ultra veloz y ligero.",
    descripcionWeb: "Calzado de alta gama para arcilla ultra veloz y ligero con suela completa de espina de pescado Precision-Sole.",
    categoriaNombre: "Calzado Deportivo",
    marcaNombre: "Asics",
    precioBase: 690000,
    precioWeb: 690000,
    slug: "zapatillas-asics-solution-speed-ff-3-clay",
    esDestacado: true,
  },
  {
    sku: "811-2TV",
    referencia: "811-2TV",
    nombre: "Zapatillas Asics Gel-Challenger 14 Clay",
    descripcion: "Excelente estabilidad lateral con tecnología Wingwall para fondo de pista.",
    descripcionWeb: "Excelente estabilidad lateral con tecnología Wingwall para fondo de pista en canchas de tenis y pádel.",
    categoriaNombre: "Calzado Deportivo",
    marcaNombre: "Asics",
    precioBase: 490000,
    precioWeb: 490000,
    slug: "zapatillas-asics-gel-challenger-14-clay",
    esDestacado: false,
  },
  {
    sku: "812-2TV",
    referencia: "812-2TV",
    nombre: "Zapatillas Asics Court FF 3 Novak Clay",
    descripcion: "Diseñadas y probadas en conjunto con Novak Djokovic.",
    descripcionWeb: "Diseñadas y probadas en conjunto con Novak Djokovic para recuperaciones rápidas y deslizamientos controlados.",
    categoriaNombre: "Calzado Deportivo",
    marcaNombre: "Asics",
    precioBase: 790000,
    precioWeb: 790000,
    slug: "zapatillas-asics-court-ff-3-novak-clay",
    esDestacado: true,
  },
  {
    sku: "815-2TV",
    referencia: "815-2TV",
    nombre: "Zapatillas Nike Vapor Pro 2 Clay",
    descripcion: "Perfil bajo y unidad Zoom Air en el antepié para aceleración explosiva.",
    descripcionWeb: "Perfil bajo y unidad Zoom Air en el antepié para aceleración explosiva en canchas de polvo de ladrillo.",
    categoriaNombre: "Calzado Deportivo",
    marcaNombre: "Nike",
    precioBase: 650000,
    precioWeb: 650000,
    slug: "zapatillas-nike-vapor-pro-2-clay",
    esDestacado: true,
  },

  // --- CUERDAS ---
  {
    sku: "830-2TV",
    referencia: "830-2TV",
    nombre: "Rollo Cuerda Luxilon ALU Power 125 (220m)",
    descripcion: "El cordaje número 1 del Tour mundial en carrete de 220 metros.",
    descripcionWeb: "El cordaje número 1 del Tour mundial en carrete de 220 metros para un control absoluto y retención de tensión premium.",
    categoriaNombre: "Cuerdas",
    marcaNombre: "Luxilon",
    precioBase: 950000,
    precioWeb: 950000,
    slug: "rollo-luxilon-alu-power-125-220m",
    esDestacado: true,
  },
  {
    sku: "831-2TV",
    referencia: "831-2TV",
    nombre: "Set Individual Cuerda Babolat RPM Blast 125",
    descripcion: "Monofilamento octogonal de co-poliéster para máximo spin.",
    descripcionWeb: "Monofilamento octogonal de co-poliéster para máximo spin y durabilidad utilizado por Rafa Nadal.",
    categoriaNombre: "Cuerdas",
    marcaNombre: "Babolat",
    precioBase: 85000,
    precioWeb: 85000,
    slug: "set-cuerda-babolat-rpm-blast-125",
    esDestacado: false,
  },
  {
    sku: "832-2TV",
    referencia: "832-2TV",
    nombre: "Set Individual Cuerda Yonex Poly Tour Pro 125",
    descripcion: "Sensación suave y gran confort para jugadores exigentes.",
    descripcionWeb: "Sensación suave y gran confort para jugadores exigentes que buscan control con menor impacto en el brazo.",
    categoriaNombre: "Cuerdas",
    marcaNombre: "Yonex",
    precioBase: 79000,
    precioWeb: 79000,
    slug: "set-cuerda-yonex-poly-tour-pro-125",
    esDestacado: false,
  },

  // --- GRIPS & OVERGRIPS ---
  {
    sku: "840-2TV",
    referencia: "840-2TV",
    nombre: "Tarro Overgrip Wilson Pro Comfort x 30 Unidades",
    descripcion: "El overgrip preferido por profesionales por su adherencia y absorción.",
    descripcionWeb: "El overgrip preferido por profesionales por su adherencia y absorción en presentación tambor de 30 unidades.",
    categoriaNombre: "Grips & Overgrips",
    marcaNombre: "Wilson",
    precioBase: 195000,
    precioWeb: 195000,
    slug: "tarro-overgrip-wilson-pro-comfort-30",
    esDestacado: true,
  },
  {
    sku: "841-2TV",
    referencia: "841-2TV",
    nombre: "Pack Overgrip Yonex Super Grap x 3 Unidades",
    descripcion: "Tacto pegajoso y gran absorción de sudor.",
    descripcionWeb: "Tacto pegajoso y gran absorción de sudor en blíster de 3 unidades para raqueta o pala de pádel.",
    categoriaNombre: "Grips & Overgrips",
    marcaNombre: "Yonex",
    precioBase: 35000,
    precioWeb: 35000,
    slug: "pack-overgrip-yonex-super-grap-3",
    esDestacado: false,
  },

  // --- MALETAS & RAQUETEROS ---
  {
    sku: "850-2TV",
    referencia: "850-2TV",
    nombre: "Raquetero Wilson Super Tour Red 9 Raquetas",
    descripcion: "Compartimentos térmicos Thermoguard para proteger raquetas y tensión.",
    descripcionWeb: "Compartimentos térmicos Thermoguard para proteger raquetas y tensión de temperaturas extremas.",
    categoriaNombre: "Maletas",
    marcaNombre: "Wilson",
    precioBase: 650000,
    precioWeb: 650000,
    slug: "raquetero-wilson-super-tour-red-9",
    esDestacado: true,
  },
  {
    sku: "851-2TV",
    referencia: "851-2TV",
    nombre: "Mochila Babolat Pure Aero Backpack",
    descripcion: "Mochila versátil y expandible con protección térmica para hasta 3 raquetas.",
    descripcionWeb: "Mochila versátil y expandible con protección térmica para hasta 3 raquetas y compartimento para calzado.",
    categoriaNombre: "Maletas",
    marcaNombre: "Babolat",
    precioBase: 390000,
    precioWeb: 390000,
    slug: "mochila-babolat-pure-aero-backpack",
    esDestacado: false,
  },

  // --- CANCHAS & ACCESORIOS ---
  {
    sku: "860-2TV",
    referencia: "860-2TV",
    nombre: "Malla Oficial de Tenis Doble Cable ITF",
    descripcion: "Malla profesional con cable de acero y banda de vinilo resistente.",
    descripcionWeb: "Malla profesional con cable de acero y banda de vinilo resistente para clubes y canchas de competición.",
    categoriaNombre: "Canchas & Redes",
    marcaNombre: "Smash",
    precioBase: 1490000,
    precioWeb: 1490000,
    slug: "malla-oficial-tenis-doble-cable-itf",
    esDestacado: false,
  },

  // --- SERVICIOS ---
  {
    sku: "997TV",
    referencia: "997TV",
    nombre: "Servicio de Encordado Computarizado de Raqueta",
    descripcion: "Encordado profesional con calibración electrónica de tensión exacta.",
    descripcionWeb: "Encordado profesional con calibración electrónica de tensión exacta en máquinas electrónicas de 6 puntos.",
    categoriaNombre: "Servicios",
    marcaNombre: "Smash",
    precioBase: 25000,
    precioWeb: 25000,
    slug: "servicio-encordado-computarizado",
    esDestacado: true,
  },
  {
    sku: "998TV",
    referencia: "998TV",
    nombre: "Servicio de Balanceo y Personalización de Peso",
    descripcion: "Ajuste de peso estático, swingweight y balance para parejas de raquetas idénticas.",
    descripcionWeb: "Ajuste de peso estático, swingweight y balance para parejas de raquetas idénticas.",
    categoriaNombre: "Servicios",
    marcaNombre: "Smash",
    precioBase: 120000,
    precioWeb: 120000,
    slug: "servicio-balanceo-personalizacion-peso",
    esDestacado: false,
  }
];

export async function seedSmashClient() {
  console.log('🎾 Aprovisionando cliente y tienda Smash Tenis y Pádel en Edatia ERP...');

  // 1. Crear o actualizar Empresa Smash
  const nitSmash = '1234567';
  const empresaSmash = await prisma.empresa.upsert({
    where: { nit: nitSmash },
    update: {
      nombre: 'Smash Tenis y Pádel',
      nombreComercial: 'Smash',
      email: 'admin@smash.com',
      telefono: '+573105559876',
      direccion: 'Bogotá, Colombia',
      tipoPersona: 'JURIDICA',
      regimenFiscal: '48',
    },
    create: {
      nit: nitSmash,
      digitoVerificacion: '1',
      nombre: 'Smash Tenis y Pádel',
      nombreComercial: 'Smash',
      email: 'admin@smash.com',
      telefono: '+573105559876',
      direccion: 'Bogotá, Colombia',
      tipoPersona: 'JURIDICA',
      regimenFiscal: '48',
    },
  });
  console.log(`✅ Empresa registrada: ${empresaSmash.nombre} (NIT: ${empresaSmash.nit}, ID: ${empresaSmash.id})`);

  // 2. Bodega Principal Smash
  const bodegaSmash = await prisma.bodega.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresaSmash.id,
        codigo: 'BOD-SMASH',
      },
    },
    update: {
      nombre: 'Bodega Principal Smash',
      activo: true,
    },
    create: {
      empresaId: empresaSmash.id,
      codigo: 'BOD-SMASH',
      nombre: 'Bodega Principal Smash',
      direccion: 'Sede Smash Bogotá',
      activo: true,
    },
  });
  console.log(`✅ Bodega principal creada: ${bodegaSmash.nombre} (${bodegaSmash.codigo})`);

  // 3. Crear tipos de identificación básica si no existen
  const tiposIdDef = [
    { codigoDian: '31', nombreCorto: 'NIT', descripcion: 'Número de Identificación Tributaria' },
    { codigoDian: '13', nombreCorto: 'CC', descripcion: 'Cédula de Ciudadanía' },
    { codigoDian: '22', nombreCorto: 'CE', descripcion: 'Cédula de Extranjería' },
  ];
  for (const t of tiposIdDef) {
    await prisma.tipoIdentificacion.upsert({
      where: {
        empresaId_codigoDian: {
          empresaId: empresaSmash.id,
          codigoDian: t.codigoDian,
        },
      },
      update: {},
      create: {
        empresaId: empresaSmash.id,
        codigoDian: t.codigoDian,
        nombreCorto: t.nombreCorto,
        descripcion: t.descripcion,
        activo: true,
      },
    });
  }

  // 4. Crear o actualizar Usuario Administrador
  // Usuario: admin | Contraseña: Smash2026* | Email: admin@smash.com
  const passwordHash = await bcrypt.hash('Smash2026*', 12);
  const adminUser = await prisma.user.upsert({
    where: {
      empresaId_usuario: {
        empresaId: empresaSmash.id,
        usuario: 'admin',
      },
    },
    update: {
      email: 'admin@smash.com',
      password: passwordHash,
      nombre: 'Administrador Smash',
      rol: 'admin',
      activo: true,
      loginFallidosConsecutivos: 0,
      loginBloqueadoHasta: null,
    },
    create: {
      empresaId: empresaSmash.id,
      usuario: 'admin',
      email: 'admin@smash.com',
      nombre: 'Administrador Smash',
      password: passwordHash,
      rol: 'admin',
      activo: true,
    },
  });
  console.log(`✅ Usuario Administrador aprovisionado: ${adminUser.usuario} (${adminUser.email})`);

  // 5. Vincular al Manager con Plan Premium
  const planPremium = await prisma.planBase.findFirst({ where: { nombre: 'Premium' } }) || { id: 1 };
  await (prisma as any).clienteManager.upsert({
    where: { nit: nitSmash },
    update: {
      empresaId: empresaSmash.id,
      planBaseId: planPremium.id,
      estado: 'ACTIVO',
    },
    create: {
      nit: nitSmash,
      nombre: 'Smash Tenis y Pádel',
      empresaId: empresaSmash.id,
      planBaseId: planPremium.id,
      estado: 'ACTIVO',
      email: 'admin@smash.com',
      telefono: '+573105559876',
    },
  });

  // 6. Configuración de Tienda Virtual (Slug: smash)
  const storeConfig = await prisma.configuracionTienda.upsert({
    where: { empresaId: empresaSmash.id },
    update: {
      slugTienda: 'smash',
      nombreTienda: 'Smash - Tienda de Tenis y Pádel',
      whatsappVentas: '+573105559876',
      montoEnvioGratis: 200000,
      costoEnvioBase: 12000,
      colorPrimario: '#171717',
      activo: true,
    },
    create: {
      empresaId: empresaSmash.id,
      slugTienda: 'smash',
      nombreTienda: 'Smash - Tienda de Tenis y Pádel',
      whatsappVentas: '+573105559876',
      montoEnvioGratis: 200000,
      costoEnvioBase: 12000,
      colorPrimario: '#171717',
      activo: true,
    },
  });
  console.log(`✅ Configuración de Tienda Virtual activa: slug '${storeConfig.slugTienda}'`);

  // 7. Poblar Categorías y Productos de Smash en el ERP
  const categoriasMap = new Map<string, number>();
  for (const item of SMASH_SEED_PRODUCTS) {
    if (!categoriasMap.has(item.categoriaNombre)) {
      const catSlug = item.categoriaNombre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const cat = await prisma.categoria.upsert({
        where: {
          empresaId_slug: {
            empresaId: empresaSmash.id,
            slug: catSlug,
          },
        },
        update: {},
        create: {
          empresaId: empresaSmash.id,
          nombre: item.categoriaNombre,
          slug: catSlug,
        },
      });
      categoriasMap.set(item.categoriaNombre, cat.id);
    }
  }

  let seededCount = 0;
  for (const p of SMASH_SEED_PRODUCTS) {
    const catId = categoriasMap.get(p.categoriaNombre);
    const existing = await prisma.producto.findFirst({
      where: { empresaId: empresaSmash.id, sku: p.sku },
    });

    if (!existing) {
      const nuevoProducto = await prisma.producto.create({
        data: {
          empresaId: empresaSmash.id,
          sku: p.sku,
          referencia: p.referencia,
          nombre: p.nombre,
          descripcion: p.descripcion,
          descripcionWeb: p.descripcionWeb,
          precioBase: p.precioBase,
          precioWeb: p.precioWeb,
          categoriaId: catId,
          slug: p.slug,
          publicadoWeb: true,
          activo: true,
          esDestacado: p.esDestacado,
          manejaBodega: p.categoriaNombre !== 'Servicios',
          tipoIva: 'EXCLUIDO',
        },
      });

      // Crear stock inicial si maneja bodega
      if (p.categoriaNombre !== 'Servicios') {
        await prisma.stock.create({
          data: {
            productoId: nuevoProducto.id,
            bodegaId: bodegaSmash.id,
            empresaId: empresaSmash.id,
            cantidad: 15,
            cantidadReservada: 0,
          },
        });
      }
      seededCount++;
    }
  }

  console.log(`🎉 Se poblaron ${seededCount} productos del catálogo oficial de Smash con stock inicial.`);
  console.log('==============================================================');
  console.log(' Credenciales de Smash para ingresar a erp.edatia.com:');
  console.log('   NIT:        1234567');
  console.log('   Usuario:    admin');
  console.log('   Email:      admin@smash.com');
  console.log('   Contraseña: Smash2026*');
  console.log('   API Tienda: https://api.edatia.com/api/v1/public/tiendas/smash/productos');
  console.log('==============================================================');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedSmashClient()
    .catch((e) => {
      console.error('❌ Error provisionando Smash:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
