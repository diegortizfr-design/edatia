import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const empresas = await prisma.empresa.findMany({
    select: { id: true, nit: true, nombre: true }
  });

  console.log('\n🏢 EMPRESAS REGISTRADAS EN LA BASE DE DATOS:');
  console.log('────────────────────────────────────────');
  if (empresas.length === 0) {
    console.log('⚠️ No hay ninguna empresa registrada.');
  } else {
    empresas.forEach(e => {
      console.log(`🆔 ID: ${e.id} | 📄 NIT: "${e.nit}" | 🏢 Nombre: ${e.nombre}`);
    });
  }
  console.log('────────────────────────────────────────\n');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
