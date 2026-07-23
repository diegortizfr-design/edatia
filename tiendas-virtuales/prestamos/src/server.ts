import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import prisma from './config/db';
import { seedDefaultTenants } from './seed';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Mount API routes
app.use('/api', apiRouter);

// Serve ads.txt for Google AdSense verification dynamically
app.get('/ads.txt', (req, res) => {
  const publisherId = process.env.ADSENSE_PUBLISHER_ID || 'pub-9138086731888541';
  res.type('text/plain');
  res.send(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`);
});

// Serve Frontend Static Assets (Production build)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback all other requests to the frontend React Router index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Database connection check & start server
const startServer = async () => {
  try {
    console.log('Probando conexión con PostgreSQL...');
    await prisma.$connect();
    console.log('Conectado con éxito a la base de datos prestamos_edatia.');

    await seedDefaultTenants();

    app.listen(PORT, () => {
      console.log(`Servidor de préstamos ejecutándose en el puerto ${PORT}`);
      console.log(`Modo de entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Error crítico al conectar a la base de datos:', error);
    process.exit(1);
  }
};

startServer();
