const express = require('express');
const router = express.Router();
const publicEcomController = require('../controllers/publicEcomController');

// This route is public and does not require authMiddleware
router.get('/:nit', publicEcomController.getCatalog);
router.post('/:nit/order', publicEcomController.createOrder);
router.get('/:nit/branches', publicEcomController.getPhysicalStores);
router.get('/:nit/departamentos', publicEcomController.getDepartamentos);
router.get('/:nit/ciudades', publicEcomController.getCiudades);

module.exports = router;
