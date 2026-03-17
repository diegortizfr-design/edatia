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

// Middlewares
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for compatibility with Render/custom domains
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// crear pool al iniciar
createPool();

// Ruta de monitoreo básico
app.get('/api/ping', (req, res) => res.json({ ok: true, timestamp: new Date() }));



if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Configuración de versión 1 de la API
const v1Router = require('./routes/v1');
app.use('/api/v1', v1Router);

// Redirecciones de compatibilidad (Legacy Support)
// Esto permite que el frontend actual siga funcionando sin cambios inmediatos
app.use('/api/auth', authRoutes);
app.use('/api/facturacion', require('./routes/facturacionRoutes'));
app.use('/api/productos', require('./routes/productosRoutes'));
app.use('/api/inventario', require('./routes/inventarioRoutes'));
app.use('/api/compras', require('./routes/comprasRoutes'));
app.use('/api/terceros', require('./routes/tercerosRoutes'));
app.use('/api/contabilidad', require('./routes/contabilidadRoutes'));
app.use('/api/caja', require('./routes/cajaRoutes'));
app.use('/api/nomina', require('./routes/nominaRoutes'));


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
