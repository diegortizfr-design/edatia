import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Pencil, Trash2, FileText, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';

interface PerfilCargo {
  id: number;
  nombre: string;
  descripcion?: string;
  permisos: string[];
  documentoUrl?: string;
  createdAt: string;
  _count?: { colaboradores: number };
}

export function PerfilesCargoPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: perfiles = [], isLoading } = useQuery<PerfilCargo[]>({
    queryKey: ['manager', 'perfiles-cargo'],
    queryFn: () => api.get('/manager/perfiles-cargo').then((r) => r.data),
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

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase size={20} className="text-brand-blue" />
            Perfiles de Cargo
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Perfiles permanentes desvinculados de personas — trazabilidad continua
          </p>
        </div>
        <button
          onClick={() => navigate('/perfiles-cargo/nuevo')}
          title="Nuevo perfil de cargo"
          className="p-2 rounded-lg bg-gradient-brand text-white shadow-glow-brand hover:opacity-90 transition-all"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-sm">Cargando perfiles...</div>
      ) : perfiles.length === 0 ? (
        <Card className="py-12 text-center">
          <Briefcase size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <p className="text-gray-400 dark:text-slate-500 text-sm">No hay perfiles de cargo creados</p>
          <p className="text-gray-300 dark:text-slate-600 text-xs mt-1">
            Los perfiles definen roles funcionales independientes de los colaboradores
          </p>
          <button
            onClick={() => navigate('/perfiles-cargo/nuevo')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-brand text-white text-sm font-medium shadow-glow-brand hover:opacity-90 transition-all"
          >
            <Plus size={14} /> Crear primer perfil
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {perfiles.map((p) => (
            <Card key={p.id} hover className="group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight pr-2">{p.nombre}</h3>
                {/* Action buttons — icon only */}
                <div className="flex items-center gap-1 shrink-0">
                  {p.documentoUrl && (
                    <a
                      href={p.documentoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver documentación"
                      className="p-1.5 rounded-md text-gray-400 dark:text-slate-500 hover:text-brand-blue hover:bg-blue-50 dark:hover:bg-brand-blue/10 transition-all"
                    >
                      <FileText size={15} />
                    </a>
                  )}
                  <button
                    onClick={() => navigate(`/perfiles-cargo/${p.id}`)}
                    title="Editar perfil"
                    className="p-1.5 rounded-md text-gray-400 dark:text-slate-500 hover:text-brand-blue hover:bg-blue-50 dark:hover:bg-brand-blue/10 transition-all"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar perfil "${p.nombre}"?`)) {
                        deleteMutation.mutate(p.id);
                      }
                    }}
                    title="Eliminar perfil"
                    className="p-1.5 rounded-md text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {p.descripcion && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-2">{p.descripcion}</p>
              )}

              {/* Colaboradores count */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 mb-3">
                <Users size={13} />
                <span>
                  {p._count?.colaboradores ?? 0} colaborador{(p._count?.colaboradores ?? 0) !== 1 ? 'es' : ''}
                </span>
              </div>

              {p.permisos.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Permisos</p>
                  <div className="flex flex-wrap gap-1">
                    {p.permisos.slice(0, 4).map((perm) => (
                      <span
                        key={perm}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-brand-indigo/10 border border-indigo-200 dark:border-brand-indigo/20 text-indigo-600 dark:text-brand-indigo font-mono"
                      >
                        {perm}
                      </span>
                    ))}
                    {p.permisos.length > 4 && (
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 px-1.5 py-0.5">
                        +{p.permisos.length - 4} más
                      </span>
                    )}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-gray-300 dark:text-slate-600 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                Creado {formatDate(p.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
