/**
 * Seed inicial del Edatia Manager
 * Crea: colaborador admin + 5 módulos de software + 3 planes base + perfil de cargo inicial
 *
 * Ejecución:
 *   docker compose exec api npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/manager-seed.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed del Edatia Manager...\n');

  // ──────────────────────────────────────────────
  // 1. Perfil de cargo base: Administrador
  // ──────────────────────────────────────────────
  const perfilAdmin = await prisma.perfilCargo.upsert({
    where: { nombre: 'Administrador del Sistema' },
    update: {},
    create: {
      nombre: 'Administrador del Sistema',
      descripcion: 'Acceso total al portal Manager de Edatia',
      permisos: ['*'],
    },
  });
  console.log(`✅ Perfil cargo: ${perfilAdmin.nombre}`);

  // ──────────────────────────────────────────────
  // 2. Colaborador admin
  // ──────────────────────────────────────────────
  const managerPassword = process.env.MANAGER_ADMIN_PASSWORD ?? 'Manager123!';
  const hash = await bcrypt.hash(managerPassword, 12);

  const admin = await (prisma as any).colaborador.upsert({
    where: { email: 'admin@edatia.com' },
    update: {},
    create: {
      email: 'admin@edatia.com',
      nombre: 'Administrador Edatia',
      password: hash,
      rol: 'ADMIN',
      activo: true,
      perfilCargoId: perfilAdmin.id,
    },
  });
  console.log(`✅ Colaborador admin: ${admin.email} / contraseña: ${managerPassword}`);

  // ──────────────────────────────────────────────
  // 3. Módulos de software (5 módulos)
  // ──────────────────────────────────────────────
  const modulos = [
    {
      nombre: 'Inventario',
      slug: 'inventario',
      descripcion: 'Control de stock, entradas, salidas, trazabilidad de productos y bodegas.',
      icono: '📦',
      precioAnual: 1_200_000,
    },
    {
      nombre: 'Ventas / Comercial',
      slug: 'ventas',
      descripcion: 'Gestión de pedidos, cotizaciones, clientes, facturación y cartera.',
      icono: '💼',
      precioAnual: 1_500_000,
    },
    {
      nombre: 'Administrativo',
      slug: 'administrativo',
      descripcion: 'Gestión de recursos humanos, nómina, contratos y activos fijos.',
      icono: '🏢',
      precioAnual: 1_800_000,
    },
    {
      nombre: 'Contable',
      slug: 'contable',
      descripcion: 'Módulo contable completo: PUC, comprobantes, balances, declaraciones.',
      icono: '📊',
      precioAnual: 2_000_000,
    },
    {
      nombre: 'Digital',
      slug: 'digital',
      descripcion: 'Inteligencia de datos, reportes avanzados, dashboards e integración con IA.',
      icono: '🌐',
      precioAnual: 2_400_000,
    },
  ];

  for (const m of modulos) {
    const mod = await (prisma as any).moduloSoftware.upsert({
      where: { slug: m.slug },
      update: { precioAnual: m.precioAnual },
      create: m,
    });
    console.log(`✅ Módulo: ${mod.nombre} (${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(m.precioAnual)}/año)`);
  }

  // ──────────────────────────────────────────────
  // 4. Planes base
  // ──────────────────────────────────────────────
  const planes = [
    {
      nombre: 'Básico',
      descripcion: 'Ideal para pequeñas empresas que inician su transformación digital.',
      precioBase: 800_000,
      limiteUsuarios: 5,
    },
    {
      nombre: 'Estándar',
      descripcion: 'Para medianas empresas con múltiples áreas operativas.',
      precioBase: 1_500_000,
      limiteUsuarios: 15,
    },
    {
      nombre: 'Premium',
      descripcion: 'Para empresas en crecimiento con necesidades avanzadas de datos.',
      precioBase: 3_000_000,
      limiteUsuarios: 50,
    },
  ];

  for (const p of planes) {
    const plan = await (prisma as any).planBase.upsert({
      where: { nombre: p.nombre },
      update: {},
      create: p,
    });
    console.log(`✅ Plan: ${plan.nombre} (${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p.precioBase)}/mes)`);
  }

  console.log('\n🎉 Seed del Manager completado!');
  console.log('────────────────────────────────────────');
  console.log('🌐 Portal:     https://manager.edatia.com');
  console.log('👤 Usuario:    admin@edatia.com');
  console.log(`🔑 Contraseña: ${managerPassword}`);
  console.log('────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
