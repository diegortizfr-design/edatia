import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  tenantId?: string;
  tenantEmail?: string;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'prestamos_secret_jwt_key_2026_PROD';
    const decoded = jwt.verify(token, secret) as { id: string; email: string };
    req.tenantId = decoded.id;
    req.tenantEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};
