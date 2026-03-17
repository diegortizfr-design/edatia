// backend/core/accounting/accountingEngine.js
const eventBus = require('../../shared/events');

/**
 * Motor Contable de ERPod
 * Escucha eventos del sistema y genera asientos contables basados en plantillas
 */
class AccountingEngine {
    static init() {
        console.log('🚀 AccountingEngine inicializado. Escuchando eventos financieros...');
        
        // Suscribirse a los eventos clave
        eventBus.on('sale.completed', this.handleSaleAccounting);
        eventBus.on('purchase.completed', this.handlePurchaseAccounting);
    }

    /**
     * Procesa la contabilidad de una venta completada
     */
    static async handleSaleAccounting(payload) {
        const { tenant, data } = payload;
        const db = tenant.db;

        try {
            console.log(`[AccountingEngine] Procesando asiento para Venta #${data.id} - Empresa: ${tenant.nombre}`);

            // 1. Obtener la plantilla configurada para este evento
            // Por ahora usamos una lógica base mientras se implementan las tablas de plantillas
            const [plantillas] = await db.query(
                'SELECT * FROM contabilidad_plantillas WHERE evento_slug = ? LIMIT 1', 
                ['sale.completed']
            );

            if (plantillas.length === 0) {
                console.warn(`[AccountingEngine] No se encontró plantilla configurada para sale.completed en el tenant ${tenant.nit}`);
                return;
            }

            const plantilla = plantillas[0];

            // 2. Obtener las reglas de la plantilla
            const [reglas] = await db.query(
                'SELECT * FROM contabilidad_plantilla_detalles WHERE plantilla_id = ?',
                [plantilla.id]
            );

            if (reglas.length === 0) return;

            // 3. Iniciar Transacción Contable
            // Nota: req.tenant.db ya es una conexión, pero para transacciones complejas 
            // usaríamos un pool o aseguraríamos persistencia atómica.
            
            const totalDebito = 0;
            const totalCredito = 0;

            // Crear el encabezado del comprobante
            const [comp] = await db.query(`
                INSERT INTO contabilidad_comprobantes 
                (numero, tipo, fecha, descripcion, total_debito, total_credito, estado)
                VALUES (?, 'AUTOMATICO', CURDATE(), ?, 0, 0, 'Contabilizado')
            `, [`AS-VT-${data.id}-${Date.now()}`, `Asiento automático de venta #${data.numero_comprobante || data.id}`]);

            const comprobanteId = comp.insertId;
            let sumDebito = 0;
            let sumCredito = 0;

            // 4. Procesar cada regla según el valor de la venta
            for (const regla of reglas) {
                let valor = 0;
                
                // Evaluar fórmula simple (TOTAL, SUBTOTAL, IVA)
                if (regla.valor_formula === 'TOTAL') valor = parseFloat(data.total);
                else if (regla.valor_formula === 'SUBTOTAL') valor = parseFloat(data.subtotal || (data.total / 1.19)); // Fallback manual si no viene
                else if (regla.valor_formula === 'IVA') valor = parseFloat(data.iva || (data.total - (data.total / 1.19)));

                if (valor === 0) continue;

                const debito = regla.naturaleza === 'DEBITO' ? valor : 0;
                const credito = regla.naturaleza === 'CREDITO' ? valor : 0;
                
                sumDebito += debito;
                sumCredito += credito;

                // Obtener el código de cuenta real desde el alias configurado
                const [cuentas] = await db.query(
                    'SELECT cuenta_codigo FROM contabilidad_cuentas_config WHERE alias = ? LIMIT 1',
                    [regla.cuenta_alias]
                );

                const cuentaCodigo = cuentas.length > 0 ? cuentas[0].cuenta_codigo : regla.cuenta_alias;

                await db.query(`
                    INSERT INTO contabilidad_movimientos 
                    (comprobante_id, cuenta_codigo, tercero_id, descripcion, debito, credito, modulo_origen, referencia_id)
                    VALUES (?, ?, ?, ?, ?, ?, 'VENTAS', ?)
                `, [comprobanteId, cuentaCodigo, data.cliente_id, `Mov. venta #${data.id}`, debito, credito, data.id]);
            }

            // 5. Validar Partida Doble
            if (Math.abs(sumDebito - sumCredito) > 0.01) {
                console.error(`[AccountingEngine] ERROR: El asiento de la venta #${data.id} no está balanceado. Diferencia: ${sumDebito - sumCredito}`);
                // En un sistema real aquí haríamos ROLLBACK de la transacción contable si usáramos un objeto de transacción
            }

            // 6. Actualizar totales del comprobante
            await db.query(
                'UPDATE contabilidad_comprobantes SET total_debito = ?, total_credito = ? WHERE id = ?',
                [sumDebito, sumCredito, comprobanteId]
            );

            console.log(`[AccountingEngine] Asiento generado exitosamente para Venta #${data.id}`);

        } catch (error) {
            console.error(`[AccountingEngine] Fallo al procesar contabilidad de venta #${data.id}:`, error.message);
        }
    }

    /**
     * Procesa la contabilidad de una compra completada
     */
    static async handlePurchaseAccounting(payload) {
        // Implementación similar para compras...
        console.log('[AccountingEngine] Recibido evento de compra completada. Procesando...');
    }
}

module.exports = AccountingEngine;
