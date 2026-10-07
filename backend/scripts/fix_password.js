const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const password = "123456";
  const hash = await bcrypt.hash(password, 12);
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Match local?', isMatch);
  
  if (isMatch) {
    await prisma.user.updateMany({
      where: { email: 'admin@diegortiz.site' },
      data: { password: hash, loginFallidosConsecutivos: 0, loginBloqueadoHasta: null }
    });
    console.log('✅ Contraseña actualizada correctamente en DB.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
