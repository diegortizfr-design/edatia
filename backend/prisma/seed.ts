import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ejecutando seed de base de datos completo...');

  // 1. Módulos de software
  const modulosDef = [
    {
      nombre: 'Inventario',
      slug: 'inventario',
      descripcion: 'Control de stock, entradas, salidas, trazabilidad de productos y bodegas.',
      icono: '📦',
      precioAnual: 1200000,
    },
    {
      nombre: 'Ventas / Comercial',
      slug: 'ventas',
      descripcion: 'Gestión de pedidos, cotizaciones, clientes, facturación y cartera.',
      icono: '💼',
      precioAnual: 1500000,
    },
    {
      nombre: 'Administrativo',
      slug: 'administrativo',
      descripcion: 'Gestión de recursos humanos, nómina, contratos y activos fijos.',
      icono: '🏢',
      precioAnual: 1800000,
    },
    {
      nombre: 'Contable',
      slug: 'contable',
      descripcion: 'Módulo contable completo: PUC, comprobantes, balances, declaraciones.',
      icono: '📊',
      precioAnual: 2000000,
    },
    {
      nombre: 'Digital',
      slug: 'digital',
      descripcion: 'Inteligencia de datos, reportes avanzados, dashboards e integración con IA.',
      icono: '🌐',
      precioAnual: 2400000,
    },
  ];

  const dbModulos = [];
  for (const m of modulosDef) {
    const mod = await (prisma as any).moduloSoftware.upsert({
      where: { slug: m.slug },
      update: { precioAnual: m.precioAnual },
      create: m,
    });
    dbModulos.push(mod);
  }
  console.log('✅ Módulos de software registrados');

  // 2. Plan base Premium
  const planPremium = await prisma.planBase.upsert({
    where: { nombre: 'Premium' },
    update: {},
    create: {
      nombre: 'Premium',
      descripcion: 'Acceso total a todos los módulos y funciones.',
      precioBase: 3000000,
      limiteUsuarios: 50,
    },
  });
  console.log('✅ Plan Base Premium registrado');

  // 3. Vincular módulos al Plan Premium
  for (const mod of dbModulos) {
    await (prisma as any).planBaseModulo.upsert({
      where: {
        planBaseId_moduloId: {
          planBaseId: planPremium.id,
          moduloId: mod.id,
        },
      },
      update: {},
      create: {
        planBaseId: planPremium.id,
        moduloId: mod.id,
      },
    });
  }
  console.log('✅ Módulos vinculados al plan Premium');

  // 4. Crear empresas
  const empresaDiego = await prisma.empresa.upsert({
    where: { nit: '1143875756-0' },
    update: {},
    create: {
      nit: '1143875756-0',
      nombre: 'Diego Ortiz - Pruebas ERP',
      direccion: 'Colombia',
      telefono: '',
      email: 'admin@diegortiz.site',
      regimenFiscal: 'SIMPLIFICADO',
      tipoPersona: 'NATURAL',
    },
  });
  console.log(`✅ Empresa Diego Ortiz registrada (NIT: ${empresaDiego.nit})`);

  const empresaDemo = await prisma.empresa.upsert({
    where: { nit: '900000000-0' },
    update: {},
    create: {
      nit: '900000000-0',
      nombre: 'Edatia Demo SAS',
      direccion: 'Calle 1 # 2-3, Bogotá',
      telefono: '+57 300 000 0000',
    },
  });
  console.log(`✅ Empresa Demo registrada (NIT: ${empresaDemo.nit})`);

  // 4b. Crear tipos de identificación por defecto para cada empresa
  const tiposIdDef = [
    { codigoDian: '31', nombreCorto: 'NIT', descripcion: 'Número de Identificación Tributaria' },
    { codigoDian: '13', nombreCorto: 'CC', descripcion: 'Cédula de Ciudadanía' },
    { codigoDian: '22', nombreCorto: 'CE', descripcion: 'Cédula de Extranjería' },
    { codigoDian: '41', nombreCorto: 'PASAPORTE', descripcion: 'Pasaporte' },
    { codigoDian: '47', nombreCorto: 'PEP', descripcion: 'Permiso Especial de Permanencia' },
  ];

  for (const empresa of [empresaDiego, empresaDemo]) {
    for (const t of tiposIdDef) {
      await (prisma as any).tipoIdentificacion.upsert({
        where: {
          empresaId_codigoDian: {
            empresaId: empresa.id,
            codigoDian: t.codigoDian,
          },
        },
        update: {},
        create: {
          empresaId: empresa.id,
          codigoDian: t.codigoDian,
          nombreCorto: t.nombreCorto,
          descripcion: t.descripcion,
          activo: true,
        },
      });
    }
  }
  console.log('✅ Tipos de identificación iniciales registrados para cada empresa');

  // 5. Vincular empresas a ClienteManager con Plan Premium
  await (prisma as any).clienteManager.upsert({
    where: { nit: '1143875756-0' },
    update: {
      empresaId: empresaDiego.id,
      planBaseId: planPremium.id,
      estado: 'ACTIVO',
    },
    create: {
      nit: '1143875756-0',
      nombre: 'Diego Ortiz - Pruebas ERP',
      empresaId: empresaDiego.id,
      planBaseId: planPremium.id,
      estado: 'ACTIVO',
    },
  });

  await (prisma as any).clienteManager.upsert({
    where: { nit: '900000000-0' },
    update: {
      empresaId: empresaDemo.id,
      planBaseId: planPremium.id,
      estado: 'ACTIVO',
    },
    create: {
      nit: '900000000-0',
      nombre: 'Edatia Demo SAS',
      empresaId: empresaDemo.id,
      planBaseId: planPremium.id,
      estado: 'ACTIVO',
    },
  });
  console.log('✅ Clientes vinculados al Plan Premium en el Manager');

  // 6. Crear usuarios de administrador
  const hashDiego = await bcrypt.hash('Admin123', 12);
  const adminDiego = await prisma.user.upsert({
    where: { email: 'admin@diegortiz.site' },
    update: {},
    create: {
      email: 'admin@diegortiz.site',
      usuario: 'admin_diego',
      nombre: 'Diego Ortiz',
      password: hashDiego,
      rol: 'admin',
      empresaId: empresaDiego.id,
    },
  });
  console.log(`✅ Usuario Diego registrado (admin@diegortiz.site / Admin123)`);

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const hashDemo = await bcrypt.hash(adminPassword, 12);
  const adminDemo = await prisma.user.upsert({
    where: { email: 'admin@edatia.com' },
    update: {},
    create: {
      email: 'admin@edatia.com',
      usuario: 'admin',
      nombre: 'Administrador Edatia',
      password: hashDemo,
      rol: 'admin',
      empresaId: empresaDemo.id,
    },
  });
  console.log(`✅ Usuario Demo registrado (admin@edatia.com / ${adminPassword})`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
