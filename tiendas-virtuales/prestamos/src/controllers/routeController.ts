import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDailyRoute = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { date } = req.query; // Expects YYYY-MM-DD, defaults to today

  try {
    const targetDate = date ? new Date(String(date)) : new Date();
    
    // Set targetDate to end of that day (23:59:59.999) to capture all installments due up to that date
    const endOfDay = new Date(targetDate.getTime());
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all active/overdue loans and their pending amortizations due on or before endOfDay
    const loansWithPendingAmortizations = await prisma.loan.findMany({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'OVERDUE'] },
        amortizations: {
          some: {
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            dueDate: { lte: endOfDay }
          }
        }
      },
      include: {
        customer: true,
        amortizations: {
          where: {
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            dueDate: { lte: endOfDay }
          },
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    // Group and format the route list by customer
    const routeList = loansWithPendingAmortizations.map(loan => {
      const customer = loan.customer;
      
      // Calculate total amount to collect (sum of all pending installments up to today)
      const pendingInstallments = loan.amortizations;
      const totalToCollect = pendingInstallments.reduce((sum, inst) => {
        return sum + (inst.amount - inst.amountPaid);
      }, 0);

      // Identify if the loan has overdue installments (due date strictly before today's start)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const isOverdue = pendingInstallments.some(inst => inst.dueDate < startOfToday);

      return {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        customerId: customer.id,
        customerName: customer.name,
        documentId: customer.documentId,
        phone: customer.phone,
        address: customer.address,
        totalBalance: loan.balance,
        installmentAmt: loan.installmentAmt,
        totalToCollect,
        pendingInstallmentsCount: pendingInstallments.length,
        isOverdue,
        frequency: loan.paymentFrequency
      };
    });

    // Sort by address or customer name for logical routing
    routeList.sort((a, b) => a.address.localeCompare(b.address));

    return res.json({
      date: endOfDay.toISOString().split('T')[0],
      totalCustomers: routeList.length,
      route: routeList
    });
  } catch (error) {
    console.error('Error al generar la ruta del día:', error);
    return res.status(500).json({ error: 'Error al generar la ruta de cobranza del día.' });
  }
};
