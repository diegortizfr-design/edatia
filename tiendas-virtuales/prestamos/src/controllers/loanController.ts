import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper to calculate payment schedule dates
export const calculateInstallmentDates = (startDate: Date, frequency: string, installments: number): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(startDate.getTime());

  for (let i = 0; i < installments; i++) {
    if (frequency === 'DAILY') {
      // Add 1 day (Every day, Monday to Sunday)
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (frequency === 'WEEKLY') {
      // Add 7 days
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (frequency === 'BIWEEKLY') {
      // Add 15 days
      currentDate.setDate(currentDate.getDate() + 15);
    } else if (frequency === 'MONTHLY') {
      // Add 1 month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    dates.push(new Date(currentDate.getTime()));
  }

  return dates;
};

// Simulate loan without saving
export const simulateLoan = (req: AuthenticatedRequest, res: Response) => {
  const { principal, interestRate, paymentFrequency, installments } = req.body;

  if (!principal || !interestRate || !paymentFrequency || !installments) {
    return res.status(400).json({ error: 'Monto, interés, frecuencia y cuotas son requeridos.' });
  }

  const p = parseFloat(principal);
  const r = parseFloat(interestRate);
  const inst = parseInt(installments);

  const interestAmount = p * (r / 100);
  const totalAmount = p + interestAmount;
  const installmentAmt = Math.round((totalAmount / inst) * 100) / 100;

  const dates = calculateInstallmentDates(new Date(), paymentFrequency, inst);

  const schedule = dates.map((date, idx) => ({
    installmentNumber: idx + 1,
    dueDate: date,
    amount: installmentAmt,
    status: 'PENDING'
  }));

  return res.json({
    principal: p,
    interestRate: r,
    interestAmount,
    totalAmount,
    installmentAmt,
    schedule
  });
};

// Create a loan product template
export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { name, description, interestRate, paymentFrequency, installments } = req.body;

  if (!name || !interestRate || !paymentFrequency || !installments) {
    return res.status(400).json({ error: 'Nombre, interés, frecuencia y cuotas son requeridos.' });
  }

  try {
    const product = await prisma.loanProduct.create({
      data: {
        tenantId,
        name,
        description: description || null,
        interestRate: parseFloat(interestRate),
        paymentFrequency,
        installments: parseInt(installments)
      }
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({ error: 'Error al registrar el producto de préstamo.' });
  }
};

// Get loan product templates
export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;

  try {
    const products = await prisma.loanProduct.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });

    return res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return res.status(500).json({ error: 'Error al listar los productos.' });
  }
};

// Assign a new loan to a client
export const createLoan = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { customerId, principal, interestRate, paymentFrequency, installments } = req.body;

  if (!customerId || !principal || !interestRate || !paymentFrequency || !installments) {
    return res.status(400).json({ error: 'Todos los campos son requeridos para asignar el préstamo.' });
  }

  const p = parseFloat(principal);
  const r = parseFloat(interestRate);
  const inst = parseInt(installments);

  try {
    // Verify client belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'El cliente no existe o no pertenece a esta empresa.' });
    }

    // Verify client has no active loan currently (usually 1 active loan at a time)
    const activeLoan = await prisma.loan.findFirst({
      where: {
        customerId,
        tenantId,
        status: { in: ['ACTIVE', 'OVERDUE'] }
      }
    });

    if (activeLoan) {
      return res.status(400).json({
        error: `El cliente ya posee un préstamo activo (${activeLoan.loanNumber}) con un saldo de $${activeLoan.balance.toLocaleString()}. Debe renovarlo o cancelarlo antes de asignar uno nuevo.`
      });
    }

    // Calculate details
    const interestAmount = p * (r / 100);
    const totalAmount = p + interestAmount;
    const installmentAmt = Math.round((totalAmount / inst) * 100) / 100;
    const dates = calculateInstallmentDates(new Date(), paymentFrequency, inst);
    const endDate = dates[dates.length - 1];

    // Consecutivo auto-incremental de préstamo
    const count = await prisma.loan.count({ where: { tenantId } });
    const loanNumber = `PREST-${(count + 1).toString().padStart(4, '0')}`;

    // Create loan and schedule in a transaction
    const loan = await prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          tenantId,
          customerId,
          loanNumber,
          principal: p,
          interestRate: r,
          interestAmount,
          totalAmount,
          balance: totalAmount,
          paymentFrequency,
          installments: inst,
          installmentAmt,
          endDate,
          status: 'ACTIVE'
        }
      });

      // Create schedule items
      const scheduleData = dates.map((date, index) => ({
        loanId: newLoan.id,
        installmentNumber: index + 1,
        dueDate: date,
        amount: installmentAmt,
        status: 'PENDING'
      }));

      await tx.amortizationSchedule.createMany({
        data: scheduleData
      });

      return newLoan;
    });

    // Fetch full loan with customer details and schedule to return
    const fullLoan = await prisma.loan.findUnique({
      where: { id: loan.id },
      include: {
        customer: true,
        amortizations: {
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    return res.status(201).json(fullLoan);
  } catch (error) {
    console.error('Error al asignar préstamo:', error);
    return res.status(500).json({ error: 'Ocurrió un error al registrar y estructurar el préstamo.' });
  }
};

// Renew an existing active loan
export const renewLoan = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { oldLoanId, principal, interestRate, paymentFrequency, installments } = req.body;

  if (!oldLoanId || !principal || !interestRate || !paymentFrequency || !installments) {
    return res.status(400).json({ error: 'Todos los campos son requeridos para la renovación.' });
  }

  const p = parseFloat(principal);
  const r = parseFloat(interestRate);
  const inst = parseInt(installments);

  try {
    // 1. Fetch old loan
    const oldLoan = await prisma.loan.findFirst({
      where: { id: oldLoanId, tenantId, status: { in: ['ACTIVE', 'OVERDUE'] } },
      include: { customer: true }
    });

    if (!oldLoan) {
      return res.status(404).json({ error: 'El préstamo anterior no fue encontrado, o ya está cancelado/renovado.' });
    }

    const currentBalance = oldLoan.balance;

    // 2. Validate that the new loan is equal or greater than the current debt
    if (p < currentBalance) {
      return res.status(400).json({
        error: `El monto del nuevo crédito ($${p.toLocaleString()}) debe ser igual o mayor al saldo pendiente del crédito anterior ($${currentBalance.toLocaleString()}) para poder comprar la cartera.`
      });
    }

    const excedente = p - currentBalance; // Excess to be given to the customer

    // 3. Calculate new loan values
    const interestAmount = p * (r / 100);
    const totalAmount = p + interestAmount;
    const installmentAmt = Math.round((totalAmount / inst) * 100) / 100;
    const dates = calculateInstallmentDates(new Date(), paymentFrequency, inst);
    const endDate = dates[dates.length - 1];

    const count = await prisma.loan.count({ where: { tenantId } });
    const loanNumber = `PREST-${(count + 1).toString().padStart(4, '0')}`;

    // 4. Transaction execution
    const newLoan = await prisma.$transaction(async (tx) => {
      // A. Update old loan status to RENEWED, balance to 0
      await tx.loan.update({
        where: { id: oldLoanId },
        data: {
          status: 'RENEWED',
          balance: 0
        }
      });

      // B. Update old loan's outstanding amortizations to PAID under renewal
      await tx.amortizationSchedule.updateMany({
        where: {
          loanId: oldLoanId,
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
        },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          amountPaid: 0 // Clarifying that it was liquidated via refinancing
        }
      });

      // C. Create new loan referencing the old one
      const createdLoan = await tx.loan.create({
        data: {
          tenantId,
          customerId: oldLoan.customerId,
          loanNumber,
          principal: p,
          interestRate: r,
          interestAmount,
          totalAmount,
          balance: totalAmount,
          paymentFrequency,
          installments: inst,
          installmentAmt,
          endDate,
          status: 'ACTIVE',
          renewalFromId: oldLoanId
        }
      });

      // D. Create new amortization schedule
      const scheduleData = dates.map((date, index) => ({
        loanId: createdLoan.id,
        installmentNumber: index + 1,
        dueDate: date,
        amount: installmentAmt,
        status: 'PENDING'
      }));

      await tx.amortizationSchedule.createMany({
        data: scheduleData
      });

      return createdLoan;
    });

    // Fetch full new loan details
    const fullNewLoan = await prisma.loan.findUnique({
      where: { id: newLoan.id },
      include: {
        customer: true,
        amortizations: {
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    return res.status(200).json({
      message: 'Crédito renovado exitosamente.',
      excedente,
      debtSettled: currentBalance,
      loan: fullNewLoan
    });
  } catch (error) {
    console.error('Error al renovar préstamo:', error);
    return res.status(500).json({ error: 'Ocurrió un error al procesar la renovación del crédito.' });
  }
};

// Get single loan details
export const getLoanById = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { id } = req.params;

  try {
    const loan = await prisma.loan.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        amortizations: {
          orderBy: { installmentNumber: 'asc' }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Préstamo no encontrado.' });
    }

    return res.json(loan);
  } catch (error) {
    console.error('Error al obtener préstamo:', error);
    return res.status(500).json({ error: 'Error al consultar los detalles del préstamo.' });
  }
};

// List all loans
export const getLoans = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;

  try {
    const loans = await prisma.loan.findMany({
      where: { tenantId },
      include: {
        customer: true
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return res.json(loans);
  } catch (error) {
    console.error('Error al obtener préstamos:', error);
    return res.status(500).json({ error: 'Error al cargar la lista de préstamos.' });
  }
};
