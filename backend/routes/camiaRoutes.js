const express = require('express');
const router = express.Router();
const camiaController = require('../controllers/camiaController');
const authMiddleware = require('../middlewares/authMiddleware'); // Assuming it exists as used in other routes

router.get('/eventos', authMiddleware, camiaController.getEventos);
router.post('/eventos', authMiddleware, camiaController.crearEvento);
router.get('/resumen', authMiddleware, camiaController.getResumenHoy);

module.exports = router;
