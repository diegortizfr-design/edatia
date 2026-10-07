require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function main() {
  const { resources } = await cloudinary.search
    .expression('filename:JUG-015*')
    .max_results(5)
    .execute();
    
  console.log(resources.map(r => r.secure_url));
}

main().catch(console.error);
