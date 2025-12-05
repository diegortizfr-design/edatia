// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: './datos.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        if (!token) return res.status(401).json({ ok: false, message: 'No token provided' });

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // aquí puedes añadir info mínima (id, email, role)
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        return res.status(401).json({ ok: false, message: 'Invalid token' });
    }
}

module.exports = { protect };
