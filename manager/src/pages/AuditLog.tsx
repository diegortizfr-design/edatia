import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert, RefreshCw, Search, X,
  LogIn, LogOut, KeyRound, Eye, UserCog, Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Tipos ───────────────────────────────────────────────────────────────────
interface AuditEntry {
  id: number;
  accion: string;
  entidad?: string;
  entidadId?: number;
  colaboradorId?: number;
  colaboradorEmail?: string;
  ip?: string;
  userAgent?: string;
  detalles?: Record<string, unknown>;
  createdAt: string;
}

interface AuditStats {
  totalHoy: number;
  fallosUltimaHora: number;
  cuentasBloqueadas: number;
}

// ── Config visual de cada acción ─────────────────────────────────────────────
const ACCIONES: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  LOGIN_OK:                 { label: 'Login OK',          color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50  dark:bg-green-500/10',  icon: <LogIn size={13} /> },
  LOGIN_FAIL:               { label: 'Login Fallido',     color: 'text-red-600   dark:text-red-400',    bg: 'bg-red-50    dark:bg-red-500/10',    icon: <ShieldAlert size={13} /> },
  CUENTA_BLOQUEADA:         { label: 'Cuenta Bloqueada',  color: 'text-red-700   dark:text-red-300',    bg: 'bg-red-100   dark:bg-red-500/20',    icon: <Lock size={13} /> },
  LOGOUT:                   { label: 'Logout',            color: 'text-blue-600  dark:text-blue-400',   bg: 'bg-blue-50   dark:bg-blue-500/10',   icon: <LogOut size={13} /> },
  TOKEN_REFRESH:            { label: 'Token Renovado',    color: 'text-slate-500 dark:text-slate-400',  bg: 'bg-gray-50   dark:bg-white/5',       icon: <KeyRound size={13} /> },
  TOKEN_REFRESH_FAIL:       { label: 'Refresh Fallido',   color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', icon: <KeyRound size={13} /> },
  ACCESS_PII:               { label: 'Acceso PII',        color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50  dark:bg-amber-500/10',  icon: <Eye size={13} /> },
  COLABORADOR_CREATE:       { label: 'Colaborador Creado',color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', icon: <UserCog size={13} /> },
  COLABORADOR_UPDATE:       { label: 'Colaborador Editado',color:'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', icon: <UserCog size={13} /> },
  COLABORADOR_TOGGLE_ACTIVO:{ label: 'Toggle Activo',     color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', icon: <UserCog size={13} /> },
  COLABORADOR_TRANSFERIR:   { label: 'Transferencia',     color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', icon: <UserCog size={13} /> },
};

function accionMeta(accion: string) {
  return ACCIONES[accion] ?? {
    label: accion,
    color: 'text-gray-500 dark:text-slate-400',
    bg: 'bg-gray-50 dark:bg-white/5',
    icon: <ShieldAlert size={13} />,
  };
}

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

// ── Componente principal ──────────────────────────────────────────────────────
export function AuditLogPage() {
  const [accion, setAccion]                   = useState('');
  const [email, setEmail]                     = useState('');
  const [ip, setIp]                           = useState('');
  const [dateFrom, setDateFrom]               = useState('');
  const [dateTo, setDateTo]                   = useState('');
  const [page, setPage]                       = useState(1);
  const [expandedId, setExpandedId]           = useState<number | null>(null);

  // Reset de página al cambiar filtros
  useEffect(() => { setPage(1); }, [accion, email, ip, dateFrom, dateTo]);

  const params = new URLSearchParams();
  if (accion)    params.set('accion', accion);
  if (email)     params.set('colaboradorEmail', email);
  if (ip)        params.set('ip', ip);
  if (dateFrom)  params.set('dateFrom', dateFrom);
  if (dateTo)    params.set('dateTo', dateTo);
  params.set('page', String(page));
  params.set('limit', '50');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-log', accion, email, ip, dateFrom, dateTo, page],
    queryFn: () =>
      api.get<{ data: AuditEntry[]; total: number; pages: number; page: number }>(
        `/manager/audit-log?${params.toString()}`,
      ).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['audit-log-stats'],
    queryFn: () => api.get<AuditStats>('/manager/audit-log/stats').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const clearFilters = () => {
    setAccion(''); setEmail(''); setIp(''); setDateFrom(''); setDateTo('');
  };
  const hasFilters = !!(accion || email || ip || dateFrom || dateTo);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert size={24} className="text-brand-purple" />
            Monitor de Seguridad
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Registro de eventos de autenticación, acceso a datos y cambios críticos
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={cn(isFetching && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {/* Stats rápidas */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Eventos hoy"
            value={stats.totalHoy}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-50 dark:bg-blue-500/10"
          />
          <StatCard
            label="Logins fallidos (última hora)"
            value={stats.fallosUltimaHora}
            color={stats.fallosUltimaHora > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
            bg={stats.fallosUltimaHora > 0 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-green-50 dark:bg-green-500/10'}
          />
          <StatCard
            label="Cuentas bloqueadas ahora"
            value={stats.cuentasBloqueadas}
            color={stats.cuentasBloqueadas > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-600 dark:text-green-400'}
            bg={stats.cuentasBloqueadas > 0 ? 'bg-red-100 dark:bg-red-500/20' : 'bg-green-50 dark:bg-green-500/10'}
          />
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/8 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Acción */}
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
              Acción
            </label>
            <select
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
            >
              <option value="">Todas las acciones</option>
              {Object.entries(ACCIONES).map(([key, v]) => (
                <option key={key} value={key}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Email */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
              Email colaborador
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="nombre@edatia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
              />
            </div>
          </div>

          {/* IP */}
          <div className="flex-1 min-w-[130px]">
            <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
              IP
            </label>
            <input
              type="text"
              placeholder="192.168.x.x"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
            />
          </div>

          {/* Fecha desde */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
            />
          </div>

          {/* Limpiar */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-gray-200 dark:border-white/10 transition-colors"
            >
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/8 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {isLoading ? 'Cargando...' : `${data?.total ?? 0} eventos encontrados`}
          </span>
          <span className="text-xs text-gray-400 dark:text-slate-500">
            Auto-actualiza cada 30s
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 dark:text-slate-500 text-sm">
            <RefreshCw size={16} className="animate-spin mr-2" /> Cargando eventos...
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500">
            <ShieldAlert size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No hay eventos con los filtros aplicados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Fecha / Hora</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                  <th className="px-4 py-3 text-left">Colaborador</th>
                  <th className="px-4 py-3 text-left">IP</th>
                  <th className="px-4 py-3 text-left">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {data?.data.map((entry) => {
                  const meta = accionMeta(entry.accion);
                  const isExpanded = expandedId === entry.id;
                  const isCritical = ['LOGIN_FAIL', 'CUENTA_BLOQUEADA', 'TOKEN_REFRESH_FAIL'].includes(entry.accion);

                  return (
                    <>
                      <tr
                        key={entry.id}
                        className={cn(
                          'transition-colors',
                          isCritical
                            ? 'bg-red-50/40 dark:bg-red-500/5 hover:bg-red-50 dark:hover:bg-red-500/10'
                            : 'hover:bg-gray-50 dark:hover:bg-white/3',
                          isExpanded && 'bg-gray-50 dark:bg-white/5',
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                          {formatFecha(entry.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', meta.bg, meta.color)}>
                            {meta.icon}
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-slate-300 text-xs">
                          {entry.colaboradorEmail ?? <span className="text-gray-300 dark:text-slate-600 italic">desconocido</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">
                          {entry.ip ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {entry.detalles ? (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className="text-xs text-brand-blue hover:underline"
                            >
                              {isExpanded ? 'Ocultar' : 'Ver detalles'}
                            </button>
                          ) : (
                            <span className="text-gray-300 dark:text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Fila expandida con detalles JSON */}
                      {isExpanded && entry.detalles && (
                        <tr key={`${entry.id}-detail`} className="bg-gray-50 dark:bg-white/3">
                          <td colSpan={5} className="px-4 pb-3">
                            <pre className="text-xs font-mono bg-white dark:bg-navy-700 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-gray-700 dark:text-slate-300 overflow-x-auto">
                              {JSON.stringify(entry.detalles, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/5">
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Página {data.page} de {data.pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-componente: stat card ────────────────────────────────────────────────
function StatCard({ label, value, color, bg }: {
  label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-white/8 p-4', bg)}>
      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={cn('text-3xl font-bold', color)}>{value}</p>
    </div>
  );
}
