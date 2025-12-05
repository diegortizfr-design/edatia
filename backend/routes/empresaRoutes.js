// backend/routes/empresaRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const empresaCtrl = require('../controllers/empresaController');

router.get('/', protect, empresaCtrl.listarEmpresas);
router.post('/', protect, empresaCtrl.crearEmpresa);

module.exports = router;
