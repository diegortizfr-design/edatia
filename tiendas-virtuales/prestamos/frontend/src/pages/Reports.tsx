import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { 
  BarChart3, Wallet, TrendingUp, Coins, 
  Calendar, ChevronRight, RefreshCw, Phone, ArrowUpRight,
  Users, Clock, CalendarDays, CalendarRange, Search, UserCheck, UserX, PieChart
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

interface FrequencyData {
  count: number;
  percentage: number;
  activeLoansCount: number;
  totalDebt: number;
  totalPrincipal: number;
}

interface CustomerReportItem {
  id: string;
  name: string;
  documentId: string;
  phone: string;
  address: string;
  email: string | null;
  status: string;
  defaultFrequency: string;
  activeLoansCount: number;
  totalDebt: number;
}

interface CustomerSegmentationStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  byFrequency: {
    DAILY: FrequencyData;
    WEEKLY: FrequencyData;
    BIWEEKLY: FrequencyData;
    MONTHLY: FrequencyData;
  };
  customersList: CustomerReportItem[];
}

export const Reports: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'treasury' | 'customers'>('treasury');
  
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [projections, setProjections] = useState<DateProjection[]>([]);
  const [totalPeriodExpected, setTotalPeriodExpected] = useState<number>(0);
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Customer segmentation states
  const [customerStats, setCustomerStats] = useState<CustomerSegmentationStats | null>(null);
  const [freqFilter, setFreqFilter] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const [treasuryData, projectionData, customerData] = await Promise.all([
        apiCall('/reports/treasury'),
        apiCall(`/reports/recaudo-proyeccion?days=${daysFilter}`),
        apiCall('/reports/customers')
      ]);

      setStats(treasuryData);
      setProjections(projectionData.projections || []);
      setTotalPeriodExpected(projectionData.totalPeriodExpected || 0);
      setCustomerStats(customerData);

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

  // Filtered customer list for the segmentation tab
  const filteredCustomers = (customerStats?.customersList || []).filter(c => {
    const matchesFreq = freqFilter === 'ALL' || c.defaultFrequency === freqFilter;
    const matchesSearch = searchTerm === '' || 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.documentId.includes(searchTerm) ||
      c.phone.includes(searchTerm);
    return matchesFreq && matchesSearch;
  });

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'DAILY': return 'Diario';
      case 'WEEKLY': return 'Semanal';
      case 'BIWEEKLY': return 'Quincenal';
      case 'MONTHLY': return 'Mensual';
      default: return freq;
    }
  };

  const getFrequencyBadgeColor = (freq: string) => {
    switch (freq) {
      case 'DAILY': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'WEEKLY': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'BIWEEKLY': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'MONTHLY': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Main Sub-tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-brand-400" />
            Módulo de Reportes & Análisis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Control de tesorería, proyecciones de cobro y segmentación estratégica de clientes
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Main Tab Navigation Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMainTab('treasury')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeMainTab === 'treasury'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-4 h-4" />
              Tesorería & Recaudo
            </button>
            <button
              onClick={() => setActiveMainTab('customers')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                activeMainTab === 'customers'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Segmentación Clientes
            </button>
          </div>

          <button
            onClick={fetchReportsData}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
            title="Actualizar Datos"
          >
            <RefreshCw className={`w-4 h-4 text-brand-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TESORERÍA Y RECAUDO */}
      {activeMainTab === 'treasury' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Primary Financial Indicators */}
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
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capital por Cobrar</span>
              <div className="text-xl font-bold font-mono text-cyan-400">
                ${stats ? stats.capitalPorCobrar.toLocaleString('es-CO') : '0'}
              </div>
              <span className="text-[10px] text-slate-500 block">Principal pendiente de recuperación</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capital Cobrado</span>
              <div className="text-xl font-bold font-mono text-indigo-400">
                ${stats ? stats.capitalCobrado.toLocaleString('es-CO') : '0'}
              </div>
              <span className="text-[10px] text-slate-500 block">Principal retornado a la fecha</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Intereses por Cobrar</span>
              <div className="text-xl font-bold font-mono text-amber-400">
                ${stats ? stats.interesesPorCobrar.toLocaleString('es-CO') : '0'}
              </div>
              <span className="text-[10px] text-slate-500 block">Utilidad futura proyectada</span>
            </div>

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
              {/* Days List */}
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

              {/* Selected Date Details Breakdown */}
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
      )}

      {/* TAB 2: SEGMENTACIÓN DE CLIENTES */}
      {activeMainTab === 'customers' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Customer KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Clientes */}
            <div className="glass-card p-5 rounded-2xl border border-brand-500/30 bg-brand-500/5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-brand-300">Total Clientes</span>
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-bold font-mono text-white">
                {customerStats ? customerStats.totalCustomers : 0}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <UserCheck className="w-3 h-3" /> {customerStats?.activeCustomers || 0} Activos
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <UserX className="w-3 h-3" /> {customerStats?.inactiveCustomers || 0} Inactivos
                </span>
              </div>
            </div>

            {/* Clientes Diarios */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400">Clientes Diarios</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold font-mono text-emerald-300">
                  {customerStats?.byFrequency?.DAILY?.count || 0}
                </h3>
                <span className="text-xs font-bold text-emerald-400/80 font-mono">
                  ({customerStats?.byFrequency?.DAILY?.percentage || 0}%)
                </span>
              </div>
              <p className="text-[10px] text-emerald-400/70 mt-1">Cobro día a día (Lunes a Domingo)</p>
            </div>

            {/* Clientes Semanales */}
            <div className="glass-card p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-blue-400">Clientes Semanales</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <CalendarDays className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold font-mono text-blue-300">
                  {customerStats?.byFrequency?.WEEKLY?.count || 0}
                </h3>
                <span className="text-xs font-bold text-blue-400/80 font-mono">
                  ({customerStats?.byFrequency?.WEEKLY?.percentage || 0}%)
                </span>
              </div>
              <p className="text-[10px] text-blue-400/70 mt-1">Cobro cada 7 días</p>
            </div>

            {/* Clientes Quincenales */}
            <div className="glass-card p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-purple-400">Clientes Quincenales</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <CalendarRange className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold font-mono text-purple-300">
                  {customerStats?.byFrequency?.BIWEEKLY?.count || 0}
                </h3>
                <span className="text-xs font-bold text-purple-400/80 font-mono">
                  ({customerStats?.byFrequency?.BIWEEKLY?.percentage || 0}%)
                </span>
              </div>
              <p className="text-[10px] text-purple-400/70 mt-1">Cobro cada 15 días</p>
            </div>

            {/* Clientes Mensuales */}
            <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400">Clientes Mensuales</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold font-mono text-amber-300">
                  {customerStats?.byFrequency?.MONTHLY?.count || 0}
                </h3>
                <span className="text-xs font-bold text-amber-400/80 font-mono">
                  ({customerStats?.byFrequency?.MONTHLY?.percentage || 0}%)
                </span>
              </div>
              <p className="text-[10px] text-amber-400/70 mt-1">Cobro cada 30 días</p>
            </div>
          </div>

          {/* Visual Distribution Progress Bars Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-brand-400" />
                  Distribución Porcentual de Cartera de Clientes
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proporción de clientes activos e inactivos clasificados por su modalidad de cobro
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg">
                Total: {customerStats?.totalCustomers || 0} Clientes
              </span>
            </div>

            {/* Progress Stack Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
                <div 
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-500" 
                  style={{ width: `${customerStats?.byFrequency?.DAILY?.percentage || 0}%` }}
                  title={`Diario: ${customerStats?.byFrequency?.DAILY?.percentage}%`}
                />
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${customerStats?.byFrequency?.WEEKLY?.percentage || 0}%` }}
                  title={`Semanal: ${customerStats?.byFrequency?.WEEKLY?.percentage}%`}
                />
                <div 
                  className="bg-purple-500 h-full transition-all duration-500" 
                  style={{ width: `${customerStats?.byFrequency?.BIWEEKLY?.percentage || 0}%` }}
                  title={`Quincenal: ${customerStats?.byFrequency?.BIWEEKLY?.percentage}%`}
                />
                <div 
                  className="bg-amber-500 h-full rounded-r-full transition-all duration-500" 
                  style={{ width: `${customerStats?.byFrequency?.MONTHLY?.percentage || 0}%` }}
                  title={`Mensual: ${customerStats?.byFrequency?.MONTHLY?.percentage}%`}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-slate-300">Diarios ({customerStats?.byFrequency?.DAILY?.percentage || 0}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs font-semibold text-slate-300">Semanales ({customerStats?.byFrequency?.WEEKLY?.percentage || 0}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-xs font-semibold text-slate-300">Quincenales ({customerStats?.byFrequency?.BIWEEKLY?.percentage || 0}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-slate-300">Mensuales ({customerStats?.byFrequency?.MONTHLY?.percentage || 0}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Frequency Breakdown Cards Grid (Diario, Semanal, Quincenal, Mensual) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Diario Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Cobro Diario</h4>
                    <span className="text-[10px] text-slate-400">Modalidad 1 día</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {customerStats?.byFrequency?.DAILY?.count || 0} Clientes
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Préstamos Activos:</span>
                  <span className="font-bold text-white font-mono">{customerStats?.byFrequency?.DAILY?.activeLoansCount || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Deuda Total Pendiente:</span>
                  <span className="font-bold text-emerald-400 font-mono">${(customerStats?.byFrequency?.DAILY?.totalDebt || 0).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Capital Colocado:</span>
                  <span className="font-bold text-purple-300 font-mono">${(customerStats?.byFrequency?.DAILY?.totalPrincipal || 0).toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            {/* Semanal Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Cobro Semanal</h4>
                    <span className="text-[10px] text-slate-400">Modalidad 7 días</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {customerStats?.byFrequency?.WEEKLY?.count || 0} Clientes
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Préstamos Activos:</span>
                  <span className="font-bold text-white font-mono">{customerStats?.byFrequency?.WEEKLY?.activeLoansCount || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Deuda Total Pendiente:</span>
                  <span className="font-bold text-blue-400 font-mono">${(customerStats?.byFrequency?.WEEKLY?.totalDebt || 0).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Capital Colocado:</span>
                  <span className="font-bold text-purple-300 font-mono">${(customerStats?.byFrequency?.WEEKLY?.totalPrincipal || 0).toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            {/* Quincenal Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-purple-500/40 transition">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                    <CalendarRange className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Cobro Quincenal</h4>
                    <span className="text-[10px] text-slate-400">Modalidad 15 días</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {customerStats?.byFrequency?.BIWEEKLY?.count || 0} Clientes
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Préstamos Activos:</span>
                  <span className="font-bold text-white font-mono">{customerStats?.byFrequency?.BIWEEKLY?.activeLoansCount || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Deuda Total Pendiente:</span>
                  <span className="font-bold text-purple-400 font-mono">${(customerStats?.byFrequency?.BIWEEKLY?.totalDebt || 0).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Capital Colocado:</span>
                  <span className="font-bold text-purple-300 font-mono">${(customerStats?.byFrequency?.BIWEEKLY?.totalPrincipal || 0).toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            {/* Mensual Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Cobro Mensual</h4>
                    <span className="text-[10px] text-slate-400">Modalidad 30 días</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {customerStats?.byFrequency?.MONTHLY?.count || 0} Clientes
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Préstamos Activos:</span>
                  <span className="font-bold text-white font-mono">{customerStats?.byFrequency?.MONTHLY?.activeLoansCount || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Deuda Total Pendiente:</span>
                  <span className="font-bold text-amber-400 font-mono">${(customerStats?.byFrequency?.MONTHLY?.totalDebt || 0).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Capital Colocado:</span>
                  <span className="font-bold text-purple-300 font-mono">${(customerStats?.byFrequency?.MONTHLY?.totalPrincipal || 0).toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Filtered Customer List Table */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-400" />
                  Directorio Segmentado de Clientes
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filtra tus deudores por su modalidad de cobro asignada para consultar saldos y créditos activos
                </p>
              </div>

              {/* Filter Tabs & Search Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar cliente, cédula o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-full sm:w-64"
                  />
                </div>

                {/* Frequency Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
                  {[
                    { id: 'ALL', label: 'Todos' },
                    { id: 'DAILY', label: 'Diarios' },
                    { id: 'WEEKLY', label: 'Semanales' },
                    { id: 'BIWEEKLY', label: 'Quincenales' },
                    { id: 'MONTHLY', label: 'Mensuales' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFreqFilter(f.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        freqFilter === f.id
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Cédula / NIT</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3 text-center">Frecuencia</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Créditos Activos</th>
                    <th className="px-4 py-3 text-right">Saldo Adeudado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        No se encontraron clientes para la modalidad o término seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{c.documentId}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{c.phone}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getFrequencyBadgeColor(c.defaultFrequency)}`}>
                            {getFrequencyLabel(c.defaultFrequency)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {c.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-white">
                          {c.activeLoansCount}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                          ${c.totalDebt.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
