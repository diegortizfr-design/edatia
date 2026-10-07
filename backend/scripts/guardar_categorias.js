const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const jsonPath = '/app/clasificacion_ia.json';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // 1. Reorganizar reglas lógicas (usando includes para evadir caracteres corruptos)
  data.forEach(p => {
    let sub = p.subcategoria;
    let cat = p.categoria;

    if (sub.includes('Ropa')) { cat = 'Ropa'; sub = 'Ropa Infantil'; }
    else if (sub.includes('Alimentaci')) { cat = 'Alimentación'; sub = 'Biberones y Vajillas'; }
    else if (sub.includes('Aseo') || sub.includes('Cremas') || sub.includes('ales')) { cat = 'Pañales y Cuidado'; sub = 'Aseo y Cremas'; }
    else if (sub.includes('Lencer') || sub.includes('Paseo') || sub.includes('Accesorios')) { 
      cat = 'Variedades'; 
      if (sub.includes('Lencer')) sub = 'Lencería';
      else if (sub.includes('Paseo')) sub = 'Paseo';
      else if (sub.includes('Accesorios')) sub = 'Accesorios';
    }
    else if (cat.includes('Jugueter') || sub.includes('Estimulaci')) { cat = 'Juguetería'; sub = 'Estimulación Temprana'; }

    p.categoria = cat;
    p.subcategoria = sub;
  });

  const estructura = {};
  data.forEach(p => {
    if (!estructura[p.categoria]) estructura[p.categoria] = new Set();
    estructura[p.categoria].add(p.subcategoria);
  });

  // 3. Crear en la base de datos
  console.log('Borrrando categorías viejas de la Empresa 1...');
  // Los productos tienen set null on delete, así que podemos borrar sin romper
  await prisma.categoria.deleteMany({ where: { empresaId: 1 } });

  const mapaSubcategorias = {}; // { 'Variedades-Lencería': id }

  console.log('Creando nueva estructura de categorías...');
  for (const [catNombre, subcategorias] of Object.entries(estructura)) {
    // Generar slug seguro
    const catSlug = catNombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const categoriaPadre = await prisma.categoria.create({
      data: {
        empresaId: 1,
        nombre: catNombre,
        slug: catSlug,
        activo: true
      }
    });

    for (const subNombre of subcategorias) {
      const subSlug = catSlug + '-' + subNombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const sub = await prisma.categoria.create({
        data: {
          empresaId: 1,
          nombre: subNombre,
          slug: subSlug,
          parentId: categoriaPadre.id,
          activo: true
        }
      });
      mapaSubcategorias[`${catNombre}-${subNombre}`] = sub.id;
    }
  }

  // 4. Asignar cada producto a su subcategoría en la base de datos
  console.log('Asignando categorías a los 125 productos...');
  let actualizados = 0;
  for (const p of data) {
    const subCatId = mapaSubcategorias[`${p.categoria}-${p.subcategoria}`];
    if (subCatId) {
      await prisma.producto.update({
        where: { id: p.id },
        data: { categoriaId: subCatId }
      });
      actualizados++;
    }
  }

  console.log(`✅ ¡Éxito! Se crearon ${Object.keys(estructura).length} categorías principales y se asignaron ${actualizados} productos.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
