import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  X,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
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
  estado: string;
  createdAt: string;
  asesor?: { id: number; nombre: string; rol: string } | null;
  planBase?: { id: number; nombre: string; precioBase: number } | null;
  modulosActivos?: { id: number; activo: boolean; modulo: { id: number; nombre: string; precioAnual: number } }[];
}

interface CreateForm {
  nit: string;
  nombre: string;
  email: string;
  telefono: string;
  ciudad: string;
  contacto: string;
  estado: string;
  observaciones: string;
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
  const qc = useQueryClient();
  const canEdit = ['ADMIN', 'COMERCIAL'].includes(colaborador?.rol ?? '');

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const [form, setForm] = useState<CreateForm>({
    nit: '', nombre: '', email: '', telefono: '',
    ciudad: '', contacto: '', estado: 'PROSPECTO', observaciones: '',
  });

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['manager', 'clientes'],
    queryFn: () => api.get('/manager/clientes').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CreateForm>) => api.post('/manager/clientes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'clientes'] });
      toast.success('Cliente creado exitosamente');
      setShowCreate(false);
      setForm({ nit: '', nombre: '', email: '', telefono: '', ciudad: '', contacto: '', estado: 'PROSPECTO', observaciones: '' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al crear cliente';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 size={20} className="text-brand-blue" />
            Clientes
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {clientes.length} clientes registrados
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Nuevo Cliente
          </Button>
        )}
      </div>

      {/* Filters */}
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
            className="pl-9 pr-8 py-2.5 rounded-lg border border-white/10 bg-navy-800 text-sm text-slate-300 appearance-none focus:outline-none focus:border-brand-blue/60 min-w-[150px]"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Cargando clientes...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {search || filterEstado ? 'Sin resultados para tu búsqueda' : 'Aún no hay clientes registrados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">NIT</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Ciudad</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Módulos</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Creado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-white/2 transition-colors cursor-pointer"
                    onClick={() => setSelectedCliente(c)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {c.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{c.nombre}</p>
                          {c.email && (
                            <p className="text-xs text-slate-500">{c.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-slate-400 font-mono text-xs">{c.nit}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-400 text-xs">{c.ciudad ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={estadoVariant[c.estado] ?? 'default'}>
                        {c.estado}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-slate-400 text-xs">
                        {c.modulosActivos?.filter((m) => m.activo).length ?? 0} módulos
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500 text-xs">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedCliente(c); }}
                        className="text-slate-500 hover:text-brand-blue transition-colors text-xs"
                      >
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-navy-800 rounded-2xl border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.7)] animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="font-semibold text-white">Nuevo Cliente</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="NIT *"
                  placeholder="900123456-7"
                  value={form.nit}
                  onChange={(e) => setForm((f) => ({ ...f, nit: e.target.value }))}
                />
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-navy-800 text-sm text-slate-300 focus:outline-none focus:border-brand-blue/60"
                  >
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <Input
                label="Nombre de la empresa *"
                placeholder="Distribuidora XYZ SAS"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email"
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                <Input
                  label="Teléfono"
                  placeholder="+57 300 000 0000"
                  value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ciudad"
                  placeholder="Bogotá"
                  value={form.ciudad}
                  onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
                />
                <Input
                  label="Contacto principal"
                  placeholder="Nombre del contacto"
                  value={form.contacto}
                  onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                  rows={2}
                  placeholder="Notas sobre el prospecto..."
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-navy-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button
                loading={createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    nit: form.nit,
                    nombre: form.nombre,
                    email: form.email || undefined,
                    telefono: form.telefono || undefined,
                    ciudad: form.ciudad || undefined,
                    contacto: form.contacto || undefined,
                    estado: form.estado,
                    observaciones: form.observaciones || undefined,
                  })
                }
                disabled={!form.nit || !form.nombre}
              >
                Crear Cliente
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-navy-800 rounded-2xl border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.7)] animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold">
                  {selectedCliente.nombre.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold text-white">{selectedCliente.nombre}</h2>
                  <p className="text-xs text-slate-500">{selectedCliente.nit}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCliente(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Estado */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Estado:</span>
                {canEdit ? (
                  <select
                    value={selectedCliente.estado}
                    onChange={(e) => {
                      updateEstadoMutation.mutate({ id: selectedCliente.id, estado: e.target.value });
                      setSelectedCliente({ ...selectedCliente, estado: e.target.value });
                    }}
                    className={cn(
                      'text-xs font-medium px-2 py-1 rounded-full border focus:outline-none cursor-pointer',
                      ESTADO_COLORS[selectedCliente.estado],
                    )}
                  >
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                ) : (
                  <Badge variant={estadoVariant[selectedCliente.estado] ?? 'default'}>
                    {selectedCliente.estado}
                  </Badge>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedCliente.email && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">{selectedCliente.email}</span>
                  </div>
                )}
                {selectedCliente.telefono && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={13} className="text-slate-500 shrink-0" />
                    <span>{selectedCliente.telefono}</span>
                  </div>
                )}
                {selectedCliente.ciudad && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={13} className="text-slate-500 shrink-0" />
                    <span>{selectedCliente.ciudad}</span>
                  </div>
                )}
                {selectedCliente.contacto && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <User size={13} className="text-slate-500 shrink-0" />
                    <span>{selectedCliente.contacto}</span>
                  </div>
                )}
              </div>

              {/* Módulos */}
              {selectedCliente.modulosActivos && selectedCliente.modulosActivos.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                    <Package size={12} /> Módulos activos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCliente.modulosActivos
                      .filter((m) => m.activo)
                      .map((m) => (
                        <span
                          key={m.id}
                          className="text-xs px-2 py-0.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue"
                        >
                          {m.modulo.nombre}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Plan base */}
              {selectedCliente.planBase && (
                <div className="rounded-lg bg-navy-700/50 border border-white/5 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Plan base</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{selectedCliente.planBase.nombre}</p>
                    <p className="text-xs text-slate-500">{formatCOP(selectedCliente.planBase.precioBase)}/mes</p>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-600">
                Registrado {formatDate(selectedCliente.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
