const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerceController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/orders', authenticateToken, ecommerceController.getWebOrders);
router.get('/orders/:id', authenticateToken, ecommerceController.getWebOrderDetail);
router.put('/orders/:id/status', authenticateToken, ecommerceController.updateWebOrderStatus);

module.exports = router;
