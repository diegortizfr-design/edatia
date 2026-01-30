const express = require('express');
const router = express.Router();
const camiaController = require('../controllers/camiaController');
const { protect } = require('../middlewares/authMiddleware'); // Assuming it exists as used in other routes

router.get('/eventos', protect, camiaController.getEventos);
router.post('/eventos', protect, camiaController.crearEvento);
router.get('/resumen', protect, camiaController.getResumenHoy);

module.exports = router;
