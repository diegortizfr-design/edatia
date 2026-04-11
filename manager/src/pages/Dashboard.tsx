import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Users,
  TrendingUp,
  Package,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCOP, ESTADO_COLORS, ROL_COLORS } from '@/lib/utils';

interface ClienteStats {
  total: number;
  porEstado: Record<string, number>;
  ingresosMensuales: number;
}

interface ColabStats {
  total: number;
  porRol: Record<string, number>;
}

export function DashboardPage() {
  const { colaborador } = useAuth();
  const isAdmin = colaborador?.rol === 'ADMIN';

  const { data: clienteStats } = useQuery<ClienteStats>({
    queryKey: ['manager', 'clientes', 'stats'],
    queryFn: () => api.get('/manager/clientes/stats').then((r) => r.data),
  });

  const { data: colabStats } = useQuery<ColabStats>({
    queryKey: ['manager', 'colaboradores', 'stats'],
    queryFn: () => api.get('/manager/colaboradores/stats').then((r) => r.data),
    enabled: isAdmin,
  });

  const { data: modulos } = useQuery<{ id: number; nombre: string; activo: boolean; precioAnual: number; slug: string }[]>({
    queryKey: ['manager', 'modulos'],
    queryFn: () => api.get('/manager/modulos').then((r) => r.data),
  });

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {saludo}, {colaborador?.nombre?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Panel de control · Edatia Manager
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-500 bg-white dark:bg-navy-700 border border-gray-200 dark:border-white/5 rounded-lg px-3 py-2">
          <Activity size={13} className="text-emerald-500" />
          <span>
            {new Intl.DateTimeFormat('es-CO', {
              weekday: 'long', day: 'numeric', month: 'long',
            }).format(new Date())}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Clientes"
          value={clienteStats?.total ?? '—'}
          icon={<Building2 size={20} />}
          trend={`${clienteStats?.porEstado?.ACTIVO ?? 0} activos`}
          color="blue"
        />
        <StatCard
          label="Ing. Mensual Est."
          value={clienteStats ? formatCOP(clienteStats.ingresosMensuales) : '—'}
          icon={<TrendingUp size={20} />}
          trend="módulos activos"
          color="emerald"
        />
        <StatCard
          label="Módulos Activos"
          value={modulos?.filter((m) => m.activo).length ?? '—'}
          icon={<Package size={20} />}
          trend={`de ${modulos?.length ?? 0} totales`}
          color="purple"
        />
        {isAdmin && (
          <StatCard
            label="Colaboradores"
            value={colabStats?.total ?? '—'}
            icon={<Users size={20} />}
            trend="equipo activo"
            color="yellow"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clientes por estado */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gradient-card p-5 shadow-sm dark:shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Clientes por Estado</h2>
            <a
              href="/clientes"
              className="text-xs text-brand-blue hover:text-brand-indigo flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'] as const).map((estado) => (
              <div
                key={estado}
                className="rounded-lg bg-gray-50 dark:bg-navy-700/50 border border-gray-200 dark:border-white/5 px-4 py-3 flex items-center justify-between"
              >
                <span className="text-xs text-gray-500 dark:text-slate-400">{estado}</span>
                <span
                  className={`text-lg font-bold ${
                    estado === 'ACTIVO'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : estado === 'PROSPECTO'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : estado === 'SUSPENDIDO'
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {clienteStats?.porEstado?.[estado] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Módulos disponibles */}
        <div className="rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gradient-card p-5 shadow-sm dark:shadow-card">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Módulos Software</h2>
          <div className="space-y-2">
            {modulos?.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">
                    {m.slug === 'inventario' ? '📦' : m.slug === 'ventas' ? '💼' : m.slug === 'administrativo' ? '🏢' : m.slug === 'contable' ? '📊' : '🌐'}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-slate-300 truncate">{m.nombre}</span>
                </div>
                <Badge variant={m.activo ? 'success' : 'danger'}>
                  {m.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            ))}
            {!modulos?.length && (
              <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">Sin módulos configurados</p>
            )}
          </div>
        </div>
      </div>

      {/* Colaboradores por rol (ADMIN only) */}
      {isAdmin && colabStats && (
        <div className="rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gradient-card p-5 shadow-sm dark:shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Equipo por Rol</h2>
            <a
              href="/colaboradores"
              className="text-xs text-brand-blue hover:text-brand-indigo flex items-center gap-1 transition-colors"
            >
              Gestionar equipo <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'] as const).map((rol) => (
              <div
                key={rol}
                className="rounded-lg bg-gray-50 dark:bg-navy-700/50 border border-gray-200 dark:border-white/5 px-4 py-3 text-center"
              >
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {colabStats.porRol?.[rol] ?? 0}
                </p>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide ${ROL_COLORS[rol]}`}
                >
                  {rol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
