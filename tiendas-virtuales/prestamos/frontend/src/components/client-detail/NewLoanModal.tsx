import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { ClientFullDetails, Loan } from './clientDetailTypes';
import { Coins, Sparkles, X } from 'lucide-react';

interface NewLoanModalProps {
  show: boolean;
  client: ClientFullDetails;
  onClose: () => void;
  onSuccess: (newLoan: Loan) => void;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  show,
  client,
  onClose,
  onSuccess
}) => {
  const [principal, setPrincipal] = useState('500000');
  const [interestRate, setInterestRate] = useState('20');
  const [frequency, setFrequency] = useState('DAILY');
  const [installments, setInstallments] = useState('24');
  const [simulation, setSimulation] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      if (client?.defaultFrequency) {
        setFrequency(client.defaultFrequency);
      }
    }
  }, [show, client]);

  useEffect(() => {
    if (show && principal && interestRate && installments) {
      const p = parseFloat(principal);
      const r = parseFloat(interestRate);
      const inst = parseInt(installments);

      if (!isNaN(p) && !isNaN(r) && !isNaN(inst) && inst > 0) {
        const interestAmount = p * (r / 100);
        const totalAmount = p + interestAmount;
        const installmentAmt = Math.round(totalAmount / inst);

        const dates: Date[] = [];
        let currentDate = new Date();
        for (let i = 0; i < inst; i++) {
          currentDate.setDate(currentDate.getDate() + 1);
          if (frequency === 'DAILY' && currentDate.getDay() === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (frequency === 'WEEKLY') {
            currentDate.setDate(currentDate.getDate() + 6);
          } else if (frequency === 'BIWEEKLY') {
            currentDate.setDate(currentDate.getDate() + 14);
          } else if (frequency === 'MONTHLY') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          dates.push(new Date(currentDate.getTime()));
        }

        setSimulation({
          principal: p,
          interestRate: r,
          interestAmount,
          totalAmount,
          installmentAmt,
          dates
        });
      }
    }
  }, [show, principal, interestRate, frequency, installments]);

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const newLoan = await apiCall('/loans', {
        method: 'POST',
        bodyData: {
          customerId: client.id,
          principal: parseFloat(principal),
          interestRate: parseFloat(interestRate),
          paymentFrequency: frequency,
          installments: parseInt(installments)
        }
      });

      onSuccess(newLoan);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al asignar préstamo.');
    } finally {
      setLoading(false);
    }
  };

  const translateFrequency = (freq: string) => {
    const freqs: Record<string, string> = {
      DAILY: 'Diario',
      WEEKLY: 'Semanal',
      BIWEEKLY: 'Quincenal',
      MONTHLY: 'Mensual'
    };
    return freqs[freq] || freq;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600/10 border border-brand-500/20 rounded-xl flex items-center justify-center text-brand-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Asignar Nuevo Préstamo</h3>
              <p className="text-xs text-slate-400">Estructurar crédito para {client.name}</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Monto a Prestar ($) *</label>
              <input
                type="number"
                required
                min="10000"
                step="10000"
                value={principal}
                onChange={e => setPrincipal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Interés Global (%) *</label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Frecuencia de Pago *</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition"
              >
                <option value="DAILY">Diario (Lunes a Sábado)</option>
                <option value="WEEKLY">Semanal</option>
                <option value="BIWEEKLY">Quincenal</option>
                <option value="MONTHLY">Mensual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Número de Cuotas *</label>
              <input
                type="number"
                required
                min="1"
                max="360"
                value={installments}
                onChange={e => setInstallments(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono transition"
              />
            </div>
          </div>

          {/* Simulation Box */}
          {simulation && (
            <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Resumen del Crédito
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Monto Interés:</span>
                  <span className="font-semibold text-white font-mono">${simulation.interestAmount.toLocaleString('es-CO')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total a Cobrar:</span>
                  <span className="font-semibold text-emerald-400 font-mono">${simulation.totalAmount.toLocaleString('es-CO')}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-brand-500/20 flex justify-between items-center">
                  <span className="text-slate-300">Valor Cuota ({translateFrequency(frequency)}):</span>
                  <span className="text-base font-bold text-brand-300 font-mono">${simulation.installmentAmt.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>
          )}

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
              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 shadow-lg shadow-brand-600/20"
            >
              {loading ? 'Procesando...' : 'Asignar Crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
