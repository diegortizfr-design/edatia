import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const createPayment = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { loanId, amount, notes, lateInterestAmount } = req.body;

  if (!loanId || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'El ID del préstamo y un monto válido mayor a 0 son obligatorios.' });
  }

  const payAmount = parseFloat(amount);

  try {
    // 1. Fetch loan
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, tenantId, status: { in: ['ACTIVE', 'OVERDUE'] } },
      include: {
        customer: true,
        amortizations: {
          where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Préstamo activo no encontrado.' });
    }

    if (payAmount > loan.balance) {
      return res.status(400).json({
        error: `El monto abonado ($${payAmount.toLocaleString()}) supera el saldo total pendiente de la deuda ($${loan.balance.toLocaleString()}).`
      });
    }

    // 2. Generate payment receipt sequential number
    const count = await prisma.payment.count({ where: { tenantId } });
    const receiptNumber = `REC-${(count + 1).toString().padStart(4, '0')}`;

    // 3. Process database transaction
    const result = await prisma.$transaction(async (tx) => {
      // A. Create the payment record
      const payment = await tx.payment.create({
        data: {
          tenantId,
          loanId,
          customerId: loan.customerId,
          receiptNumber,
          amount: payAmount,
          lateInterestAmount: lateInterestAmount ? parseFloat(String(lateInterestAmount)) : 0,
          notes: notes || null
        }
      });

      // B. Distribute the payment amount over pending amortization installments (FIFO order)
      let remainingPayment = payAmount;
      const amortizationsToUpdate = loan.amortizations;
      const principalRatio = loan.totalAmount > 0 ? loan.principal / loan.totalAmount : 1;

      for (const amort of amortizationsToUpdate) {
        if (remainingPayment <= 0) break;

        const outstandingAmountForInstallment = amort.amount - amort.amountPaid;

        if (remainingPayment >= outstandingAmountForInstallment) {
          // Pay installment fully
          const fullPrincipal = Math.round(amort.amount * principalRatio * 100) / 100;
          const fullInterest = Math.round((amort.amount - fullPrincipal) * 100) / 100;

          await tx.amortizationSchedule.update({
            where: { id: amort.id },
            data: {
              amountPaid: amort.amount,
              principalPaid: fullPrincipal,
              interestPaid: fullInterest,
              status: 'PAID',
              paidAt: new Date()
            }
          });
          remainingPayment -= outstandingAmountForInstallment;
        } else {
          // Pay installment partially
          const newAmountPaid = Math.round((amort.amountPaid + remainingPayment) * 100) / 100;
          const partialPrincipal = Math.round(newAmountPaid * principalRatio * 100) / 100;
          const partialInterest = Math.round((newAmountPaid - partialPrincipal) * 100) / 100;

          await tx.amortizationSchedule.update({
            where: { id: amort.id },
            data: {
              amountPaid: newAmountPaid,
              principalPaid: partialPrincipal,
              interestPaid: partialInterest,
              status: 'PARTIAL',
              paidAt: new Date()
            }
          });
          remainingPayment = 0;
        }
      }

      // C. Update the loan balance with rounding/cent tolerance
      const rawNewBalance = Math.max(0, loan.balance - payAmount);
      const isPaid = rawNewBalance < 1; // Cancela el crédito si el saldo residual es menor a 1 peso/centavo por redondeo
      const newBalance = isPaid ? 0 : Math.round(rawNewBalance * 100) / 100;

      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          balance: newBalance,
          status: isPaid ? 'PAID' : loan.status
        }
      });

      if (isPaid) {
        // Asegurar que todas las cuotas del préstamo cancelado queden marcadas como PAID
        await tx.amortizationSchedule.updateMany({
          where: { loanId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
          data: {
            status: 'PAID',
            paidAt: new Date()
          }
        });
      }

      return { payment, updatedLoan };
    });

    // Fetch details to print receipt
    const fullPayment = await prisma.payment.findUnique({
      where: { id: result.payment.id },
      include: {
        customer: true,
        loan: true
      }
    });

    return res.status(201).json({
      message: 'Abono registrado correctamente.',
      payment: fullPayment,
      remainingBalance: result.updatedLoan.balance,
      loanStatus: result.updatedLoan.status
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    return res.status(500).json({ error: 'Ocurrió un error al procesar el abono.' });
  }
};

export const getPaymentById = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;
  const { id } = req.params;

  try {
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        loan: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Recibo de pago no encontrado.' });
    }

    return res.json(payment);
  } catch (error) {
    console.error('Error al consultar recibo:', error);
    return res.status(500).json({ error: 'Error al cargar el recibo de pago.' });
  }
};

// List all payments
export const getPayments = async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId!;

  try {
    const payments = await prisma.payment.findMany({
      where: { tenantId },
      include: {
        customer: true,
        loan: true
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });

    return res.json(payments);
  } catch (error) {
    console.error('Error al obtener abonos:', error);
    return res.status(500).json({ error: 'Error al cargar la lista de recibos.' });
  }
};
