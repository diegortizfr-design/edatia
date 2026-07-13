import { useState, useEffect } from 'react'
import { Shield, Plus, Search, Trash2, Edit3, CheckCircle2, ShieldCheck, Check, RefreshCw } from 'lucide-react'
import { getRoles, createRol, updateRol, deleteRol } from '../../services/erp.service'

interface RolConfig {
  id: string | number;
  nombre: string; // ej. Administrador, Facturador
  descripcion: string;
  permisos: string[]; // ['prod_crear', 'fact_anular', 'cont_cerrar', ...]
}

const PERMISSION_GROUPS = [
  {
    label: 'Inventarios',
    items: [
      { id: 'inv_ver', label: 'Ver Productos y Stock' },
      { id: 'inv_crear', label: 'Crear Productos y Bodegas' },
      { id: 'inv_editar', label: 'Editar Datos de Productos' },
      { id: 'inv_eliminar', label: 'Eliminar Productos del Inventario' }
    ]
  },
  {
    label: 'Ventas y Facturación',
    items: [
      { id: 'vnt_ver', label: 'Ver Clientes e Historial de Facturas' },
      { id: 'vnt_crear', label: 'Crear Clientes, Cotizaciones y Facturas' },
      { id: 'vnt_anular', label: 'Anular/Cancelar Facturas Emitidas' }
    ]
  },
  {
    label: 'Contabilidad y Finanzas',
    items: [
      { id: 'cnt_puc', label: 'Gestionar Plan de Cuentas (PUC)' },
      { id: 'cnt_cerrar', label: 'Efectuar Cierre de Periodos Contables' }
    ]
  },
  {
    label: 'Seguridad y Logs',
    items: [
      { id: 'seg_auditoria', label: 'Ver Logs de Auditoría General' },
      { id: 'seg_usuarios', label: 'Administrar Usuarios y Roles' }
    ]
  }
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 font-sans">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

export function Roles() {
  const [data, setData] = useState<RolConfig[]>([])
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados del Formulario
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [form, setForm] = useState<Partial<RolConfig>>({})

  const fetchRolesList = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getRoles()
      const mapped = (res || []).map((item: any) => ({
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        permisos: Array.isArray(item.permisos) ? item.permisos : [],
      }))
      setData(mapped)
    } catch (e: any) {
      console.error(e)
      setError('Fallo al obtener los roles desde el servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRolesList()
  }, [])

  const handleOpenNew = () => {
    setEditingId(null)
    setForm({
      nombre: '',
      descripcion: '',
      permisos: []
    })
    setViewMode('form')
  }

  const handleOpenEdit = (item: RolConfig) => {
    setEditingId(item.id)
    setForm({ ...item })
    setViewMode('form')
  }

  const handleDelete = async (id: string | number) => {
    if (window.confirm('¿Está seguro de eliminar este Rol?')) {
      try {
        await deleteRol(Number(id))
        fetchRolesList()
      } catch (err: any) {
        console.error(err)
        alert(err.response?.data?.message || 'Error al eliminar el rol.')
      }
    }
  }

  const togglePermission = (permId: string) => {
    const current = form.permisos || []
    if (current.includes(permId)) {
      setForm(f => ({ ...f, permisos: current.filter(x => x !== permId) }))
    } else {
      setForm(f => ({ ...f, permisos: [...current, permId] }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.descripcion) {
      return alert('El nombre del rol y la descripción son obligatorios.')
    }

    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        permisos: form.permisos || []
      }

      if (editingId) {
        await updateRol(Number(editingId), payload)
      } else {
        await createRol(payload)
      }

      fetchRolesList()
      setViewMode('list')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Error al guardar el rol.')
    }
  }

  const filteredItems = data.filter(r => 
    r.nombre.toLowerCase().includes(search.toLowerCase()) || 
    r.descripcion.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full space-y-6">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Seguridad</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">Roles</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Shield size={24} className="text-indigo-600" />
                Roles y Permisos
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Define las plantillas de roles y los alcances operacionales que se le asignarán a los usuarios.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchRolesList}
                className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all border border-slate-200"
                title="Refrescar roles"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Plus size={16} />
                Crear Rol
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar rol por nombre..."
                className="w-full pl-9 pr-3.5 py-2.0 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Listado */}
          {isLoading ? (
            <div className="text-center p-8 text-slate-500 font-medium">Cargando roles del sistema...</div>
          ) : error ? (
            <div className="text-center p-8 text-rose-500 font-semibold bg-rose-50 rounded-2xl border border-rose-100">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase border border-indigo-100">
                        <ShieldCheck size={14} />
                        {item.nombre}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar permisos"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar rol"
                          disabled={item.nombre.toLowerCase() === 'administrador' || item.nombre.toLowerCase() === 'admin'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs leading-normal">{item.descripcion}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Permisos activos:</span>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.permisos.length} de 11
                    </span>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full text-center p-8 text-slate-400 italic">No se encontraron roles.</div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Form Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Seguridad</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Roles</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{editingId ? 'Editar' : 'Crear'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Shield size={24} className="text-indigo-600" />
                {editingId ? 'Editar Rol y Permisos' : 'Crear Nuevo Rol'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Ingresa el nombre del rol, su descripción e indica qué permisos detallados tiene autorizados.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Datos Generales */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <Field label="Nombre del Rol *">
                    <input
                      type="text"
                      value={form.nombre || ''}
                      onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      placeholder="Ej. Facturador POS"
                      disabled={form.nombre?.toLowerCase() === 'administrador' || form.nombre?.toLowerCase() === 'admin'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </Field>
                </div>
                <div className="md:col-span-8">
                  <Field label="Descripción de Responsabilidades *">
                    <input
                      type="text"
                      value={form.descripcion || ''}
                      onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Ej. Realiza el registro y despacho de mercancías en almacén central."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    />
                  </Field>
                </div>
              </div>

              {/* Matriz de Permisos */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Matriz de Privilegios Operacionales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {PERMISSION_GROUPS.map(group => (
                    <div key={group.label} className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-100/50 pb-1.5">{group.label}</h4>
                      <div className="space-y-2">
                        {group.items.map(item => {
                          const isChecked = (form.permisos || []).includes(item.id)
                          return (
                            <label
                              key={item.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-white text-indigo-900 border border-indigo-100 font-semibold shadow-sm'
                                  : 'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100/50'
                              }`}
                            >
                              <span className="text-xs">{item.label}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(item.id)}
                                disabled={form.nombre?.toLowerCase() === 'administrador' || form.nombre?.toLowerCase() === 'admin'}
                                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-50"
                              />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all"
                >
                  Guardar Rol
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
