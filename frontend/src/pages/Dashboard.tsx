import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, AlertTriangle, Store, RefreshCw, LayoutDashboard } from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

interface BusinessKpis {
  totalVentasHoy: number
  totalClientes: number
  stockAlertsCount: number
  sesionesAbiertas: number
}

function useBusinessStats() {
  return useQuery<BusinessKpis>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => (await api.get<BusinessKpis>('/dashboard/kpis')).data,
    staleTime: 60_000,
  })
}

export function Dashboard() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useBusinessStats()

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">
            Bienvenido{user?.nombre ? `, ${user.nombre.split(' ')[0]}` : ''}
          </h2>
          <p className="text-slate-500 mt-1">
            Resumen de negocio — {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {isError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          No pudimos cargar los KPIs de negocio. Verifica tu conexión.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Ventas de Hoy"
          value={data ? formatCurrency(data.totalVentasHoy) : '—'}
          subtitle="POS + Facturación"
          icon={TrendingUp}
          color="indigo"
          loading={isLoading}
        />
        <MetricCard
          title="Clientes"
          value={data?.totalClientes ?? '—'}
          subtitle="Clientes activos"
          icon={Users}
          color="emerald"
          loading={isLoading}
        />
        <MetricCard
          title="Alertas de Stock"
          value={data?.stockAlertsCount ?? '—'}
          subtitle="Bajo el mínimo"
          icon={AlertTriangle}
          color="rose"
          loading={isLoading}
        />
        <MetricCard
          title="Cajas Abiertas"
          value={data?.sesionesAbiertas ?? '—'}
          subtitle="Sesiones de POS"
          icon={Store}
          color="amber"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <LayoutDashboard className="h-5 w-5 text-indigo-500" />
            <h3 className="font-semibold text-slate-700">Accesos Rápidos</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: 'Punto de Venta (POS)', href: '/pos', icon: Store, color: 'text-amber-500' },
              { label: 'Nueva Factura', href: '/ventas/facturas/nueva', icon: TrendingUp, color: 'text-indigo-500' },
              { label: 'Ver Inventario', href: '/inventario/productos', icon: AlertTriangle, color: 'text-rose-500' },
              { label: 'Gestión de Clientes', href: '/ventas/clientes', icon: Users, color: 'text-emerald-500' },
            ].map(({ label, href, icon: Icon, color }) => (
              <a
                key={href}
                href={href}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all text-sm text-slate-600 font-medium border border-transparent hover:border-slate-200 group"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${color}`} />
                  {label}
                </div>
                <span className="text-slate-300 group-hover:text-slate-400 transition-colors">→</span>
              </a>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-indigo-500" />
          </div>
          <h3 className="font-semibold text-slate-800">Bienvenido a Edatia ERP</h3>
          <p className="text-sm text-slate-500 mt-2 px-4">
            Desde aquí puedes gestionar toda la operación de tu empresa. Usa el menú superior para navegar entre los módulos.
          </p>
          <div className="mt-6">
             <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Estado del Perfil</span>
             <div className="mt-2 flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-slate-700">{user?.nombre}</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-md font-bold uppercase">{user?.rol}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

