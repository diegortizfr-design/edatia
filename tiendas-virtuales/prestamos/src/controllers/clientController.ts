import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getClients = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { search } = req.query;

  try {
    const clients = await prisma.customer.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { name: { contains: String(search), mode: 'insensitive' } },
                { documentId: { contains: String(search), mode: 'insensitive' } },
                { phone: { contains: String(search), mode: 'insensitive' } }
              ]
            }
          : {})
      },
      include: {
        loans: {
          select: {
            id: true,
            status: true,
            balance: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Format output to include active loans count and total debt
    const formattedClients = clients.map(client => {
      const activeLoans = client.loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE');
      const totalDebt = activeLoans.reduce((sum, loan) => sum + loan.balance, 0);

      return {
        id: client.id,
        name: client.name,
        documentId: client.documentId,
        phone: client.phone,
        address: client.address,
        email: client.email,
        status: client.status,
        activeLoansCount: activeLoans.length,
        totalDebt,
        createdAt: client.createdAt
      };
    });

    return res.json(formattedClients);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return res.status(500).json({ error: 'Error al obtener el listado de clientes.' });
  }
};

export const getClientById = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { id } = req.params;

  try {
    const client = await prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        loans: {
          include: {
            amortizations: {
              orderBy: { installmentNumber: 'asc' }
            },
            payments: {
              orderBy: { paymentDate: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado o no pertenece a esta empresa.' });
    }

    return res.json(client);
  } catch (error) {
    console.error('Error al obtener ficha de cliente:', error);
    return res.status(500).json({ error: 'Error al obtener los detalles del cliente.' });
  }
};

export const createClient = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { name, documentId, phone, address, email } = req.body;

  if (!name || !documentId || !phone || !address) {
    return res.status(400).json({ error: 'Nombre, Cédula/NIT, teléfono y dirección son obligatorios.' });
  }

  try {
    // Check if client with documentId already exists in this tenant
    const existingClient = await prisma.customer.findFirst({
      where: {
        tenantId,
        documentId
      }
    });

    if (existingClient) {
      return res.status(400).json({ error: 'Ya existe un cliente registrado con ese número de identificación.' });
    }

    const client = await prisma.customer.create({
      data: {
        tenantId,
        name,
        documentId,
        phone,
        address,
        email: email || null
      }
    });

    return res.status(201).json(client);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return res.status(500).json({ error: 'Error al registrar el cliente.' });
  }
};

export const updateClient = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { id } = req.params;
  const { name, documentId, phone, address, email, status } = req.body;

  try {
    const client = await prisma.customer.findFirst({
      where: { id, tenantId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    // If changing documentId, check for uniqueness
    if (documentId && documentId !== client.documentId) {
      const existingClient = await prisma.customer.findFirst({
        where: {
          tenantId,
          documentId,
          id: { not: id }
        }
      });
      if (existingClient) {
        return res.status(400).json({ error: 'Ya existe otro cliente registrado con este número de identificación.' });
      }
    }

    const updatedClient = await prisma.customer.update({
      where: { id },
      data: {
        name: name !== undefined ? name : client.name,
        documentId: documentId !== undefined ? documentId : client.documentId,
        phone: phone !== undefined ? phone : client.phone,
        address: address !== undefined ? address : client.address,
        email: email !== undefined ? email : client.email,
        status: status !== undefined ? status : client.status
      }
    });

    return res.json(updatedClient);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return res.status(500).json({ error: 'Error al actualizar la información del cliente.' });
  }
};

export const deleteClient = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { id } = req.params;

  try {
    const client = await prisma.customer.findFirst({
      where: { id, tenantId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    await prisma.customer.delete({
      where: { id }
    });

    return res.json({ message: 'Cliente eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return res.status(500).json({ error: 'Error al eliminar el cliente.' });
  }
};
