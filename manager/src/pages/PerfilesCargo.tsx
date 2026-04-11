import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus, X, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';

interface PerfilCargo {
  id: number;
  nombre: string;
  descripcion?: string;
  permisos: string[];
  createdAt: string;
  _count?: { colaboradores: number };
}

interface PerfilForm {
  nombre: string;
  descripcion: string;
  permisoInput: string;
  permisos: string[];
}

export function PerfilesCargoPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PerfilCargo | null>(null);
  const [form, setForm] = useState<PerfilForm>({
    nombre: '', descripcion: '', permisoInput: '', permisos: [],
  });

  const { data: perfiles = [], isLoading } = useQuery<PerfilCargo[]>({
    queryKey: ['manager', 'perfiles-cargo'],
    queryFn: () => api.get('/manager/perfiles-cargo').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { nombre: string; descripcion?: string; permisos: string[] }) =>
      editing
        ? api.patch(`/manager/perfiles-cargo/${editing.id}`, data)
        : api.post('/manager/perfiles-cargo', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'perfiles-cargo'] });
      toast.success(editing ? 'Perfil actualizado' : 'Perfil creado');
      closeForm();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/manager/perfiles-cargo/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'perfiles-cargo'] });
      toast.success('Perfil eliminado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    },
  });

  function openEdit(p: PerfilCargo) {
    setEditing(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', permisoInput: '', permisos: [...p.permisos] });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm({ nombre: '', descripcion: '', permisoInput: '', permisos: [] });
  }

  function addPermiso() {
    const val = form.permisoInput.trim();
    if (val && !form.permisos.includes(val)) {
      setForm((f) => ({ ...f, permisos: [...f.permisos, val], permisoInput: '' }));
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase size={20} className="text-brand-blue" />
            Perfiles de Cargo
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Perfiles permanentes desvinculados de personas — trazabilidad continua
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditing(null); }}>
          <Plus size={15} /> Nuevo Perfil
        </Button>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Cargando perfiles...</div>
      ) : perfiles.length === 0 ? (
        <Card className="py-12 text-center">
          <Briefcase size={32} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">No hay perfiles de cargo creados</p>
          <p className="text-slate-600 text-xs mt-1">Los perfiles definen roles funcionales independientes de los colaboradores</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {perfiles.map((p) => (
            <Card key={p.id} hover>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white">{p.nombre}</h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-slate-500 hover:text-brand-blue transition-colors p-1"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar perfil "${p.nombre}"?`)) {
                        deleteMutation.mutate(p.id);
                      }
                    }}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {p.descripcion && (
                <p className="text-xs text-slate-400 mb-3">{p.descripcion}</p>
              )}

              {p.permisos.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Permisos</p>
                  <div className="flex flex-wrap gap-1">
                    {p.permisos.map((perm) => (
                      <span
                        key={perm}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo font-mono"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-600 mt-3">Creado {formatDate(p.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-navy-800 rounded-2xl border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.7)] animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="font-semibold text-white">
                {editing ? 'Editar Perfil' : 'Nuevo Perfil de Cargo'}
              </h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <Input
                label="Nombre del cargo *"
                placeholder="ej. Asesor Comercial Senior"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={2}
                  placeholder="Funciones y responsabilidades del cargo..."
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-navy-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none"
                />
              </div>

              {/* Permisos */}
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Permisos</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.permisoInput}
                    onChange={(e) => setForm((f) => ({ ...f, permisoInput: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPermiso())}
                    placeholder="ej. clientes:read"
                    className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-navy-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue/60"
                  />
                  <Button variant="secondary" size="sm" onClick={addPermiso}>
                    + Add
                  </Button>
                </div>
                {form.permisos.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.permisos.map((p) => (
                      <span
                        key={p}
                        className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo font-mono"
                      >
                        {p}
                        <button
                          onClick={() => setForm((f) => ({ ...f, permisos: f.permisos.filter((x) => x !== p) }))}
                          className="hover:text-red-400"
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <Button variant="ghost" onClick={closeForm}>Cancelar</Button>
              <Button
                loading={saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({
                    nombre: form.nombre,
                    descripcion: form.descripcion || undefined,
                    permisos: form.permisos,
                  })
                }
                disabled={!form.nombre}
              >
                {editing ? 'Guardar' : 'Crear Perfil'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
