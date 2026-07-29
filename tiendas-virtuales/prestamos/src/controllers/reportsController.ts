import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getPortfolioStats = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;

  try {
    // 1. Get active and overdue loans
    const activeLoans = await prisma.loan.findMany({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'OVERDUE'] }
      }
    });

    const totalActiveLoansCount = activeLoans.length;
    const totalCapitalPrestado = activeLoans.reduce((sum, l) => sum + l.principal, 0);
    const totalExpectedRecuperacion = activeLoans.reduce((sum, l) => sum + l.totalAmount, 0);
    const currentOutstandingBalance = activeLoans.reduce((sum, l) => sum + l.balance, 0);
    const totalExpectedInteres = activeLoans.reduce((sum, l) => sum + l.interestAmount, 0);

    // 2. Get payments stats
    const allPayments = await prisma.payment.findMany({
      where: { tenantId }
    });

    const totalCollected = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // 3. Collected today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const paymentsToday = await prisma.payment.findMany({
      where: {
        tenantId,
        paymentDate: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });
    const totalCollectedToday = paymentsToday.reduce((sum, p) => sum + p.amount, 0);

    // 4. Overdue loans calculations
    const overdueLoans = activeLoans.filter(l => l.status === 'OVERDUE');
    const totalOverdueCount = overdueLoans.length;
    const totalOverdueBalance = overdueLoans.reduce((sum, l) => sum + l.balance, 0);

    // 5. Total Customers count
    const totalCustomers = await prisma.customer.count({
      where: { tenantId, status: 'ACTIVE' }
    });

    // 6. Chart data: last 7 days of collections
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getTime());
      start.setHours(0, 0, 0, 0);
      const end = new Date(d.getTime());
      end.setHours(23, 59, 59, 999);

      const dayPayments = await prisma.payment.findMany({
        where: {
          tenantId,
          paymentDate: {
            gte: start,
            lte: end
          }
        }
      });

      const dayTotal = dayPayments.reduce((sum, p) => sum + p.amount, 0);
      const formattedDate = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });

      last7DaysData.push({
        date: formattedDate,
        amount: dayTotal
      });
    }

    // Fetch tenant details for initial capital
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { initialCapital: true }
    });
    const initialCapital = tenant?.initialCapital || 0;
    const availableCapital = Math.max(0, initialCapital - totalCapitalPrestado + totalCollected);

    return res.json({
      summary: {
        totalCustomers,
        activeLoansCount: totalActiveLoansCount,
        initialCapital,
        availableCapital,
        capitalPrestado: totalCapitalPrestado,
        expectedRecuperacion: totalExpectedRecuperacion,
        outstandingBalance: currentOutstandingBalance,
        totalInteresGenerado: totalExpectedInteres,
        totalCollected,
        collectedToday: totalCollectedToday,
        overdueLoansCount: totalOverdueCount,
        overdueBalance: totalOverdueBalance,
        collectionEfficiency: totalExpectedRecuperacion > 0 
          ? Math.round(((totalExpectedRecuperacion - currentOutstandingBalance) / totalExpectedRecuperacion) * 100)
          : 0
      },
      chartData: last7DaysData
    });
  } catch (error) {
    console.error('Error al generar estadísticas:', error);
    return res.status(500).json({ error: 'Error al generar estadísticas de cartera.' });
  }
};
