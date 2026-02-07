const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const productosCtrl = require('../controllers/productosController');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, productosCtrl.listarProductos);
router.post('/', protect, productosCtrl.crearProducto);
router.post('/bulk-upload', protect, upload.single('archivo'), productosCtrl.bulkUpload);
router.put('/:id', protect, productosCtrl.actualizarProducto);
router.delete('/:id', protect, productosCtrl.eliminarProducto);
router.post('/unificar', protect, productosCtrl.unificarProductos);


router.get('/duplicados', protect, productosCtrl.obtenerDuplicados);
router.get('/categorias', protect, productosCtrl.obtenerCategorias);
router.post('/categorias', protect, productosCtrl.crearCategoria);
router.put('/categorias/:id', protect, productosCtrl.actualizarCategoria);
router.delete('/categorias/:id', protect, productosCtrl.eliminarCategoria);

module.exports = router;
