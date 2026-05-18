import { Activity, Building2, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/ui/Card';

export function ComercialDashboardPage() {
  const { colaborador } = useAuth();
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {saludo}, {colaborador?.nombre?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Dashboard Comercial · Gestión de Clientes
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-500 bg-white dark:bg-navy-700 border border-gray-200 dark:border-white/5 rounded-lg px-3 py-2">
          <Activity size={13} className="text-brand-blue" />
          <span>
            {new Intl.DateTimeFormat('es-CO', {
              weekday: 'long', day: 'numeric', month: 'long',
            }).format(new Date())}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Mis Clientes Activos"
          value={'—'}
          icon={<Building2 size={20} />}
          trend="clientes"
          color="blue"
        />
        <StatCard
          label="Prospectos en Gestión"
          value={'—'}
          icon={<TrendingUp size={20} />}
          trend="prospectos"
          color="emerald"
        />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gradient-card p-5 shadow-sm dark:shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Resumen de Gestión Comercial</h2>
          <a
            href="/clientes"
            className="text-xs text-brand-blue hover:text-brand-indigo flex items-center gap-1 transition-colors"
          >
            Ir a clientes <ArrowUpRight size={12} />
          </a>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          En esta sección podrás ver el rendimiento de tus ventas, clientes contactados y metas comerciales.
        </p>
      </div>
    </div>
  );
}
