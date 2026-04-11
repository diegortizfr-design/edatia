import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, X, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatCOP, MODULO_ICONS } from '@/lib/utils';

interface Modulo {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  icono?: string;
  precioAnual: number;
  activo: boolean;
}

interface ModuloForm {
  nombre: string;
  slug: string;
  descripcion: string;
  precioAnual: string;
}

const SLUGS = ['inventario', 'ventas', 'administrativo', 'contable', 'digital'];

export function ModulosPage() {
  const { colaborador } = useAuth();
  const qc = useQueryClient();
  const isAdmin = colaborador?.rol === 'ADMIN';

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Modulo | null>(null);
  const [form, setForm] = useState<ModuloForm>({ nombre: '', slug: '', descripcion: '', precioAnual: '' });

  const { data: modulos = [], isLoading } = useQuery<Modulo[]>({
    queryKey: ['manager', 'modulos'],
    queryFn: () => api.get('/manager/modulos').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: { nombre: string; slug: string; descripcion?: string; precioAnual: number }) =>
      api.post('/manager/modulos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'modulos'] });
      toast.success('Módulo creado');
      setShowCreate(false);
      setForm({ nombre: '', slug: '', descripcion: '', precioAnual: '' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ nombre: string; descripcion: string; precioAnual: number }> }) =>
      api.patch(`/manager/modulos/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'modulos'] });
      toast.success('Módulo actualizado');
      setEditing(null);
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/manager/modulos/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'modulos'] });
    },
    onError: () => toast.error('Error'),
  });

  function openEdit(m: Modulo) {
    setEditing(m);
    setForm({
      nombre: m.nombre,
      slug: m.slug,
      descripcion: m.descripcion ?? '',
      precioAnual: String(m.precioAnual),
    });
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package size={20} className="text-brand-blue" />
            Módulos de Software
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Módulos disponibles en la plataforma Edatia</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setShowCreate(true); setEditing(null); }}>
            <Plus size={15} /> Nuevo Módulo
          </Button>
        )}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Cargando módulos...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulos.map((m) => (
            <Card
              key={m.id}
              hover
              glow={m.activo ? 'blue' : 'none'}
              className={!m.activo ? 'opacity-60' : ''}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{MODULO_ICONS[m.slug] ?? '📦'}</div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.activo ? 'success' : 'danger'}>
                    {m.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {isAdmin && (
                    <button
                      onClick={() => openEdit(m)}
                      className="text-slate-500 hover:text-brand-blue transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-white text-base mb-1">{m.nombre}</h3>
              {m.descripcion && (
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{m.descripcion}</p>
              )}

              <div className="pt-3 border-t border-white/5">
                <p className="text-xs text-slate-500 mb-0.5">Precio anual</p>
                <p className="text-lg font-bold bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
                  {formatCOP(m.precioAnual)}
                </p>
                <p className="text-xs text-slate-500">{formatCOP(Math.round(m.precioAnual / 12))}/mes</p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => toggleMutation.mutate(m.id)}
                  className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {m.activo ? 'Desactivar' : 'Activar'} módulo
                </button>
              )}
            </Card>
          ))}

          {!modulos.length && (
            <div className="col-span-3 text-center py-12 text-slate-500 text-sm">
              No hay módulos configurados
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreate || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-navy-800 rounded-2xl border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.7)] animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="font-semibold text-white">
                {editing ? 'Editar Módulo' : 'Nuevo Módulo'}
              </h2>
              <button
                onClick={() => { setShowCreate(false); setEditing(null); }}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <Input
                label="Nombre *"
                placeholder="ej. Inventario"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
              {!editing && (
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">Slug *</label>
                  <select
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-navy-800 text-sm text-slate-300 focus:outline-none focus:border-brand-blue/60"
                  >
                    <option value="">Selecciona un slug</option>
                    {SLUGS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={2}
                  placeholder="Descripción del módulo..."
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-navy-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none"
                />
              </div>
              <Input
                label="Precio anual (COP) *"
                type="number"
                placeholder="1200000"
                value={form.precioAnual}
                onChange={(e) => setForm((f) => ({ ...f, precioAnual: e.target.value }))}
              />
              {form.precioAnual && !isNaN(Number(form.precioAnual)) && (
                <p className="text-xs text-slate-500">
                  = {formatCOP(Math.round(Number(form.precioAnual) / 12))}/mes
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <Button variant="ghost" onClick={() => { setShowCreate(false); setEditing(null); }}>
                Cancelar
              </Button>
              <Button
                loading={createMutation.isPending || updateMutation.isPending}
                onClick={() => {
                  if (editing) {
                    updateMutation.mutate({
                      id: editing.id,
                      data: {
                        nombre: form.nombre,
                        descripcion: form.descripcion || undefined,
                        precioAnual: Number(form.precioAnual),
                      },
                    });
                  } else {
                    createMutation.mutate({
                      nombre: form.nombre,
                      slug: form.slug,
                      descripcion: form.descripcion || undefined,
                      precioAnual: Number(form.precioAnual),
                    });
                  }
                }}
                disabled={!form.nombre || !form.precioAnual || (!editing && !form.slug)}
              >
                {editing ? 'Guardar Cambios' : 'Crear Módulo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
