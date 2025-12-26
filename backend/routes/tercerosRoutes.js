const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const tercerosCtrl = require('../controllers/tercerosController');

router.get('/', protect, tercerosCtrl.listarTerceros);
router.post('/', protect, tercerosCtrl.crearTercero);
router.put('/:id', protect, tercerosCtrl.actualizarTercero);
router.delete('/:id', protect, tercerosCtrl.eliminarTercero);

module.exports = router;
