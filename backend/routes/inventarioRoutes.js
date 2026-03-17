const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { protect } = require('../middlewares/authMiddleware');
const tenantHandler = require('../middlewares/tenantHandler');

// Get Kardex for a product
router.get('/kardex/:producto_id', protect, tenantHandler, inventarioController.verKardex);

// Create manual adjustment
router.post('/ajuste', protect, tenantHandler, inventarioController.crearAjuste);

module.exports = router;
