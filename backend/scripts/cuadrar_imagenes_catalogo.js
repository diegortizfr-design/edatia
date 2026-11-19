/**
 * Cuadra (1:1) las imágenes existentes del catálogo para que la tienda virtual no las recorte.
 *
 * Usa el mismo ImagenEstandarService del backend (normalizarEntrada + componer → 1200x1200,
 * producto centrado, relleno con el color de fondo detectado o blanco). Las imágenes que ya
 * son cuadradas se dejan intactas.
 *
 * Es reversible: guarda en metadataWeb.imagenesAntesCuadrar el mapeo { urlNueva: urlAnterior }
 * y NO borra las imágenes anteriores de Cloudinary.
 *
 * Ejecutar DENTRO del contenedor del API (tiene sharp, prisma, cloudinary y las variables .env):
 *   docker cp backend/scripts/cuadrar_imagenes_catalogo.js edatia-backend:/app/cuadrar.js
 *   docker exec edatia-backend node /app/cuadrar.js --empresa 2                  # simulación
 *   docker exec edatia-backend node /app/cuadrar.js --empresa 2 --muestras 6     # + vistas previas en /tmp/cuadrar-preview
 *   docker exec edatia-backend node /app/cuadrar.js --empresa 2 --aplicar        # aplica cambios
 *   docker exec edatia-backend node /app/cuadrar.js --empresa 2 --revertir       # deshace
 */
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const sharpNs = require('sharp');
const sharp = sharpNs.default || sharpNs;
const { PrismaClient } = require('@prisma/client');
const { ImagenEstandarService } = require(path.join(
  process.cwd(),
  'dist/digital/ia-productos/imagen-estandar.service',
));

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const flag = (name) => args.includes(`--${name}`);

const EMPRESA_ID = parseInt(arg('empresa', ''), 10);
const APLICAR = flag('aplicar');
const REVERTIR = flag('revertir');
const MUESTRAS = parseInt(arg('muestras', '0'), 10) || 0;
const TOLERANCIA = parseFloat(arg('tolerancia', '0.02')); // 2% de diferencia entre lados = "ya es cuadrada"
const SOLO_ID = arg('producto') ? parseInt(arg('producto'), 10) : null;
const PREVIEW_DIR = '/tmp/cuadrar-preview';

if (!EMPRESA_ID) {
  console.error('Falta --empresa <id>');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();
const estandar = new ImagenEstandarService();

function subirACloudinary(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder, public_id: publicId, overwrite: true, resource_type: 'image' },
        (err, res) => (err || !res ? reject(err || new Error('upload vacío')) : resolve(res.secure_url)),
      )
      .end(buffer);
  });
}

async function descargar(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

async function dimensiones(buffer) {
  const m = await sharp(buffer).metadata();
  // Orientaciones EXIF 5-8 intercambian ancho y alto
  const rotada = m.orientation && m.orientation >= 5;
  return { w: rotada ? m.height : m.width, h: rotada ? m.width : m.height };
}

function imagenesDe(producto) {
  const meta = producto.metadataWeb || {};
  const lista = Array.isArray(meta.imagenes) && meta.imagenes.length > 0 ? [...meta.imagenes] : [];
  if (producto.imagen && !lista.includes(producto.imagen)) lista.unshift(producto.imagen);
  return lista.filter((u) => typeof u === 'string' && u.trim());
}

async function revertir() {
  const productos = await prisma.producto.findMany({ where: { empresaId: EMPRESA_ID } });
  let n = 0;
  for (const p of productos) {
    const meta = p.metadataWeb || {};
    const mapa = meta.imagenesAntesCuadrar;
    if (!mapa || typeof mapa !== 'object' || !Object.keys(mapa).length) continue;
    const back = (u) => mapa[u] || u;
    const imagenes = Array.isArray(meta.imagenes) ? meta.imagenes.map(back) : meta.imagenes;
    const { imagenesAntesCuadrar, ...resto } = meta;
    console.log(`↩️  [${p.id}] ${p.nombre}`);
    if (APLICAR) {
      await prisma.producto.update({
        where: { id: p.id },
        data: { imagen: p.imagen ? back(p.imagen) : p.imagen, metadataWeb: { ...resto, imagenes } },
      });
    }
    n++;
  }
  console.log(`\n${APLICAR ? 'Revertidos' : 'Se revertirían (agrega --aplicar)'}: ${n} productos`);
}

async function main() {
  if (REVERTIR) return revertir();

  console.log(`Modo: ${APLICAR ? '🟢 APLICAR CAMBIOS' : '🟡 SIMULACIÓN (no se modifica nada)'}`);
  if (MUESTRAS) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

  const where = { empresaId: EMPRESA_ID, ...(SOLO_ID ? { id: SOLO_ID } : {}) };
  const productos = await prisma.producto.findMany({ where, orderBy: { id: 'asc' } });

  const stats = { productos: 0, imagenes: 0, yaCuadradas: 0, cuadradas: 0, errores: 0, productosActualizados: 0 };
  let muestrasHechas = 0;
  const reporte = [];

  for (const p of productos) {
    const urls = imagenesDe(p);
    if (!urls.length) continue;
    stats.productos++;

    const mapaNuevo = {}; // urlAnterior -> urlNueva
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      stats.imagenes++;
      try {
        const buf = await descargar(url);
        const { w, h } = await dimensiones(buf);
        const diff = Math.abs(w - h) / Math.max(w, h);
        if (diff <= TOLERANCIA) {
          stats.yaCuadradas++;
          continue;
        }

        const tipo = w > h ? 'horizontal' : 'vertical';
        console.log(`🔧 [${p.id}] ${p.nombre} — img ${i + 1}: ${w}x${h} (${tipo})`);
        reporte.push({ id: p.id, nombre: p.nombre, url, w, h });

        if (APLICAR || muestrasHechas < MUESTRAS) {
          const normal = await estandar.normalizarEntrada(buf);
          const { imagen } = await estandar.componer(normal);

          if (muestrasHechas < MUESTRAS) {
            fs.writeFileSync(path.join(PREVIEW_DIR, `${p.id}-${i + 1}-antes.jpg`), await sharp(buf).rotate().jpeg().toBuffer());
            fs.writeFileSync(path.join(PREVIEW_DIR, `${p.id}-${i + 1}-despues.jpg`), imagen);
            muestrasHechas++;
          }

          if (APLICAR) {
            const publicId = `${p.sku || 'prod'}-std-${i + 1}-${Date.now().toString().slice(-6)}`;
            mapaNuevo[url] = await subirACloudinary(imagen, `edatia_erp/empresa_${EMPRESA_ID}/productos`, publicId);
          }
        }
        stats.cuadradas++;
      } catch (e) {
        stats.errores++;
        console.warn(`⚠️  [${p.id}] ${p.nombre} — img ${i + 1}: ${e.message || e}`);
      }
    }

    if (APLICAR && Object.keys(mapaNuevo).length) {
      const meta = p.metadataWeb || {};
      const map = (u) => mapaNuevo[u] || u;
      const imagenes = Array.isArray(meta.imagenes) && meta.imagenes.length ? meta.imagenes.map(map) : urls.map(map);
      const antes = { ...(meta.imagenesAntesCuadrar || {}) };
      for (const [viejo, nuevo] of Object.entries(mapaNuevo)) antes[nuevo] = viejo;

      await prisma.producto.update({
        where: { id: p.id },
        data: {
          imagen: p.imagen ? map(p.imagen) : imagenes[0],
          metadataWeb: { ...meta, imagenes, imagenesAntesCuadrar: antes },
        },
      });
      stats.productosActualizados++;
    }
  }

  fs.writeFileSync('/tmp/cuadrar-reporte.json', JSON.stringify(reporte, null, 2));
  console.log('\n──────── Resumen ────────');
  console.log(`Productos con imagen:     ${stats.productos}`);
  console.log(`Imágenes revisadas:       ${stats.imagenes}`);
  console.log(`Ya cuadradas (intactas):  ${stats.yaCuadradas}`);
  console.log(`${APLICAR ? 'Cuadradas' : 'A cuadrar'}:                ${stats.cuadradas}`);
  console.log(`Errores:                  ${stats.errores}`);
  if (APLICAR) console.log(`Productos actualizados:   ${stats.productosActualizados}`);
  if (MUESTRAS) console.log(`Vistas previas en:        ${PREVIEW_DIR}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

