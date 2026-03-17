// backend/src/domain/billing/services/BillingService.js
const BillingRepository = require('../../../repositories/BillingRepository');
const eventBus = require('../../../../shared/events');

class BillingService {
    /**
     * Procesa un cambio de plan con cálculo de prorrateo (diseño inicial)
     */
    static async changePlan(empresaId, newPlanId) {
        const currentSub = await BillingRepository.getSubscriptionByEmpresa(empresaId);
        
        // 1. Guardar historial
        // 2. Calcular prorrateo (crédito del periodo no usado)
        // 3. Generar factura de ajuste si es upgrade
        
        await BillingRepository.updateSubscriptionStatus(currentSub.id, 'ACTIVE'); // Placeholder
        
        eventBus.emit('billing.plan.changed', { 
            empresa_id: empresaId, 
            old_plan: currentSub.plan_id, 
            new_plan: newPlanId 
        });
        
        return { success: true, message: 'Plan actualizado con éxito' };
    }

    static async processPayment(invoiceId, paymentPayload) {
        // Lógica de validación con pasarela vía Adapter
        const paymentId = await BillingRepository.recordPayment({
            factura_id: invoiceId,
            monto: paymentPayload.monto,
            estado: 'SUCCESS',
            gateway: paymentPayload.gateway
        });

        eventBus.emit('billing.invoice.paid', { invoice_id: invoiceId });
        return { success: true, paymentId };
    }
}

module.exports = BillingService;
