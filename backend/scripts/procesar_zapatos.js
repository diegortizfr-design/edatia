const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Cargar entorno
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=["']?([^"'\\r\\n]+)`, 'm'));
  return match ? match[1].trim() : null;
}

const GEMINI_API_KEY = getEnv('GEMINI_API_KEY');
const CLOUDINARY_CLOUD_NAME = getEnv('CLOUDINARY_CLOUD_NAME');
const CLOUDINARY_API_KEY = getEnv('CLOUDINARY_API_KEY');
const CLOUDINARY_API_SECRET = getEnv('CLOUDINARY_API_SECRET');

const ZAPATOS_DIR = path.join(__dirname, '../../tiendas-virtuales/distribuidorababyworld/public/catalogo/zapatos');
const JSON_FILE = path.join(__dirname, 'productos_zapatos.json');
const FRONTEND_JSON = path.join(__dirname, '../../tiendas-virtuales/distribuidorababyworld/src/data/productos_zapatos.json');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Subir a Cloudinary con firma SHA-1 nativa
async function subirACloudinary(filePath, customName, folderName = 'distribuidorababyworld/zapatos') {
  const timestamp = Math.round(new Date().getTime() / 1000);

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
  const base64Data = fileBuffer.toString('base64');
  const ext = path.extname(filePath).slice(1) || 'png';
  const dataUri = `data:image/${ext};base64,${base64Data}`;

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
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
}

// Analizar con Gemini Flash Lite
async function analizarConGemini(imagePath) {
  const fileBuffer = fs.readFileSync(imagePath);
  const base64Data = fileBuffer.toString('base64');
  const ext = path.extname(imagePath).slice(1) || 'png';
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  const prompt = `Analiza este zapato / calzado infantil o de bebé con atención a los detalles visuales.
Devuelve un JSON estrictamente con la siguiente estructura:
{
  "nombre": "Nombre comercial atractivo (máx 50 caracteres)",
  "descripcion": "Descripción corta para catálogo (máx 120 caracteres)",
  "descripcionLarga": "Descripción persuasiva y completa destacando comodidad, ergonomía, materiales y ocasión de uso",
  "categoria": "Calzado",
  "subcategoria": "Deportivos / Casuales / Sandalias / Botas / Colegiales",
  "genero": "Niño / Niña / Unisex",
  "precio": 55000,
  "detalles": [
    "3 a 5 viñetas detallando características clave como suela antideslizante, plantilla acolchada, etc."
  ],
  "tallasSugeridas": ["21", "22", "23", "24", "25", "26"],
  "tipoCierre": "Velcro / Cordón / Elástico / Sin cordón",
  "material": "Malla transpirable / Cuero sintético / Lona resistente / Goma EVA",
  "prefijoSku": "3 letras mayúsculas indicando el tipo: ZDP (Deportivo), ZCS (Casual), SAN (Sandalia), BOT (Bota), ZCL (Colegial)",
  "codigoColor": "2 letras mayúsculas del color: AZ, BL, RS, VD, NG, MR, RJ, GR, AM, SU"
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
    generationConfig: { responseMimeType: "application/json" }
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

async function main() {
  console.log('🚀 INICIANDO AJUSTE INTELIGENTE DE CATÁLOGO (PRESERVANDO SUB-CARPETAS)');

  // 1. Cargar productos previos
  const productosExistentes = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

  // Identificar los 24 productos que son de subcarpetas puras (IDs 7 a 30)
  // Las llaves que tuvieron mezcla de raíz fueron: 21_45, 21_50, 21_53, 21_56, 22_09, 21_58
  const keysMezcladas = new Set(['14 oct 2026 21_45', '14 oct 2026 21_50', '14 oct 2026 21_53', '14 oct 2026 21_56', '14 oct 2026 22_09', '14 oct 2026 21_58']);
  
  const productosValidados = productosExistentes.filter(p => !keysMezcladas.has(p.productoKey));
  console.log(`✅ Se preservan ${productosValidados.length} productos que ya estaban perfectos.`);

  // Contadores de SKU basados en lo existente
  const contadoresSKU = {};
  productosValidados.forEach(p => {
    const parts = (p.sku || '').split('-');
    if (parts.length >= 2) {
      const pref = parts[0];
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) contadoresSKU[pref] = Math.max(contadoresSKU[pref] || 0, num);
    }
  });

  function generarSku(prefijo, color) {
    prefijo = prefijo || 'ZDP';
    color = color || 'SU';
    contadoresSKU[prefijo] = (contadoresSKU[prefijo] || 0) + 1;
    return `${prefijo}-${contadoresSKU[prefijo].toString().padStart(3, '0')}-${color}`;
  }

  // 2. Procesar las 3 subcarpetas especiales usando SOLO sus fotos internas
  const subcarpetasEspeciales = [
    { name: 'Nueva carpeta', dir: path.join(ZAPATOS_DIR, 'Nueva carpeta') },
    { name: 'Nueva carpeta (2)', dir: path.join(ZAPATOS_DIR, 'Nueva carpeta (2)') },
    { name: 'Nueva carpeta (27)', dir: path.join(ZAPATOS_DIR, 'Nueva carpeta (27)') }
  ];

  for (const sc of subcarpetasEspeciales) {
    const files = fs.readdirSync(sc.dir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f)).map(f => path.join(sc.dir, f));
    if (files.length === 0) continue;

    console.log(`\n📁 Procesando subcarpeta: ${sc.name} (${files.length} fotos internas)...`);
    const aiData = await analizarConGemini(files[0]);
    const sku = generarSku(aiData.prefijoSku, aiData.codigoColor);
    console.log(`   🏷️ SKU: ${sku} | ${aiData.nombre}`);

    const uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
      const suf = files.length > 1 ? `-${i + 1}` : '';
      const customName = `${sku}${suf}`;
      const url = await subirACloudinary(files[i], customName);
      uploadedUrls.push(url);
    }

    productosValidados.push({
      productoKey: `Carpeta: ${sc.name}`,
      sku,
      nombre: aiData.nombre,
      descripcion: aiData.descripcion,
      descripcionLarga: aiData.descripcionLarga,
      precio: aiData.precio || 55000,
      categoria: 'Calzado',
      subcategoria: aiData.subcategoria || 'Casuales',
      genero: aiData.genero || 'Unisex',
      imagen: uploadedUrls[0],
      imagenes: uploadedUrls,
      stock: 25,
      detalles: aiData.detalles || [],
      tallas: aiData.tallasSugeridas || ['21', '22', '23', '24', '25', '26'],
      tipoCierre: aiData.tipoCierre || 'Velcro',
      material: aiData.material || 'Sintético',
      publicadoWeb: true,
      esDestacado: false
    });

    await delay(3000);
  }

  // 3. Procesar las 12 fotos sueltas de la raíz INDIVIDUALMENTE
  const rootFiles = fs.readdirSync(ZAPATOS_DIR).filter(f => fs.statSync(path.join(ZAPATOS_DIR, f)).isFile() && /\.(png|jpg|jpeg|webp)$/i.test(f));
  console.log(`\n📄 Procesando ${rootFiles.length} fotos sueltas de la raíz INDIVIDUALMENTE...`);

  for (let i = 0; i < rootFiles.length; i++) {
    const fName = rootFiles[i];
    const fPath = path.join(ZAPATOS_DIR, fName);
    console.log(`\n[${i + 1}/${rootFiles.length}] Procesando foto suelta: ${fName}`);

    const aiData = await analizarConGemini(fPath);
    const sku = generarSku(aiData.prefijoSku, aiData.codigoColor);
    console.log(`   🏷️ SKU Individual: ${sku} | ${aiData.nombre} (${aiData.subcategoria})`);

    const url = await subirACloudinary(fPath, `${sku}-1`);

    productosValidados.push({
      productoKey: `Individual: ${fName}`,
      sku,
      nombre: aiData.nombre,
      descripcion: aiData.descripcion,
      descripcionLarga: aiData.descripcionLarga,
      precio: aiData.precio || 55000,
      categoria: 'Calzado',
      subcategoria: aiData.subcategoria || 'Sandalias',
      genero: aiData.genero || 'Unisex',
      imagen: url,
      imagenes: [url], // Solo 1 foto porque no tiene más ángulos
      stock: 25,
      detalles: aiData.detalles || [],
      tallas: aiData.tallasSugeridas || ['21', '22', '23', '24', '25', '26'],
      tipoCierre: aiData.tipoCierre || 'Velcro',
      material: aiData.material || 'Sintético',
      publicadoWeb: true,
      esDestacado: false
    });

    await delay(3000);
  }

  // 4. Reasignar IDs secuenciales de 1 a N
  productosValidados.forEach((p, idx) => {
    p.id = idx + 1;
  });

  // 5. Guardar archivos finales
  fs.writeFileSync(JSON_FILE, JSON.stringify(productosValidados, null, 2), 'utf8');
  fs.writeFileSync(FRONTEND_JSON, JSON.stringify(productosValidados, null, 2), 'utf8');

  console.log('\n🎉 ==============================================');
  console.log(`✅ ¡CATÁLOGO CONSOLIDADO CON ÉXITO!`);
  console.log(`📦 Total de productos únicos: ${productosValidados.length} (esperados: 39)`);
  console.log(`📁 27 de subcarpetas (con múltiples ángulos)`);
  console.log(`📄 12 individuales de la raíz (con 1 foto única)`);
  console.log('==============================================\n');
}

main().catch(console.error);
