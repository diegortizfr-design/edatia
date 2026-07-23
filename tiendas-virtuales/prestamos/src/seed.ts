import bcrypt from 'bcryptjs';
import prisma from './config/db';

export async function seedDefaultTenants() {
  const tenants = [
    {
      nit: '1033680464',
      name: 'Creditos rapidos garcia',
      email: 'creditorapidos26@gmail.com',
      password: 'Creditosrapidos2026',
      isPremium: true
    },
    {
      nit: '1143875756',
      name: 'Administrador Edatia',
      email: 'admin@edatia.com',
      password: 'Admin123!',
      isPremium: true
    }
  ];

  console.log('🌱 Ejecutando sembrado/actualización de empresas en prestamos_edatia...');

  for (const item of tenants) {
    const cleanNit = item.nit.trim();
    const cleanEmail = item.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(item.password, 10);

    const existing = await prisma.tenant.findFirst({
      where: {
        OR: [
          { nit: cleanNit },
          { email: cleanEmail }
        ]
      }
    });

    if (existing) {
      await prisma.tenant.update({
        where: { id: existing.id },
        data: {
          nit: cleanNit,
          name: item.name,
          email: cleanEmail,
          password: hashedPassword,
          isPremium: item.isPremium
        }
      });
      console.log(`✅ Tenant actualizado: ${item.name} (${cleanEmail})`);
    } else {
      await prisma.tenant.create({
        data: {
          nit: cleanNit,
          name: item.name,
          email: cleanEmail,
          password: hashedPassword,
          isPremium: item.isPremium
        }
      });
      console.log(`✅ Tenant creado: ${item.name} (${cleanEmail})`);
    }
  }
}

// Allow direct execution via node dist/seed.js
if (require.main === module) {
  seedDefaultTenants()
    .then(() => {
      console.log('🚀 Sembrado de base de datos completado.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error en el sembrado:', err);
      process.exit(1);
    });
}
