const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const tenantHandler = require('../middlewares/tenantHandler');
const facturacionCtrl = require('../controllers/facturacionController');

router.get('/', protect, tenantHandler, facturacionCtrl.listarFacturas);
router.get('/recibos', protect, tenantHandler, facturacionCtrl.listarRecibos);
router.get('/:id/detalles', protect, tenantHandler, facturacionCtrl.obtenerDetallesFactura);
router.post('/', protect, tenantHandler, facturacionCtrl.crearFactura);
router.post('/anular', protect, tenantHandler, facturacionCtrl.anularFactura);


module.exports = router;
