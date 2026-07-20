import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Users, AlertCircle, Calendar, Landmark, Coins } from 'lucide-react';

interface PortfolioSummary {
  totalCustomers: number;
  activeLoansCount: number;
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

export const Dashboard: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
  const { tenant } = useAuth();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
          Dashboard General
        </h1>
        <p className="text-slate-400 mt-1">
          Resumen operativo y estado financiero de la cartera de <span className="text-brand-400 font-semibold">{tenant?.name}</span>.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:border-brand-500/30 transition">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Landmark className="w-16 h-16 text-brand-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total en Cartera</p>
          <h3 className="text-2xl font-bold text-white mt-2">
            ${summary?.outstandingBalance.toLocaleString('es-CO')} COP
          </h3>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span className="font-semibold text-emerald-400">
              ${summary?.capitalPrestado.toLocaleString('es-CO')}
            </span> 
            <span>capital de origen</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Coins className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cobrado Hoy</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">
            ${summary?.collectedToday.toLocaleString('es-CO')} COP
          </h3>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span>Total acumulado:</span>
            <span className="font-semibold text-slate-300">
              ${summary?.totalCollected.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:border-red-500/30 transition">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cartera en Mora</p>
          <h3 className="text-2xl font-bold text-red-400 mt-2">
            ${summary?.overdueBalance.toLocaleString('es-CO')} COP
          </h3>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span className="text-red-400 font-semibold">{summary?.overdueLoansCount}</span>
            <span>créditos atrasados</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:border-brand-500/30 transition">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="w-16 h-16 text-brand-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Clientes Activos</p>
          <h3 className="text-2xl font-bold text-white mt-2">
            {summary?.totalCustomers}
          </h3>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span className="text-brand-400 font-semibold">{summary?.activeLoansCount}</span>
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
              <h3 className="text-lg font-bold text-white">Recaudo de los últimos 7 días</h3>
              <p className="text-xs text-slate-400">Comportamiento diario de la cobranza</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              Eficiencia: {summary?.collectionEfficiency}%
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
