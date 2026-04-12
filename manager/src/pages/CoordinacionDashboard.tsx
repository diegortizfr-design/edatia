import { useQuery } from '@tanstack/react-query';
import { BarChart3, Ticket, AlertTriangle, Star, Users, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface Stats {
  total: number;
  porEstado: Record<string, number>;
  porPrioridad: Record<string, number>;
  calificacionPromedio: number | null;
  totalCalificados: number;
}

interface Colaborador {
  id: number; nombre: string; rol: string;
  ticketsSAC?: { id: number }[];
  ticketsDesarrollo?: { id: number }[];
}

const ESTADO_COLOR: Record<string, string> = {
  NUEVO:      'bg-gray-200 dark:bg-gray-600',
  SAC:        'bg-blue-400 dark:bg-blue-500',
  DESARROLLO: 'bg-purple-400 dark:bg-purple-500',
  DEVUELTO:   'bg-yellow-400 dark:bg-yellow-500',
  RESUELTO:   'bg-green-400 dark:bg-green-500',
  CALIFICADO: 'bg-emerald-400 dark:bg-emerald-500',
};

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
          <p className={cn('text-3xl font-bold mt-1', color ?? 'text-gray-900 dark:text-white')}>{value}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-brand-blue/10 text-brand-blue">{icon}</div>
      </div>
    </Card>
  );
}

export function CoordinacionDashboardPage() {
  const { data: stats, isLoading: loadingStats } = useQuery<Stats>({
    queryKey: ['manager', 'tickets', 'stats'],
    queryFn:  () => api.get('/manager/tickets/stats').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: colaboradores = [] } = useQuery<Colaborador[]>({
    queryKey: ['manager', 'colaboradores'],
    queryFn:  () => api.get('/manager/colaboradores').then((r) => r.data),
  });

  const { data: ticketsAbiertos = [] } = useQuery<any[]>({
    queryKey: ['manager', 'tickets', 'abiertos'],
    queryFn:  () => api.get('/manager/tickets').then((r) => r.data),
    refetchInterval: 30_000,
  });

  if (loadingStats) {
    return <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">Cargando métricas...</div>;
  }

  const totalEstados = Object.values(stats?.porEstado ?? {}).reduce((a, b) => a + b, 0) || 1;

  // Calcular carga por asesor SAC
  const asesoresSAC = colaboradores.filter((c) => c.rol === 'OPERACION' || c.rol === 'ADMIN');
  const cargaSAC = asesoresSAC.map((c) => ({
    ...c,
    activos: ticketsAbiertos.filter((t: any) =>
      t.asesorSac?.id === c.id && !['RESUELTO', 'CALIFICADO'].includes(t.estado)
    ).length,
  })).sort((a, b) => b.activos - a.activos);

  const ticketsCriticos = ticketsAbiertos.filter((t: any) =>
    t.prioridad === 'CRITICA' && !['RESUELTO', 'CALIFICADO'].includes(t.estado)
  ).length;

  const sinAsignar = ticketsAbiertos.filter((t: any) => !t.asesorSac).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-brand-blue" /> Dashboard — Coordinación
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Vista en tiempo real del equipo de soporte</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Ticket size={20} />}      label="Total tickets"    value={stats?.total ?? 0} />
        <StatCard icon={<AlertTriangle size={20} />} label="Sin asignar"    value={sinAsignar}        color={sinAsignar > 0 ? 'text-orange-500' : undefined} sub="necesitan atención" />
        <StatCard icon={<AlertTriangle size={20} />} label="Críticos activos" value={ticketsCriticos} color={ticketsCriticos > 0 ? 'text-red-500' : undefined} />
        <StatCard icon={<Star size={20} />}         label="Calificación prom" value={stats?.calificacionPromedio ? `${stats.calificacionPromedio} ★` : '—'} sub={`${stats?.totalCalificados ?? 0} calificados`} color="text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tickets por estado */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Tickets por estado</p>
          <div className="space-y-3">
            {Object.entries(stats?.porEstado ?? {}).map(([estado, count]) => (
              <div key={estado} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400 w-24 shrink-0">{estado}</span>
                <div className="flex-1 bg-gray-100 dark:bg-navy-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', ESTADO_COLOR[estado] ?? 'bg-gray-300')}
                    style={{ width: `${(count / totalEstados) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Tickets por prioridad */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Tickets por prioridad</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'CRITICA', color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/30' },
              { k: 'ALTA',    color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/30' },
              { k: 'MEDIA',   color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30' },
              { k: 'BAJA',    color: 'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700' },
            ].map(({ k, color }) => (
              <div key={k} className={cn('rounded-xl border p-4 text-center', color)}>
                <p className="text-2xl font-bold">{stats?.porPrioridad[k] ?? 0}</p>
                <p className="text-xs font-medium uppercase tracking-wide mt-0.5">{k}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Carga del equipo SAC */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Users size={16} /> Carga del equipo SAC
        </p>
        {cargaSAC.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">No hay asesores SAC registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-left">
                  {['Asesor', 'Rol', 'Tickets activos', 'Carga'].map((h) => (
                    <th key={h} className="pb-2 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {cargaSAC.map((c) => {
                  const maxCarga = Math.max(...cargaSAC.map((x) => x.activos), 1);
                  return (
                    <tr key={c.id}>
                      <td className="py-2.5 pr-6 font-medium text-gray-900 dark:text-white">{c.nombre}</td>
                      <td className="py-2.5 pr-6 text-xs text-gray-400 dark:text-slate-500">{c.rol}</td>
                      <td className="py-2.5 pr-6">
                        <span className={cn('font-bold', c.activos > 5 ? 'text-red-500' : c.activos > 2 ? 'text-orange-500' : 'text-green-500')}>
                          {c.activos}
                        </span>
                      </td>
                      <td className="py-2.5 w-32">
                        <div className="bg-gray-100 dark:bg-navy-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', c.activos > 5 ? 'bg-red-400' : c.activos > 2 ? 'bg-orange-400' : 'bg-green-400')}
                            style={{ width: `${(c.activos / maxCarga) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
