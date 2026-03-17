// backend/routes/v1/index.js
const express = require('express');
const router = express.Router();

// Importar rutas v1
const authRoutes = require('../authRoutes');
const facturacionRoutes = require('../facturacionRoutes');
const comprasRoutes = require('../comprasRoutes');
const productosRoutes = require('../productosRoutes');
const inventarioRoutes = require('../inventarioRoutes');
const contabilidadRoutes = require('../contabilidadRoutes');
const nominaRoutes = require('../nominaRoutes');
const tercerosRoutes = require('../tercerosRoutes');
const sucursalesRoutes = require('../sucursalesRoutes');
const cajaRoutes = require('../cajaRoutes');

// Definir rutas v1
router.use('/auth', authRoutes);
router.use('/facturacion', facturacionRoutes);
router.use('/compras', comprasRoutes);
router.use('/productos', productosRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/contabilidad', contabilidadRoutes);
router.use('/nomina', nominaRoutes);
router.use('/terceros', tercerosRoutes);
router.use('/sucursales', sucursalesRoutes);
router.use('/caja', cajaRoutes);
router.use('/billing', require('./billing/billing.routes'));

// Nuevos módulos (Prototipos)
// router.use('/tesoreria', require('./tesoreriaRoutes'));
// router.use('/mrp', require('./mrpRoutes'));

module.exports = router;
