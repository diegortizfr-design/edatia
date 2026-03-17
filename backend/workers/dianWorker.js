// backend/workers/dianWorker.js
const eventBus = require('../shared/events');

/**
 * Worker para el envío de facturación electrónica a la DIAN
 * Funciona de forma asíncrona para no bloquear el flujo de venta
 */
class DianWorker {
    static init() {
        console.log('🛠️ DianWorker inicializado. Esperando facturas para envío asíncrono...');
        
        eventBus.on('sale.completed', this.processElectronicInvoice);
    }

    /**
     * Procesa el envío a la DIAN
     */
    static async processElectronicInvoice(payload) {
        const { tenant, data } = payload;
        const db = tenant.db;

        try {
            console.log(`[DianWorker] Iniciando proceso DIAN para Factura #${data.id} - Empresa: ${tenant.nombre}`);

            // 1. Marcar factura como procesando
            await db.query('UPDATE facturas SET dian_status = "PROCESANDO" WHERE id = ?', [data.id]);

            // 2. Simulación de integración con proveedor tecnológico DIAN
            // Aquí iría el llamado a una API externa o generación de XML
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simular latencia de red

            const mockResponse = {
                success: true,
                cufe: `CUFE-${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
                xml_path: `/uploads/xml/sale_${data.id}.xml`,
                status: 'ACEPTADO',
                qr_code: 'https://erpod.com/check/invoice/' + data.id
            };

            // 3. Actualizar la factura con la respuesta de la DIAN
            await db.query(`
                UPDATE facturas SET 
                cufe = ?, 
                xml_path = ?, 
                dian_status = ?, 
                qr_code = ?, 
                fecha_validacion = NOW(),
                xml_enviado = 1
                WHERE id = ?
            `, [mockResponse.cufe, mockResponse.xml_path, mockResponse.status, mockResponse.qr_code, data.id]);

            console.log(`[DianWorker] Factura #${data.id} aceptada por la DIAN con CUFE: ${mockResponse.cufe}`);

        } catch (error) {
            console.error(`[DianWorker] Error enviando factura #${data.id} a la DIAN:`, error.message);
            // Marcar para reintento automático
            await db.query('UPDATE facturas SET dian_status = "RECHAZADO", observaciones = ? WHERE id = ?', [error.message, data.id]);
        }
    }
}

module.exports = DianWorker;
