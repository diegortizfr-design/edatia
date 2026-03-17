// backend/core/billing/PlanGuard.js
const { getPool } = require('../../config/db');

/**
 * Middleware para validar límites del plan SaaS
 * @param {string} resource ('usuarios', 'sucursales', 'facturas')
 */
const validatePlanLimit = (resource) => {
    return async (req, res, next) => {
        try {
            const empresaId = req.user.empresa_id; // Debería estar en el JWT
            const pool = getPool();

            const query = `
                SELECT p.*, s.estado, u.usuarios_count, u.sucursales_count, u.facturas_mes_count
                FROM saas_suscripciones s
                JOIN saas_planes p ON s.plan_id = p.id
                LEFT JOIN saas_uso_actual u ON s.empresa_id = u.empresa_id
                WHERE s.empresa_id = ? AND s.estado IN ('TRIAL', 'ACTIVE')
                LIMIT 1
            `;

            const [rows] = await pool.query(query, [empresaId]);
            if (rows.length === 0) {
                return res.status(403).json({ success: false, message: 'Suscripción no activa o inexistente.' });
            }

            const sub = rows[0];
            let isOverLimit = false;

            if (resource === 'usuarios' && sub.usuarios_count >= sub.limite_usuarios) isOverLimit = true;
            if (resource === 'sucursales' && sub.sucursales_count >= sub.limite_sucursales) isOverLimit = true;
            if (resource === 'facturas' && sub.facturas_mes_count >= sub.limite_facturas_mes) isOverLimit = true;

            if (isOverLimit) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Límite de ${resource} alcanzado para su plan ${sub.nombre}. Por favor, actualice su suscripción.`,
                    code: 'PLAN_LIMIT_REACHED'
                });
            }

            next();
        } catch (error) {
            console.error('[PlanGuard] Error:', error);
            res.status(500).json({ success: false, message: 'Error validando límites del plan.' });
        }
    };
};

module.exports = { validatePlanLimit };
