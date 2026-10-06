import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Rutas
const CATALOGO_DIR = path.join(__dirname, '../../tiendas-virtuales/glowxir/public/catalogo');
const OUTPUT_FILE = path.join(__dirname, '../../tiendas-virtuales/glowxir/src/data/productos_generados.json');

// Categorías permitidas según productos.ts
const CATEGORIAS = ['Pañales y Cuidado', 'Juguetería', 'Variedades'];

// Contadores dinámicos para los prefijos generados
const contadoresSKU: Record<string, number> = {};

// Interface del producto
interface ProductGenerated {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string;
  descripcionLarga: string;
  precio: number;
  categoria: string;
  subcategoria?: string;
  genero?: string;
  imagen: string;
  imagenes: string[];
  stock: number;
  detalles: string[];
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Función para agrupar imágenes por nombre/timestamp
function groupImages(files: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  
  files.forEach(file => {
    if (!file.endsWith('.png') && !file.endsWith('.jpg') && !file.endsWith('.jpeg')) return;
    
    // Quitar extension
    const baseName = file.replace(/\.[^/.]+$/, "");
    
    // Intentar identificar el prefijo base. Ej: "Imagen de ChatGPT 24 sept 2026, 20_36_21-1" -> "Imagen de ChatGPT 24 sept 2026, 20_36"
    // O si es "Coche RC todoterreno en caja (1)" -> "Coche RC todoterreno en caja"
    let prefix = baseName;
    const matchSuffix = baseName.match(/(.*)[-\s]\(?\d+\)?$/);
    
    if (matchSuffix) {
      prefix = matchSuffix[1].trim();
    }

    if (!groups[prefix]) {
      groups[prefix] = [];
    }
    groups[prefix].push(file);
  });
  
  return groups;
}

// Función para subir a Cloudinary con nombre específico (SKU)
async function uploadToCloudinary(filePath: string, folderName: string, customName: string): Promise<string> {
  try {
    const folderPath = `glowxir/${folderName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folderPath,
      public_id: customName, // Esto asigna el nombre exacto basado en el SKU
      overwrite: true,
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Error subiendo a Cloudinary: ${filePath}`, error);
    throw error;
  }
}

// Función para analizar la imagen con Gemini
async function analyzeImageWithGemini(imagePath: string): Promise<any> {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: [
      {
        role: 'user',
        parts: [
          { text: `Analiza este producto infantil/bebé. Devuelve un JSON con los siguientes campos estrictamente:
          - nombre: Un nombre comercial atractivo (máx 50 chars).
          - descripcion: Descripción corta para catálogo (máx 120 chars).
          - descripcionLarga: Descripción detallada y persuasiva.
          - precio: Un precio estimado realista en COP (ej. 45000).
          - categoria: Debe ser exactamente una de estas tres: "Pañales y Cuidado", "Juguetería", "Variedades".
          - genero: "Niño", "Niña" o "Unisex".
          - detalles: Array de 3 a 5 viñetas con características principales.
          - prefijoSku: 3 letras mayúsculas indicando la subcategoría según este estándar: RPA (Ropa Niña), RPN (Ropa Niño), RPU (Ropa Unisex), JUG (Juguetes), PAN (Pañaleras), BAN (Bañeras), BAC (Bacinillas), COM (Comedores), CAM (Caminadores), NID (Nidos), CMP (Campings), DON (Donas), COL (Colchonetas), MEC (Mecedores). Si no encaja, inventa uno de 3 letras (ej. VAR).
          - codigoColor: 2 letras mayúsculas para el color predominante. Usa estándar: AZ (Azul), BL (Blanco), RS (Rosa), VD (Verde), CQ (Caqui), CF (Café), RJ (Rojo), PL (Piel), NG (Negro), FL (Flores), SU (Surtido/Multicolor).` },
          { inlineData: { data: base64Image, mimeType: 'image/png' } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nombre: { type: Type.STRING },
          descripcion: { type: Type.STRING },
          descripcionLarga: { type: Type.STRING },
          precio: { type: Type.INTEGER },
          categoria: { type: Type.STRING },
          genero: { type: Type.STRING },
          detalles: { type: Type.ARRAY, items: { type: Type.STRING } },
          prefijoSku: { type: Type.STRING },
          codigoColor: { type: Type.STRING },
        },
        required: ["nombre", "descripcion", "descripcionLarga", "precio", "categoria", "genero", "detalles", "prefijoSku", "codigoColor"]
      }
    }
  });

  if (!response.text) {
      throw new Error("Empty response from Gemini");
  }
  
  return JSON.parse(response.text);
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ FALTA GEMINI_API_KEY en el archivo .env");
    process.exit(1);
  }

  const files = fs.readdirSync(CATALOGO_DIR);
  const grouped = groupImages(files);
  const productKeys = Object.keys(grouped);
  
  console.log(`📦 Se encontraron ${files.length} imágenes, agrupadas en ${productKeys.length} productos.`);

  const productos: ProductGenerated[] = [];
  let idCounter = 1;

  for (const key of productKeys) {
    const images = grouped[key];
    console.log(`\n▶ Procesando producto [${idCounter}/${productKeys.length}]: ${key} (${images.length} imágenes)`);
    
    // 1. Analizar la primera imagen con Gemini
    const firstImagePath = path.join(CATALOGO_DIR, images[0]);
    let aiData;
    try {
      console.log(`   🧠 Analizando con IA...`);
      aiData = await analyzeImageWithGemini(firstImagePath);
    } catch (e) {
      console.error(`   ⚠️ Error con IA:`, e);
      console.log(`   ⏳ Esperando 15 segundos antes de reintentar...`);
      await delay(15000);
      continue;
    }

    // 2. Determinar la categoría y generar el SKU exacto basado en el CSV
    const categoriaFinal = CATEGORIAS.includes(aiData.categoria) ? aiData.categoria : 'Variedades';
    const prefijo = aiData.prefijoSku || 'VAR';
    const color = aiData.codigoColor || 'SU';
    
    // Inicializar el contador si es la primera vez que vemos este prefijo
    if (!contadoresSKU[prefijo]) {
      // Nota: Idealmente leeríamos el CSV actual para saber en qué número va,
      // pero para esta generación asumiremos que empezamos en 001 o el número que siga.
      contadoresSKU[prefijo] = 1; 
    }
    
    const contador = contadoresSKU[prefijo];
    // Ensamblar estilo: RPA-001-SU
    const sku = `${prefijo}-${contador.toString().padStart(3, '0')}-${color}`;
    
    contadoresSKU[prefijo]++; // Incrementar para el siguiente producto de este tipo
    console.log(`   🏷️ SKU asignado: ${sku}`);

    // 3. Subir todas las imágenes del grupo a Cloudinary en la carpeta de su categoría, usando el SKU
    const uploadedUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const imgFile = images[i];
      // Si hay más de 1 foto, nombrar como SKU-1, SKU-2, etc. Si no, solo SKU.
      const sufijo = images.length > 1 ? `-${i + 1}` : '';
      const customImageName = `${sku}${sufijo}`;
      
      console.log(`   ☁️ Subiendo imagen ${i + 1}/${images.length} como ${customImageName} (carpeta: ${categoriaFinal})...`);
      const url = await uploadToCloudinary(path.join(CATALOGO_DIR, imgFile), categoriaFinal, customImageName);
      uploadedUrls.push(url);
    }

    // 4. Crear el objeto del producto
    const product: ProductGenerated = {
      id: idCounter++,
      sku: sku,
      nombre: aiData.nombre,
      descripcion: aiData.descripcion,
      descripcionLarga: aiData.descripcionLarga,
      precio: aiData.precio,
      categoria: categoriaFinal,
      genero: aiData.genero,
      imagen: uploadedUrls[0],
      imagenes: uploadedUrls,
      stock: 10,
      detalles: aiData.detalles
    };

    productos.push(product);
    
    // Guardar progreso en cada paso por si falla
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(productos, null, 2), 'utf8');

    console.log(`   ⏳ Esperando 15 segundos para no saturar la cuota gratuita de Gemini...`);
    await delay(15000);
  }

  // Guardar resultado
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(productos, null, 2), 'utf8');
  console.log(`\n✅ Proceso completado. Datos guardados en: ${OUTPUT_FILE}`);
  console.log(`Puedes copiar y pegar este JSON en tu archivo productos.ts o usarlo para la BD del ERP.`);
}

main().catch(console.error);
