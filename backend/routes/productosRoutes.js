const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const tenantHandler = require('../middlewares/tenantHandler');
const productosCtrl = require('../controllers/productosController');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, tenantHandler, productosCtrl.listarProductos);
router.post('/', protect, tenantHandler, productosCtrl.crearProducto);
router.post('/bulk-upload', protect, tenantHandler, upload.single('archivo'), productosCtrl.bulkUpload);
router.put('/:id', protect, tenantHandler, productosCtrl.actualizarProducto);
router.delete('/:id', protect, tenantHandler, productosCtrl.eliminarProducto);
router.post('/unificar', protect, tenantHandler, productosCtrl.unificarProductos);


router.get('/duplicados', protect, tenantHandler, productosCtrl.obtenerDuplicados);
router.get('/categorias', protect, tenantHandler, productosCtrl.obtenerCategorias);
router.post('/categorias', protect, tenantHandler, productosCtrl.crearCategoria);
router.put('/categorias/:id', protect, tenantHandler, productosCtrl.actualizarCategoria);
router.delete('/categorias/:id', protect, tenantHandler, productosCtrl.eliminarCategoria);

module.exports = router;
