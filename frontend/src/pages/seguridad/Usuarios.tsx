import { useState, useEffect } from 'react'
import { Users, Plus, Search, Trash2, Edit3, CheckCircle2, ShieldAlert, Check, X, RefreshCw } from 'lucide-react'
import { getUsuariosERP, createUsuarioERP, updateUsuarioERP, deleteUsuarioERP } from '../../services/erp.service'

interface UsuarioConfig {
  id: string | number;
  usuario: string; // ej. HECTOR, facturacion
  nombre: string;  // ej. HECTOR FABIO BOCANEGRA
  administrador: boolean;
  activo: boolean;
  modulosPermitidos: string[]; // ['inventario', 'ventas', 'contabilidad', 'digital', 'pos']
}

const MODULE_OPTIONS = [
  { id: 'inventario', label: 'Inventario (Análisis, Bodegas, Productos)' },
  { id: 'ventas', label: 'Ventas (Clientes, Cotizaciones, Facturas)' },
  { id: 'contabilidad', label: 'Contabilidad (PUC, Comprobantes, Asientos)' },
  { id: 'digital', label: 'Digital (E-commerce, Catálogo, Ajustes)' },
  { id: 'pos', label: 'Punto de Venta (POS Screen, Cierre, Config)' }
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: any) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
    />
  )
}

export function Usuarios() {
  const [data, setData] = useState<UsuarioConfig[]>([])
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados del Formulario
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [form, setForm] = useState<Partial<UsuarioConfig>>({})
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getUsuariosERP()
      const list = (res || []).map((item: any) => ({
        id: item.id,
        usuario: item.usuario,
        nombre: item.nombre || '',
        administrador: item.rol === 'admin',
        activo: item.activo !== false,
        modulosPermitidos: item.rol === 'admin' ? ['inventario', 'ventas', 'contabilidad', 'digital', 'pos'] : ['pos'],
        email: item.email || '',
      }))
      setData(list)
    } catch (e: any) {
      console.error(e)
      setError('Error al obtener los usuarios del servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpenNew = () => {
    setEditingId(null)
    setForm({
      usuario: '',
      nombre: '',
      administrador: false,
      activo: true,
      modulosPermitidos: ['pos']
    })
    setEmail('')
    setPassword('')
    setViewMode('form')
  }

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id)
    setForm({ ...item })
    setEmail(item.email || '')
    setPassword('')
    setViewMode('form')
  }

  const handleDelete = async (id: string | number) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        await deleteUsuarioERP(Number(id))
        fetchUsers()
      } catch (err: any) {
        console.error(err)
        alert(err.response?.data?.message || 'Error al eliminar el usuario.')
      }
    }
  }

  const toggleModule = (modId: string) => {
    const current = form.modulosPermitidos || []
    if (current.includes(modId)) {
      setForm(f => ({ ...f, modulosPermitidos: current.filter(x => x !== modId) }))
    } else {
      setForm(f => ({ ...f, modulosPermitidos: [...current, modId] }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.usuario || !form.nombre || !email) {
      return alert('El usuario, nombre completo y correo son obligatorios.')
    }
    if (!editingId && !password) {
      return alert('La contraseña es obligatoria para usuarios nuevos.')
    }

    try {
      const payload: any = {
        usuario: form.usuario,
        nombre: form.nombre,
        email,
        activo: form.activo !== false,
        rol: form.administrador ? 'admin' : 'user'
      }
      if (password) {
        payload.password = password
      }

      if (editingId) {
        await updateUsuarioERP(Number(editingId), payload)
      } else {
        await createUsuarioERP(payload)
      }

      fetchUsers()
      setViewMode('list')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Error al guardar el usuario.')
    }
  }

  const filteredItems = data.filter(u => 
    u.usuario.toLowerCase().includes(search.toLowerCase()) || 
    u.nombre.toLowerCase().includes(search.toLowerCase())
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
                <span className="text-slate-600 font-medium">Usuarios</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Users size={24} className="text-indigo-600" />
                Usuarios del Sistema
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Catálogo de personas autorizadas con acceso al ERP y asignación de roles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchUsers}
                className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all border border-slate-200"
                title="Refrescar usuarios"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition-all shadow-md shadow-indigo-100"
              >
                <Plus size={14} strokeWidth={3} />
                Nuevo Usuario
              </button>
            </div>
          </div>

          {/* Filtro de Búsqueda */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por usuario o nombre..."
                className="w-full pl-9 pr-3.5 py-2.0 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all focus:bg-white"
              />
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario / Login</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Estado</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Tipo Cuenta</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Accesos Permitidos</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                        Cargando usuarios del sistema...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-rose-500 font-semibold bg-rose-50/50">
                        {error}
                      </td>
                    </tr>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/25 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-700">{item.usuario}</td>
                        <td className="p-4 font-medium text-slate-800">{item.nombre}</td>
                        <td className="p-4 text-slate-600">{(item as any).email || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.activo 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {item.activo ? <CheckCircle2 size={12} /> : <X size={12} />}
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                            item.administrador 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}>
                            {item.administrador ? 'Administrador' : 'Operador'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {item.modulosPermitidos.map(m => (
                              <span key={m} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-semibold">
                                {m}
                              </span>
                            ))}
                            {item.modulosPermitidos.length === 0 && (
                              <span className="text-slate-300 italic text-xs">Sin accesos</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"
                              title="Editar usuario"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded-lg transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        No se encontraron usuarios que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Form Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Seguridad</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Usuarios</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{editingId ? 'Editar' : 'Crear'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <ShieldAlert size={24} className="text-indigo-600" />
                {editingId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Ingresa los datos generales del usuario y define el alcance de su rol.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Bloque 1: Datos Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <Field label="Usuario (Login) *">
                    <input
                      type="text"
                      value={form.usuario || ''}
                      onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
                      placeholder="Ej. HECTOR"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-mono font-bold"
                    />
                  </Field>
                </div>
                <div className="md:col-span-8">
                  <Field label="Nombre Completo *">
                    <Input
                      value={form.nombre}
                      onChange={(v: string) => setForm(f => ({ ...f, nombre: v }))}
                      placeholder="Ej. Hector Fabio Bocanegra"
                    />
                  </Field>
                </div>
                <div className="md:col-span-6">
                  <Field label="Correo Electrónico *">
                    <Input
                      value={email}
                      onChange={setEmail}
                      placeholder="ejemplo@edatia.com"
                      type="email"
                    />
                  </Field>
                </div>
                <div className="md:col-span-6">
                  <Field label={editingId ? "Nueva Contraseña (Dejar en blanco para conservar)" : "Contraseña *"}>
                    <Input
                      value={password}
                      onChange={setPassword}
                      placeholder="Mínimo 8 caracteres"
                      type="password"
                    />
                  </Field>
                </div>
              </div>

              {/* Bloque 2: Atributos y Permisos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                {/* Opciones de Perfil */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Estados y Roles</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 cursor-pointer hover:bg-slate-100/50 transition-all">
                      <input
                        type="checkbox"
                        checked={form.administrador || false}
                        onChange={e => setForm(f => ({ ...f, administrador: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div className="leading-tight">
                        <p className="text-sm font-bold text-slate-700">Administrador</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Control absoluto</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 cursor-pointer hover:bg-slate-100/50 transition-all">
                      <input
                        type="checkbox"
                        checked={form.activo || false}
                        onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div className="leading-tight">
                        <p className="text-sm font-bold text-slate-700">Usuario Activo</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite inicio de sesión</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Accesos a Módulos del ERP */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Módulos del ERP Autorizados</h3>
                  <p className="text-xs text-slate-400 leading-tight">Define cuáles menús del ERP se mostrarán para este usuario en el panel principal.</p>
                  <div className="space-y-2">
                    {MODULE_OPTIONS.map(m => {
                      const isChecked = (form.modulosPermitidos || []).includes(m.id)
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleModule(m.id)}
                          className={`flex items-center justify-between p-3.0 border rounded-xl cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 font-medium'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs">{m.label}</span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
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
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
