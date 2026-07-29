import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

// Get expenses list and totals for tenant
export const getExpenses = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;

  try {
    const expenses = await prisma.expense.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return res.json({
      totalExpenses,
      count: expenses.length,
      expenses
    });
  } catch (error) {
    console.error('Error al obtener egresos:', error);
    return res.status(500).json({ error: 'Error al listar los egresos.' });
  }
};

// Create a new expense
export const createExpense = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { amount, description } = req.body;

  if (!amount || !description) {
    return res.status(400).json({ error: 'Monto u observación son requeridos para registrar el egreso.' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'El monto del egreso debe ser un número mayor a cero.' });
  }

  try {
    // Check available cash in box
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { initialCapital: true }
    });
    const initialCapital = tenant?.initialCapital || 0;

    const activeLoans = await prisma.loan.findMany({
      where: { tenantId, status: { in: ['ACTIVE', 'OVERDUE'] } },
      select: { principal: true }
    });
    const totalCapitalPrestado = activeLoans.reduce((sum, l) => sum + l.principal, 0);

    const allPayments = await prisma.payment.findMany({
      where: { tenantId },
      select: { amount: true }
    });
    const totalCollected = allPayments.reduce((sum, p) => sum + p.amount, 0);

    const existingIncomes = await prisma.income.findMany({
      where: { tenantId },
      select: { amount: true }
    });
    const totalIncomes = existingIncomes.reduce((sum, i) => sum + i.amount, 0);

    const existingExpenses = await prisma.expense.findMany({
      where: { tenantId },
      select: { amount: true }
    });
    const totalExpensesBefore = existingExpenses.reduce((sum, e) => sum + e.amount, 0);

    const availableCapital = Math.max(0, initialCapital - totalCapitalPrestado + totalCollected + totalIncomes - totalExpensesBefore);

    if (numericAmount > availableCapital) {
      return res.status(400).json({
        error: `El monto del egreso ($${numericAmount.toLocaleString('es-CO')}) supera el Saldo en Caja Disponible ($${availableCapital.toLocaleString('es-CO')}).`
      });
    }

    // Auto-generate consecutive EGR-0001
    const count = await prisma.expense.count({ where: { tenantId } });
    const expenseNumber = `EGR-${(count + 1).toString().padStart(4, '0')}`;

    const newExpense = await prisma.expense.create({
      data: {
        tenantId,
        expenseNumber,
        amount: numericAmount,
        description: description.trim(),
        date: new Date()
      }
    });

    return res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error al registrar egreso:', error);
    return res.status(500).json({ error: 'Error al registrar el egreso.' });
  }
};

// Get incomes list and totals for tenant
export const getIncomes = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;

  try {
    const incomes = await prisma.income.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);

    return res.json({
      totalIncomes,
      count: incomes.length,
      incomes
    });
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    return res.status(500).json({ error: 'Error al listar los ingresos.' });
  }
};

// Create a new income (cash injection)
export const createIncome = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { amount, description } = req.body;

  if (!amount || !description) {
    return res.status(400).json({ error: 'Monto u observación son requeridos para registrar el ingreso.' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'El monto del ingreso debe ser un número mayor a cero.' });
  }

  try {
    // Auto-generate consecutive ING-0001
    const count = await prisma.income.count({ where: { tenantId } });
    const incomeNumber = `ING-${(count + 1).toString().padStart(4, '0')}`;

    const newIncome = await prisma.income.create({
      data: {
        tenantId,
        incomeNumber,
        amount: numericAmount,
        description: description.trim(),
        date: new Date()
      }
    });

    return res.status(201).json(newIncome);
  } catch (error) {
    console.error('Error al registrar ingreso:', error);
    return res.status(500).json({ error: 'Error al registrar el ingreso.' });
  }
};
