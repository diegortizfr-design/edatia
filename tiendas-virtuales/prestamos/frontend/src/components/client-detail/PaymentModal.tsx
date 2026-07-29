import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { ClientFullDetails, Loan, PrintReceiptData } from './clientDetailTypes';
import { Coins, X } from 'lucide-react';

interface PaymentModalProps {
  show: boolean;
  client: ClientFullDetails;
  activeLoan: Loan | null;
  onClose: () => void;
  onSuccess: (receiptData: PrintReceiptData) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  client,
  activeLoan,
  onClose,
  onSuccess
}) => {
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && activeLoan) {
      // Suggest installment amount as default pay amount
      const suggested = Math.min(activeLoan.installmentAmt, activeLoan.balance);
      setPayAmount(String(suggested));
      setPayNotes('');
      setError('');
    }
  }, [show, activeLoan]);

  if (!show || !activeLoan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('El monto a abonar debe ser mayor a 0.');
      return;
    }

    if (amountNum > activeLoan.balance) {
      setError(`El monto abonado ($${amountNum.toLocaleString()}) no puede superar el saldo pendiente ($${activeLoan.balance.toLocaleString()}).`);
      return;
    }

    setLoading(true);

    try {
      const res = await apiCall('/payments', {
        method: 'POST',
        bodyData: {
          loanId: activeLoan.id,
          amount: amountNum,
          notes: payNotes || null
        }
      });

      const receiptData: PrintReceiptData = {
        clientName: client.name,
        documentId: client.documentId,
        loanNumber: activeLoan.loanNumber,
        receiptNumber: res.payment.receiptNumber,
        amount: res.payment.amount,
        paymentDate: res.payment.paymentDate,
        notes: res.payment.notes,
        remainingBalance: res.remainingBalance
      };

      onSuccess(receiptData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar abono.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Registrar Abono / Pago</h3>
              <p className="text-xs text-slate-400">Recaudo para crédito {activeLoan.loanNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Valor de Cuota:</span>
            <span className="font-mono font-semibold text-slate-200">${activeLoan.installmentAmt.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Saldo Pendiente Deuda:</span>
            <span className="font-mono font-bold text-emerald-400">${activeLoan.balance.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Monto Recibido ($) *</label>
            <input
              type="number"
              required
              min="100"
              max={activeLoan.balance}
              step="500"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-base text-white focus:outline-none focus:border-emerald-500 font-mono transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Observaciones / Notas (Opcional)</label>
            <textarea
              rows={2}
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              placeholder="Ej: Pago realizado por Nequi / Efectivo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-lg text-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 shadow-lg shadow-emerald-600/20"
            >
              {loading ? 'Procesando...' : 'Generar Recibo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
