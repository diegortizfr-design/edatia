const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importCsv() {
  const content = fs.readFileSync('../inventario_factura_bebes.csv', 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const headers = lines[0].split(';');
  
  // Asumiendo empresa Demo = 2
  const empresaId = 2; 

  console.log('Importando productos...');
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 10) continue;
    
    const sku = cols[0];
    const nombre = cols[1];
    const codigoBarras = cols[2];
    const referencia = cols[3];
    const categoriaNombre = cols[4];
    const costoPromedio = parseFloat(cols[8] || '0');
    const precioBase = parseFloat(cols[9] || '0');
    const tipoIva = cols[11];
    const stockInicial = parseFloat(cols[12] || '0');
    const stockMinimo = parseFloat(cols[13] || '0');
    const puntoReorden = parseFloat(cols[14] || '0');
    const descripcion = cols[19];

    // Buscar o crear categoria
    let categoriaId = null;
    if (categoriaNombre) {
      let cat = await prisma.categoria.findFirst({ where: { nombre: categoriaNombre, empresaId } });
      if (!cat) {
        cat = await prisma.categoria.create({ data: { nombre: categoriaNombre, empresaId, activo: true } });
      }
      categoriaId = cat.id;
    }

    // Upsert producto
    const producto = await prisma.producto.upsert({
      where: { empresaId_sku: { empresaId, sku } },
      update: {
        nombre,
        codigoBarras: codigoBarras || null,
        referencia: referencia || null,
        categoriaId,
        costoPromedio,
        precioBase,
        tipoIva,
        stockMinimo,
        puntoReorden,
        descripcion: descripcion || null,
      },
      create: {
        empresaId,
        sku,
        nombre,
        codigoBarras: codigoBarras || null,
        referencia: referencia || null,
        categoriaId,
        costoPromedio,
        precioBase,
        tipoIva,
        stockMinimo,
        puntoReorden,
        descripcion: descripcion || null,
        activo: true,
      }
    });

    console.log(`Producto importado: ${sku} - ${nombre}`);
  }
  
  console.log('¡Importación completada!');
}

importCsv().catch(console.error).finally(() => prisma.$disconnect());
