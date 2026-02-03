const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const sucursalesCtrl = require('../controllers/sucursalesController');

router.get('/', protect, sucursalesCtrl.listarSucursales);
router.post('/', protect, sucursalesCtrl.crearSucursal);
router.put('/:id', protect, sucursalesCtrl.actualizarSucursal);

module.exports = router;
