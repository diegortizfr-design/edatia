import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'prestamos_secret_jwt_key_2026_PROD';

export const register = async (req: AuthenticatedRequest, res: Response) => {
  const { nit, name, email, password } = req.body;

  if (!nit || !name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios (NIT, nombre, correo, contraseña).' });
  }

  try {
    // Check if NIT or Email already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { nit },
          { email }
        ]
      }
    });

    if (existingTenant) {
      return res.status(400).json({ error: 'El NIT o el correo electrónico ya se encuentran registrados.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        nit,
        name,
        email,
        password: hashedPassword
      }
    });

    // Generate JWT
    const token = jwt.sign({ id: tenant.id, email: tenant.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Empresa registrada correctamente.',
      token,
      tenant: {
        id: tenant.id,
        nit: tenant.nit,
        name: tenant.name,
        email: tenant.email
      }
    });
  } catch (error: any) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Ocurrió un error al registrar la empresa.' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  const { nit, email, password } = req.body;

  if (!nit || !email || !password) {
    return res.status(400).json({ error: 'NIT, correo y contraseña son obligatorios.' });
  }

  try {
    // Find Tenant by NIT and Email
    const tenant = await prisma.tenant.findFirst({
      where: {
        nit,
        email
      }
    });

    if (!tenant) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifique el NIT y correo.' });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, tenant.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas. Contraseña incorrecta.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: tenant.id, email: tenant.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      tenant: {
        id: tenant.id,
        nit: tenant.nit,
        name: tenant.name,
        email: tenant.email
      }
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Ocurrió un error al iniciar sesión.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'No se pudo identificar el Tenant.' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: {
        id: true,
        nit: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    return res.json(tenant);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ error: 'Ocurrió un error al obtener los datos de la empresa.' });
  }
};
