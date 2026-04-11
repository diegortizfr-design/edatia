import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, X, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn, formatDate, ROL_COLORS } from '@/lib/utils';

interface Colaborador {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  perfilCargo?: { id: number; nombre: string } | null;
}

const ROLES = ['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'];
const rolVariant: Record<string, 'info' | 'success' | 'default' | 'warning'> = {
  ADMIN: 'warning',
  COMERCIAL: 'info',
  COORDINACION: 'success',
  OPERACION: 'default',
};

interface CreateForm {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export function ColaboradoresPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>({ nombre: '', email: '', password: '', rol: 'COMERCIAL' });

  const { data: colaboradores = [], isLoading } = useQuery<Colaborador[]>({
    queryKey: ['manager', 'colaboradores'],
    queryFn: () => api.get('/manager/colaboradores').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => api.post('/manager/colaboradores', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'colaboradores'] });
      toast.success('Colaborador creado');
      setShowCreate(false);
      setForm({ nombre: '', email: '', password: '', rol: 'COMERCIAL' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/manager/colaboradores/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'colaboradores'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al cambiar estado'),
  });

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-brand-blue" />
            Colaboradores
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{colaboradores.length} miembros del equipo</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Nuevo Colaborador
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Cargando colaboradores...</div>
      ) : colaboradores.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-slate-500 text-sm">Aún no hay colaboradores registrados</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colaboradores.map((c) => (
            <Card key={c.id} hover className="relative">
              {/* Active indicator */}
              <div className={cn(
                'absolute top-3 right-3 w-2 h-2 rounded-full',
                c.activo ? 'bg-emerald-500' : 'bg-slate-600',
              )} />

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-white text-sm truncate">{c.nombre}</p>
                    {c.rol === 'ADMIN' && <Shield size={12} className="text-brand-purple shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{c.email}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide',
                  ROL_COLORS[c.rol] ?? ROL_COLORS['OPERACION'],
                )}>
                  {c.rol}
                </span>
                {c.perfilCargo && (
                  <span className="text-[10px] text-slate-500 truncate ml-2">{c.perfilCargo.nombre}</span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-600">Desde {formatDate(c.createdAt)}</span>
                <button
                  onClick={() => toggleMutation.mutate(c.id)}
                  className={cn(
                    'flex items-center gap-1 text-[10px] font-medium transition-colors',
                    c.activo ? 'text-emerald-400 hover:text-red-400' : 'text-slate-500 hover:text-emerald-400',
                  )}
                >
                  {c.activo
                    ? <><ToggleRight size={14} /> Activo</>
                    : <><ToggleLeft size={14} /> Inactivo</>}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-navy-800 rounded-2xl border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.7)] animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="font-semibold text-white">Nuevo Colaborador</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <Input
                label="Nombre completo *"
                placeholder="Juan Pérez"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
              <Input
                label="Email *"
                type="email"
                placeholder="juan@edatia.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input
                label="Contraseña *"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Rol *</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-navy-800 text-sm text-slate-300 focus:outline-none focus:border-brand-blue/60"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button
                loading={createMutation.isPending}
                onClick={() => createMutation.mutate(form)}
                disabled={!form.nombre || !form.email || !form.password}
              >
                Crear Colaborador
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
