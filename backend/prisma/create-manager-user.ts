import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'gerencia@edatia.com';
  const password = '3D4t142026*';
  const hash = await bcrypt.hash(password, 12);

  // Asegurar que existe el perfil de administrador
  const perfil = await prisma.perfilCargo.upsert({
    where: { nombre: 'Administrador del Sistema' },
    update: {},
    create: {
      nombre: 'Administrador del Sistema',
      descripcion: 'Acceso total al portal Manager de Edatia',
      permisos: ['*'],
    },
  });

  console.log(`✅ Perfil de cargo verificado: ${perfil.nombre}`);

  const user = await (prisma as any).colaborador.upsert({
    where: { email },
    update: {
      password: hash,
      activo: true,
      rol: 'ADMIN',
      perfilCargoId: perfil.id,
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
