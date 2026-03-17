// backend/src/api/v1/billing/billing.routes.js
const express = require('express');
const router = express.Router();
const BillingController = require('./billing.controller');
const authMiddleware = require('../../../../middlewares/auth');

// Rutas protegidas de Billing
router.get('/plans', authMiddleware, BillingController.getPlans);
router.get('/subscription', authMiddleware, BillingController.getSubscription);
router.post('/subscribe', authMiddleware, BillingController.subscribe);
router.post('/pay', authMiddleware, BillingController.processPayment);

module.exports = router;
