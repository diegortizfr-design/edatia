import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ejecutando seed de base de datos...');

  // Empresa demo
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
  console.log(`✅ Empresa creada: ${empresa.nombre} (NIT: ${empresa.nit})`);

  // Usuario administrador
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
  console.log(`✅ Admin creado: ${admin.email} (usuario: ${admin.usuario})`);
  console.log(`   Contraseña: ${adminPassword}`);
  console.log('');
  console.log('⚠️  Cambia la contraseña del admin luego del primer login.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
