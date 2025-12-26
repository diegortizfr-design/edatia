const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const productosCtrl = require('../controllers/productosController');

router.get('/', protect, productosCtrl.listarProductos);
router.post('/', protect, productosCtrl.crearProducto);
router.put('/:id', protect, productosCtrl.actualizarProducto);
router.delete('/:id', protect, productosCtrl.eliminarProducto);

module.exports = router;
