// backend/routes/v1/billing/billing.routes.js
const express = require('express');
const router = express.Router();
const BillingController = require('./billing.controller');
const { protect } = require('../../../middlewares/authMiddleware');

// Rutas protegidas de Billing
router.get('/plans', protect, BillingController.getPlans);
router.get('/subscription', protect, BillingController.getSubscription);
router.post('/subscribe', protect, BillingController.subscribe);
router.post('/pay', protect, BillingController.processPayment);

module.exports = router;
