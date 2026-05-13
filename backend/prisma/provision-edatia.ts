import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const nitEmpresa = '1143875756';
  const emailUser = 'gerencia@edatia.com';
  const passwordUser = '3D4t142026*';
  const username = 'gerencia';

  console.log(`🚀 Iniciando provisión para la empresa con NIT: ${nitEmpresa}...`);

  // 1. Buscar la empresa
  const empresa = await prisma.empresa.findUnique({
    where: { nit: nitEmpresa }
  });

  if (!empresa) {
    console.error(`❌ Error: No se encontró ninguna empresa con el NIT ${nitEmpresa}. Asegúrate de haberla creado en el Manager.`);
    return;
  }

  console.log(`✅ Empresa encontrada: ${empresa.nombre} (ID: ${empresa.id})`);

  // 2. Crear el hash de la contraseña
  const hash = await bcrypt.hash(passwordUser, 12);

  // 3. Crear o actualizar el usuario principal del ERP
  const user = await prisma.user.upsert({
    where: { email: emailUser },
    update: {
      password: hash,
      empresaId: empresa.id,
      rol: 'admin',
      usuario: username
    },
    create: {
      email: emailUser,
      usuario: username,
      nombre: 'Administrador Edatia',
      password: hash,
      rol: 'admin',
      empresaId: empresa.id
    }
  });

  console.log(`\n🎉 PROVISIÓN COMPLETADA CON ÉXITO`);
  console.log(`────────────────────────────────────────`);
  console.log(`🏢 Empresa:   ${empresa.nombre}`);
  console.log(`👤 Usuario:   ${user.email}`);
  console.log(`🆔 Login:     ${user.usuario}`);
  console.log(`🔑 Password:  ${passwordUser}`);
  console.log(`🌐 ERP URL:   https://app.edatia.com`);
  console.log(`────────────────────────────────────────`);
}

main()
  .catch(e => {
    console.error('❌ Error durante la provisión:', e);
  })
  .finally(() => prisma.$disconnect());
