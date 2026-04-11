import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, X, Pencil, Users, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { formatCOP, formatDate } from '@/lib/utils';

interface PlanBase {
  id: number;
  nombre: string;
  descripcion?: string;
  precioBase: number;
  limiteUsuarios?: number;
  activo: boolean;
  createdAt: string;
}

interface PlanForm {
  nombre: string;
  descripcion: string;
  precioBase: string;
  limiteUsuarios: string;
}

export function PlanesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PlanBase | null>(null);
  const [form, setForm] = useState<PlanForm>({ nombre: '', descripcion: '', precioBase: '', limiteUsuarios: '5' });

  const { data: planes = [], isLoading } = useQuery<PlanBase[]>({
    queryKey: ['manager', 'planes-base'],
    queryFn: () => api.get('/manager/planes-base').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { nombre: string; descripcion?: string; precioBase: number; limiteUsuarios?: number }) =>
      editing
        ? api.patch(`/manager/planes-base/${editing.id}`, data)
        : api.post('/manager/planes-base', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'planes-base'] });
      toast.success(editing ? 'Plan actualizado' : 'Plan creado');
      closeForm();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    },
  });

  function openEdit(p: PlanBase) {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precioBase: String(p.precioBase),
      limiteUsuarios: p.limiteUsuarios ? String(p.limiteUsuarios) : '5',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm({ nombre: '', descripcion: '', precioBase: '', limiteUsuarios: '5' });
  }

  // Gradient tiers for plan cards
  const planGradients = [
    'from-slate-500/10 border-slate-500/20',
    'from-brand-blue/10 border-brand-blue/20',
    'from-brand-purple/10 border-brand-purple/20',
    'from-amber-500/10 border-amber-500/20',
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard size={20} className="text-brand-blue" />
            Planes Base
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Planes de suscripción base para los clientes</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); }}
          title="Nuevo plan"
          className="p-2 rounded-lg bg-gradient-brand text-white shadow-glow-brand hover:opacity-90 transition-all"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-sm">Cargando planes...</div>
      ) : planes.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-gray-400 dark:text-slate-500 text-sm">No hay planes configurados</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {planes.map((p, i) => (
            <Card
              key={p.id}
              hover
              className={`bg-gradient-to-br ${planGradients[i % planGradients.length]} border`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                  <CreditCard size={18} className="text-brand-blue" />
                </div>
                <button
                  onClick={() => openEdit(p)}
                  title="Editar plan"
                  className="text-gray-400 dark:text-slate-500 hover:text-brand-blue transition-colors p-1"
                >
                  <Pencil size={13} />
                </button>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{p.nombre}</h3>
              {p.descripcion && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">{p.descripcion}</p>
              )}

              <div className="space-y-2 mt-4">
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Precio mensual</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCOP(p.precioBase)}</p>
                </div>

                {p.limiteUsuarios && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                    <Users size={12} />
                    <span>Hasta {p.limiteUsuarios} usuarios</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-gray-300 dark:text-slate-600 mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                Creado {formatDate(p.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-navy-800 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-[0_32px_80px_rgba(0,0,0,0.7)] animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {editing ? 'Editar Plan' : 'Nuevo Plan Base'}
              </h2>
              <button
                onClick={closeForm}
                title="Cerrar"
                className="text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <Input
                label="Nombre del plan *"
                placeholder="ej. Básico, Estándar, Premium"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={2}
                  placeholder="Describe qué incluye este plan..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none"
                />
              </div>
              <Input
                label="Precio mensual (COP) *"
                type="number"
                placeholder="800000"
                value={form.precioBase}
                onChange={(e) => setForm((f) => ({ ...f, precioBase: e.target.value }))}
              />
              <Input
                label="Límite de usuarios"
                type="number"
                placeholder="5"
                value={form.limiteUsuarios}
                onChange={(e) => setForm((f) => ({ ...f, limiteUsuarios: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-white/5">
              <Button variant="ghost" onClick={closeForm}>Cancelar</Button>
              <Button
                loading={saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({
                    nombre: form.nombre,
                    descripcion: form.descripcion || undefined,
                    precioBase: Number(form.precioBase),
                    limiteUsuarios: form.limiteUsuarios ? Number(form.limiteUsuarios) : undefined,
                  })
                }
                disabled={!form.nombre || !form.precioBase}
              >
                {!saveMutation.isPending && <Check size={15} />}
                {editing ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
