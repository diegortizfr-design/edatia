// backend/src/core/billing/workers/billingWorker.js
const { getPool } = require('../../../../config/db');
const eventBus = require('../../../../../shared/events');

/**
 * Motor de Facturación SaaS Profesional v2.1
 * Tareas: Trial Monitor, Invoice Generator, Payment Collector, Subscription Enforcer
 */
class BillingWorker {
    static async runExecutionCycle() {
        console.log('[BillingWorker] Iniciando ciclo de ejecución...');
        const pool = getPool();

        try {
            // 1. MONITOREO DE TRIALS: Empresas en TRIAL cuya fecha expiró
            const [expiredTrials] = await pool.query(`
                SELECT * FROM saas_suscripciones 
                WHERE estado = 'TRIAL' AND trial_ends_at <= NOW()
            `);
            for (const sub of expiredTrials) {
                await this.handleExpiredTrial(sub);
            }

            // 2. GENERACIÓN DE FACTURAS RECURRENTES: Basado en next_billing_date
            const [toBill] = await pool.query(`
                SELECT s.*, p.precio_mensual 
                FROM saas_suscripciones s
                JOIN saas_planes p ON s.plan_id = p.id
                WHERE s.estado = 'ACTIVE' AND s.next_billing_date <= CURDATE()
            `);
            for (const sub of toBill) {
                await this.generateRecurringInvoice(sub);
            }

            // 3. REINTENTO DE PAGOS Y SUSPENSIÓN POR MOROSIDAD
            // Facturas PENDING vencidas
            const [overdue] = await pool.query(`
                SELECT f.*, s.empresa_id 
                FROM saas_facturas f
                JOIN saas_suscripciones s ON f.suscripcion_id = s.id
                WHERE f.estado = 'PENDING' AND f.fecha_vencimiento <= CURDATE()
                AND f.payment_attempts < 3
            `);
            for (const inv of overdue) {
                await this.processCollectionRetry(inv);
            }

        } catch (error) {
            console.error('[BillingWorker] Error en el ciclo:', error);
        }
    }

    static async handleExpiredTrial(sub) {
        const pool = getPool();
        // Cambiar a PAST_DUE o SUSPENDED si no hay tarjeta
        await pool.query('UPDATE saas_suscripciones SET estado = "SUSPENDED" WHERE id = ?', [sub.id]);
        await pool.query('UPDATE empresasconfig SET acceso_bloqueado = 1 WHERE id = ?', [sub.empresa_id]);
        eventBus.emit('billing.trial.expired', { empresa_id: sub.empresa_id });
    }

    static async generateRecurringInvoice(sub) {
        const nextDate = new Date(sub.next_billing_date);
        nextDate.setMonth(nextDate.getMonth() + 1);

        const pool = getPool();
        await pool.query(`
            INSERT INTO saas_facturas (suscripcion_id, monto, periodo_inicio, periodo_fin, fecha_vencimiento)
            VALUES (?, ?, CURDATE(), ?, DATE_ADD(CURDATE(), INTERVAL 5 DAY))
        `, [sub.id, sub.precio_mensual, nextDate]);

        await pool.query('UPDATE saas_suscripciones SET next_billing_date = ? WHERE id = ?', [nextDate, sub.id]);
        eventBus.emit('billing.invoice.generated', { empresa_id: sub.empresa_id });
    }

    static async processCollectionRetry(inv) {
        const pool = getPool();
        const attempts = inv.payment_attempts + 1;
        
        // Simulación de reintento de pago...
        const paymentSuccess = false; // Aquí iría Stripe

        if (paymentSuccess) {
            await pool.query('UPDATE saas_facturas SET estado = "PAID", fecha_pago = NOW() WHERE id = ?', [inv.id]);
            eventBus.emit('billing.invoice.paid', { invoice_id: inv.id });
        } else {
            await pool.query('UPDATE saas_facturas SET payment_attempts = ?, last_attempt_at = NOW() WHERE id = ?', [attempts, inv.id]);
            if (attempts >= 3) {
                await pool.query('UPDATE saas_suscripciones SET estado = "SUSPENDED" WHERE id = ?', [inv.suscripcion_id]);
                await pool.query('UPDATE empresasconfig SET acceso_bloqueado = 1 WHERE id = ?', [inv.empresa_id]);
                eventBus.emit('billing.subscription.suspended', { empresa_id: inv.empresa_id });
            } else {
                eventBus.emit('billing.payment.failed', { invoice_id: inv.id, attempts });
            }
        }
    }
}

module.exports = BillingWorker;
