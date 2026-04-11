import { useState, useEffect, KeyboardEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  Plus,
  X,
  ExternalLink,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  Shield,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, ROL_COLORS } from '@/lib/utils';

interface PerfilCargo {
  id: number;
  nombre: string;
  descripcion?: string;
  responsabilidades?: string;
  correoPrincipal?: string;
  subcorreos: string[];
  permisos: string[];
  documentoUrl?: string;
  createdAt: string;
}

interface Colaborador {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

interface FormState {
  nombre: string;
  descripcion: string;
  responsabilidades: string;
  correoPrincipal: string;
  subcorreos: string[];
  subcorreoInput: string;
  permisos: string[];
  permisoInput: string;
  documentoUrl: string;
}

const rolVariant: Record<string, 'info' | 'success' | 'default' | 'warning'> = {
  ADMIN: 'warning',
  COMERCIAL: 'info',
  COORDINACION: 'success',
  OPERACION: 'default',
};

export function PerfilCargoForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'nuevo';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>({
    nombre: '',
    descripcion: '',
    responsabilidades: '',
    correoPrincipal: '',
    subcorreos: [],
    subcorreoInput: '',
    permisos: [],
    permisoInput: '',
    documentoUrl: '',
  });

  // Fetch existing perfil when editing
  const { data: perfil, isLoading: loadingPerfil } = useQuery<PerfilCargo>({
    queryKey: ['manager', 'perfiles-cargo', id],
    queryFn: () => api.get(`/manager/perfiles-cargo/${id}`).then((r) => r.data),
    enabled: !isNew,
  });

  // Fetch colaboradores for this perfil
  const { data: colaboradores = [] } = useQuery<Colaborador[]>({
    queryKey: ['manager', 'colaboradores'],
    queryFn: () => api.get('/manager/colaboradores').then((r) => r.data),
    enabled: !isNew,
  });

  const perfilColaboradores = colaboradores.filter(
    (c: Colaborador & { perfilCargoId?: number }) => (c as any).perfilCargoId === Number(id),
  );

  const toggleMutation = useMutation({
    mutationFn: (colabId: number) => api.patch(`/manager/colaboradores/${colabId}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'colaboradores'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al cambiar estado'),
  });

  // Populate form from perfil data
  useEffect(() => {
    if (perfil) {
      setForm({
        nombre: perfil.nombre ?? '',
        descripcion: perfil.descripcion ?? '',
        responsabilidades: perfil.responsabilidades ?? '',
        correoPrincipal: perfil.correoPrincipal ?? '',
        subcorreos: perfil.subcorreos ?? [],
        subcorreoInput: '',
        permisos: perfil.permisos ?? [],
        permisoInput: '',
        documentoUrl: perfil.documentoUrl ?? '',
      });
    }
  }, [perfil]);

  const saveMutation = useMutation({
    mutationFn: (data: object) =>
      isNew
        ? api.post('/manager/perfiles-cargo', data)
        : api.patch(`/manager/perfiles-cargo/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'perfiles-cargo'] });
      toast.success(isNew ? 'Perfil creado' : 'Perfil actualizado');
      navigate('/perfiles-cargo');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    },
  });

  function handleSave() {
    if (!form.nombre.trim()) {
      toast.error('El nombre del perfil es requerido');
      return;
    }
    saveMutation.mutate({
      nombre: form.nombre.trim(),
      descripcion: form.descripcion || undefined,
      responsabilidades: form.responsabilidades || undefined,
      correoPrincipal: form.correoPrincipal || undefined,
      subcorreos: form.subcorreos,
      permisos: form.permisos,
      documentoUrl: form.documentoUrl || undefined,
    });
  }

  function addSubcorreo() {
    const val = form.subcorreoInput.trim();
    if (val && !form.subcorreos.includes(val)) {
      setForm((f) => ({ ...f, subcorreos: [...f.subcorreos, val], subcorreoInput: '' }));
    }
  }

  function addPermiso() {
    const val = form.permisoInput.trim();
    if (val && !form.permisos.includes(val)) {
      setForm((f) => ({ ...f, permisos: [...f.permisos, val], permisoInput: '' }));
    }
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>, add: () => void) {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  }

  if (!isNew && loadingPerfil) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-brand-blue" size={28} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-navy-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-white/5 -mx-6 px-6 py-3 mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/perfiles-cargo')}
          title="Volver a perfiles"
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Nombre del perfil de cargo..."
            className="w-full bg-transparent text-lg font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending || !form.nombre.trim()}
          title="Guardar perfil"
          className="p-2 rounded-lg bg-gradient-brand text-white shadow-glow-brand hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        </button>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — main info (3/5) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Información del Perfil */}
          <section className="rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-navy-800 p-5 shadow-sm dark:shadow-card">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Información del Perfil</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={3}
                  placeholder="Descripción general del cargo..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5">
                  Responsabilidades
                </label>
                <textarea
                  value={form.responsabilidades}
                  onChange={(e) => setForm((f) => ({ ...f, responsabilidades: e.target.value }))}
                  rows={5}
                  placeholder="Lista de responsabilidades del cargo..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none"
                />
              </div>
            </div>
          </section>

          {/* Correos Corporativos */}
          <section className="rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-navy-800 p-5 shadow-sm dark:shadow-card">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Correos Corporativos</h2>
            <div className="space-y-4">
              <Input
                label="Correo principal"
                type="email"
                placeholder="ej. comercial@edatia.com"
                value={form.correoPrincipal}
                onChange={(e) => setForm((f) => ({ ...f, correoPrincipal: e.target.value }))}
              />

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5">
                  Subcorreos
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={form.subcorreoInput}
                    onChange={(e) => setForm((f) => ({ ...f, subcorreoInput: e.target.value }))}
                    onKeyDown={(e) => handleTagKeyDown(e, addSubcorreo)}
                    placeholder="comercial1@edatia.com — Enter para agregar"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60"
                  />
                  <button
                    onClick={addSubcorreo}
                    title="Agregar subcorreo"
                    className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-navy-600 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-navy-500 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {form.subcorreos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.subcorreos.map((email) => (
                      <span
                        key={email}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-navy-700 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300"
                      >
                        {email}
                        <button
                          onClick={() => setForm((f) => ({ ...f, subcorreos: f.subcorreos.filter((x) => x !== email) }))}
                          title="Quitar subcorreo"
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Documentación del Área */}
          <section className="rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-navy-800 p-5 shadow-sm dark:shadow-card">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Documentación del Área</h2>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="URL o ruta del documento"
                  placeholder="https://drive.google.com/... o /docs/comercial.pdf"
                  value={form.documentoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, documentoUrl: e.target.value }))}
                />
              </div>
              {form.documentoUrl && (
                <a
                  href={form.documentoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir documento"
                  className="p-2.5 rounded-lg border border-gray-300 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:text-brand-blue hover:border-brand-blue/40 transition-all mb-0.5"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </section>
        </div>

        {/* Right — permisos + colaboradores (2/5) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Permisos */}
          <section className="rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-navy-800 p-5 shadow-sm dark:shadow-card">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Permisos</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.permisoInput}
                onChange={(e) => setForm((f) => ({ ...f, permisoInput: e.target.value }))}
                onKeyDown={(e) => handleTagKeyDown(e, addPermiso)}
                placeholder="ej. clientes:read — Enter"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 font-mono"
              />
              <button
                onClick={addPermiso}
                title="Agregar permiso"
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-navy-600 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-navy-500 transition-colors"
              >
                <Plus size={15} />
              </button>
            </div>
            {form.permisos.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {form.permisos.map((perm) => (
                  <span
                    key={perm}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-brand-indigo/10 border border-indigo-200 dark:border-brand-indigo/20 text-indigo-700 dark:text-brand-indigo font-mono"
                  >
                    {perm}
                    <button
                      onClick={() => setForm((f) => ({ ...f, permisos: f.permisos.filter((x) => x !== perm) }))}
                      title="Quitar permiso"
                      className="text-indigo-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-300 dark:text-slate-600 mt-3">Sin permisos asignados</p>
            )}
          </section>

          {/* Colaboradores del Perfil */}
          <section className="rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-navy-800 p-5 shadow-sm dark:shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Colaboradores</h2>
              {!isNew && (
                <button
                  onClick={() => navigate(`/perfiles-cargo/${id}/colaboradores/nuevo`)}
                  title="Agregar colaborador"
                  className="p-1.5 rounded-lg text-gray-400 dark:text-slate-400 hover:text-brand-blue hover:bg-blue-50 dark:hover:bg-brand-blue/10 transition-all"
                >
                  <UserPlus size={16} />
                </button>
              )}
            </div>

            {isNew ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">
                Guarda el perfil primero para agregar colaboradores
              </p>
            ) : perfilColaboradores.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">
                Sin colaboradores asignados aún
              </p>
            ) : (
              <div className="space-y-2">
                {perfilColaboradores.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-navy-700/50 border border-gray-100 dark:border-white/5"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {c.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{c.nombre}</p>
                        {c.rol === 'ADMIN' && <Shield size={10} className="text-brand-purple shrink-0" />}
                      </div>
                      <Badge variant={rolVariant[c.rol] ?? 'default'} className="text-[10px] mt-0.5">
                        {c.rol}
                      </Badge>
                    </div>
                    <button
                      onClick={() => toggleMutation.mutate(c.id)}
                      title={c.activo ? 'Desactivar' : 'Activar'}
                      className={cn(
                        'shrink-0 transition-colors',
                        c.activo
                          ? 'text-emerald-500 hover:text-red-400'
                          : 'text-gray-300 dark:text-slate-600 hover:text-emerald-500',
                      )}
                    >
                      {c.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Bottom save button on mobile */}
      <div className="mt-6 flex justify-end lg:hidden">
        <Button
          onClick={handleSave}
          loading={saveMutation.isPending}
          disabled={!form.nombre.trim()}
          size="lg"
        >
          <Check size={16} />
          {isNew ? 'Crear Perfil' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}
