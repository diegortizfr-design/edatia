const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const CAT_DIR = '/app/catalogo_panales';
const BACKEND_JSON = '/app/productos_panales_y_leches.json';
const BACKEND_SQL = '/app/importar_panales_y_leches.sql';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Subir imagen a Cloudinary usando firma SHA-1
async function subirACloudinary(filePath, customName, folderName = 'distribuidorababyworld/panales_y_leches') {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    folder: folderName,
    overwrite: 'true',
    public_id: customName,
    timestamp: timestamp.toString()
  };
  const sortedKeys = Object.keys(paramsToSign).sort();
  const stringToSign = sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join('&') + CLOUDINARY_API_SECRET;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase() || 'png';
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const dataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('folder', folderName);
  formData.append('public_id', customName);
  formData.append('overwrite', 'true');
  formData.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (data.error) throw new Error(`Cloudinary Error: ${data.error.message}`);
  return data.secure_url;
}

// Analizar imagen con Gemini Flash
async function analizarConGemini(imagePath) {
  const fileBuffer = fs.readFileSync(imagePath);
  const base64Data = fileBuffer.toString('base64');
  const ext = path.extname(imagePath).slice(1).toLowerCase() || 'png';
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  const prompt = `Analiza detalladamente este producto infantil o para bebé (pañal, leche/fórmula, toallitas o artículo de cuidado).
Examina cuidadosamente el empaque visible en la imagen: marca comercial, línea/modelo, etapa de edad o talla, peso neto o número de unidades, características y beneficios clave.

Devuelve ESTRICTAMENTE un JSON con la siguiente estructura:
{
  "nombre": "Nombre comercial profesional y completo (máximo 70 caracteres, ej: Pañales Babysec Ultra Protect Talla M x 50 Und / Fórmula Nan Optipro 1 x 800g)",
  "descripcion": "Descripción corta para catálogo e inventario (máximo 130 caracteres)",
  "descripcionLarga": "Descripción persuasiva, detallada y completa destacando beneficios clave, comodidad, nutrición o absorción, ingredientes principales y recomendaciones de uso",
  "tipoProducto": "PANAL" o "LECHE" o "CUIDADO",
  "marca": "Marca detectada (ej: Winny, Huggies, Pampers, Babysec, Nan, Enfamil, Similac, Nestógeno, Peptisorb, etc.)",
  "presentacion": "Presentación comercial (ej: Paquete x 50 pañales / Lata x 800g / Bolsa x 400g / Paquete x 80 toallitas)",
  "etapaTalla": "Etapa o talla detectada (ej: Etapa 1 / Talla M / Etapa 2 / 0-6 meses / Talla G / etc.)",
  "subcategoria": "Pañales Desechables" o "Fórmulas y Leches" o "Aseo y Cuidado",
  "precio": 65000,
  "detalles": [
    "3 a 5 viñetas técnicas con beneficios reales (ej: Barreras antifugas 3D, Hasta 12 horas de absorción, Enriquecido con DHA y ARA, Hipoalergénico)"
  ],
  "prefijoSku": "PAN" o "LEC" o "ASE",
  "sufijoSku": "Código de 2 a 3 caracteres para talla o variante (ej: M, G, XG, RN, E1, E2, 800, 400, SU)"
}`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } }
        ]
      }
    ],
    generationConfig: { responseMimeType: 'application/json' }
  };

  let intentos = 0;
  while (intentos < 3) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(text);
    } catch (err) {
      intentos++;
      console.warn(`   ⚠️ Intento ${intentos} falló con Gemini: ${err.message}. Reintentando en 3s...`);
      await delay(3000);
      if (intentos >= 3) throw err;
    }
  }
}

function generarSlug(nombre, sku) {
  const cleanNombre = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${cleanNombre}-${sku.toLowerCase()}`;
}

async function main() {
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('🚀 PIPELINE INTELIGENTE: PAÑALES Y LECHES (GEMINI + CLOUDINARY + ERP)');
  console.log('════════════════════════════════════════════════════════════════════\n');

  // 1. Obtener Empresa y Categorías
  const tienda = await prisma.configuracionTienda.findFirst({
    where: { slugTienda: 'distribuidorababyworld' }
  });
  const empresaId = tienda ? tienda.empresaId : 1;
  console.log(`🏢 Empresa ID objetivo: ${empresaId} (${tienda?.nombreTienda || 'Distribuidora Baby World'})`);

  // Asegurar o buscar categorías
  let catPanales = await prisma.categoria.findFirst({
    where: { empresaId, LOWER_nombre: undefined, nombre: { contains: 'Pañales', mode: 'insensitive' } }
  });
  let catAlimentacion = await prisma.categoria.findFirst({
    where: { empresaId, nombre: { contains: 'Alimentación', mode: 'insensitive' } }
  });
  let catAseo = await prisma.categoria.findFirst({
    where: { empresaId, nombre: { contains: 'Aseo', mode: 'insensitive' } }
  });

  const catPanalesId = catPanales ? catPanales.id : 73;
  const catAlimentacionId = catAlimentacion ? catAlimentacion.id : 71;
  const catAseoId = catAseo ? catAseo.id : 74;

  console.log(`📁 IDs de Categorías: Pañales=${catPanalesId}, Alimentación=${catAlimentacionId}, Aseo=${catAseoId}`);

  // 2. Cargar SKUs existentes para evitar colisiones
  const productosExistentes = await prisma.producto.findMany({
    where: { empresaId },
    select: { sku: true }
  });

  const contadoresSKU = {
    PAN: 13, // Existían hasta PAN-013 en base de datos
    LEC: 0,
    ASE: 0
  };

  productosExistentes.forEach((p) => {
    const parts = (p.sku || '').split('-');
    if (parts.length >= 2) {
      const pref = parts[0].toUpperCase();
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) {
        contadoresSKU[pref] = Math.max(contadoresSKU[pref] || 0, num);
      }
    }
  });

  console.log('🔢 Contadores iniciales de SKU:', contadoresSKU);

  function crearSku(prefijo, sufijo) {
    prefijo = (prefijo || 'PAN').toUpperCase();
    sufijo = (sufijo || 'SU').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (sufijo.length > 5) sufijo = sufijo.slice(0, 5);
    contadoresSKU[prefijo] = (contadoresSKU[prefijo] || 0) + 1;
    return `${prefijo}-${contadoresSKU[prefijo].toString().padStart(3, '0')}-${sufijo}`;
  }

  const productosProcesados = [];

  // 3. Procesar subcarpetas (Cada subcarpeta es UN solo producto con múltiples fotos)
  const itemsInCat = fs.readdirSync(CAT_DIR);
  const subcarpetas = itemsInCat
    .filter((name) => {
      const full = path.join(CAT_DIR, name);
      return fs.statSync(full).isDirectory();
    })
    .sort();

  console.log(`\n📂 Se encontraron ${subcarpetas.length} subcarpetas (productos con múltiples ángulos)...`);

  for (let idx = 0; idx < subcarpetas.length; idx++) {
    const folderName = subcarpetas[idx];
    const folderPath = path.join(CAT_DIR, folderName);
    const files = fs
      .readdirSync(folderPath)
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
      .map((f) => path.join(folderPath, f))
      .sort();

    if (files.length === 0) continue;

    console.log(`\n[Carpeta ${idx + 1}/${subcarpetas.length}] 📁 ${folderName} (${files.length} fotos)...`);

    // Analizar con Gemini la primera foto representativa
    console.log(`   🤖 Analizando con Gemini: ${path.basename(files[0])}...`);
    const aiData = await analizarConGemini(files[0]);
    const sku = crearSku(aiData.prefijoSku, aiData.sufijoSku);
    console.log(`   🏷️ SKU Asignado: ${sku}`);
    console.log(`   📦 Nombre: ${aiData.nombre}`);
    console.log(`   💰 Precio estimado: $${aiData.precio.toLocaleString('es-CO')} COP`);
    console.log(`   🔖 Tipo: ${aiData.tipoProducto} | Presentación: ${aiData.presentacion}`);

    // Subir todas las fotos de esta carpeta a Cloudinary
    console.log(`   ☁️ Subiendo ${files.length} fotos a Cloudinary...`);
    const uploadedUrls = [];
    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      const suf = files.length > 1 ? `-${fIdx + 1}` : '';
      const customName = `${sku}${suf}`;
      const url = await subirACloudinary(files[fIdx], customName);
      uploadedUrls.push(url);
    }

    // Determinar categoría
    let catId = catPanalesId;
    if (aiData.tipoProducto === 'LECHE' || aiData.subcategoria === 'Fórmulas y Leches') {
      catId = catAlimentacionId;
    } else if (aiData.tipoProducto === 'CUIDADO' || aiData.subcategoria === 'Aseo y Cuidado') {
      catId = catAseoId;
    }

    const prodObj = {
      empresaId,
      sku,
      nombre: aiData.nombre,
      descripcion: aiData.descripcion,
      descripcionWeb: aiData.descripcionLarga,
      precio: aiData.precio || 60000,
      categoriaId: catId,
      tipoProducto: aiData.tipoProducto,
      marca: aiData.marca || 'Distribuidora Baby World',
      presentacion: aiData.presentacion || '',
      etapaTalla: aiData.etapaTalla || '',
      subcategoria: aiData.subcategoria || 'General',
      imagen: uploadedUrls[0],
      imagenes: uploadedUrls,
      stock: 30,
      detalles: aiData.detalles || [],
      publicadoWeb: false, // ⚠️ OCULTO en tienda virtual, SOLO en inventario ERP
      activo: true,
      esDestacado: false,
      productoKey: `Carpeta: ${folderName}`
    };

    productosProcesados.push(prodObj);
    await delay(2500); // Respetar rate limits
  }

  // 4. Procesar fotos sueltas de la raíz (Cada una es un producto independiente)
  const rootFiles = itemsInCat
    .filter((f) => {
      const full = path.join(CAT_DIR, f);
      return fs.statSync(full).isFile() && /\.(png|jpe?g|webp)$/i.test(f);
    })
    .sort();

  console.log(`\n📄 Se encontraron ${rootFiles.length} fotos sueltas en la raíz (productos individuales)...`);

  for (let rIdx = 0; rIdx < rootFiles.length; rIdx++) {
    const fName = rootFiles[rIdx];
    const fPath = path.join(CAT_DIR, fName);

    console.log(`\n[Foto Suelta ${rIdx + 1}/${rootFiles.length}] 📄 ${fName}...`);

    console.log(`   🤖 Analizando con Gemini...`);
    const aiData = await analizarConGemini(fPath);
    const sku = crearSku(aiData.prefijoSku, aiData.sufijoSku);
    console.log(`   🏷️ SKU Asignado: ${sku}`);
    console.log(`   📦 Nombre: ${aiData.nombre}`);
    console.log(`   💰 Precio estimado: $${aiData.precio.toLocaleString('es-CO')} COP`);
    console.log(`   🔖 Tipo: ${aiData.tipoProducto} | Presentación: ${aiData.presentacion}`);

    console.log(`   ☁️ Subiendo a Cloudinary...`);
    const url = await subirACloudinary(fPath, `${sku}-1`);

    let catId = catPanalesId;
    if (aiData.tipoProducto === 'LECHE' || aiData.subcategoria === 'Fórmulas y Leches') {
      catId = catAlimentacionId;
    } else if (aiData.tipoProducto === 'CUIDADO' || aiData.subcategoria === 'Aseo y Cuidado') {
      catId = catAseoId;
    }

    const prodObj = {
      empresaId,
      sku,
      nombre: aiData.nombre,
      descripcion: aiData.descripcion,
      descripcionWeb: aiData.descripcionLarga,
      precio: aiData.precio || 60000,
      categoriaId: catId,
      tipoProducto: aiData.tipoProducto,
      marca: aiData.marca || 'Distribuidora Baby World',
      presentacion: aiData.presentacion || '',
      etapaTalla: aiData.etapaTalla || '',
      subcategoria: aiData.subcategoria || 'General',
      imagen: url,
      imagenes: [url],
      stock: 30,
      detalles: aiData.detalles || [],
      publicadoWeb: false, // ⚠️ OCULTO en tienda virtual, SOLO en inventario ERP
      activo: true,
      esDestacado: false,
      productoKey: `Individual: ${fName}`
    };

    productosProcesados.push(prodObj);
    await delay(2500);
  }

  console.log('\n────────────────────────────────────────────────────────────────────');
  console.log(`📦 Procesamiento completado: ${productosProcesados.length} productos generados.`);
  console.log('────────────────────────────────────────────────────────────────────\n');

  // 5. Insertar directamente en la Base de Datos (edatia_erp) vía Prisma
  console.log('💾 Insertando / actualizando productos en la base de datos PostgreSQL...');
  let insertadosCount = 0;

  for (const p of productosProcesados) {
    const slug = generarSlug(p.nombre, p.sku);
    const metadataWeb = {
      imagenes: p.imagenes,
      detalles: p.detalles,
      marca: p.marca,
      presentacion: p.presentacion,
      etapaTalla: p.etapaTalla,
      subcategoria: p.subcategoria,
      tipoProducto: p.tipoProducto
    };

    const dataPayload = {
      empresaId: p.empresaId,
      sku: p.sku,
      nombre: p.nombre,
      descripcion: p.descripcion,
      descripcionWeb: p.descripcionWeb,
      precioBase: p.precio,
      precioWeb: p.precio,
      imagen: p.imagen,
      categoriaId: p.categoriaId,
      activo: true,
      publicadoWeb: false, // 🔒 SOLO INVENTARIO, NO PUBLICADO EN TIENDA
      esDestacado: false,
      slug,
      tipoIva: 'EXENTO',
      manejaBodega: true,
      metadataWeb,
      costoPromedio: 0,
      stockMinimo: 5,
      puntoReorden: 10
    };

    const existing = await prisma.producto.findFirst({
      where: { empresaId: p.empresaId, sku: p.sku }
    });

    if (existing) {
      await prisma.producto.update({
        where: { id: existing.id },
        data: dataPayload
      });
    } else {
      await prisma.producto.create({
        data: dataPayload
      });
    }
    insertadosCount++;
  }

  console.log(`✅ ¡ÉXITO! Se sincronizaron ${insertadosCount} productos en el Inventario (con publicadoWeb = false).`);

  // 6. Guardar archivo JSON
  fs.writeFileSync(BACKEND_JSON, JSON.stringify(productosProcesados, null, 2), 'utf8');
  console.log(`📄 JSON exportado en: ${BACKEND_JSON}`);

  // 7. Generar SQL exportable para producción
  function escapeSql(str) {
    if (str === null || str === undefined) return 'NULL';
    return `'${String(str).replace(/'/g, "''")}'`;
  }

  let sql = `-- ====================================================================\n`;
  sql += `-- IMPORTACIÓN DE PAÑALES Y LECHES (PRODUCCIÓN: SOLO INVENTARIO / publicadoWeb = false)\n`;
  sql += `-- Total productos: ${productosProcesados.length}\n`;
  sql += `-- Generado: ${new Date().toISOString()}\n`;
  sql += `-- ====================================================================\n\n`;
  sql += `DO $$\n`;
  sql += `DECLARE\n`;
  sql += `  v_empresa_id INT;\n`;
  sql += `BEGIN\n`;
  sql += `  SELECT "empresaId" INTO v_empresa_id FROM "ConfiguracionTienda" WHERE "slugTienda" = 'distribuidorababyworld' LIMIT 1;\n`;
  sql += `  IF v_empresa_id IS NULL THEN\n`;
  sql += `    SELECT id INTO v_empresa_id FROM "Empresa" WHERE activo = true LIMIT 1;\n`;
  sql += `  END IF;\n\n`;

  productosProcesados.forEach((p) => {
    const slug = generarSlug(p.nombre, p.sku);
    const meta = JSON.stringify({
      imagenes: p.imagenes,
      detalles: p.detalles,
      marca: p.marca,
      presentacion: p.presentacion,
      etapaTalla: p.etapaTalla,
      subcategoria: p.subcategoria,
      tipoProducto: p.tipoProducto
    });

    sql += `  -- SKU: ${p.sku} | ${p.nombre.replace(/'/g, '')}\n`;
    sql += `  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = ${escapeSql(p.sku)}) THEN\n`;
    sql += `    UPDATE "Producto" SET\n`;
    sql += `      nombre = ${escapeSql(p.nombre)},\n`;
    sql += `      descripcion = ${escapeSql(p.descripcion)},\n`;
    sql += `      "descripcionWeb" = ${escapeSql(p.descripcionWeb)},\n`;
    sql += `      "precioBase" = ${p.precio},\n`;
    sql += `      "precioWeb" = ${p.precio},\n`;
    sql += `      imagen = ${escapeSql(p.imagen)},\n`;
    sql += `      "categoriaId" = ${p.categoriaId},\n`;
    sql += `      "publicadoWeb" = false,\n`;
    sql += `      "metadataWeb" = ${escapeSql(meta)}::jsonb,\n`;
    sql += `      "updatedAt" = NOW()\n`;
    sql += `    WHERE "empresaId" = v_empresa_id AND sku = ${escapeSql(p.sku)};\n`;
    sql += `  ELSE\n`;
    sql += `    INSERT INTO "Producto" (\n`;
    sql += `      "empresaId", sku, nombre, descripcion, "descripcionWeb",\n`;
    sql += `      "precioBase", "precioWeb", imagen, "categoriaId", activo,\n`;
    sql += `      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",\n`;
    sql += `      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",\n`;
    sql += `      "createdAt", "updatedAt"\n`;
    sql += `    ) VALUES (\n`;
    sql += `      v_empresa_id, ${escapeSql(p.sku)}, ${escapeSql(p.nombre)}, ${escapeSql(p.descripcion)}, ${escapeSql(p.descripcionWeb)},\n`;
    sql += `      ${p.precio}, ${p.precio}, ${escapeSql(p.imagen)}, ${p.categoriaId}, true,\n`;
    sql += `      false, false, ${escapeSql(slug)}, 'EXENTO', true,\n`;
    sql += `      ${escapeSql(meta)}::jsonb, 0, 5, 10,\n`;
    sql += `      NOW(), NOW()\n`;
    sql += `    );\n`;
    sql += `  END IF;\n\n`;
  });

  sql += `  RAISE NOTICE '✅ Importación de pañales y leches finalizada: % productos en inventario.', ${productosProcesados.length};\n`;
  sql += `END $$;\n`;

  fs.writeFileSync(BACKEND_SQL, sql, 'utf8');
  console.log(`📄 Script SQL para producción exportado en: ${BACKEND_SQL}`);

  console.log('\n🎉 ¡PROCESO COMPLETADO AL 100%! 🎉');
}

main()
  .catch((e) => {
    console.error('❌ Error fatal en el pipeline:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
