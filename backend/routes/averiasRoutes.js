const express = require('express');
const router = express.Router();
const averiasController = require('../controllers/averiasController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, averiasController.getAverias);
router.post('/', protect, averiasController.crearAveria);

module.exports = router;
