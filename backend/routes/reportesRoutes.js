const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const reportesCtrl = require('../controllers/reportesController');

router.get('/dashboard', protect, reportesCtrl.getDashboardStats);

module.exports = router;
