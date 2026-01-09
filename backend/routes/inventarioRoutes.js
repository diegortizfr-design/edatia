const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { protect } = require('../middlewares/authMiddleware');

// Get Kardex for a product
router.get('/kardex/:producto_id', protect, inventarioController.verKardex);

// Create manual adjustment
router.post('/ajuste', protect, inventarioController.crearAjuste);

module.exports = router;
