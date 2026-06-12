import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const clients = await prisma.tercero.findMany({ where: { esCliente: true } });
  const providers = await prisma.tercero.findMany({ where: { esProveedor: true } });
  const companies = await prisma.empresa.findMany();
  console.log("COMPANIES:", companies.map(c => ({ id: c.id, nit: c.nit, nombre: c.nombre })));
  console.log("CLIENTS:", clients.map(c => ({ id: c.id, nombre: c.nombre, empresaId: c.empresaId, nit: c.numeroDocumento })));
  console.log("PROVIDERS:", providers.map(p => ({ id: p.id, nombre: p.nombre, empresaId: p.empresaId, nit: p.numeroDocumento })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
