import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Code2, Search, Filter, ChevronDown, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn, formatDate } from '@/lib/utils';

interface Ticket {
  id: number; numero: string; asunto: string; estado: string; prioridad: string;
  categoria?: string; createdAt: string;
  cliente: { id: number; nombre: string };
  asesorSac?: { id: number; nombre: string } | null;
  _count?: { mensajes: number };
}

const ESTADOS_DEV = ['DESARROLLO', 'DEVUELTO', 'RESUELTO', 'CALIFICADO'];
const PRIORIDADES  = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

const ESTADO_COLOR: Record<string, string> = {
  DESARROLLO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  DEVUELTO:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  RESUELTO:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  CALIFICADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};
const PRIOR_COLOR: Record<string, string> = {
  BAJA: 'text-slate-500', MEDIA: 'text-blue-500',
  ALTA: 'text-orange-500', CRITICA: 'text-red-500',
};

export function OperacionDesarrolloPage() {
  const { colaborador } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch]      = useState('');
  const [filterEstado, setFE]    = useState('DESARROLLO');
  const [filterPrioridad, setFP] = useState('');

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['manager', 'tickets', 'desarrollo', colaborador?.id],
    queryFn:  () => api.get('/manager/tickets', {
      params: { desarrolladorId: colaborador?.id },
    }).then((r) => r.data),
  });

  const filtered = tickets.filter((t) => {
    const matchSearch    = !search || t.asunto.toLowerCase().includes(search.toLowerCase()) ||
      t.numero.includes(search) || t.cliente.nombre.toLowerCase().includes(search.toLowerCase());
    const matchEstado    = !filterEstado    || t.estado    === filterEstado;
    const matchPrioridad = !filterPrioridad || t.prioridad === filterPrioridad;
    return matchSearch && matchEstado && matchPrioridad;
  });

  const criticos = filtered.filter((t) => t.prioridad === 'CRITICA' && t.estado === 'DESARROLLO').length;

  const selectCls = 'pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-700 dark:text-slate-300 appearance-none focus:outline-none focus:border-brand-blue/60';

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Code2 size={20} className="text-purple-500" /> Desarrollo — Mis Tickets
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          {filtered.length} tickets · {criticos > 0 && <span className="text-red-500 font-medium">{criticos} crítico{criticos > 1 ? 's' : ''}</span>}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input placeholder="Buscar por asunto, número o cliente..."
            value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search size={15} />} />
        </div>
        <div className="relative">
          <select value={filterEstado} onChange={(e) => setFE(e.target.value)} className={selectCls}>
            <option value="">Todos los estados</option>
            {ESTADOS_DEV.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterPrioridad} onChange={(e) => setFP(e.target.value)} className={selectCls}>
            <option value="">Todas las prioridades</option>
            {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <AlertTriangle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">Cargando tickets...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">
            {filterEstado ? `No hay tickets en estado ${filterEstado}` : 'No tienes tickets asignados de desarrollo'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-left">
                  {['Número','Asunto','Cliente','Asesor SAC','Prioridad','Estado','Msgs','Creado',''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filtered.map((t) => (
                  <tr key={t.id} className={cn(
                    'hover:bg-gray-50 dark:hover:bg-white/2 transition-colors',
                    t.prioridad === 'CRITICA' && 'border-l-2 border-red-500',
                  )}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-slate-500">{t.numero}</td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{t.asunto}</p>
                      {t.categoria && <p className="text-xs text-gray-400 dark:text-slate-500">{t.categoria}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{t.cliente.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{t.asesorSac?.nombre ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-bold', PRIOR_COLOR[t.prioridad])}>{t.prioridad}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', ESTADO_COLOR[t.estado] ?? '')}>{t.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-slate-500 text-xs text-center">{t._count?.mensajes ?? 0}</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-slate-500 text-xs">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/tickets/${t.id}`)} title="Ver ticket"
                        className="p-1.5 rounded-lg text-gray-300 dark:text-slate-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all">
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
