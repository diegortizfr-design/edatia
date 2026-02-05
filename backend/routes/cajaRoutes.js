const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const cajaCtrl = require('../controllers/cajaController');

router.get('/config', protect, cajaCtrl.listarCajas);
router.post('/config', protect, cajaCtrl.crearCaja);
router.put('/config/:id', protect, cajaCtrl.actualizarCaja);
router.delete('/config/:id', protect, cajaCtrl.eliminarCaja);

router.get('/verificar', protect, cajaCtrl.verificarCaja);
router.get('/totales', protect, cajaCtrl.obtenerTotalesCaja);
router.post('/abrir', protect, cajaCtrl.abrirCaja);
router.post('/cerrar', protect, cajaCtrl.cerrarCaja);

module.exports = router;
