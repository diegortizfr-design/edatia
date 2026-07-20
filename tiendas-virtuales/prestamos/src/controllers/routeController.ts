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

// Arqueo / Cierre de caja de la ruta diaria
export const getRouteCheckout = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { date } = req.query; // Expects YYYY-MM-DD

  try {
    const targetDate = date ? new Date(String(date)) : new Date();
    
    // Start and end of the target day
    const startOfDay = new Date(targetDate.getTime());
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate.getTime());
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Fetch scheduled amortizations that were pending at the start of today
    const scheduledAmortizations = await prisma.amortizationSchedule.findMany({
      where: {
        loan: {
          tenantId,
          status: { in: ['ACTIVE', 'OVERDUE', 'PAID', 'RENEWED'] }
        },
        dueDate: { lte: endOfDay },
        OR: [
          { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
          { 
            status: 'PAID',
            paidAt: { gte: startOfDay, lte: endOfDay }
          }
        ]
      },
      include: {
        loan: {
          include: {
            customer: true
          }
        }
      }
    });

    // 2. Fetch payments registered on the target date
    const paymentsToday = await prisma.payment.findMany({
      where: {
        tenantId,
        paymentDate: { gte: startOfDay, lte: endOfDay }
      },
      include: {
        customer: true,
        loan: true
      }
    });

    // Map scheduled loans
    const scheduledLoansMap = new Map<string, any>();
    scheduledAmortizations.forEach(am => {
      const loan = am.loan;
      const amountDue = am.status === 'PAID' ? am.amount : (am.amount - am.amountPaid);

      if (!scheduledLoansMap.has(loan.id)) {
        scheduledLoansMap.set(loan.id, {
          loan,
          customer: loan.customer,
          amountDue: 0
        });
      }
      scheduledLoansMap.get(loan.id).amountDue += amountDue;
    });

    const scheduledClientsCount = scheduledLoansMap.size;
    const scheduledAmount = Array.from(scheduledLoansMap.values()).reduce((sum, item) => sum + item.amountDue, 0);

    // Map collected totals
    const collectedAmount = paymentsToday.reduce((sum, p) => sum + p.amount, 0);
    const collectedCustomersSet = new Set<string>();
    paymentsToday.forEach(p => collectedCustomersSet.add(p.customerId));
    const collectedClientsCount = collectedCustomersSet.size;

    // Calculate pending totals from scheduled target
    let pendingAmount = 0;
    const pendingLoansSet = new Set<string>();

    scheduledLoansMap.forEach((item, loanId) => {
      const paymentsForLoan = paymentsToday.filter(p => p.loanId === loanId);
      const totalPaidToday = paymentsForLoan.reduce((sum, p) => sum + p.amount, 0);
      
      const remainingDue = Math.max(0, item.amountDue - totalPaidToday);
      if (remainingDue > 0) {
        pendingAmount += remainingDue;
        pendingLoansSet.add(item.customer.id);
      }
    });

    const pendingClientsCount = pendingLoansSet.size;
    const complianceRate = scheduledAmount > 0 ? Math.round((collectedAmount / scheduledAmount) * 100) : 100;
    const isCompleted = pendingClientsCount === 0 && pendingAmount === 0;

    return res.json({
      date: startOfDay.toISOString().split('T')[0],
      scheduledClientsCount,
      scheduledAmount,
      collectedClientsCount,
      collectedAmount,
      pendingClientsCount,
      pendingAmount,
      complianceRate,
      isCompleted
    });
  } catch (error) {
    console.error('Error al generar cierre de ruta:', error);
    return res.status(500).json({ error: 'Error al generar el cierre de la ruta.' });
  }
};
