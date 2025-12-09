const http = require('http');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde la carpeta backend
dotenv.config({ path: path.join(__dirname, 'backend', 'datos.env') });

// Importar la aplicación correcta desde la carpeta backend
const app = require('./backend/app');

// Usar el puerto que asigne Render
const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server bootstrapped from root, listening on port ${PORT}`);
  console.log('Loaded backend/app.js successfully');
});