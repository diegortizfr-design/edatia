import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { 
  Receipt, Plus, Wallet, RefreshCw, 
  ArrowDownRight, ArrowUpRight, FileText, CheckCircle2, X
} from 'lucide-react';

interface MovementItem {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  consecutiveNumber: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export const Accounting: React.FC = () => {
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [totalIncomes, setTotalIncomes] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [availableCapital, setAvailableCapital] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Tab Filter
  const [activeTab, setActiveTab] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [entryType, setEntryType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchAccountingData = async () => {
    setLoading(true);
    try {
      const [incomeRes, expenseRes, treasuryRes] = await Promise.all([
        apiCall('/incomes'),
        apiCall('/expenses'),
        apiCall('/reports/treasury')
      ]);

      const fetchedIncomes: MovementItem[] = (incomeRes.incomes || []).map((i: any) => ({
        id: i.id,
        type: 'INCOME' as const,
        consecutiveNumber: i.incomeNumber,
        amount: i.amount,
        description: i.description,
        date: i.date,
        createdAt: i.createdAt
      }));

      const fetchedExpenses: MovementItem[] = (expenseRes.expenses || []).map((e: any) => ({
        id: e.id,
        type: 'EXPENSE' as const,
        consecutiveNumber: e.expenseNumber,
        amount: e.amount,
        description: e.description,
        date: e.date,
        createdAt: e.createdAt
      }));

      // Combine and sort by createdAt descending
      const combined = [...fetchedIncomes, ...fetchedExpenses].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setMovements(combined);
      setTotalIncomes(incomeRes.totalIncomes || 0);
      setTotalExpenses(expenseRes.totalExpenses || 0);
      setAvailableCapital(treasuryRes.availableCapital || 0);
    } catch (err: any) {
      console.error('Error al cargar datos de contabilidad:', err);
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

  const openRegisterModal = (type: 'INCOME' | 'EXPENSE') => {
    setEntryType(type);
    setAmountInput('');
    setDescription('');
    setFormError('');
    setShowModal(true);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    const numericAmount = Number(amountInput.replace(/\D/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setFormError('Por favor ingresa un monto válido mayor a cero.');
      return;
    }

    if (entryType === 'EXPENSE' && numericAmount > availableCapital) {
      setFormError(`El monto del egreso ($${numericAmount.toLocaleString('es-CO')}) supera el Saldo en Caja Disponible ($${availableCapital.toLocaleString('es-CO')}).`);
      return;
    }

    if (!description.trim()) {
      setFormError('Por favor especifica una observación o concepto.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = entryType === 'INCOME' ? '/incomes' : '/expenses';
      await apiCall(endpoint, {
        method: 'POST',
        bodyData: {
          amount: numericAmount,
          description: description.trim()
        }
      });

      const messageText = entryType === 'INCOME'
        ? 'Ingreso registrado exitosamente. Se ha sumado al saldo disponible en caja.'
        : 'Egreso registrado exitosamente. Se ha descontado del saldo disponible en caja.';

      setSuccessMessage(messageText);
      setAmountInput('');
      setDescription('');
      setShowModal(false);
      fetchAccountingData();

      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el movimiento.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMovements = movements.filter(m => {
    if (activeTab === 'INCOME') return m.type === 'INCOME';
    if (activeTab === 'EXPENSE') return m.type === 'EXPENSE';
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-brand-400" />
            Contabilidad & Movimientos de Caja
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro de ingresos adicionales y egresos de caja para controlar la liquidez disponible para préstamos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAccountingData}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 text-brand-400 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>

          <button
            onClick={() => openRegisterModal('INCOME')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Registrar Ingreso
          </button>

          <button
            onClick={() => openRegisterModal('EXPENSE')}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-red-600/20 transition"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Ingresos */}
        <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Total Ingresos Registrados</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-bold font-mono text-emerald-300">
            ${totalIncomes.toLocaleString('es-CO')}
          </h3>
          <p className="text-xs text-emerald-400/80 mt-1">Inyecciones de capital agregadas a la caja</p>
        </div>

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
        <div className="glass-card p-6 rounded-2xl border border-brand-500/30 bg-brand-500/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-brand-400">Saldo Disponible en Caja</span>
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-bold font-mono text-brand-300">
            ${availableCapital.toLocaleString('es-CO')}
          </h3>
          <p className="text-xs text-brand-400/80 mt-1">Capital remanente disponible para préstamos</p>
        </div>
      </div>

      {/* Table of Movements History */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-400" />
              Historial de Movimientos de Caja
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Listado completo de ingresos y egresos registrados
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'ALL' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({movements.length})
            </button>
            <button
              onClick={() => setActiveTab('INCOME')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'INCOME' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ingresos ({movements.filter(m => m.type === 'INCOME').length})
            </button>
            <button
              onClick={() => setActiveTab('EXPENSE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'EXPENSE' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Egresos ({movements.filter(m => m.type === 'EXPENSE').length})
            </button>
          </div>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No hay movimientos registrados para este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Consecutivo</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Observación / Concepto</th>
                  <th className="px-4 py-3 text-right">Monto ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredMovements.map(m => {
                  const isIncome = m.type === 'INCOME';
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-white">{m.consecutiveNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isIncome 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {isIncome ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{new Date(m.createdAt).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{m.description}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${
                        isIncome ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {isIncome ? `+$${m.amount.toLocaleString('es-CO')}` : `-$${m.amount.toLocaleString('es-CO')}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal to Register Income or Expense */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative animate-zoomIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  entryType === 'INCOME'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {entryType === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {entryType === 'INCOME' ? 'Registrar Ingreso de Caja' : 'Registrar Egreso de Caja'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {entryType === 'INCOME' ? 'Entrada / Inyección de dinero a la caja' : 'Salida de dinero de la caja física'}
                  </p>
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

            <form onSubmit={handleSaveMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monto del {entryType === 'INCOME' ? 'Ingreso' : 'Egreso'} ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono font-bold">$</span>
                  <input
                    type="text"
                    required
                    value={amountInput}
                    onChange={handleAmountChange}
                    className={`w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono font-semibold focus:outline-none transition ${
                      entryType === 'INCOME' ? 'focus:border-emerald-500' : 'focus:border-red-500'
                    }`}
                    placeholder="ej: 500.000"
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
                  className={`w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none transition ${
                    entryType === 'INCOME' ? 'focus:border-emerald-500' : 'focus:border-red-500'
                  }`}
                  placeholder={
                    entryType === 'INCOME'
                      ? 'ej: Inyección de capital del socio, Préstamo bancario, Recuperación...'
                      : 'ej: Pago nómina recaudador, Mantenimiento moto, Papelería...'
                  }
                />
              </div>

              <div className={`p-3 rounded-xl text-[11px] leading-relaxed border ${
                entryType === 'INCOME'
                  ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300/80'
                  : 'bg-red-500/5 border-red-500/15 text-red-300/80'
              }`}>
                {entryType === 'INCOME' ? (
                  <span>✅ <strong>Aviso:</strong> Este ingreso aumentará directamente el Saldo Disponible en Caja para la colocación de nuevos créditos.</span>
                ) : (
                  <span>⚠️ <strong>Aviso:</strong> Este egreso se descontará directamente del Saldo Disponible en Caja para préstamos.</span>
                )}
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
                  className={`px-5 py-2 text-white font-semibold rounded-xl text-xs shadow-lg transition ${
                    entryType === 'INCOME'
                      ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 shadow-emerald-600/20'
                      : 'bg-red-600 hover:bg-red-500 disabled:bg-red-800 shadow-red-600/20'
                  }`}
                >
                  {submitting ? 'Guardando...' : entryType === 'INCOME' ? 'Confirmar Ingreso' : 'Confirmar Egreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
