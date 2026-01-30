// backend/app.js
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const { createPool } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const reportesRoutes = require('./routes/reportesRoutes');


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
app.use('/api/reportes', reportesRoutes); // Added use statement
app.use('/api/contabilidad', require('./routes/contabilidadRoutes'));
app.use('/api/averias', require('./routes/averiasRoutes'));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend'))); // Mantener compatibilidad si se usa /frontend
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Ruta raíz: Mostrar la página de landing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'modules', 'core', 'landing.html'));
});

// Ruta healthcheck
app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'dev' }));

// 404
app.use((req, res) => res.status(404).json({ ok: false, message: 'Not Found' }));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;
