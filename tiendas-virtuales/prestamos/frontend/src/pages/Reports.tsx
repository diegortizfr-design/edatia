import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { 
  BarChart3, Wallet, TrendingUp, Coins, 
  Calendar, ChevronRight, RefreshCw, Phone, ArrowUpRight
} from 'lucide-react';

interface TreasuryStats {
  initialCapital: number;
  availableCapital: number;
  capitalPrestado: number;
  totalCollected: number;
  cajaIntereses: number;
  capitalPorCobrar: number;
  capitalCobrado: number;
  interesesPorCobrar: number;
  interesesCobrados: number;
}

interface ProjectionItem {
  amortizationId: string;
  installmentNumber: number;
  loanNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
}

interface DateProjection {
  date: string;
  rawDate: string;
  installmentsCount: number;
  totalExpected: number;
  items: ProjectionItem[];
}

export const Reports: React.FC = () => {
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [projections, setProjections] = useState<DateProjection[]>([]);
  const [totalPeriodExpected, setTotalPeriodExpected] = useState<number>(0);
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const [treasuryData, projectionData] = await Promise.all([
        apiCall('/reports/treasury'),
        apiCall(`/reports/recaudo-proyeccion?days=${daysFilter}`)
      ]);

      setStats(treasuryData);
      setProjections(projectionData.projections || []);
      setTotalPeriodExpected(projectionData.totalPeriodExpected || 0);

      if (projectionData.projections && projectionData.projections.length > 0) {
        setSelectedDate(projectionData.projections[0].date);
      }
    } catch (err: any) {
      console.error('Error al cargar datos de reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [daysFilter]);

  const activeDateProjection = projections.find(p => p.date === selectedDate) || null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-brand-400" />
            Reportes Financieros & Proyección de Recaudo
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Control de flujo de caja, balance de capitales e intereses, y cronograma de cobro programado
          </p>
        </div>

        <button
          onClick={fetchReportsData}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 text-brand-400 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Datos
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capital Inicial */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Capital Inicial Invertido</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-white">
            ${stats ? stats.initialCapital.toLocaleString('es-CO') : '0'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Base configurada para la cartera</p>
        </div>

        {/* Saldo en Caja (Disponible) */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Saldo en Caja (Disponible)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-emerald-300">
            ${stats ? stats.availableCapital.toLocaleString('es-CO') : '0'}
          </h3>
          <p className="text-[11px] text-emerald-400/80 mt-1">Dinero listo para asignar en nuevos créditos</p>
        </div>

        {/* Caja Intereses Recaudados */}
        <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400">Caja Intereses Recaudados</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-amber-300">
            ${stats ? stats.cajaIntereses.toLocaleString('es-CO') : '0'}
          </h3>
          <p className="text-[11px] text-amber-400/80 mt-1">Ganancia neta recibida por intereses</p>
        </div>

        {/* Capital Prestado Colocado */}
        <div className="glass-card p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-purple-400">Capital Prestado Colocado</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-purple-300">
            ${stats ? stats.capitalPrestado.toLocaleString('es-CO') : '0'}
          </h3>
          <p className="text-[11px] text-purple-400/80 mt-1">Monto en circulación activa</p>
        </div>
      </div>

      {/* Secondary Financial Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capital por Cobrar */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capital por Cobrar</span>
          <div className="text-xl font-bold font-mono text-cyan-400">
            ${stats ? stats.capitalPorCobrar.toLocaleString('es-CO') : '0'}
          </div>
          <span className="text-[10px] text-slate-500 block">Principal pendiente de recuperación</span>
        </div>

        {/* Capital Cobrado */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capital Cobrado</span>
          <div className="text-xl font-bold font-mono text-indigo-400">
            ${stats ? stats.capitalCobrado.toLocaleString('es-CO') : '0'}
          </div>
          <span className="text-[10px] text-slate-500 block">Principal retornado a la fecha</span>
        </div>

        {/* Intereses por Cobrar */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Intereses por Cobrar</span>
          <div className="text-xl font-bold font-mono text-amber-400">
            ${stats ? stats.interesesPorCobrar.toLocaleString('es-CO') : '0'}
          </div>
          <span className="text-[10px] text-slate-500 block">Utilidad futura proyectada</span>
        </div>

        {/* Intereses Cobrados */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Intereses Cobrados</span>
          <div className="text-xl font-bold font-mono text-emerald-400">
            ${stats ? stats.interesesCobrados.toLocaleString('es-CO') : '0'}
          </div>
          <span className="text-[10px] text-slate-500 block">Intereses liquidados al cobro</span>
        </div>
      </div>

      {/* Proyección de Recaudo Section (Calendario por Días) */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" />
              Proyección de Recaudo (Calendario por Días)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Programación diaria de dinero a recolectar según las cuotas de amortización registradas
            </p>
          </div>

          {/* Days Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            {[7, 15, 30, 60].map(d => (
              <button
                key={d}
                onClick={() => setDaysFilter(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  daysFilter === d
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d} Días
              </button>
            ))}
          </div>
        </div>

        {/* Total Projected Header Banner */}
        <div className="p-4 rounded-xl bg-brand-600/10 border border-brand-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase text-brand-300 tracking-wider">Total Programado a Recoger en {daysFilter} Días</span>
            <h4 className="text-2xl font-bold font-mono text-brand-400 mt-0.5">
              ${totalPeriodExpected.toLocaleString('es-CO')}
            </h4>
          </div>
          <span className="text-xs font-mono font-bold bg-brand-500/20 text-brand-300 px-3 py-1.5 rounded-lg w-fit">
            {projections.length} Días con Cobros Programados
          </span>
        </div>

        {/* Projection Calendar & Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Days List (Left Column) */}
          <div className="lg:col-span-5 space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {projections.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No hay cuotas pendientes programadas para este rango de días.
              </div>
            ) : (
              projections.map(proj => {
                const dateObj = new Date(proj.date + 'T00:00:00');
                const dayName = dateObj.toLocaleDateString('es-CO', { weekday: 'short' });
                const dayNum = dateObj.getDate();
                const monthName = dateObj.toLocaleDateString('es-CO', { month: 'short' });
                const isSelected = selectedDate === proj.date;

                return (
                  <button
                    key={proj.date}
                    onClick={() => setSelectedDate(proj.date)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-brand-600/15 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-brand-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-300'
                      }`}>
                        <span className="text-[10px] uppercase font-semibold">{dayName}</span>
                        <span className="text-sm font-bold leading-none">{dayNum}</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white uppercase">{dayName} {dayNum} {monthName}</div>
                        <div className="text-[11px] text-slate-400">{proj.installmentsCount} cuotas a cobrar</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        ${proj.totalExpected.toLocaleString('es-CO')}
                      </div>
                      <ChevronRight className={`w-4 h-4 ml-auto mt-1 transition ${isSelected ? 'text-brand-400' : 'text-slate-600'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Selected Date Details Breakdown (Right Column) */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4">
            {activeDateProjection ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase">
                      Desglose de Cobros: {new Date(activeDateProjection.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {activeDateProjection.installmentsCount} cuotas por un total de ${activeDateProjection.totalExpected.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                    ${activeDateProjection.totalExpected.toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2.5">Crédito Nro</th>
                        <th className="px-3 py-2.5">Cliente</th>
                        <th className="px-3 py-2.5 text-center">Cuota Nro</th>
                        <th className="px-3 py-2.5 text-right">Valor Cuota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {activeDateProjection.items.map(item => (
                        <tr key={item.amortizationId} className="hover:bg-slate-900/60 transition">
                          <td className="px-3 py-2.5 font-mono text-brand-400 font-bold">{item.loanNumber}</td>
                          <td className="px-3 py-2.5 font-medium text-white">
                            <div>{item.customerName}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-600" /> {item.customerPhone}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-slate-400">Cuota {item.installmentNumber}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">${item.amount.toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                Selecciona una fecha de la izquierda para ver el desglose detallado de cuotas y clientes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
