import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { 
  Receipt, Plus, DollarSign, Wallet, RefreshCw, 
  ArrowDownRight, FileText, AlertCircle, CheckCircle2, X
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  expenseNumber: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export const Accounting: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [availableCapital, setAvailableCapital] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchAccountingData = async () => {
    setLoading(true);
    try {
      const [expenseRes, treasuryRes] = await Promise.all([
        apiCall('/expenses'),
        apiCall('/reports/treasury')
      ]);

      setExpenses(expenseRes.expenses || []);
      setTotalExpenses(expenseRes.totalExpenses || 0);
      setAvailableCapital(treasuryRes.availableCapital || 0);
    } catch (err: any) {
      console.error('Error al cargar contabilidad:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAmountInput('');
      return;
    }
    setAmountInput(Number(raw).toLocaleString('es-CO'));
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    const numericAmount = Number(amountInput.replace(/\D/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setFormError('Por favor ingresa un monto válido mayor a cero.');
      return;
    }

    if (numericAmount > availableCapital) {
      setFormError(`El monto del egreso ($${numericAmount.toLocaleString('es-CO')}) supera el Saldo en Caja Disponible ($${availableCapital.toLocaleString('es-CO')}).`);
      return;
    }

    if (!description.trim()) {
      setFormError('Por favor especifica una observación o concepto para el egreso.');
      return;
    }

    setSubmitting(true);
    try {
      await apiCall('/expenses', {
        method: 'POST',
        bodyData: {
          amount: numericAmount,
          description: description.trim()
        }
      });

      setSuccessMessage('Egreso registrado exitosamente. Se ha descontado del disponible en caja.');
      setAmountInput('');
      setDescription('');
      setShowModal(false);
      fetchAccountingData();

      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar el egreso.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-red-400" />
            Contabilidad & Egresos de Caja
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro de egresos y salidas de dinero de caja. Los egresos reducen el saldo disponible para préstamos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAccountingData}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 text-brand-400 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>

          <button
            onClick={() => {
              setFormError('');
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-red-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Registrar Egreso
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Total Egresos */}
        <div className="glass-card p-6 rounded-2xl border border-red-500/30 bg-red-500/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-red-400">Total Egresos Registrados</span>
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-bold font-mono text-red-300">
            ${totalExpenses.toLocaleString('es-CO')}
          </h3>
          <p className="text-xs text-red-400/80 mt-1">Suma acumulada de gastos y egresos de caja</p>
        </div>

        {/* Saldo Disponible en Caja */}
        <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Saldo Disponible en Caja</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-bold font-mono text-emerald-300">
            ${availableCapital.toLocaleString('es-CO')}
          </h3>
          <p className="text-xs text-emerald-400/80 mt-1">Capital remanente listo para colocación de préstamos</p>
        </div>
      </div>

      {/* Table of Expenses History */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-400" />
              Historial de Egresos Registrados
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Listado ordenado del más reciente al más antiguo
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full">
            {expenses.length} Egresos
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No se han registrado egresos de caja todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Consecutivo</th>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Observación / Concepto</th>
                  <th className="px-4 py-3 text-right">Monto Egreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-white">{e.expenseNumber}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{new Date(e.createdAt).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{e.description}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-400">
                      -${e.amount.toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative animate-zoomIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Registrar Egreso de Caja</h3>
                  <p className="text-xs text-slate-400">Salida de dinero de la caja física</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Monto del Egreso ($) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono font-bold">$</span>
                  <input
                    type="text"
                    required
                    value={amountInput}
                    onChange={handleAmountChange}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono font-semibold focus:outline-none focus:border-red-500 transition"
                    placeholder="ej: 100.000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observación / Concepto *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition"
                  placeholder="ej: Pago nómina recaudador, Mantenimiento moto, Papelería..."
                />
              </div>

              <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl text-[11px] text-red-300/80 leading-relaxed">
                ⚠️ <strong>Aviso:</strong> Al guardar este egreso, el dinero se descontará directamente del Saldo en Caja Disponible para préstamos.
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-semibold rounded-xl text-xs shadow-lg shadow-red-600/20 transition"
                >
                  {submitting ? 'Guardando...' : 'Confirmar Egreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
