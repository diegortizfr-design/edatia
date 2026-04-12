import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Ticket, Search, Filter, ChevronDown, AlertTriangle,
  ExternalLink, UserCheck, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getApiError } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn, formatDate } from '@/lib/utils';

interface TicketItem {
  id: number; numero: string; asunto: string; estado: string; prioridad: string;
  categoria?: string; createdAt: string; origen: string;
  cliente: { id: number; nombre: string };
  asesorSac?: { id: number; nombre: string } | null;
  desarrollador?: { id: number; nombre: string } | null;
  _count?: { mensajes: number };
}
interface Colaborador { id: number; nombre: string; rol: string }

const ESTADOS   = ['NUEVO','SAC','DESARROLLO','DEVUELTO','RESUELTO','CALIFICADO'];
const PRIORIDADES = ['BAJA','MEDIA','ALTA','CRITICA'];

const ESTADO_COLOR: Record<string, string> = {
  NUEVO:      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  SAC:        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DESARROLLO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  DEVUELTO:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  RESUELTO:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  CALIFICADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};
const PRIOR_COLOR: Record<string, string> = {
  BAJA: 'text-slate-500', MEDIA: 'text-blue-500',
  ALTA: 'text-orange-500', CRITICA: 'text-red-500',
};

export function CoordinacionTicketsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch]         = useState('');
  const [filterEstado, setFE]       = useState('');
  const [filterPrioridad, setFP]    = useState('');
  const [reasignando, setReasignando] = useState<number | null>(null);
  const [nuevoAsesor, setNuevoAsesor] = useState('');

  const { data: tickets = [], isLoading } = useQuery<TicketItem[]>({
    queryKey: ['manager', 'tickets', 'all'],
    queryFn:  () => api.get('/manager/tickets').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: colaboradores = [] } = useQuery<Colaborador[]>({
    queryKey: ['manager', 'colaboradores'],
    queryFn:  () => api.get('/manager/colaboradores').then((r) => r.data),
  });

  const reasignarMutation = useMutation({
    mutationFn: ({ ticketId, asesorSacId }: { ticketId: number; asesorSacId: number }) =>
      api.patch(`/manager/tickets/${ticketId}/escalar-sac`, { asesorSacId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'tickets'] });
      toast.success('Ticket reasignado');
      setReasignando(null);
      setNuevoAsesor('');
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const filtered = tickets.filter((t) => {
    const matchSearch    = !search || t.asunto.toLowerCase().includes(search.toLowerCase()) ||
      t.numero.includes(search) || t.cliente.nombre.toLowerCase().includes(search.toLowerCase());
    const matchEstado    = !filterEstado    || t.estado    === filterEstado;
    const matchPrioridad = !filterPrioridad || t.prioridad === filterPrioridad;
    return matchSearch && matchEstado && matchPrioridad;
  });

  const asesoresSAC = colaboradores.filter((c) => ['OPERACION','ADMIN','COORDINACION'].includes(c.rol));

  const selectCls = 'pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-700 dark:text-slate-300 appearance-none focus:outline-none focus:border-brand-blue/60';

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Ticket size={20} className="text-brand-blue" /> Todos los Tickets
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {filtered.length} tickets · Vista de coordinación
          </p>
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['manager', 'tickets'] })}
          title="Actualizar" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
          <RefreshCw size={16} />
        </button>
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
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
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
          <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">Sin tickets con esos filtros</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-left">
                  {['Número','Asunto','Cliente','Prioridad','Estado','Asesor SAC','Desarrollador','Msgs','Creado',''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filtered.map((t) => (
                  <>
                    <tr key={t.id} className={cn(
                      'hover:bg-gray-50 dark:hover:bg-white/2 transition-colors',
                      t.prioridad === 'CRITICA' && 'border-l-2 border-red-500',
                      !t.asesorSac && t.estado === 'NUEVO' && 'border-l-2 border-orange-400',
                    )}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">{t.numero}</td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{t.asunto}</p>
                        {t.categoria && <p className="text-xs text-gray-400 dark:text-slate-500">{t.categoria}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs whitespace-nowrap">{t.cliente.nombre}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-bold', PRIOR_COLOR[t.prioridad])}>{t.prioridad}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', ESTADO_COLOR[t.estado] ?? '')}>{t.estado}</span>
                      </td>
                      <td className="px-4 py-3">
                        {reasignando === t.id ? (
                          <div className="flex items-center gap-1">
                            <select value={nuevoAsesor} onChange={(e) => setNuevoAsesor(e.target.value)}
                              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-700 text-gray-900 dark:text-white focus:outline-none">
                              <option value="">Seleccionar...</option>
                              {asesoresSAC.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                            <button onClick={() => nuevoAsesor && reasignarMutation.mutate({ ticketId: t.id, asesorSacId: Number(nuevoAsesor) })}
                              className="text-xs px-2 py-1 rounded bg-brand-blue text-white hover:opacity-90">OK</button>
                            <button onClick={() => setReasignando(null)} className="text-xs px-1.5 py-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white">✕</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500 dark:text-slate-400">{t.asesorSac?.nombre ?? <span className="text-orange-500">Sin asignar</span>}</span>
                            <button onClick={() => { setReasignando(t.id); setNuevoAsesor(''); }} title="Reasignar"
                              className="text-gray-300 dark:text-slate-600 hover:text-brand-blue transition-colors">
                              <UserCheck size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{t.desarrollador?.nombre ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500 text-center">{t._count?.mensajes ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/tickets/${t.id}`)} title="Ver ticket"
                          className="p-1.5 rounded-lg text-gray-300 dark:text-slate-500 hover:text-brand-blue hover:bg-brand-blue/10 transition-all">
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
