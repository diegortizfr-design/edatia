import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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

const rolVariant: Record<string, 'info' | 'success' | 'default' | 'warning'> = {
  ADMIN: 'warning',
  COMERCIAL: 'info',
  COORDINACION: 'success',
  OPERACION: 'default',
};

export function ColaboradoresPage() {
  const { colaborador: currentUser } = useAuth();
  const isAdmin = currentUser?.rol === 'ADMIN';
  const qc = useQueryClient();

  const { data: colaboradores = [], isLoading } = useQuery<Colaborador[]>({
    queryKey: ['manager', 'colaboradores'],
    queryFn: () => api.get('/manager/colaboradores').then((r) => r.data),
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-brand-blue" />
            Colaboradores
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{colaboradores.length} miembros del equipo</p>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-400 dark:text-slate-500 bg-blue-50 dark:bg-brand-blue/5 border border-blue-100 dark:border-brand-blue/10 rounded-lg px-3 py-2">
        Para crear colaboradores, ve a <strong className="text-brand-blue">Perfiles de Cargo</strong> y agrega colaboradores desde allí.
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-sm">Cargando colaboradores...</div>
      ) : colaboradores.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-gray-400 dark:text-slate-500 text-sm">Aún no hay colaboradores registrados</p>
          <p className="text-gray-300 dark:text-slate-600 text-xs mt-1">Crea colaboradores desde un Perfil de Cargo</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colaboradores.map((c) => (
            <Card key={c.id} hover className="relative">
              {/* Active indicator */}
              <div className={cn(
                'absolute top-3 right-3 w-2 h-2 rounded-full',
                c.activo ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600',
              )} />

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{c.nombre}</p>
                    {c.rol === 'ADMIN' && <Shield size={12} className="text-brand-purple shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{c.email}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <Badge variant={rolVariant[c.rol] ?? 'default'}>
                  {c.rol}
                </Badge>
                {c.perfilCargo && (
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate ml-2">{c.perfilCargo.nombre}</span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 dark:text-slate-600">Desde {formatDate(c.createdAt)}</span>
                {isAdmin && (
                  <button
                    onClick={() => toggleMutation.mutate(c.id)}
                    title={c.activo ? 'Desactivar colaborador' : 'Activar colaborador'}
                    className={cn(
                      'flex items-center gap-1 text-[10px] font-medium transition-colors',
                      c.activo
                        ? 'text-emerald-600 dark:text-emerald-400 hover:text-red-500 dark:hover:text-red-400'
                        : 'text-gray-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400',
                    )}
                  >
                    {c.activo
                      ? <><ToggleRight size={14} /> Activo</>
                      : <><ToggleLeft size={14} /> Inactivo</>}
                  </button>
                )}
                {!isAdmin && (
                  <span className={cn(
                    'text-[10px] font-medium',
                    c.activo ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500',
                  )}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
