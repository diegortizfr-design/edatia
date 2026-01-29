const express = require('express');
const router = express.Router();
const contabilidadController = require('../controllers/contabilidadController');
const { protect } = require('../middlewares/authMiddleware'); // Asumiendo middleware de auth existente

// Rutas protegidas
router.get('/puc', protect, contabilidadController.getPUC);
router.post('/puc', protect, contabilidadController.createAccount);

module.exports = router;
