import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Send, AlertTriangle, ChevronDown,
  Clock, User, Code2, Headphones, Bot, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn, formatDate } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Mensaje {
  id: number; autor: string; autorId?: number; nombre?: string;
  contenido: string; interno: boolean; createdAt: string;
}
interface Colaborador { id: number; nombre: string }
interface Ticket {
  id: number; numero: string; asunto: string; descripcion: string;
  estado: string; prioridad: string; categoria?: string; origen: string;
  calificacion?: number; resueltoAt?: string; createdAt: string;
  cliente: { id: number; nombre: string; nit: string };
  asesorSac?: Colaborador | null;
  desarrollador?: Colaborador | null;
  mensajes: Mensaje[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ESTADO_COLOR: Record<string, string> = {
  NUEVO:       'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  SAC:         'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DESARROLLO:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  DEVUELTO:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  RESUELTO:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  CALIFICADO:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};
const PRIORIDAD_COLOR: Record<string, string> = {
  BAJA:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  MEDIA:   'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  ALTA:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  CRITICA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
const AUTOR_ICON: Record<string, React.ReactNode> = {
  CLIENTE:     <User size={14} />,
  SAC:         <Headphones size={14} />,
  DESARROLLO:  <Code2 size={14} />,
  IA:          <Bot size={14} />,
};

function MensajeItem({ msg }: { msg: Mensaje }) {
  const isInterno = msg.interno;
  return (
    <div className={cn('flex gap-3', isInterno && 'opacity-80')}>
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white',
        msg.autor === 'CLIENTE'    ? 'bg-gray-400 dark:bg-gray-600' :
        msg.autor === 'SAC'        ? 'bg-brand-blue' :
        msg.autor === 'DESARROLLO' ? 'bg-purple-500' :
        'bg-emerald-500',
      )}>
        {AUTOR_ICON[msg.autor] ?? <User size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-700 dark:text-slate-200">
            {msg.nombre ?? msg.autor}
          </span>
          {isInterno && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium">
              <Lock size={10} /> Nota interna
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">{formatDate(msg.createdAt)}</span>
        </div>
        <div className={cn(
          'text-sm rounded-xl px-4 py-3 leading-relaxed',
          isInterno
            ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 text-yellow-900 dark:text-yellow-100'
            : 'bg-gray-100 dark:bg-navy-700 text-gray-800 dark:text-slate-200',
        )}>
          {msg.contenido}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function TicketDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { colaborador } = useAuth();
  const rol = colaborador?.rol ?? '';

  const [mensaje, setMensaje]     = useState('');
  const [esInterno, setEsInterno] = useState(false);
  const [showEscalar, setShowEscalar] = useState(false);
  const [devResp, setDevResp]     = useState('');
  const [resolMsg, setResolMsg]   = useState('');

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ['manager', 'tickets', id],
    queryFn:  () => api.get(`/manager/tickets/${id}`).then((r) => r.data),
  });

  const { data: colaboradores = [] } = useQuery<Colaborador[]>({
    queryKey: ['manager', 'colaboradores'],
    queryFn:  () => api.get('/manager/colaboradores').then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['manager', 'tickets'] });

  const msgMutation = useMutation({
    mutationFn: (data: { contenido: string; interno: boolean }) =>
      api.post(`/manager/tickets/${id}/mensajes`, data),
    onSuccess: () => { invalidate(); setMensaje(''); setEsInterno(false); },
    onError: (e) => toast.error(getApiError(e)),
  });

  const escalarDevMutation = useMutation({
    mutationFn: (data: { desarrolladorId: number; nota?: string }) =>
      api.patch(`/manager/tickets/${id}/escalar-desarrollo`, data),
    onSuccess: () => { invalidate(); setShowEscalar(false); toast.success('Escalado a Desarrollo'); },
    onError: (e) => toast.error(getApiError(e)),
  });

  const devolverMutation = useMutation({
    mutationFn: (data: { respuesta: string }) =>
      api.patch(`/manager/tickets/${id}/devolver-sac`, data),
    onSuccess: () => { invalidate(); setDevResp(''); toast.success('Devuelto a SAC'); },
    onError: (e) => toast.error(getApiError(e)),
  });

  const resolverMutation = useMutation({
    mutationFn: (data: { mensaje?: string }) =>
      api.patch(`/manager/tickets/${id}/resolver`, data),
    onSuccess: () => { invalidate(); toast.success('Ticket resuelto'); },
    onError: (e) => toast.error(getApiError(e)),
  });

  if (isLoading || !ticket) {
    return <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">Cargando ticket...</div>;
  }

  const desarrolladores = colaboradores.filter((c: any) => c.rol === 'OPERACION' || c.rol === 'ADMIN');
  const canEscalar  = ['SAC', 'DEVUELTO'].includes(ticket.estado) && ['ADMIN', 'COORDINACION', 'OPERACION'].includes(rol);
  const canDevolver = ticket.estado === 'DESARROLLO' && ['ADMIN', 'COORDINACION', 'OPERACION'].includes(rol);
  const canResolver = ['SAC', 'DEVUELTO'].includes(ticket.estado) && ['ADMIN', 'COORDINACION', 'OPERACION'].includes(rol);

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-gray-400 dark:text-slate-500">{ticket.numero}</span>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', ESTADO_COLOR[ticket.estado])}>{ticket.estado}</span>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', PRIORIDAD_COLOR[ticket.prioridad])}>{ticket.prioridad}</span>
            {ticket.categoria && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-slate-300">{ticket.categoria}</span>}
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 truncate">{ticket.asunto}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna izquierda — mensajes */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4">
            {ticket.mensajes.filter((m) => !m.interno || ['ADMIN','COORDINACION','OPERACION'].includes(rol)).map((m) => (
              <MensajeItem key={m.id} msg={m} />
            ))}
            {ticket.mensajes.length === 0 && (
              <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-4">Sin mensajes aún</p>
            )}
          </Card>

          {/* Responder */}
          {!['RESUELTO','CALIFICADO'].includes(ticket.estado) && (
            <Card className="p-4 space-y-3">
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={3}
                placeholder="Escribe un mensaje..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={esInterno} onChange={(e) => setEsInterno(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-white/20" />
                  <Lock size={11} /> Nota interna (solo equipo)
                </label>
                <Button size="sm" onClick={() => mensaje.trim() && msgMutation.mutate({ contenido: mensaje, interno: esInterno })}
                  disabled={!mensaje.trim() || msgMutation.isPending}>
                  <Send size={14} /> Enviar
                </Button>
              </div>
            </Card>
          )}

          {/* Escalar a Desarrollo */}
          {canEscalar && (
            <Card className="p-4 space-y-3 border-purple-200 dark:border-purple-800/30">
              <button onClick={() => setShowEscalar(!showEscalar)}
                className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
                <Code2 size={16} /> Escalar a Desarrollo <ChevronDown size={14} className={cn('transition-transform', showEscalar && 'rotate-180')} />
              </button>
              {showEscalar && (
                <EscalarForm
                  desarrolladores={desarrolladores}
                  onSubmit={(devId, nota) => escalarDevMutation.mutate({ desarrolladorId: devId, nota })}
                  loading={escalarDevMutation.isPending}
                />
              )}
            </Card>
          )}

          {/* Devolver a SAC */}
          {canDevolver && (
            <Card className="p-4 space-y-3 border-yellow-200 dark:border-yellow-800/30">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                <Headphones size={16} /> Devolver a SAC con respuesta
              </p>
              <textarea value={devResp} onChange={(e) => setDevResp(e.target.value)} rows={3}
                placeholder="Describe la solución o aclaraciones para el asesor..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none" />
              <Button size="sm" variant="secondary" onClick={() => devResp.trim() && devolverMutation.mutate({ respuesta: devResp })}
                disabled={!devResp.trim() || devolverMutation.isPending}>
                Devolver a SAC
              </Button>
            </Card>
          )}

          {/* Resolver */}
          {canResolver && (
            <Card className="p-4 space-y-3 border-green-200 dark:border-green-800/30">
              <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                <AlertTriangle size={16} /> Marcar como resuelto
              </p>
              <textarea value={resolMsg} onChange={(e) => setResolMsg(e.target.value)} rows={2}
                placeholder="Mensaje final para el cliente (opcional)..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none" />
              <Button size="sm" onClick={() => resolverMutation.mutate({ mensaje: resolMsg || undefined })}
                disabled={resolverMutation.isPending}>
                Marcar como resuelto
              </Button>
            </Card>
          )}
        </div>

        {/* Columna derecha — info */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3 text-sm">
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Información</p>
            <div className="space-y-2">
              <Row label="Cliente"   value={ticket.cliente.nombre} />
              <Row label="NIT"       value={ticket.cliente.nit} mono />
              <Row label="Origen"    value={ticket.origen} />
              <Row label="Creado"    value={formatDate(ticket.createdAt)} />
              {ticket.resueltoAt && <Row label="Resuelto" value={formatDate(ticket.resueltoAt)} />}
              {ticket.calificacion && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Calificación</span>
                  <span className="font-medium text-yellow-500">{'★'.repeat(ticket.calificacion)}{'☆'.repeat(5 - ticket.calificacion)}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 space-y-3 text-sm">
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Asignación</p>
            <div className="space-y-2">
              <Row label="Asesor SAC"    value={ticket.asesorSac?.nombre ?? '—'} />
              <Row label="Desarrollador" value={ticket.desarrollador?.nombre ?? '—'} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className={cn('font-medium text-gray-900 dark:text-white text-right truncate', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  );
}

function EscalarForm({ desarrolladores, onSubmit, loading }: {
  desarrolladores: Colaborador[];
  onSubmit: (devId: number, nota?: string) => void;
  loading: boolean;
}) {
  const [devId, setDevId] = useState('');
  const [nota, setNota]   = useState('');
  return (
    <div className="space-y-3">
      <select value={devId} onChange={(e) => setDevId(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-brand-blue/60">
        <option value="">Seleccionar desarrollador...</option>
        {desarrolladores.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
      </select>
      <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2}
        placeholder="Nota para el desarrollador (opcional)..."
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none" />
      <Button size="sm" disabled={!devId || loading} onClick={() => onSubmit(Number(devId), nota || undefined)}>
        Escalar a Desarrollo
      </Button>
    </div>
  );
}
