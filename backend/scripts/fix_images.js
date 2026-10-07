require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const prisma = new PrismaClient();

async function main() {
  console.log('Buscando TODAS las imágenes en Cloudinary...');
  // No filtramos por folder para encontrar todo
  let allResources = [];
  let next_cursor = null;
  do {
    const response = await cloudinary.search
      .expression('resource_type:image')
      .max_results(500)
      .next_cursor(next_cursor)
      .execute();
    allResources = allResources.concat(response.resources);
    next_cursor = response.next_cursor;
  } while(next_cursor);
    
  console.log(`Encontradas ${allResources.length} imágenes en total en Cloudinary.`);
  
  const productos = await prisma.producto.findMany({ where: { empresaId: 1 } });
  console.log(`Encontrados ${productos.length} productos en la BD.`);

  let actualizados = 0;
  for (const prod of productos) {
    // Buscar en cloudinary por filename que empiece con el SKU
    const img = allResources.find(r => r.filename.startsWith(prod.sku));
    if (img && img.secure_url !== prod.imagen) {
      await prisma.producto.update({
        where: { id: prod.id },
        data: { imagen: img.secure_url }
      });
      actualizados++;
    }
  }
  
  console.log(`✅ Actualizadas las URLs de ${actualizados} imágenes de productos.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
