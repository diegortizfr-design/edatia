// backend/routes/v1/billing/billing.controller.js
const BillingService = require('../../../src/domain/billing/services/BillingService');

/**
 * Controlador para la gestión comercial del SaaS
 */
class BillingController {
    static async getPlans(req, res) {
        // Consultar saas_planes activos
        res.json({ success: true, data: [] });
    }

    static async getSubscription(req, res) {
        // Estado actual de la empresa
        res.json({ success: true, data: {} });
    }

    static async subscribe(req, res) {
        try {
            const { planId, paymentMethod } = req.body;
            const result = await BillingService.changePlan(req.user.empresa_id, planId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async processPayment(req, res) {
        try {
            const { invoiceId, payload } = req.body;
            const result = await BillingService.processPayment(invoiceId, payload);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = BillingController;
