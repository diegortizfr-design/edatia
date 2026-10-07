const path = require('path');
const cloudinary = require(path.join('/app', 'node_modules/cloudinary')).v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  console.log('Iniciando limpieza y renombrado en Cloudinary...');

  // 1. Borrar recursos de las carpetas de prueba
  try {
    const res1 = await cloudinary.api.delete_resources_by_prefix('edatia_erp/empresa_1/');
    console.log(`✅ Borradas imágenes de empresa_1:`, Object.keys(res1.deleted || {}).length);
    const res2 = await cloudinary.api.delete_resources_by_prefix('edatia_erp/empresa_2/');
    console.log(`✅ Borradas imágenes de empresa_2:`, Object.keys(res2.deleted || {}).length);
  } catch (e) {
    console.log('⚠️ Error borrando imágenes de prueba (pueden no existir)', e.message);
  }

  // 2. Borrar las carpetas de prueba vacías
  try {
    await cloudinary.api.delete_folder('edatia_erp/empresa_1');
    console.log('✅ Carpeta empresa_1 borrada');
  } catch(e){}
  
  try {
    await cloudinary.api.delete_folder('edatia_erp/empresa_2');
    console.log('✅ Carpeta empresa_2 borrada');
  } catch(e){}

  // 3. Renombrar la carpeta del catálogo
  try {
    await cloudinary.api.rename_folder('glowxir', 'distribuidorababyworld');
    console.log('✅ Carpeta glowxir renombrada exitosamente a distribuidorababyworld');
  } catch (e) {
    console.log('⚠️ Error al renombrar la carpeta (quizás ya se renombró o hay un problema de permisos):', e.message);
  }
}

main().catch(console.error);
