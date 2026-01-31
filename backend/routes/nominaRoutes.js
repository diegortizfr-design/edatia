// backend/routes/nominaRoutes.js
const express = require('express');
const router = express.Router();
const nominaController = require('../controllers/nominaController');
const auth = require('../middlewares/auth'); // Assuming there's an auth middleware

router.get('/cargos', auth, nominaController.getCargos);
router.post('/cargos', auth, nominaController.createCargo);
router.put('/cargos/:id', auth, nominaController.updateCargo);
router.delete('/cargos/:id', auth, nominaController.deleteCargo);

module.exports = router;
