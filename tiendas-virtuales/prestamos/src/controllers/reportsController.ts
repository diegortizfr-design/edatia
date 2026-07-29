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

    const allIncomes = await prisma.income.findMany({
      where: { tenantId }
    });
    const totalIncomes = allIncomes.reduce((sum, i) => sum + i.amount, 0);

    const allExpenses = await prisma.expense.findMany({
      where: { tenantId }
    });
    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    const availableCapital = Math.max(0, initialCapital - totalCapitalPrestado + totalCollected + totalIncomes - totalExpenses);

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
        totalIncomes,
        totalExpenses,
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

// Detailed Financial Treasury / Reports KPIs
export const getTreasuryReport = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { initialCapital: true }
    });
    const initialCapital = tenant?.initialCapital || 0;

    const activeLoans = await prisma.loan.findMany({
      where: { tenantId, status: { in: ['ACTIVE', 'OVERDUE'] } }
    });

    const capitalPrestado = activeLoans.reduce((sum, l) => sum + l.principal, 0);
    const totalInteresProyectado = activeLoans.reduce((sum, l) => sum + l.interestAmount, 0);

    const allPayments = await prisma.payment.findMany({
      where: { tenantId }
    });
    const totalCollected = allPayments.reduce((sum, p) => sum + p.amount, 0);

    const allIncomes = await prisma.income.findMany({
      where: { tenantId }
    });
    const totalIncomes = allIncomes.reduce((sum, i) => sum + i.amount, 0);

    const allExpenses = await prisma.expense.findMany({
      where: { tenantId }
    });
    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    const availableCapital = Math.max(0, initialCapital - capitalPrestado + totalCollected + totalIncomes - totalExpenses);

    const amortizations = await prisma.amortizationSchedule.findMany({
      where: { loan: { tenantId } }
    });

    const capitalCobrado = amortizations.reduce((sum, a) => sum + a.principalPaid, 0);
    const interesesCobrados = amortizations.reduce((sum, a) => sum + a.interestPaid, 0);
    
    const capitalPorCobrar = Math.max(0, capitalPrestado - capitalCobrado);
    const interesesPorCobrar = Math.max(0, totalInteresProyectado - interesesCobrados);

    return res.json({
      initialCapital,
      availableCapital,
      capitalPrestado,
      totalCollected,
      totalIncomes,
      totalExpenses,
      cajaIntereses: interesesCobrados,
      capitalPorCobrar,
      capitalCobrado,
      interesesPorCobrar,
      interesesCobrados
    });
  } catch (error) {
    console.error('Error al obtener reporte financiero:', error);
    return res.status(500).json({ error: 'Error al obtener reporte financiero.' });
  }
};

// Recaudo Proyección (Calendario por Días)
export const getRecaudoProyeccion = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { days = '30' } = req.query;

  try {
    const limitDays = parseInt(days as string) || 30;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate.getTime());
    endDate.setDate(endDate.getDate() + limitDays);
    endDate.setHours(23, 59, 59, 999);

    const pendingAmortizations = await prisma.amortizationSchedule.findMany({
      where: {
        loan: {
          tenantId,
          status: { in: ['ACTIVE', 'OVERDUE'] }
        },
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        dueDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        loan: {
          include: { customer: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Group by YYYY-MM-DD
    const groupedByDate: Record<string, any> = {};

    pendingAmortizations.forEach(item => {
      const dateStr = item.dueDate.toISOString().split('T')[0];
      const pendingAmount = item.amount - item.amountPaid;

      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = {
          date: dateStr,
          rawDate: item.dueDate,
          installmentsCount: 0,
          totalExpected: 0,
          items: []
        };
      }

      groupedByDate[dateStr].installmentsCount += 1;
      groupedByDate[dateStr].totalExpected += pendingAmount;
      groupedByDate[dateStr].items.push({
        amortizationId: item.id,
        installmentNumber: item.installmentNumber,
        loanNumber: item.loan.loanNumber,
        customerName: item.loan.customer.name,
        customerPhone: item.loan.customer.phone,
        amount: pendingAmount
      });
    });

    const projectionList = Object.values(groupedByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalPeriodExpected = projectionList.reduce((sum, p) => sum + p.totalExpected, 0);

    return res.json({
      days: limitDays,
      totalPeriodExpected,
      projections: projectionList
    });
  } catch (error) {
    console.error('Error al calcular proyección de recaudo:', error);
    return res.status(500).json({ error: 'Error al calcular proyección de recaudo.' });
  }
};
