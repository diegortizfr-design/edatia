import { Activity, Headphones, Code2, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/ui/Card';

export function OperacionDashboardPage() {
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
            Dashboard Operación · Mis Tickets y Tareas
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-500 bg-white dark:bg-navy-700 border border-gray-200 dark:border-white/5 rounded-lg px-3 py-2">
          <Activity size={13} className="text-slate-400" />
          <span>
            {new Intl.DateTimeFormat('es-CO', {
              weekday: 'long', day: 'numeric', month: 'long',
            }).format(new Date())}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Tickets SAC Asignados"
          value={'—'}
          icon={<Headphones size={20} />}
          trend="abiertos"
          color="slate"
        />
        <StatCard
          label="Tickets Dev Asignados"
          value={'—'}
          icon={<Code2 size={20} />}
          trend="abiertos"
          color="blue"
        />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gradient-card p-5 shadow-sm dark:shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Resumen de Operación</h2>
          <div className="flex gap-4">
            <a href="/operacion/sac/tickets/nuevo" className="text-xs text-brand-blue hover:text-brand-indigo flex items-center gap-1">
              Ver SAC <ArrowUpRight size={12} />
            </a>
            <a href="/operacion/desarrollo/tickets" className="text-xs text-brand-blue hover:text-brand-indigo flex items-center gap-1">
              Ver Desarrollo <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          En esta sección podrás ver el rendimiento de tu atención de tickets y tiempos de respuesta.
        </p>
      </div>
    </div>
  );
}
