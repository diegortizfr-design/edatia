import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const nit = '1143875756';
  const name = 'Administrador Edatia';
  const email = 'admin@edatia.com';
  const password = 'Admin123!';

  console.log('Iniciando creación de usuario administrador en la base de datos...');

  // Check if tenant already exists
  const existing = await prisma.tenant.findFirst({
    where: {
      OR: [
        { nit },
        { email }
      ]
    }
  });

  if (existing) {
    console.log('Aviso: El NIT o Correo ya se encuentran registrados en la base de datos.');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      nit,
      name,
      email,
      password: hashedPassword
    }
  });

  console.log('¡Usuario Creado Exitosamente!');
  console.log('------------------------------------');
  console.log(`Empresa:  ${tenant.name}`);
  console.log(`NIT:      ${tenant.nit}`);
  console.log(`Correo:   ${tenant.email}`);
  console.log('------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error crítico al crear el usuario administrador:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
