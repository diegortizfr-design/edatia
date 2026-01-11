const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const facturacionCtrl = require('../controllers/facturacionController');

router.get('/', protect, facturacionCtrl.listarFacturas);
router.get('/:id/detalles', protect, facturacionCtrl.obtenerDetallesFactura);
router.post('/', protect, facturacionCtrl.crearFactura);


module.exports = router;
