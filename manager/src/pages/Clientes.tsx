import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Plus, Search, Filter, ChevronDown,
  Mail, Phone, MapPin, Package, Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn, formatCOP, formatDate, ESTADO_COLORS } from '@/lib/utils';

interface Cliente {
  id: number;
  nit: string;
  nombre: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  contacto?: string;
  tipoPersona?: string;
  tipoDocumento?: string;
  estado: string;
  createdAt: string;
  asesor?: { id: number; nombre: string; rol: string } | null;
  planBase?: { id: number; nombre: string; precioBase: number } | null;
  modulosActivos?: { id: number; activo: boolean; modulo: { id: number; nombre: string; precioAnual: number } }[];
}

const ESTADOS = ['PROSPECTO', 'ACTIVO', 'SUSPENDIDO', 'CANCELADO'];
const estadoVariant: Record<string, 'warning' | 'success' | 'danger' | 'default'> = {
  PROSPECTO: 'warning',
  ACTIVO: 'success',
  SUSPENDIDO: 'danger',
  CANCELADO: 'danger',
};

export function ClientesPage() {
  const { colaborador } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canEdit = ['ADMIN', 'COMERCIAL'].includes(colaborador?.rol ?? '');

  const [search, setSearch]           = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [expandedId, setExpandedId]   = useState<number | null>(null);

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['manager', 'clientes'],
    queryFn: () => api.get('/manager/clientes').then((r) => r.data),
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      api.patch(`/manager/clientes/${id}`, { estado }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'clientes'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const filtered = clientes.filter((c) => {
    const matchSearch =
      !search ||
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.nit.includes(search) ||
      c.ciudad?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filterEstado || c.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 size={20} className="text-brand-blue" />
            Clientes
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {clientes.length} clientes registrados
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => navigate('/clientes/nuevo')}
            title="Nuevo cliente"
            className="p-2 rounded-lg bg-gradient-brand text-white shadow-glow-brand hover:opacity-90 transition-all"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre, NIT o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>
        <div className="relative">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-700 dark:text-slate-300 appearance-none focus:outline-none focus:border-brand-blue/60 min-w-[150px]"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 pointer-events-none" />
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">Cargando clientes...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">
            {search || filterEstado ? 'Sin resultados para tu búsqueda' : 'Aún no hay clientes registrados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider hidden sm:table-cell">Identificación</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider hidden md:table-cell">Ciudad</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider hidden lg:table-cell">Módulos</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider hidden lg:table-cell">Registrado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filtered.map((c) => (
                  <>
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {c.nombre.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{c.nombre}</p>
                            {c.email && <p className="text-xs text-gray-400 dark:text-slate-500">{c.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-gray-400 dark:text-slate-400 font-mono text-xs">
                          {c.tipoDocumento ?? 'NIT'} {c.nit}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-gray-400 dark:text-slate-400 text-xs">{c.ciudad ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        {canEdit ? (
                          <select
                            value={c.estado}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateEstadoMutation.mutate({ id: c.id, estado: e.target.value })}
                            className={cn(
                              'text-xs font-medium px-2 py-1 rounded-full border focus:outline-none cursor-pointer',
                              ESTADO_COLORS[c.estado],
                            )}
                          >
                            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                          </select>
                        ) : (
                          <Badge variant={estadoVariant[c.estado] ?? 'default'}>{c.estado}</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-gray-400 dark:text-slate-400 text-xs">
                          {c.modulosActivos?.filter((m) => m.activo).length ?? 0} módulos
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell text-gray-400 dark:text-slate-500 text-xs">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        {canEdit && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/clientes/${c.id}`); }}
                            title="Editar cliente"
                            className="p-1.5 rounded-lg text-gray-300 dark:text-slate-500 hover:text-brand-blue hover:bg-brand-blue/10 transition-all"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Fila expandida */}
                    {expandedId === c.id && (
                      <tr key={`${c.id}-detail`} className="bg-gray-50 dark:bg-white/2">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            {c.email && (
                              <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                                <Mail size={13} className="shrink-0 text-gray-400 dark:text-slate-500" />
                                <span className="truncate">{c.email}</span>
                              </div>
                            )}
                            {c.telefono && (
                              <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                                <Phone size={13} className="shrink-0 text-gray-400 dark:text-slate-500" />
                                <span>{c.telefono}</span>
                              </div>
                            )}
                            {c.ciudad && (
                              <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                                <MapPin size={13} className="shrink-0 text-gray-400 dark:text-slate-500" />
                                <span>{c.ciudad}</span>
                              </div>
                            )}
                            {c.asesor && (
                              <div className="text-gray-500 dark:text-slate-400">
                                <span className="text-xs text-gray-400 dark:text-slate-500">Asesor: </span>
                                {c.asesor.nombre}
                              </div>
                            )}
                            {c.planBase && (
                              <div className="text-gray-500 dark:text-slate-400">
                                <span className="text-xs text-gray-400 dark:text-slate-500">Plan: </span>
                                {c.planBase.nombre} · {formatCOP(c.planBase.precioBase)}/mes
                              </div>
                            )}
                            {c.modulosActivos && c.modulosActivos.filter((m) => m.activo).length > 0 && (
                              <div className="col-span-2 sm:col-span-4 flex flex-wrap gap-1.5 pt-1">
                                <Package size={13} className="text-gray-400 dark:text-slate-500 shrink-0 mt-0.5" />
                                {c.modulosActivos.filter((m) => m.activo).map((m) => (
                                  <span
                                    key={m.id}
                                    className="text-xs px-2 py-0.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue"
                                  >
                                    {m.modulo.nombre}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
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
