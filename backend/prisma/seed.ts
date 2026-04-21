import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ejecutando seed de base de datos...');

  // ── Empresa de pruebas (Diego Ortiz) ─────────────────────────────────────
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
  console.log(`✅ Empresa: ${empresaDiego.nombre} (NIT: ${empresaDiego.nit})`);

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
  console.log(`✅ Usuario: ${adminDiego.email}  /  contraseña: Admin123`);

  // ── Empresa demo Edatia ───────────────────────────────────────────────────
  const empresa = await prisma.empresa.upsert({
    where: { nit: '900000000-0' },
    update: {},
    create: {
      nit: '900000000-0',
      nombre: 'Edatia Demo SAS',
      direccion: 'Calle 1 # 2-3, Bogotá',
      telefono: '+57 300 000 0000',
    },
  });
  console.log(`✅ Empresa: ${empresa.nombre} (NIT: ${empresa.nit})`);

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const hash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@edatia.com' },
    update: {},
    create: {
      email: 'admin@edatia.com',
      usuario: 'admin',
      nombre: 'Administrador Edatia',
      password: hash,
      rol: 'admin',
      empresaId: empresa.id,
    },
  });
  console.log(`✅ Usuario: ${admin.email}  /  contraseña: ${adminPassword}`);

  console.log('');
  console.log('⚠️  Cambia las contraseñas luego del primer login.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
