import { useQuery } from '@tanstack/react-query'
import { Users, Building2, Activity, TrendingUp, RefreshCw } from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import type { StatsResponse } from '../types'

function useStats() {
  const users = useQuery<StatsResponse>({
    queryKey: ['stats', 'users'],
    queryFn: async () => (await api.get<StatsResponse>('/users/stats')).data,
    staleTime: 30_000,
  })

  const empresas = useQuery<StatsResponse>({
    queryKey: ['stats', 'empresas'],
    queryFn: async () => (await api.get<StatsResponse>('/empresas/stats')).data,
    staleTime: 30_000,
  })

  return { users, empresas }
}

export function Dashboard() {
  const { user } = useAuth()
  const { users, empresas } = useStats()

  const isLoading = users.isLoading || empresas.isLoading
  const hasError = users.isError || empresas.isError

  const refetchAll = () => {
    void users.refetch()
    void empresas.refetch()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">
            Bienvenido{user?.nombre ? `, ${user.nombre.split(' ')[0]}` : ''}
          </h2>
          <p className="text-slate-500 mt-1">
            Panel de control — {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={refetchAll}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {hasError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          Algunos datos no pudieron cargarse. Verifica la conexión con el servidor.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Usuarios Totales"
          value={users.data?.total ?? '—'}
          subtitle={users.data ? `${users.data.admins ?? 0} admins` : undefined}
          icon={Users}
          color="indigo"
          loading={users.isLoading}
        />
        <MetricCard
          title="Empresas"
          value={empresas.data?.total ?? '—'}
          subtitle={empresas.data ? `${empresas.data.conUsuarios ?? 0} activas` : undefined}
          icon={Building2}
          color="emerald"
          loading={empresas.isLoading}
        />
        <MetricCard
          title="Empresas Activas"
          value={empresas.data?.conUsuarios ?? '—'}
          subtitle="Con usuarios asignados"
          icon={TrendingUp}
          color="amber"
          loading={empresas.isLoading}
        />
        <MetricCard
          title="Estado del Sistema"
          value="Operativo"
          subtitle="Todos los servicios activos"
          icon={Activity}
          color="rose"
          loading={false}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-1">Información del Perfil</h3>
          <p className="text-sm text-slate-500 mb-4">Tu cuenta en Edatia ERP</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Usuario</dt>
              <dd className="font-medium text-slate-700">{user?.usuario}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-700">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Rol</dt>
              <dd>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  user?.rol === 'admin'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {user?.rol}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-1">Accesos Rápidos</h3>
          <p className="text-sm text-slate-500 mb-4">Navega a las secciones principales</p>
          <div className="space-y-2">
            {[
              { label: 'Gestionar Empresas', href: '/empresas', icon: Building2 },
              { label: 'Gestionar Usuarios', href: '/usuarios', icon: Users },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600 font-medium border border-transparent hover:border-slate-200"
              >
                <Icon className="h-4 w-4 text-indigo-500" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
