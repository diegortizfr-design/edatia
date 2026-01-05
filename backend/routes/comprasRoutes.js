const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const comprasCtrl = require('../controllers/comprasController');

router.get('/', protect, comprasCtrl.listarCompras);
router.post('/', protect, comprasCtrl.crearCompra);
router.put('/:id', protect, comprasCtrl.actualizarCompra);
router.get('/:id/detalles', protect, comprasCtrl.obtenerDetallesCompra);


module.exports = router;
