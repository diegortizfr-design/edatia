import { useState, useEffect } from 'react'
import { Bell, Plus, Search, Trash2, Edit3, CheckCircle2, ShieldAlert, Check, Mail, Phone, Laptop } from 'lucide-react'

interface AlertaConfig {
  id: string;
  nombre: string;
  descripcion: string;
  evento: string; // ej. STOCK_MINIMO, MONTO_ALTO, INICIO_SOSPECHOSO
  canal: 'EMAIL' | 'SMS' | 'SYSTEM';
  destinatario: string; // ej. principal@edatia.com o Rol Administrador
  activo: boolean;
  umbral?: string; // ej. > 5.000.000 COP o < 10 unidades
}

const DEFAULT_ALERTAS: AlertaConfig[] = [
  {
    id: 'alt_stock',
    nombre: 'Alerta de Inventario Crítico',
    descripcion: 'Notifica de inmediato cuando la existencia de un producto cae por debajo del stock mínimo configurado.',
    evento: 'STOCK_MINIMO',
    canal: 'EMAIL',
    destinatario: 'compras@edatia.com',
    activo: true,
    umbral: '< Stock Mínimo'
  },
  {
    id: 'alt_monto',
    nombre: 'Factura de Alto Valor',
    descripcion: 'Reporta facturas o compras cuyo monto sea inusualmente alto para auditoría fiscal.',
    evento: 'MONTO_ALTO',
    canal: 'EMAIL',
    destinatario: 'gerencia@edatia.com',
    activo: true,
    umbral: '> 5,000,000 COP'
  },
  {
    id: 'alt_login',
    nombre: 'Intento de Acceso no Habitual',
    descripcion: 'Alerta sobre inicios de sesión realizados fuera del horario de oficina o desde ubicaciones sospechosas.',
    evento: 'INICIO_SOSPECHOSO',
    canal: 'SYSTEM',
    destinatario: 'Rol Administrador',
    activo: true,
    umbral: 'Fuera de horario / IP externa'
  },
  {
    id: 'alt_caja',
    nombre: 'Diferencia en Cierre de Caja',
    descripcion: 'Envía un SMS al administrador cuando el cuadre físico de una caja arroja diferencias frente al sistema.',
    evento: 'DIFERENCIA_CAJA',
    canal: 'SMS',
    destinatario: '+57 300 123 4567',
    activo: false,
    umbral: 'Diferencia > $10,000'
  }
];

export function Notificaciones() {
  const [data, setData] = useState<AlertaConfig[]>([])
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [savedAlert, setSavedAlert] = useState(false)

  // Estados del Formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<AlertaConfig>>({})

  useEffect(() => {
    const saved = localStorage.getItem('edatia_seguridad_notificaciones')
    if (saved) {
      try {
        setData(JSON.parse(saved))
      } catch (e) {
        setData(DEFAULT_ALERTAS)
      }
    } else {
      setData(DEFAULT_ALERTAS)
      localStorage.setItem('edatia_seguridad_notificaciones', JSON.stringify(DEFAULT_ALERTAS))
    }
  }, [])

  const saveToLocalStorage = (newState: AlertaConfig[]) => {
    setData(newState)
    localStorage.setItem('edatia_seguridad_notificaciones', JSON.stringify(newState))
    setSavedAlert(true)
    setTimeout(() => setSavedAlert(false), 3000)
  }

  const handleOpenNew = () => {
    setEditingId(null)
    setForm({
      nombre: '',
      descripcion: '',
      evento: 'STOCK_MINIMO',
      canal: 'EMAIL',
      destinatario: '',
      activo: true,
      umbral: ''
    })
    setViewMode('form')
  }

  const handleOpenEdit = (item: AlertaConfig) => {
    setEditingId(item.id)
    setForm({ ...item })
    setViewMode('form')
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta regla de notificación?')) {
      const filtered = data.filter(a => a.id !== id)
      saveToLocalStorage(filtered)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.destinatario) {
      return alert('El nombre de la alerta y el destinatario son obligatorios.')
    }

    let newState = [...data]
    if (editingId) {
      newState = data.map(a => a.id === editingId ? { ...a, ...form } as AlertaConfig : a)
    } else {
      const newAlerta: AlertaConfig = {
        id: `alt_${Date.now()}`,
        nombre: form.nombre,
        descripcion: form.descripcion || '',
        evento: form.evento || 'STOCK_MINIMO',
        canal: form.canal || 'EMAIL',
        destinatario: form.destinatario,
        activo: !!form.activo,
        umbral: form.umbral || ''
      }
      newState = [...data, newAlerta]
    }

    saveToLocalStorage(newState)
    setViewMode('list')
  }

  const filteredItems = data.filter(a => 
    a.nombre.toLowerCase().includes(search.toLowerCase()) || 
    a.descripcion.toLowerCase().includes(search.toLowerCase()) ||
    a.destinatario.toLowerCase().includes(search.toLowerCase())
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
                <span className="text-slate-600 font-medium">Notificaciones</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Bell size={24} className="text-indigo-600" />
                Alertas de Control y Notificaciones
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Configura los disparadores automáticos que enviarán alertas operativas y de seguridad.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedAlert && (
                <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold animate-bounce">
                  <CheckCircle2 size={16} /> Configuración actualizada
                </div>
              )}
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Plus size={16} />
                Nueva Alerta
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
                placeholder="Buscar regla de alerta..."
                className="w-full pl-9 pr-3.5 py-2.0 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Listado */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Acciones</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de Regla</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Canal</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Destinatario</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Umbral / Condición</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800">{item.nombre}</p>
                            <p className="text-slate-400 text-xs leading-normal">{item.descripcion}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide uppercase ${
                            item.canal === 'EMAIL' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            item.canal === 'SMS' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {item.canal === 'EMAIL' && <Mail size={12} />}
                            {item.canal === 'SMS' && <Phone size={12} />}
                            {item.canal === 'SYSTEM' && <Laptop size={12} />}
                            {item.canal}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-medium text-slate-700">{item.destinatario}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded font-semibold text-xs border border-amber-100">
                            {item.umbral || 'Cualquier evento'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                            item.activo
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        No se encontraron reglas de notificación.
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
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Notificaciones</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{editingId ? 'Editar' : 'Crear'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <ShieldAlert size={24} className="text-indigo-600" />
                {editingId ? 'Editar Regla de Notificación' : 'Crear Nueva Regla'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Ingresa los datos para configurar el envío automático de notificaciones.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <Field label="Nombre descriptivo de la Alerta *">
                    <Input
                      value={form.nombre}
                      onChange={(v: string) => setForm(f => ({ ...f, nombre: v }))}
                      placeholder="Ej. Alerta de Factura Mayor a 5 Millones"
                    />
                  </Field>
                </div>
                <div className="md:col-span-4">
                  <Field label="Tipo de Evento Disparador *">
                    <select
                      value={form.evento || 'STOCK_MINIMO'}
                      onChange={e => setForm(f => ({ ...f, evento: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-no-repeat bg-white cursor-pointer"
                    >
                      <option value="STOCK_MINIMO">Existencias por debajo del stock mínimo</option>
                      <option value="MONTO_ALTO">Factura o egreso de alto valor</option>
                      <option value="INICIO_SOSPECHOSO">Inicio de sesión sospechoso</option>
                      <option value="DIFERENCIA_CAJA">Cuadre de caja con diferencias</option>
                    </select>
                  </Field>
                </div>

                <div className="md:col-span-12">
                  <Field label="Explicación detallada de la Alerta">
                    <textarea
                      value={form.descripcion || ''}
                      onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Ej. Alerta al departamento administrativo sobre cualquier facturación electrónica de alta cuantía que requiera revisión del RUT."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all h-20 resize-none"
                    />
                  </Field>
                </div>

                <div className="md:col-span-3">
                  <Field label="Canal de Notificación *">
                    <select
                      value={form.canal || 'EMAIL'}
                      onChange={e => setForm(f => ({ ...f, canal: e.target.value as any }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-no-repeat bg-white cursor-pointer"
                    >
                      <option value="EMAIL">Correo Electrónico (Email)</option>
                      <option value="SMS">Mensaje de Texto (SMS)</option>
                      <option value="SYSTEM">Notificación Interna del Sistema</option>
                    </select>
                  </Field>
                </div>

                <div className="md:col-span-5">
                  <Field label="Destinatario *">
                    <Input
                      value={form.destinatario}
                      onChange={(v: string) => setForm(f => ({ ...f, destinatario: v }))}
                      placeholder="Ej. auditoria@edatia.com, o Rol Administrador"
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Umbral / Condición de Alerta (Opcional)">
                    <Input
                      value={form.umbral}
                      onChange={(v: string) => setForm(f => ({ ...f, umbral: v }))}
                      placeholder="Ej. > 5,000,000 COP"
                    />
                  </Field>
                </div>
              </div>

              {/* Estado */}
              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 w-full sm:w-80 cursor-pointer hover:bg-slate-100/50 transition-all">
                  <input
                    type="checkbox"
                    checked={form.activo || false}
                    onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-slate-700">Regla Activa</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">El sistema evaluará este disparador</p>
                  </div>
                </label>
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
                  Guardar Notificación
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
