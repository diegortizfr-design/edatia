import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'gerencia@edatia.com';
  const password = '3D4t142026*';
  const hash = await bcrypt.hash(password, 12);

  // Buscar el perfil de admin existente
  const perfil = await prisma.perfilCargo.findFirst({
    where: { nombre: { contains: 'Administrador' } }
  });

  if (!perfil) {
    console.log('❌ Error: No se encontró un perfil de Administrador en la base de datos.');
    return;
  }

  const user = await (prisma as any).colaborador.upsert({
    where: { email },
    update: {
      password: hash,
      activo: true,
      rol: 'ADMIN'
    },
    create: {
      email,
      nombre: 'Gerencia Edatia',
      password: hash,
      rol: 'ADMIN',
      activo: true,
      perfilCargoId: perfil.id,
    },
  });

  console.log(`✅ Usuario de Gerencia creado/actualizado con éxito: ${user.email}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
