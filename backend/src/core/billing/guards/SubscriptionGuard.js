// backend/src/core/billing/guards/SubscriptionGuard.js
const { getPool } = require('../../../config/db');

/**
 * SubscriptionGuard v2.0
 * Valida límites dinámicos y acceso a módulos premium.
 * @param {string} resource ('usuarios', 'sucursales', 'facturas', 'nomina', 'mrp', etc)
 */
const SubscriptionGuard = (resource) => {
    return async (req, res, next) => {
        try {
            const pool = getPool();
            const empresaId = req.user.empresa_id;

            const [rows] = await pool.query(`
                SELECT p.*, s.estado, u.*
                FROM saas_suscripciones s
                JOIN saas_planes p ON s.plan_id = p.id
                LEFT JOIN saas_uso_actual u ON s.empresa_id = u.empresa_id
                WHERE s.empresa_id = ? AND s.estado IN ('TRIAL', 'ACTIVE')
                LIMIT 1
            `, [empresaId]);

            if (rows.length === 0) {
                return res.status(403).json({ success: false, message: 'Su suscripción no está activa.' });
            }

            const ctx = rows[0];
            const premiumModules = JSON.parse(ctx.modulos_premium || '[]');

            // 1. Validar Límites Numéricos
            if (resource === 'usuarios' && ctx.usuarios_count >= ctx.limite_usuarios) return overLimit(res, 'usuarios', ctx.nombre);
            if (resource === 'sucursales' && ctx.sucursales_count >= ctx.limite_sucursales) return overLimit(res, 'sucursales', ctx.nombre);
            if (resource === 'facturas' && ctx.facturas_mes_count >= ctx.limite_facturas_mes) return overLimit(res, 'facturas mensuales', ctx.nombre);

            // 2. Validar Módulos Premium
            const baseModules = ['ventas', 'compras', 'productos', 'inventario', 'terceros'];
            if (!baseModules.includes(resource) && !premiumModules.includes(resource)) {
                return res.status(403).json({ 
                    success: false, 
                    message: `El módulo '${resource}' no está incluido en su plan ${ctx.nombre}.`,
                    code: 'MODULE_NOT_IN_PLAN'
                });
            }

            next();
        } catch (error) {
            console.error('[SubscriptionGuard] Error:', error);
            res.status(500).json({ success: false, message: 'Error de validación de suscripción.' });
        }
    };
};

function overLimit(res, type, plan) {
    return res.status(403).json({ 
        success: false, 
        message: `Ha excedido el límite de ${type} para su plan ${plan}.`,
        code: 'PLAN_LIMIT_EXCEEDED'
    });
}

module.exports = SubscriptionGuard;
