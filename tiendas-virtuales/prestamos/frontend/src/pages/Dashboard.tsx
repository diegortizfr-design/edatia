import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Users, AlertCircle, Calendar, Landmark, Coins, ArrowUpRight } from 'lucide-react';

interface PortfolioSummary {
  totalCustomers: number;
  activeLoansCount: number;
  initialCapital?: number;
  availableCapital?: number;
  capitalPrestado: number;
  expectedRecuperacion: number;
  outstandingBalance: number;
  totalInteresGenerado: number;
  totalCollected: number;
  collectedToday: number;
  overdueLoansCount: number;
  overdueBalance: number;
  collectionEfficiency: number;
}

interface ChartItem {
  date: string;
  amount: number;
}

export interface DashboardProps {
  setCurrentPage: (page: string) => void;
  navigateTo?: (
    page: string, 
    options?: { 
      portfolioStatus?: string; 
      transactionDate?: 'today' | 'yesterday' | 'week' | 'month' | 'all'; 
      clientId?: string 
    }
  ) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage, navigateTo }) => {
  const { tenant } = useAuth();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleNav = (
    page: string, 
    options?: { 
      portfolioStatus?: string; 
      transactionDate?: 'today' | 'yesterday' | 'week' | 'month' | 'all'; 
      clientId?: string 
    }
  ) => {
    if (navigateTo) {
      navigateTo(page, options);
    } else {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await apiCall('/reports/portfolio');
        setSummary(data.summary);
        setChartData(data.chartData);
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-slate-400">Cargando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg">
        <p className="font-semibold">Error al cargar datos:</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Find max value in chart data for scaling
  const maxVal = Math.max(...chartData.map(item => item.amount), 100000);

  // SVG Chart settings
  const chartHeight = 200;
  const chartWidth = 500;
  const padding = 30;

  // Map points to SVG coordinates
  const points = chartData.map((item, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (chartData.length - 1);
    // Invert Y axis for SVG (0,0 is top left)
    const y = chartHeight - padding - (item.amount / maxVal) * (chartHeight - padding * 2);
    return { x, y, label: item.date, val: item.amount };
  });

  // Create path description
  const pathD = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  // Area path description (close path to bottom)
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z` 
    : '';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
            Dashboard General
          </h1>
          <p className="text-slate-400 mt-1">
            Resumen operativo y estado financiero de la cartera de <span className="text-brand-400 font-semibold">{tenant?.name}</span>.
          </p>
        </div>

        {summary?.initialCapital !== undefined && summary.initialCapital > 0 && (
          <div 
            onClick={() => handleNav('accounting')}
            className="bg-slate-900 border border-slate-800 hover:border-brand-500/40 px-4 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer group transition hover-glow"
            title="Clic para ver movimientos y dinero en caja"
          >
            <div className="w-9 h-9 bg-brand-600/10 border border-brand-500/20 rounded-lg flex items-center justify-center text-brand-400 group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Capital Base Inicial</span>
                <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-brand-400 transition" />
              </div>
              <span className="text-sm font-bold text-white font-mono">${summary.initialCapital.toLocaleString('es-CO')} COP</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid con navegación a filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Total en Cartera */}
        <div 
          onClick={() => handleNav('portfolio', { portfolioStatus: 'ACTIVE' })}
          className="glass-card p-6 rounded-xl relative overflow-hidden group hover:border-brand-500/50 hover:bg-slate-900/40 transition cursor-pointer hover-glow"
          title="Clic para filtrar créditos activos en Cartera"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-transform">
            <Landmark className="w-16 h-16 text-brand-500" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total en Cartera</p>
            <span className="text-[10px] text-brand-400 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
              Ver Cartera <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2 group-hover:text-brand-300 transition">
            ${summary?.outstandingBalance.toLocaleString('es-CO')} COP
          </h3>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span 
              onClick={(e) => { e.stopPropagation(); handleNav('portfolio', { portfolioStatus: 'ALL' }); }}
              className="font-semibold text-emerald-400 hover:underline"
              title="Clic para ver todo el capital colocado histórico"
            >
              ${summary?.capitalPrestado.toLocaleString('es-CO')}
            </span> 
            <span>capital de origen</span>
          </div>
        </div>

        {/* KPI 2: Cobrado Hoy */}
        <div 
          onClick={() => handleNav('transactions', { transactionDate: 'today' })}
          className="glass-card p-6 rounded-xl relative overflow-hidden group hover:border-emerald-500/50 hover:bg-slate-900/40 transition cursor-pointer hover-glow"
          title="Clic para ver recibos cobrados hoy"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-transform">
            <Coins className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cobrado Hoy</p>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
              Ver Recibos <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">
            ${summary?.collectedToday.toLocaleString('es-CO')} COP
          </h3>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span>Total acumulado:</span>
            <span 
              onClick={(e) => { e.stopPropagation(); handleNav('transactions', { transactionDate: 'all' }); }}
              className="font-semibold text-slate-200 hover:text-emerald-300 hover:underline"
              title="Clic para ver todos los recibos históricos"
            >
              ${summary?.totalCollected.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* KPI 3: Cartera en Mora */}
        <div 
          onClick={() => handleNav('portfolio', { portfolioStatus: 'OVERDUE' })}
          className="glass-card p-6 rounded-xl relative overflow-hidden group hover:border-red-500/50 hover:bg-red-500/5 transition cursor-pointer hover-glow"
          title="Clic para filtrar créditos en mora en Cartera"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cartera en Mora</p>
            <span className="text-[10px] text-red-400 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
              Ver Morosos <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-red-400 mt-2">
            ${summary?.overdueBalance.toLocaleString('es-CO')} COP
          </h3>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span className="text-red-400 font-semibold">{summary?.overdueLoansCount}</span>
            <span>créditos atrasados</span>
          </div>
        </div>

        {/* KPI 4: Clientes Activos */}
        <div 
          onClick={() => handleNav('clients')}
          className="glass-card p-6 rounded-xl relative overflow-hidden group hover:border-brand-500/50 hover:bg-slate-900/40 transition cursor-pointer hover-glow"
          title="Clic para ver el directorio de clientes"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-transform">
            <Users className="w-16 h-16 text-brand-500" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Clientes Activos</p>
            <span className="text-[10px] text-brand-400 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
              Ver Clientes <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2 group-hover:text-brand-300 transition">
            {summary?.totalCustomers}
          </h3>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span 
              onClick={(e) => { e.stopPropagation(); handleNav('portfolio', { portfolioStatus: 'ACTIVE' }); }}
              className="text-brand-400 font-semibold hover:underline"
              title="Clic para ver créditos vigentes en Cartera"
            >
              {summary?.activeLoansCount}
            </span>
            <span>préstamos vigentes</span>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SVG Chart Panel */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Recaudo de los últimos 7 días</h3>
                <button 
                  onClick={() => handleNav('transactions', { transactionDate: 'week' })}
                  className="text-xs text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-0.5 ml-2"
                  title="Ver recibos de la semana"
                >
                  Ver recibos <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate-400">Comportamiento diario de la cobranza</p>
            </div>
            <div 
              onClick={() => handleNav('reports')}
              className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-full font-medium cursor-pointer transition hover-glow"
              title="Clic para ver reporte financiero y de tesorería"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Eficiencia: {summary?.collectionEfficiency}%
              <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[400px]">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0062ff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0062ff" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = padding + ratio * (chartHeight - padding * 2);
                const val = maxVal * (1 - ratio);
                return (
                  <g key={index}>
                    <line 
                      x1={padding} 
                      y1={y} 
                      x2={chartWidth - padding} 
                      y2={y} 
                      stroke="#1e293b" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={padding - 5} 
                      y={y + 4} 
                      fill="#64748b" 
                      fontSize="9" 
                      textAnchor="end"
                    >
                      {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`}
                    </text>
                  </g>
                );
              })}

              {/* Area path */}
              {areaD && <path d={areaD} fill="url(#chartGradient)" />}

              {/* Line path */}
              {pathD && (
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke="#0062ff" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                />
              )}

              {/* Data points */}
              {points.map((point, index) => (
                <g key={index} className="group/node cursor-pointer">
                  <circle 
                    cx={point.x} 
                    cy={point.y} 
                    r="4" 
                    fill="#0f172a" 
                    stroke="#0062ff" 
                    strokeWidth="2" 
                    className="transition hover:r-6" 
                  />
                  {/* Tooltip on hover */}
                  <text 
                    x={point.x} 
                    y={point.y - 10} 
                    fill="#fff" 
                    fontSize="9" 
                    fontWeight="bold" 
                    textAnchor="middle" 
                    className="opacity-0 group-hover/node:opacity-100 transition bg-slate-900 duration-150 pointer-events-none"
                  >
                    ${(point.val / 1000).toFixed(0)}k
                  </text>
                  {/* X Axis Labels */}
                  <text 
                    x={point.x} 
                    y={chartHeight - 10} 
                    fill="#64748b" 
                    fontSize="9" 
                    textAnchor="middle"
                  >
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Side Panel: Quick Actions */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentPage('clients')}
                className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 rounded-lg hover-glow text-left transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Gestionar Clientes</p>
                    <p className="text-xs text-slate-400">Ver fichas, crear clientes</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setCurrentPage('route')}
                className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 rounded-lg hover-glow text-left transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Iniciar Ruta del Día</p>
                    <p className="text-xs text-slate-400">Ver cobranzas programadas hoy</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setCurrentPage('portfolio')}
                className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 rounded-lg hover-glow text-left transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Revisar Cartera</p>
                    <p className="text-xs text-slate-400">Saldos generales y morosidad</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
            <span>Base de datos prestamos_edatia online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
