const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerceController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/orders', protect, ecommerceController.getWebOrders);
router.get('/orders/:id', protect, ecommerceController.getWebOrderDetail);
router.put('/orders/:id/status', protect, ecommerceController.updateWebOrderStatus);

module.exports = router;
