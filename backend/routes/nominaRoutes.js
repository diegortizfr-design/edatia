// backend/routes/nominaRoutes.js
const express = require('express');
const router = express.Router();
const nominaController = require('../controllers/nominaController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/cargos', protect, nominaController.getCargos);
router.post('/cargos', protect, nominaController.createCargo);
router.put('/cargos/:id', protect, nominaController.updateCargo);
router.delete('/cargos/:id', protect, nominaController.deleteCargo);

module.exports = router;
