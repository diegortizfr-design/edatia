import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import type { ClientFullDetails, Loan } from './clientDetailTypes';
import { Coins, Sparkles, X, AlertTriangle, Trash2, Calendar, Percent, Clock, AlertCircle } from 'lucide-react';

interface EditLoanModalProps {
  show: boolean;
  loan: Loan | null;
  client: ClientFullDetails;
  onClose: () => void;
  onSuccess: (updatedLoan: Loan) => void;
  onDeleteSuccess?: () => void;
  onOpenRenew?: () => void;
}

export const EditLoanModal: React.FC<EditLoanModalProps> = ({
  show,
  loan,
  client,
  onClose,
  onSuccess,
  onDeleteSuccess,
  onOpenRenew
}) => {
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('20');
  const [frequency, setFrequency] = useState('DAILY');
  const [installments, setInstallments] = useState('24');
  const [startDate, setStartDate] = useState('');
  const [simulation, setSimulation] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (show && loan) {
      setPrincipal(loan.principal.toLocaleString('es-CO'));
      setInterestRate(loan.interestRate.toString());
      setFrequency(loan.paymentFrequency);
      setInstallments(loan.installments.toString());
      setStartDate(loan.startDate ? loan.startDate.substring(0, 10) : new Date().toISOString().substring(0, 10));
      setError('');
      setShowConfirmDelete(false);
    }
  }, [show, loan]);

  const hasPayments = Boolean(loan && loan.payments && loan.payments.length > 0);
  const totalPaid = loan?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  // Live recalculation simulation
  useEffect(() => {
    if (show && !hasPayments && principal && interestRate && installments) {
      const p = parseFloat(principal.replace(/\D/g, ''));
      const r = parseFloat(interestRate);
      const inst = parseInt(installments);

      if (!isNaN(p) && !isNaN(r) && !isNaN(inst) && inst > 0 && p > 0) {
        const interestAmount = p * (r / 100);
        const totalAmount = p + interestAmount;
        const installmentAmt = Math.round(totalAmount / inst);
        const lastInstallmentAmt = totalAmount - (installmentAmt * (inst - 1));

        const baseDate = startDate ? new Date(startDate + 'T12:00:00') : new Date();
        const dates: Date[] = [];
        let currentDate = new Date(baseDate.getTime());

        for (let i = 0; i < inst; i++) {
          if (frequency === 'DAILY') {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (frequency === 'WEEKLY') {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (frequency === 'BIWEEKLY') {
            currentDate.setDate(currentDate.getDate() + 15);
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
          lastInstallmentAmt,
          endDate: dates[dates.length - 1]
        });
      } else {
        setSimulation(null);
      }
    }
  }, [show, hasPayments, principal, interestRate, installments, frequency, startDate]);

  if (!show || !loan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPayments) return;

    setError('');
    setLoading(true);

    try {
      const p = parseFloat(principal.replace(/\D/g, ''));
      const r = parseFloat(interestRate);
      const inst = parseInt(installments);

      const res = await apiCall(`/loans/${loan.id}`, {
        method: 'PUT',
        bodyData: {
          principal: p,
          interestRate: r,
          paymentFrequency: frequency,
          installments: inst,
          startDate: startDate ? new Date(startDate + 'T12:00:00').toISOString() : undefined
        }
      });

      onSuccess(res.loan || res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el préstamo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLoan = async () => {
    setError('');
    setDeleting(true);

    try {
      await apiCall(`/loans/${loan.id}`, {
        method: 'DELETE'
      });

      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al anular el préstamo.');
    } finally {
      setDeleting(false);
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center text-brand-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Editar Préstamo
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-brand-400 border border-slate-700">
                  {loan.loanNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Cliente: {client.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Bloqueo protector si el crédito ya registra abonos */}
        {hasPayments ? (
          <div className="space-y-5">
            <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Edición Bloqueada por Seguridad Contable</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Este crédito ya cuenta con <strong>{loan.payments.length} recibo(s) de abono</strong> registrados por un valor acumulado de <strong>${totalPaid.toLocaleString('es-CO')} COP</strong>.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Modificar el capital o la tasa original alteraría la validez de los recibos de caja ya emitidos al cliente y descuadraría el balance contable.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Monto Inicial Prestado:</span>
                <span className="font-mono text-white">${loan.principal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Deuda con Intereses:</span>
                <span className="font-mono text-white">${loan.totalAmount.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Abonado a la Fecha:</span>
                <span className="font-mono text-emerald-400 font-bold">+${totalPaid.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-850">
                <span>Saldo Pendiente Actual:</span>
                <span className="font-mono text-brand-400 font-bold">${loan.balance.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2">
              <span className="text-xs font-bold text-purple-300 block">¿Deseas reestructurar o cambiar las cuotas?</span>
              <p className="text-xs text-slate-400">
                Puedes utilizar la función de <strong>Renovación de Crédito</strong>, la cual liquida la deuda actual y genera un nuevo crédito con el nuevo capital, tasa y plazo acordados.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                Cerrar
              </button>
              {onOpenRenew && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRenew();
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-md transition"
                >
                  Ir a Renovar Crédito
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Formulario de Edición Completo (Sin abonos) */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-brand-300 leading-relaxed">
              ℹ️ Este crédito <strong>no tiene abonos registrados aún</strong>. Puedes corregir el monto, interés, cuotas o modalidad. La tabla de amortización se recalculará automáticamente.
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Monto del Préstamo (Capital COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold">$</span>
                <input
                  type="text"
                  value={principal}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPrincipal(val ? parseInt(val).toLocaleString('es-CO') : '');
                  }}
                  className="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-base focus:outline-none focus:border-brand-500 transition"
                  placeholder="ej: 500.000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-slate-500" /> Tasa Interés (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-brand-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Número de Cuotas *
                </label>
                <input
                  type="number"
                  min="1"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-brand-500 transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Modalidad de Cobro *
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500 transition"
                >
                  <option value="DAILY">Diario (Todos los Días)</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="BIWEEKLY">Quincenal</option>
                  <option value="MONTHLY">Mensual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500 transition"
                  required
                />
              </div>
            </div>

            {/* Simulación en tiempo real */}
            {simulation && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-400 border-b border-slate-850 pb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Nuevo Cálculo Reestructurado</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Total a Pagar:</span>
                    <span className="text-white font-mono font-bold text-sm">
                      ${simulation.totalAmount.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Interés Total ({simulation.interestRate}%):</span>
                    <span className="text-purple-400 font-mono font-bold text-sm">
                      +${simulation.interestAmount.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Valor por Cuota:</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      ${simulation.installmentAmt.toLocaleString('es-CO')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {installments} cuotas ({translateFrequency(frequency).toLowerCase()})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fecha Vencimiento:</span>
                    <span className="text-slate-300 font-mono text-xs">
                      {simulation.endDate ? new Date(simulation.endDate).toLocaleDateString('es-CO') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmación para anular/eliminar préstamo */}
            {showConfirmDelete ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>¿Estás seguro de anular y eliminar este préstamo?</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Esta acción eliminará el crédito <strong>{loan.loanNumber}</strong> y liberará el capital en caja. No se puede deshacer.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteLoan}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? 'Anulando...' : 'Sí, Anular Crédito'}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Botones de acción */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-3 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                  title="Anular este préstamo por completo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Anular Crédito
                </button>
              ) : <div></div>}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white text-xs font-bold rounded-lg shadow-lg shadow-brand-500/20 transition"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
