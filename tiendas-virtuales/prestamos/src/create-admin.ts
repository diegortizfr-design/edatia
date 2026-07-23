import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultTenants = [
    {
      nit: '1143875756',
      name: 'Administrador Edatia',
      email: 'admin@edatia.com',
      password: 'Admin123!',
      isPremium: true
    },
    {
      nit: '1033680464',
      name: 'Créditos Rápidos',
      email: 'creditorapidos26@gmail.com',
      password: 'Créditosrapidos2026',
      isPremium: true
    }
  ];

  console.log('Iniciando creación/actualización de empresas administradoras en prestamos_edatia...');

  for (const item of defaultTenants) {
    const existing = await prisma.tenant.findFirst({
      where: {
        OR: [
          { nit: item.nit },
          { email: item.email }
        ]
      }
    });

    const hashedPassword = await bcrypt.hash(item.password, 10);

    if (existing) {
      await prisma.tenant.update({
        where: { id: existing.id },
        data: {
          nit: item.nit,
          name: item.name,
          email: item.email,
          password: hashedPassword,
          isPremium: item.isPremium
        }
      });
      console.log(`✅ Empresa ${item.name} (${item.email}) actualizada.`);
    } else {
      await prisma.tenant.create({
        data: {
          nit: item.nit,
          name: item.name,
          email: item.email,
          password: hashedPassword,
          isPremium: item.isPremium
        }
      });
      console.log(`✅ Empresa ${item.name} (${item.email}) creada exitosamente.`);
    }
  }
}

main()
  .catch((e) => {
    console.error('Error crítico al crear el usuario administrador:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
