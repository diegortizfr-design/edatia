const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const comprasCtrl = require('../controllers/comprasController');

const upload = require('../utils/uploadConfig');

router.get('/', protect, comprasCtrl.listarCompras);
router.post('/', protect, comprasCtrl.crearCompra);
router.put('/:id', protect, upload.single('factura'), comprasCtrl.actualizarCompra);
router.get('/:id/detalles', protect, comprasCtrl.obtenerDetallesCompra);


module.exports = router;
