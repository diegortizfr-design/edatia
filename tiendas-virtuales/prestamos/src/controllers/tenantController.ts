import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

// Get tenant settings
export const getTenantSettings = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        nit: true,
        email: true,
        phone: true,
        address: true,
        lateInterestEnabled: true,
        lateInterestRate: true,
        lateInterestPeriod: true,
        isPremium: true,
        createdAt: true,
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    return res.json(tenant);
  } catch (error) {
    console.error('Error al consultar configuración de empresa:', error);
    return res.status(500).json({ error: 'Error al obtener la configuración.' });
  }
};

// Update tenant settings
export const updateTenantSettings = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { name, nit, email, phone, address, lateInterestEnabled, lateInterestRate, lateInterestPeriod } = req.body;

  try {
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(nit !== undefined ? { nit } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(lateInterestEnabled !== undefined ? { lateInterestEnabled: Boolean(lateInterestEnabled) } : {}),
        ...(lateInterestRate !== undefined ? { lateInterestRate: parseFloat(lateInterestRate) } : {}),
        ...(lateInterestPeriod !== undefined ? { lateInterestPeriod } : {}),
      },
      select: {
        id: true,
        name: true,
        nit: true,
        email: true,
        phone: true,
        address: true,
        lateInterestEnabled: true,
        lateInterestRate: true,
        lateInterestPeriod: true,
        isPremium: true,
      }
    });

    return res.json({
      message: 'Configuración actualizada exitosamente.',
      tenant: updatedTenant,
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return res.status(500).json({ error: 'Error al actualizar la configuración de la empresa.' });
  }
};
