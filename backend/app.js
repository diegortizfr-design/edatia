// backend/app.js
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const { createPool } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const empresaRoutes = require('./routes/empresaRoutes');

const app = express();

// crear pool al iniciar
createPool();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/empresa', empresaRoutes);
app.use('/api/sucursales', require('./routes/sucursalesRoutes'));
app.use('/api/terceros', require('./routes/tercerosRoutes'));
app.use('/api/productos', require('./routes/productosRoutes'));
app.use('/api/compras', require('./routes/comprasRoutes'));
app.use('/api/facturacion', require('./routes/facturacionRoutes'));
app.use('/api/documentos', require('./routes/documentosRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/public/ecommerce', require('./routes/publicEcomRoutes'));
app.use('/api/inventario', require('./routes/inventarioRoutes'));

// Servir frontends por cliente (opcional)
// app.use('/actualystore', express.static(path.join(__dirname, '..', 'clientes', 'actualystore')));
// app.use('/assencebarberstudio', express.static(path.join(__dirname, '..', 'clientes', 'assencebarberstudio')));
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Ruta healthcheck
app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'dev' }));

// 404
app.use((req, res) => res.status(404).json({ ok: false, message: 'Not Found' }));

module.exports = app;
