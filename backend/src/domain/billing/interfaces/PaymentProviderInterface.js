// backend/src/domain/billing/interfaces/PaymentProviderInterface.js

/**
 * Interfaz abstracta para proveedores de pago (Stripe, PayPal, etc)
 */
class PaymentProviderInterface {
    /**
     * @param {number} amount
     * @param {string} currency
     */
    async createPaymentIntent(amount, currency) {
        throw new Error('Method not implemented');
    }

    /**
     * @param {string} transactionId
     */
    async verifyTransaction(transactionId) {
        throw new Error('Method not implemented');
    }

    /**
     * @param {string} transactionId
     */
    async refund(transactionId) {
        throw new Error('Method not implemented');
    }
}

module.exports = PaymentProviderInterface;
