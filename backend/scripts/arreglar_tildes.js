const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.categoria.findMany();
  let corregidas = 0;
  for (const c of cats) {
    let nuevoNombre = c.nombre;
    if (nuevoNombre.includes('Lencer') && nuevoNombre.includes('a')) nuevoNombre = 'Lencería';
    if (nuevoNombre.includes('Alimentaci') && nuevoNombre.includes('n')) nuevoNombre = 'Alimentación';
    if (nuevoNombre.includes('Jugueter') && nuevoNombre.includes('a')) nuevoNombre = 'Juguetería';
    if (nuevoNombre.includes('Pa') && nuevoNombre.includes('ales')) nuevoNombre = nuevoNombre.replace(/Pa.*ales/, 'Pañales');
    if (nuevoNombre.includes('Estimulaci') && nuevoNombre.includes('n')) nuevoNombre = 'Estimulación Temprana';

    if (nuevoNombre !== c.nombre) {
      await prisma.categoria.update({
        where: { id: c.id },
        data: { nombre: nuevoNombre }
      });
      corregidas++;
    }
  }
  console.log(`✅ Corregidos ${corregidas} nombres de categorías con errores de codificación.`);
}

main().finally(() => prisma.$disconnect());
