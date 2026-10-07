import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const INPUT_FILE = path.join(__dirname, '../../tiendas-virtuales/glowxir/src/data/productos_generados.json');

async function main() {
  console.log('📦 Conectando a la base de datos PostgreSQL...');

  // 1. Encontrar la empresa ligada a la tienda "glowxir"
  const tienda = await prisma.configuracionTienda.findUnique({
    where: { slugTienda: 'glowxir' },
    include: { empresa: true }
  });

  if (!tienda) {
    console.error('❌ No se encontró la tienda virtual glowxir en la base de datos.');
    return;
  }

  const empresaId = tienda.empresaId;
  console.log(`🏪 Tienda encontrada. Limpiando productos para la empresa ID: ${empresaId}...`);

  // 2. Limpieza de datos viejos
  // Es mucho más seguro "ocultar" los productos viejos que borrarlos físicamente,
  // ya que si los productos de prueba tienen facturas o ventas asociadas, la base
  // de datos (PostgreSQL) bloqueará el borrado por "Llave Foránea" (Foreign Key Constraint).
  const actualizados = await prisma.producto.updateMany({
    where: { empresaId: empresaId },
    data: { 
      publicadoWeb: false, 
      activo: false 
    }
  });

  console.log(`🧹 ¡Listo! Se ocultaron ${actualizados.count} productos viejos de prueba.`);

  // 3. Leer e importar el nuevo catálogo JSON
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ El archivo JSON no se encuentra. Asegúrate de que el script anterior haya terminado: ${INPUT_FILE}`);
    return;
  }

  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const productos = JSON.parse(rawData);

  console.log(`📥 Importando ${productos.length} nuevos productos generados por IA a la base de datos...`);

  // 4. Insertar los nuevos productos
  let contador = 0;
  for (const p of productos) {
    // Convertimos el nombre en slug (ej. "Juguete Rojo" -> "juguete-rojo")
    const slugValue = p.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + p.sku.toLowerCase();

    await prisma.producto.create({
      data: {
        empresaId: empresaId,
        sku: p.sku,
        nombre: p.nombre,
        descripcion: p.descripcion, // Descripción corta
        descripcionWeb: p.descripcionLarga, // Descripción larga generada por Gemini
        precioBase: p.precio,
        precioWeb: p.precio,
        imagen: p.imagen, // URL de Cloudinary
        activo: true,
        publicadoWeb: true, // Para que aparezca inmediatamente en la tienda
        esDestacado: Math.random() > 0.8, // 20% de probabilidad de ser destacado aleatoriamente
        slug: slugValue,
        tipoProducto: 'Inventario',
        tipoIva: 'EXENTO', // O gravado según convenga
      }
    });
    contador++;
  }

  console.log(`🎉 ¡ÉXITO! Se importaron ${contador} productos reales al catálogo.`);
}

main()
  .catch(e => {
    console.error('⚠️ Ocurrió un error importando el catálogo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
