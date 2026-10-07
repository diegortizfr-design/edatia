const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);
  await prisma.user.updateMany({
    where: { email: 'admin@diegortiz.site' },
    data: { password: hash }
  });
  console.log('✅ Contraseña actualizada a 123456');
}

main().catch(console.error).finally(() => prisma.$disconnect());
