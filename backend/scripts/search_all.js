require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function main() {
  const root = await cloudinary.api.root_folders();
  console.log('Carpetas raíz:', root.folders.map(f => f.name));
  
  const { resources } = await cloudinary.search
    .expression('folder:glowxir/*')
    .max_results(500)
    .execute();
    
  console.log(`Imágenes en glowxir/: ${resources.length}`);
}

main().catch(console.error);
