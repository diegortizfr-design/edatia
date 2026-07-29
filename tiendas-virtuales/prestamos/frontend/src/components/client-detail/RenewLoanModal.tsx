import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { ClientFullDetails, Loan } from './clientDetailTypes';
import { RefreshCw, Sparkles, AlertTriangle, X } from 'lucide-react';

interface RenewLoanModalProps {
  show: boolean;
  client: ClientFullDetails;
  activeLoan: Loan | null;
  onClose: () => void;
  onSuccess: (renewalResult: any) => void;
}

export const RenewLoanModal: React.FC<RenewLoanModalProps> = ({
  show,
  client,
  activeLoan,
  onClose,
  onSuccess
}) => {
  const [renewPrincipal, setRenewPrincipal] = useState('');
  const [renewInterestRate, setRenewInterestRate] = useState('20');
  const [renewFrequency, setRenewFrequency] = useState('DAILY');
  const [renewInstallments, setRenewInstallments] = useState('24');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && activeLoan) {
      const suggestedAmount = Math.ceil(activeLoan.balance / 100000) * 100000 + 200000;
      setRenewPrincipal(String(suggestedAmount));
      setError('');
    }
  }, [show, activeLoan]);

  if (!show || !activeLoan) return null;

  const currentBalance = activeLoan.balance;
  const p = parseFloat(renewPrincipal) || 0;
  const excedente = p >= currentBalance ? p - currentBalance : 0;
  const r = parseFloat(renewInterestRate) || 0;
  const inst = parseInt(renewInstallments) || 1;
  const interestAmount = p * (r / 100);
  const totalAmount = p + interestAmount;
  const installmentAmt = Math.round(totalAmount / inst);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (p < currentBalance) {
      setError(`El nuevo crédito ($${p.toLocaleString()}) debe ser mayor o igual al saldo pendiente ($${currentBalance.toLocaleString()}).`);
      return;
    }

    setLoading(true);

    try {
      const res = await apiCall('/loans/renew', {
        method: 'POST',
        bodyData: {
          oldLoanId: activeLoan.id,
          principal: p,
          interestRate: r,
          paymentFrequency: renewFrequency,
          installments: inst
        }
      });

      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al renovar préstamo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Renovar / Refinanciar Crédito</h3>
              <p className="text-xs text-slate-400">Compra de cartera para {client.name}</p>
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

        {/* Previous Debt Summary */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-400 block">Crédito Actual:</span>
            <span className="font-mono font-semibold text-white">{activeLoan.loanNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Saldo Pendiente a Cancelar:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">${currentBalance.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Monto del Nuevo Crédito ($) *</label>
              <input
                type="number"
                required
                min={currentBalance}
                step="10000"
                value={renewPrincipal}
                onChange={e => setRenewPrincipal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tasa de Interés (%) *</label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={renewInterestRate}
                onChange={e => setRenewInterestRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Frecuencia de Pago *</label>
              <select
                value={renewFrequency}
                onChange={e => setRenewFrequency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
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
                value={renewInstallments}
                onChange={e => setRenewInstallments(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono transition"
              />
            </div>
          </div>

          {/* Renewal Calculations */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Liquidación de Refinanciación
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Deuda Cancelada:</span>
                <span className="font-semibold text-slate-300 font-mono">${currentBalance.toLocaleString('es-CO')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Excedente al Cliente:</span>
                <span className="font-bold text-emerald-400 font-mono">${excedente.toLocaleString('es-CO')}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-purple-500/20 flex justify-between items-center">
                <span className="text-slate-300">Nueva Cuota Estimada:</span>
                <span className="text-base font-bold text-purple-300 font-mono">${installmentAmt.toLocaleString('es-CO')}</span>
              </div>
            </div>
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
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 shadow-lg shadow-purple-600/20"
            >
              {loading ? 'Procesando...' : 'Confirmar Renovación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
