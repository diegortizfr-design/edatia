import React from 'react';
import type { Loan } from './clientDetailTypes';
import { Receipt, Calendar, Coins } from 'lucide-react';

interface AmortizationTableProps {
  loan: Loan;
  onPrintContract?: () => void;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  loan,
  onPrintContract
}) => {
  const translateFrequency = (freq: string) => {
    const freqs: Record<string, string> = {
      DAILY: 'Diario',
      WEEKLY: 'Semanal',
      BIWEEKLY: 'Quincenal',
      MONTHLY: 'Mensual'
    };
    return freqs[freq] || freq;
  };

  const getAmortizationStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      PENDING: 'bg-slate-800 text-slate-400 border-slate-700/50',
      PARTIAL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      OVERDUE: 'bg-red-500/10 text-red-400 border-red-500/30'
    };
    const labels: Record<string, string> = {
      PAID: 'Pagado',
      PENDING: 'Pendiente',
      PARTIAL: 'Abonado',
      OVERDUE: 'Atrasado'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Loan Overview Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white font-mono">{loan.loanNumber}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                loan.status === 'ACTIVE' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : loan.status === 'OVERDUE'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : loan.status === 'RENEWED'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'OVERDUE' ? 'Atrasado' : loan.status === 'RENEWED' ? 'Renovado' : 'Cancelado'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Fecha inicio: {new Date(loan.startDate).toLocaleDateString('es-CO')} | Vencimiento: {new Date(loan.endDate).toLocaleDateString('es-CO')}
            </p>
          </div>

          {onPrintContract && (
            <button
              onClick={onPrintContract}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              <Receipt className="w-4 h-4 text-brand-400" /> Imprimir Contrato / Tabla
            </button>
          )}
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Monto Prestado:</span>
            <span className="text-sm font-bold text-white font-mono">${loan.principal.toLocaleString('es-CO')}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Interés ({loan.interestRate}%):</span>
            <span className="text-sm font-bold text-white font-mono">${loan.interestAmount.toLocaleString('es-CO')}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Total Deuda Inicial:</span>
            <span className="text-sm font-bold text-slate-200 font-mono">${loan.totalAmount.toLocaleString('es-CO')}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Saldo Pendiente:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">${loan.balance.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Modalidad: <strong className="text-slate-200">{translateFrequency(loan.paymentFrequency)}</strong></span>
          <span>Cuotas: <strong className="text-slate-200">{loan.installments} de ${loan.installmentAmt.toLocaleString('es-CO')}</strong></span>
        </div>
      </div>

      {/* Amortization Schedule Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-400" /> Cronograma de Amortización (Cuotas)
          </h4>
          <span className="text-xs text-slate-400 font-mono">{loan.amortizations?.length || 0} Cuotas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3"># Cuota</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3 text-right">Valor Cuota</th>
                <th className="px-4 py-3 text-right">Abonado</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3">Fecha de Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loan.amortizations && loan.amortizations.map(am => (
                <tr key={am.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-2.5 font-mono text-slate-400">Cuota {am.installmentNumber}</td>
                  <td className="px-4 py-2.5 font-mono">{new Date(am.dueDate).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-white">${am.amount.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-400">${am.amountPaid.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-2.5 text-center">{getAmortizationStatusBadge(am.status)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-400">
                    {am.paidAt ? new Date(am.paidAt).toLocaleDateString('es-CO') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments History List */}
      {loan.payments && loan.payments.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" /> Historial de Abonos Recibidos
            </h4>
          </div>
          <div className="divide-y divide-slate-800/60 text-xs">
            {loan.payments.map(p => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-800/30 transition">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{p.receiptNumber}</span>
                    <span className="text-slate-400 text-[10px]">{new Date(p.paymentDate).toLocaleString('es-CO')}</span>
                  </div>
                  {p.notes && <p className="text-slate-400 italic text-[11px]">Nota: {p.notes}</p>}
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-400 font-mono">+${p.amount.toLocaleString('es-CO')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
