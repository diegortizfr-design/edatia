// backend/src/repositories/BillingRepository.js
const { getPool } = require('../config/db');

class BillingRepository {
    static async getSubscriptionByEmpresa(empresaId) {
        const [rows] = await getPool().query(`
            SELECT s.*, p.nombre as plan_nombre, p.limite_usuarios 
            FROM saas_suscripciones s
            JOIN saas_planes p ON s.plan_id = p.id
            WHERE s.empresa_id = ?
        `, [empresaId]);
        return rows[0];
    }

    static async updateSubscriptionStatus(id, estado) {
        await getPool().query('UPDATE saas_suscripciones SET estado = ? WHERE id = ?', [estado, id]);
    }

    static async createInvoice(invoiceData) {
        const [result] = await getPool().query(`
            INSERT INTO saas_facturas (suscripcion_id, monto, tipo, periodo_inicio, periodo_fin, fecha_vencimiento)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            invoiceData.suscripcion_id, invoiceData.monto, invoiceData.tipo, 
            invoiceData.periodo_inicio, invoiceData.periodo_fin, invoiceData.fecha_vencimiento
        ]);
        return result.insertId;
    }

    static async recordPayment(paymentData) {
        const [result] = await getPool().query(`
            INSERT INTO saas_pagos (factura_id, monto, metodo_pago, estado, gateway, gateway_transaction_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            paymentData.factura_id, paymentData.monto, paymentData.metodo_pago, 
            paymentData.estado, paymentData.gateway, paymentData.gateway_transaction_id
        ]);
        return result.insertId;
    }
}

module.exports = BillingRepository;
