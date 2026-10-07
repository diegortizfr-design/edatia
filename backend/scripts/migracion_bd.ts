import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando limpieza y migración en la BD local...');

  // 1. Actualizar Empresa 1
  await prisma.empresa.update({
    where: { id: 1 },
    data: { nombre: 'Distribuidora Baby World' }
  });
  console.log('✅ Empresa 1 actualizada a "Distribuidora Baby World"');

  // 2. Eliminar Stock y Productos de prueba de Empresa 1
  const productosPruebaEmpresa1 = await prisma.producto.findMany({
    where: { empresaId: 1 }
  });
  const idsPruebaE1 = productosPruebaEmpresa1.map(p => p.id);
  if (idsPruebaE1.length > 0) {
    await prisma.stock.deleteMany({ where: { productoId: { in: idsPruebaE1 } } });
    await prisma.producto.deleteMany({ where: { id: { in: idsPruebaE1 } } });
    console.log(`✅ Eliminados ${idsPruebaE1.length} productos de prueba de la Empresa 1`);
  }

  // 3. Eliminar Stock y Productos ocultos (pruebas) de Empresa 2
  const productosPruebaEmpresa2 = await prisma.producto.findMany({
    where: { empresaId: 2, activo: false }
  });
  const idsPruebaE2 = productosPruebaEmpresa2.map(p => p.id);
  if (idsPruebaE2.length > 0) {
    await prisma.stock.deleteMany({ where: { productoId: { in: idsPruebaE2 } } });
    await prisma.producto.deleteMany({ where: { id: { in: idsPruebaE2 } } });
    console.log(`✅ Eliminados ${idsPruebaE2.length} productos de prueba de la Empresa 2`);
  }

  // 4. Eliminar Categorías de Empresa 2
  await prisma.categoria.deleteMany({ where: { empresaId: 2 } });
  console.log('✅ Eliminadas categorías de prueba de Empresa 2');

  // 5. Mover los 125 productos nuevos de Empresa 2 a Empresa 1
  const actualizados = await prisma.producto.updateMany({
    where: { empresaId: 2, activo: true },
    data: { empresaId: 1 }
  });
  console.log(`✅ Movidos ${actualizados.count} productos del catálogo IA a la Empresa 1`);

  // 6. Actualizar las URLs de Cloudinary en la base de datos (cambiando glowxir por distribuidorababyworld)
  const productosFinales = await prisma.producto.findMany({ where: { empresaId: 1 } });
  let imagenesActualizadas = 0;
  for (const p of productosFinales) {
    if (p.imagen && p.imagen.includes('/glowxir/')) {
      const nuevaUrl = p.imagen.replace('/glowxir/', '/distribuidorababyworld/');
      await prisma.producto.update({
        where: { id: p.id },
        data: { imagen: nuevaUrl }
      });
      imagenesActualizadas++;
    }
  }
  console.log(`✅ Actualizadas ${imagenesActualizadas} URLs de imágenes en la base de datos`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
