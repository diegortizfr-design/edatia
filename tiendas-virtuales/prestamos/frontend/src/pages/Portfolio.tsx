import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Landmark, Search, FolderHeart, TrendingUp } from 'lucide-react';

interface LoanPortfolioItem {
  id: string;
  loanNumber: string;
  customerId: string;
  customerName: string;
  documentId: string;
  principal: number;
  totalAmount: number;
  balance: number;
  paymentFrequency: string;
  installments: number;
  status: string;
  startDate: string;
}

interface PortfolioStats {
  summary: {
    totalCustomers: number;
    activeLoansCount: number;
    capitalPrestado: number;
    expectedRecuperacion: number;
    outstandingBalance: number;
    totalCollected: number;
    overdueLoansCount: number;
    overdueBalance: number;
    collectionEfficiency: number;
  };
}

interface PortfolioProps {
  setCurrentPage: (page: string) => void;
  setSelectedClientId: (id: string) => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({ setCurrentPage, setSelectedClientId }) => {
  const [loans, setLoans] = useState<LoanPortfolioItem[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, OVERDUE
  const [search, setSearch] = useState('');

  const fetchPortfolioData = async () => {
    try {
      // 1. Fetch Stats
      const reportsData = await apiCall('/reports/portfolio');
      setStats(reportsData);

      // 2. Fetch all clients and construct portfolio list based on their loans
      const clientsData = await apiCall('/clients');
      const portfolioItems: LoanPortfolioItem[] = [];

      for (const client of clientsData) {
        // Fetch detailed client profile to get their loans
        const details = await apiCall(`/clients/${client.id}`);
        details.loans.forEach((loan: any) => {
          portfolioItems.push({
            id: loan.id,
            loanNumber: loan.loanNumber,
            customerId: client.id,
            customerName: client.name,
            documentId: client.documentId,
            principal: loan.principal,
            totalAmount: loan.totalAmount,
            balance: loan.balance,
            paymentFrequency: loan.paymentFrequency,
            installments: loan.installments,
            status: loan.status,
            startDate: loan.startDate
          });
        });
      }

      setLoans(portfolioItems);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la cartera.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const translateFrequency = (freq: string) => {
    const freqs: Record<string, string> = {
      DAILY: 'Diario',
      WEEKLY: 'Semanal',
      BIWEEKLY: 'Quincenal',
      MONTHLY: 'Mensual'
    };
    return freqs[freq] || freq;
  };

  // Filters & Search logic
  const filteredLoans = loans.filter(item => {
    const matchesSearch = item.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          item.documentId.includes(search) || 
                          item.loanNumber.toLowerCase().includes(search.toLowerCase());
    
    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && item.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-slate-400">Calculando estados de cartera...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  const summary = stats?.summary;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
          Módulo de Cartera
        </h1>
        <p className="text-slate-400 mt-1">Supervisión agregada de cuentas por cobrar y gestión de cobranza.</p>
      </div>

      {/* Stats Summary Panel */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-start text-slate-450">
              <span className="text-xs uppercase font-bold tracking-wider">Cartera Vigente</span>
              <FolderHeart className="w-5 h-5 text-brand-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mt-2">${summary.outstandingBalance.toLocaleString('es-CO')}</h3>
            <p className="text-xs text-slate-500 mt-1">Saldo total por recuperar</p>
          </div>

          <div className="glass-card p-5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-start text-slate-450">
              <span className="text-xs uppercase font-bold tracking-wider">Capital Colocado</span>
              <Landmark className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mt-2">${summary.capitalPrestado.toLocaleString('es-CO')}</h3>
            <p className="text-xs text-slate-500 mt-1">Capital inicial invertido</p>
          </div>

          <div className="glass-card p-5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-start text-slate-450">
              <span className="text-xs uppercase font-bold tracking-wider">Eficiencia de Recaudo</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-400 mt-2">{summary.collectionEfficiency}%</h3>
            <p className="text-xs text-slate-500 mt-1">Porcentaje de recuperación</p>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, documento o nro crédito..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-850 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {['ALL', 'ACTIVE', 'OVERDUE', 'PAID', 'RENEWED'].map((status) => {
            const labels: Record<string, string> = {
              ALL: 'Todos',
              ACTIVE: 'Activos',
              OVERDUE: 'En Mora',
              PAID: 'Pagados',
              RENEWED: 'Renovados'
            };
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${
                  filterStatus === status
                    ? 'bg-brand-600 border-brand-500 text-white'
                    : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                {labels[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Portfolio Table */}
      {filteredLoans.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <Landmark className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-450 font-medium">No se encontraron créditos que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Nro Crédito</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Frecuencia</th>
                  <th className="p-4 text-right">Monto Original</th>
                  <th className="p-4 text-right">Saldo Actual</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Fecha Inicio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    onClick={() => {
                      setSelectedClientId(loan.customerId);
                      setCurrentPage('client-detail');
                    }}
                    className="hover:bg-slate-900/30 cursor-pointer transition group"
                  >
                    <td className="p-4 font-mono font-bold text-white group-hover:text-brand-400 transition-colors">
                      {loan.loanNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{loan.customerName}</div>
                      <div className="text-xs text-slate-500 font-mono">CC: {loan.documentId}</div>
                    </td>
                    <td className="p-4 text-slate-350">{translateFrequency(loan.paymentFrequency)}</td>
                    <td className="p-4 text-right font-mono text-slate-400">
                      ${loan.principal.toLocaleString('es-CO')}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-200">
                      ${loan.balance.toLocaleString('es-CO')}
                    </td>
                    <td className="p-4">
                      {loan.status === 'PAID' && <span className="text-emerald-400 font-semibold bg-emerald-500/5 px-2.5 py-0.5 rounded-full border border-emerald-500/10 text-xs">PAGADO</span>}
                      {loan.status === 'ACTIVE' && <span className="text-brand-400 font-semibold bg-brand-500/5 px-2.5 py-0.5 rounded-full border border-brand-500/10 text-xs">ACTIVO</span>}
                      {loan.status === 'RENEWED' && <span className="text-purple-400 font-semibold bg-purple-500/5 px-2.5 py-0.5 rounded-full border border-purple-500/10 text-xs">RENOVADO</span>}
                      {loan.status === 'OVERDUE' && <span className="text-red-400 font-semibold bg-red-500/5 px-2.5 py-0.5 rounded-full border border-red-500/10 text-xs">EN MORA</span>}
                    </td>
                    <td className="p-4 text-slate-450 text-xs">
                      {new Date(loan.startDate).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
