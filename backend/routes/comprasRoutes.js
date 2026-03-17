const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const tenantHandler = require('../middlewares/tenantHandler');
const comprasCtrl = require('../controllers/comprasController');

const upload = require('../utils/uploadConfig');

router.get('/', protect, tenantHandler, comprasCtrl.listarCompras);
router.post('/', protect, tenantHandler, comprasCtrl.crearCompra);
router.put('/:id', protect, tenantHandler, upload.single('factura'), comprasCtrl.actualizarCompra);
router.delete('/:id', protect, tenantHandler, comprasCtrl.eliminarCompra);
router.get('/:id/detalles', protect, tenantHandler, comprasCtrl.obtenerDetallesCompra);


module.exports = router;
