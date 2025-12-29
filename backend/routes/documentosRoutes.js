const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const documentosCtrl = require('../controllers/documentosController');

router.get('/', protect, documentosCtrl.listarDocumentos);
router.post('/', protect, documentosCtrl.crearDocumento);
router.put('/:id', protect, documentosCtrl.actualizarDocumento);
router.delete('/:id', protect, documentosCtrl.eliminarDocumento);

module.exports = router;
