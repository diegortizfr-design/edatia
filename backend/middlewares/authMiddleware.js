// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: './datos.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function protect(req, res, next) {
    console.log('AuthMiddleware: Verificando token para', req.originalUrl); // LOG DIAGNOSTICO
    try {
        const authHeader = req.headers.authorization || '';

        if (!authHeader.startsWith('Bearer ')) {
            console.warn('AuthMiddleware: No Bearer token');
            return res.status(401).json({ ok: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.warn('AuthMiddleware: Token vacío');
            return res.status(401).json({ ok: false, message: 'Empty token' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // aquí puedes añadir info mínima (id, email, role)
        console.log('AuthMiddleware: Token válido para usuario', decoded.id || decoded.sub); // LOG DIAGNOSTICO
        next();
    } catch (err) {
        console.error('AuthMiddleware Error:', err.message);
        return res.status(401).json({ ok: false, message: 'Invalid token: ' + err.message });
    }
}

module.exports = { protect };
