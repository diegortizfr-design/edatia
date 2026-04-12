import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Headphones, Plus, Search, Filter, ChevronDown,
  AlertTriangle, Clock, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';

interface Ticket {
  id: number; numero: string; asunto: string; estado: string; prioridad: string;
  categoria?: string; createdAt: string;
  cliente: { id: number; nombre: string };
  asesorSac?: { id: number; nombre: string } | null;
  _count?: { mensajes: number };
}
interface Colaborador { id: number; nombre: string; rol: string }
interface Cliente { id: number; nombre: string; nit: string }

const ESTADOS   = ['NUEVO', 'SAC', 'DESARROLLO', 'DEVUELTO', 'RESUELTO', 'CALIFICADO'];
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
const CATEGORIAS  = ['BUG', 'MEJORA', 'CONSULTA', 'CONFIGURACION'];

const ESTADO_COLOR: Record<string, string> = {
  NUEVO:      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  SAC:        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DESARROLLO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  DEVUELTO:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  RESUELTO:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  CALIFICADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};
const PRIOR_COLOR: Record<string, string> = {
  BAJA:    'text-slate-500', MEDIA:  'text-blue-500',
  ALTA:    'text-orange-500', CRITICA:'text-red-500',
};

export function OperacionSACPage() {
  const { colaborador } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch]       = useState('');
  const [filterEstado, setFE]     = useState('');
  const [filterPrioridad, setFP]  = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Form nuevo ticket
  const [form, setForm] = useState({
    clienteId: '', asunto: '', descripcion: '', prioridad: 'MEDIA', categoria: '',
  });

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['manager', 'tickets', 'sac', colaborador?.id],
    queryFn:  () => api.get('/manager/tickets', {
      params: { asesorSacId: colaborador?.id },
    }).then((r) => r.data),
  });

  const { data: todosTickets = [] } = useQuery<Ticket[]>({
    queryKey: ['manager', 'tickets', 'nuevos'],
    queryFn:  () => api.get('/manager/tickets', { params: { estado: 'NUEVO' } }).then((r) => r.data),
  });

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['manager', 'clientes'],
    queryFn:  () => api.get('/manager/clientes').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/manager/tickets', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'tickets'] });
      toast.success('Ticket creado');
      setShowCreate(false);
      setForm({ clienteId: '', asunto: '', descripcion: '', prioridad: 'MEDIA', categoria: '' });
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const tomarMutation = useMutation({
    mutationFn: (ticketId: number) =>
      api.patch(`/manager/tickets/${ticketId}/escalar-sac`, { asesorSacId: colaborador?.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'tickets'] });
      toast.success('Ticket asignado');
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const misTickets = tickets.filter((t) => {
    const matchSearch = !search || t.asunto.toLowerCase().includes(search.toLowerCase()) ||
      t.numero.includes(search) || t.cliente.nombre.toLowerCase().includes(search.toLowerCase());
    const matchEstado    = !filterEstado    || t.estado    === filterEstado;
    const matchPrioridad = !filterPrioridad || t.prioridad === filterPrioridad;
    return matchSearch && matchEstado && matchPrioridad;
  });

  const enEspera = todosTickets.filter((t) => !t.asesorSac);

  const selectCls = 'pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-700 dark:text-slate-300 appearance-none focus:outline-none focus:border-brand-blue/60';

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Headphones size={20} className="text-brand-blue" /> SAC — Mis Tickets
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {misTickets.length} tickets asignados · {enEspera.length} en espera
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} title="Nuevo ticket"
          className="p-2 rounded-lg bg-gradient-brand text-white shadow-glow-brand hover:opacity-90 transition-all">
          <Plus size={18} />
        </button>
      </div>

      {/* Tickets en espera */}
      {enEspera.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <AlertTriangle size={13} /> {enEspera.length} ticket{enEspera.length > 1 ? 's' : ''} sin asignar
          </p>
          <div className="space-y-2">
            {enEspera.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/20">
                <span className="font-mono text-xs text-gray-400 dark:text-slate-500 shrink-0">{t.numero}</span>
                <span className="flex-1 text-sm text-gray-800 dark:text-slate-200 truncate">{t.asunto}</span>
                <span className={cn('text-xs font-bold shrink-0', PRIOR_COLOR[t.prioridad])}>{t.prioridad}</span>
                <button onClick={() => tomarMutation.mutate(t.id)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-brand-blue text-white hover:opacity-90 transition-all shrink-0">
                  Tomar
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

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
        ) : misTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">No tienes tickets asignados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-left">
                  {['Número','Asunto','Cliente','Prioridad','Estado','Mensajes','Creado',''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {misTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-slate-500">{t.numero}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{t.asunto}</p>
                      {t.categoria && <p className="text-xs text-gray-400 dark:text-slate-500">{t.categoria}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{t.cliente.nombre}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-bold', PRIOR_COLOR[t.prioridad])}>{t.prioridad}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', ESTADO_COLOR[t.estado])}>{t.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-slate-500 text-xs text-center">
                      {t._count?.mensajes ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-slate-500 text-xs">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/tickets/${t.id}`)} title="Ver ticket"
                        className="p-1.5 rounded-lg text-gray-300 dark:text-slate-500 hover:text-brand-blue hover:bg-brand-blue/10 transition-all">
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

      {/* Modal crear ticket */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-navy-800 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
              <h2 className="font-semibold text-gray-900 dark:text-white">Nuevo Ticket</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5">Cliente *</label>
                <select value={form.clienteId} onChange={(e) => setForm((f) => ({ ...f, clienteId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-brand-blue/60">
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5">Asunto *</label>
                <input value={form.asunto} onChange={(e) => setForm((f) => ({ ...f, asunto: e.target.value }))}
                  placeholder="Describe el problema brevemente..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-blue/60" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5">Descripción *</label>
                <textarea value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={3} placeholder="Detalla el caso..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5">Prioridad</label>
                  <select value={form.prioridad} onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-brand-blue/60">
                    {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5">Categoría</label>
                  <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-brand-blue/60">
                    <option value="">Sin categoría</option>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-white/5">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button loading={createMutation.isPending}
                disabled={!form.clienteId || !form.asunto || !form.descripcion}
                onClick={() => createMutation.mutate({
                  clienteId: Number(form.clienteId), asunto: form.asunto,
                  descripcion: form.descripcion, prioridad: form.prioridad,
                  categoria: form.categoria || undefined,
                  asesorSacId: colaborador?.id,
                })}>
                Crear ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
