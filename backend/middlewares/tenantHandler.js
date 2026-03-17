// backend/middlewares/tenantHandler.js
const { connectToClientDB } = require('../config/dbFactory');
const { getPool } = require('../config/db');

/**
 * Middleware para resolver el contexto de la empresa (tenant)
 * Se encarga de inyectar la conexión a la DB del cliente en el objeto req
 */
const tenantHandler = async (req, res, next) => {
    try {
        // 1. Obtener el NIT del usuario (inyectado previamente por authMiddleware)
        const nit = req.user?.nit;
        if (!nit) {
            return res.status(401).json({ success: false, message: 'Identificación de empresa (NIT) no encontrada en la sesión.' });
        }

        // 2. Consultar la configuración de la base de datos del cliente en la DB Maestra
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM empresasconfig WHERE nit = ?', [nit]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'La configuración para esta empresa no existe.' });
        }

        const dbConfig = rows[0];

        // 2.1 Validar Bloqueo de Acceso (Billing)
        if (dbConfig.acceso_bloqueado) {
            return res.status(402).json({ 
                success: false, 
                message: 'El acceso a su cuenta ha sido suspendido por falta de pago o infracción de términos.',
                code: 'ACCOUNT_SUSPENDED'
            });
        }

        // 3. Establecer conexión con la base de datos del cliente
        const clientConn = await connectToClientDB(dbConfig);

        // 4. Inyectar el contexto del tenant en el request
        req.tenant = {
            id: dbConfig.id,
            nit: dbConfig.nit,
            nombre: dbConfig.nombre,
            db: clientConn
        };

        // 5. Garantizar que la conexión se cierre al finalizar la petición
        res.on('finish', async () => {
            if (clientConn && typeof clientConn.end === 'function') {
                try {
                    await clientConn.end();
                } catch (err) {
                    console.error('Error cerrando conexión del tenant:', err.message);
                }
            }
        });

        next();
    } catch (error) {
        console.error('Error en tenantHandler:', error);
        res.status(500).json({ success: false, message: 'Error de infraestructura al resolver el inquilino (Tenant).' });
    }
};

module.exports = tenantHandler;
