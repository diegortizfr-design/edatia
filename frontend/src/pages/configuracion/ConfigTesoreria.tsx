import { useState, useMemo } from 'react';
import { 
  Receipt, Plus, Search, Trash2, Edit3, CheckCircle2, 
  XCircle, AlertCircle, BookOpen, Layers, Lightbulb, ArrowRight,
  Users, Building2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  getCategoriasTesoreria, 
  createCategoriaTesoreria, 
  updateCategoriaTesoreria, 
  deleteCategoriaTesoreria, 
  getCuentasGastoPUC,
  getProveedoresTesoreria,
  CategoriaGasto,
  CuentaGastoPUC,
  ProveedorTesoreria
} from '../../services/tesoreria.service';

export default function ConfigTesoreria() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoriaGasto | null>(null);

  // Queries
  const { data: categorias = [], isLoading: loadingCats } = useQuery<CategoriaGasto[]>({
    queryKey: ['categoriasTesoreria'],
    queryFn: getCategoriasTesoreria,
  });

  const { data: cuentasPUC = [], isLoading: loadingCuentas } = useQuery<CuentaGastoPUC[]>({
    queryKey: ['cuentasGastoPUC'],
    queryFn: getCuentasGastoPUC,
  });

  const { data: proveedores = [], isLoading: loadingProveedores } = useQuery<ProveedorTesoreria[]>({
    queryKey: ['proveedoresTesoreria'],
    queryFn: getProveedoresTesoreria,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCategoriaTesoreria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoriasTesoreria'] });
      toast.success('Categoría de gasto creada exitosamente');
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al crear la categoría');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCategoriaTesoreria(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoriasTesoreria'] });
      toast.success('Categoría actualizada exitosamente');
      setIsModalOpen(false);
      setEditingCategory(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al actualizar la categoría');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategoriaTesoreria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoriasTesoreria'] });
      toast.success('Categoría eliminada o desactivada correctamente');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al eliminar la categoría');
    },
  });

  // Filtered categories
  const filteredCategorias = useMemo(() => {
    return categorias.filter(c => 
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.cuentaPUC && (c.cuentaPUC.codigo.includes(searchTerm) || c.cuentaPUC.nombre.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (c.tercero && (c.tercero.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || c.tercero.numeroDocumento?.includes(searchTerm)))
    );
  }, [categorias, searchTerm]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoriaGasto) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, nombre: string) => {
    if (confirm(`¿Está seguro de eliminar o desactivar la categoría "${nombre}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Receipt size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Tesorería: Categorías de Gasto</h1>
            <p className="text-sm text-slate-500 font-medium">
              Configure clasificaciones de egreso enlazadas a un Proveedor habitual y a su cuenta PUC real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/contabilidad/tesoreria/egresos"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-2"
          >
            <span>Ir a Gastos y Egresos</span>
            <ArrowRight size={16} />
          </Link>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Tip Box: Opción A - Bolsillo de Provisiones */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5 shrink-0">
          <Lightbulb size={20} />
        </div>
        <div className="text-xs text-amber-900 leading-relaxed space-y-1">
          <span className="font-bold text-sm text-amber-950 block">Provisión Diaria para Gastos Fijos (Arriendos, Servicios, Nómina)</span>
          <p>
            Para apartar dinero diariamente sin alterar la utilidad del mes prematuramente: Cree una cuenta de caja llamada <strong className="text-amber-950">"Provisión Gastos Fijos"</strong> en <em>Configuración ➔ Cajas / Bancos</em>. Cada día realice un traslado interno desde su caja principal a esa caja de provisión. Cuando llegue el recibo o fecha de pago del arriendo/servicio, registre el <strong>Comprobante de Egreso (CE)</strong> seleccionando la categoría correspondiente y pagando desde esa caja.
          </p>
        </div>
      </div>

      {/* Search and stats bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por categoría, proveedor, NIT o cuenta PUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <Layers size={14} className="text-slate-400" />
          <span>Total Categorías: <strong>{categorias.length}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Activas: <strong>{categorias.filter(c => c.activo).length}</strong></span>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loadingCats ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Cargando categorías de gasto...
          </div>
        ) : filteredCategorias.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt size={28} />
            </div>
            <p className="text-base font-bold text-slate-700">No hay categorías de gasto registradas</p>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Cree categorías como "Arriendo Local", "Energía Eléctrica", "Internet", "Aseo y Cafetería", ancle su proveedor habitual y asócielas a sus cuentas PUC correspondientes para emitir egresos de forma automática.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition inline-flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Crear Primera Categoría</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Categoría de Gasto</th>
                  <th className="py-3.5 px-6">Tercero / Proveedor Anclado</th>
                  <th className="py-3.5 px-6">Cuenta PUC Asignada (Débito)</th>
                  <th className="py-3.5 px-6">Estado</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategorias.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-6 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        <div>
                          <span>{cat.nombre}</span>
                          {cat.descripcion && (
                            <p className="text-xs text-slate-400 font-normal mt-0.5">{cat.descripcion}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-xs">
                      {cat.tercero ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-indigo-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-800">{cat.tercero.nombre}</span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              {cat.tercero.tipoDocumento || 'NIT'}: {cat.tercero.numeroDocumento}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Sin proveedor predeterminado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs">
                      {cat.cuentaPUC ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {cat.cuentaPUC.codigo}
                          </span>
                          <span className="text-slate-600 font-sans">{cat.cuentaPUC.nombre}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-sans font-medium flex items-center gap-1 w-max">
                          <AlertCircle size={12} />
                          Sin cuenta fija
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {cat.activo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle size={12} />
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Editar categoría"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.nombre)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Eliminar o desactivar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Categoría */}
      {isModalOpen && (
        <ModalCategoria
          category={editingCategory}
          cuentasPUC={cuentasPUC}
          loadingCuentas={loadingCuentas}
          proveedores={proveedores}
          loadingProveedores={loadingProveedores}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            if (editingCategory) {
              updateMutation.mutate({ id: editingCategory.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Componente Modal para Categoría de Gasto ─────────────────────────────────

interface ModalCategoriaProps {
  category: CategoriaGasto | null;
  cuentasPUC: CuentaGastoPUC[];
  loadingCuentas: boolean;
  proveedores: ProveedorTesoreria[];
  loadingProveedores: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading: boolean;
}

function ModalCategoria({
  category,
  cuentasPUC,
  loadingCuentas,
  proveedores,
  loadingProveedores,
  onClose,
  onSave,
  isLoading,
}: ModalCategoriaProps) {
  const [nombre, setNombre] = useState(category?.nombre || '');
  const [descripcion, setDescripcion] = useState(category?.descripcion || '');
  const [terceroId, setTerceroId] = useState<number | ''>(category?.terceroId || '');
  const [cuentaPUCId, setCuentaPUCId] = useState<number | ''>(category?.cuentaPUCId || '');
  const [activo, setActivo] = useState(category ? category.activo : true);

  const [filtroTercero, setFiltroTercero] = useState('');
  const [filtroCuenta, setFiltroCuenta] = useState('');

  const proveedoresFiltrados = useMemo(() => {
    if (!filtroTercero.trim()) return proveedores;
    const term = filtroTercero.toLowerCase();
    return proveedores.filter(p =>
      p.nombre.toLowerCase().includes(term) ||
      (p.nombreComercial && p.nombreComercial.toLowerCase().includes(term)) ||
      (p.numeroDocumento && p.numeroDocumento.includes(term))
    );
  }, [proveedores, filtroTercero]);

  const cuentasFiltradas = useMemo(() => {
    if (!filtroCuenta.trim()) return cuentasPUC;
    const term = filtroCuenta.toLowerCase();
    return cuentasPUC.filter(c => c.codigo.includes(term) || c.nombre.toLowerCase().includes(term));
  }, [cuentasPUC, filtroCuenta]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre de la categoría es obligatorio');
      return;
    }

    onSave({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      terceroId: terceroId ? Number(terceroId) : undefined,
      cuentaPUCId: cuentaPUCId ? Number(cuentaPUCId) : undefined,
      activo,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Pinned Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {category ? 'Editar Categoría de Gasto' : 'Nueva Categoría de Gasto'}
              </h3>
              <p className="text-xs text-slate-500">Tesorería y clasificación contable</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="form-cat" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Arriendo Local, Energía Eléctrica, Agua, Internet, Aseo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Descripción / Detalle (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Canon de arrendamiento mensual local comercial / Bodega principal"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Tercero / Proveedor Anclado */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tercero / Proveedor Anclado (Opcional)
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                <Users size={12} /> Proveedores reales ({proveedores.length})
              </span>
            </div>

            {loadingProveedores ? (
              <p className="text-xs text-slate-400 italic">Cargando proveedores...</p>
            ) : proveedores.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <p>No se encontraron proveedores registrados.</p>
                <p>
                  Puede registrar sus proveedores en <Link to="/inventario/proveedores" className="underline font-bold text-indigo-600">Inventario ➔ Proveedores</Link> o en Terceros.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Filtrar proveedor por nombre o NIT..."
                  value={filtroTercero}
                  onChange={(e) => setFiltroTercero(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <select
                  value={terceroId}
                  onChange={(e) => setTerceroId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition bg-white"
                >
                  <option value="">— Sin tercero predeterminado (se elegirá al momento del egreso) —</option>
                  {proveedoresFiltrados.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.nombreComercial ? `(${p.nombreComercial})` : ''} — {p.tipoDocumento || 'NIT'}: {p.numeroDocumento} {p.esProveedor ? '★ Proveedor' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Al anclar un tercero, cada vez que emita un Comprobante de Egreso con esta categoría se seleccionará este proveedor y su NIT automáticamente.
                </p>
              </div>
            )}
          </div>

          {/* Cuenta PUC */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Cuenta PUC Predeterminada (Débito)
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 font-mono">
                <BookOpen size={12} /> Cuentas en PUC ({cuentasPUC.length})
              </span>
            </div>

            {loadingCuentas ? (
              <p className="text-xs text-slate-400 italic">Cargando catálogo contable PUC...</p>
            ) : cuentasPUC.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <p className="font-bold">No se encontraron cuentas contables en su catálogo PUC.</p>
                <p>
                  Puede crear sus cuentas en <Link to="/contabilidad/puc" className="underline font-bold text-indigo-600">Contabilidad ➔ PUC</Link>.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Filtrar cuentas por código o nombre..."
                  value={filtroCuenta}
                  onChange={(e) => setFiltroCuenta(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <select
                  value={cuentaPUCId}
                  onChange={(e) => setCuentaPUCId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono bg-white"
                >
                  <option value="">— Sin cuenta fija (se elegirá al momento del egreso) —</option>
                  {cuentasFiltradas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.nombre} ({c.tipo})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Al asociar esta cuenta, se seleccionará automáticamente cada vez que registre un egreso con esta categoría.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="cat-activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="cat-activo" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Categoría Activa (disponible en el registro de egresos y caja menor)
            </label>
          </div>
        </form>

        {/* Pinned Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-cat"
            disabled={isLoading}
            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm shadow-indigo-200 transition flex items-center gap-2"
          >
            {isLoading ? 'Guardando...' : category ? 'Actualizar Categoría' : 'Guardar Categoría'}
          </button>
        </div>
      </div>
    </div>
  );
}
