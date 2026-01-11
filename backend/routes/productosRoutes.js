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


module.exports = router;
