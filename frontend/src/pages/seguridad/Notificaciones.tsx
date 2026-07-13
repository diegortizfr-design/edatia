import { useState, useEffect } from 'react'
import { Bell, Plus, Trash2, CheckCircle2, ShieldAlert, Check, Mail, Phone, Laptop, RefreshCw } from 'lucide-react'
import { getNotificaciones, createNotificacion, marcarNotificacionLeida, marcarTodasLeidas, deleteNotificacion } from '../../services/erp.service'

interface NotificacionItem {
  id: number;
  tipo: 'ALERTA' | 'INFO' | 'ADVERTENCIA' | 'ERROR';
  titulo: string;
  mensaje: string;
  modulo: string | null;
  leida: boolean;
  accionUrl: string | null;
  createdAt: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 font-sans">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder }: any) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
    />
  )
}

export function Notificaciones() {
  const [data, setData] = useState<NotificacionItem[]>([])
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados del Formulario (Creación manual de Notificación/Alerta)
  const [form, setForm] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'ALERTA' as 'ALERTA' | 'INFO' | 'ADVERTENCIA' | 'ERROR',
    modulo: 'GENERAL'
  })

  const fetchNotificaciones = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getNotificaciones()
      setData(res || [])
    } catch (e: any) {
      console.error(e)
      setError('Fallo al obtener las notificaciones del servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotificaciones()
  }, [])

  const handleOpenNew = () => {
    setForm({
      titulo: '',
      mensaje: '',
      tipo: 'ALERTA',
      modulo: 'GENERAL'
    })
    setViewMode('form')
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await marcarNotificacionLeida(id)
      fetchNotificaciones()
    } catch (err: any) {
      console.error(err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await marcarTodasLeidas()
      fetchNotificaciones()
    } catch (err: any) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta notificación?')) {
      try {
        await deleteNotificacion(id)
        fetchNotificaciones()
      } catch (err: any) {
        console.error(err)
        alert(err.response?.data?.message || 'Error al eliminar la notificación.')
      }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo || !form.mensaje) {
      return alert('El título y mensaje de la notificación son obligatorios.')
    }

    try {
      await createNotificacion({
        titulo: form.titulo,
        mensaje: form.mensaje,
        tipo: form.tipo,
        modulo: form.modulo
      })
      fetchNotificaciones()
      setViewMode('list')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Error al crear la notificación.')
    }
  }

  const filteredItems = data.filter(item => 
    item.titulo.toLowerCase().includes(search.toLowerCase()) || 
    item.mensaje.toLowerCase().includes(search.toLowerCase()) ||
    (item.modulo || '').toLowerCase().includes(search.toLowerCase())
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
                Centro de Notificaciones y Alertas
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Historial de avisos, alertas de inventario mínimo y logs de transacciones emitidas para el usuario.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotificaciones}
                className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all border border-slate-200"
                title="Refrescar notificaciones"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
              >
                Marcar Todo Leído
              </button>
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Plus size={16} />
                Enviar Notificación
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
                placeholder="Buscar notificación..."
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
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Acciones</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha / Hora</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Asunto / Mensaje</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Módulo</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">Cargando notificaciones...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-rose-500 bg-rose-50/50 font-semibold">{error}</td>
                    </tr>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <tr key={item.id} className={`transition-colors ${item.leida ? 'hover:bg-slate-50/50' : 'bg-indigo-50/10 hover:bg-indigo-50/20'}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            {!item.leida && (
                              <button
                                onClick={() => handleMarkAsRead(item.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-emerald-100"
                                title="Marcar como leída"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide uppercase border ${
                            item.tipo === 'ALERTA' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            item.tipo === 'ADVERTENCIA' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            item.tipo === 'ERROR' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {item.tipo}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <p className={`font-bold text-slate-800 ${item.leida ? 'font-medium text-slate-700' : 'font-extrabold text-indigo-900'}`}>{item.titulo}</p>
                            <p className="text-slate-500 text-xs leading-normal">{item.mensaje}</p>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-600 uppercase text-xs">{item.modulo || 'GENERAL'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                            item.leida ? 'bg-slate-100 text-slate-500' : 'bg-indigo-600 text-white animate-pulse'
                          }`}>
                            {item.leida ? 'Leída' : 'Nueva'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">No se encontraron notificaciones.</td>
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
                <span className="text-slate-600 font-medium">Enviar</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <ShieldAlert size={24} className="text-indigo-600" />
                Enviar Notificación Manual
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Emite un mensaje directo en cartelera que llegará a los terminales de los usuarios.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <Field label="Asunto / Título *">
                    <Input
                      value={form.titulo}
                      onChange={(v: string) => setForm(f => ({ ...f, titulo: v }))}
                      placeholder="Ej. Cierre de Caja Sucursal Central"
                    />
                  </Field>
                </div>
                <div className="md:col-span-4">
                  <Field label="Tipo de Notificación *">
                    <select
                      value={form.tipo}
                      onChange={e => setForm(f => ({ ...f, tipo: e.target.value as any }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-white cursor-pointer"
                    >
                      <option value="INFO">INFORMACIÓN (INFO)</option>
                      <option value="ALERTA">ALERTA</option>
                      <option value="ADVERTENCIA">ADVERTENCIA</option>
                      <option value="ERROR">CRÍTICO (ERROR)</option>
                    </select>
                  </Field>
                </div>

                <div className="md:col-span-12">
                  <Field label="Mensaje descriptivo *">
                    <textarea
                      value={form.mensaje}
                      onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                      placeholder="Escribe el cuerpo del aviso..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all h-24 resize-none"
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Módulo Relacionado">
                    <select
                      value={form.modulo}
                      onChange={e => setForm(f => ({ ...f, modulo: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-white cursor-pointer"
                    >
                      <option value="GENERAL">GENERAL</option>
                      <option value="INVENTARIO">INVENTARIO</option>
                      <option value="VENTAS">VENTAS</option>
                      <option value="CONTABILIDAD">CONTABILIDAD</option>
                      <option value="POS">PUNTO DE VENTA (POS)</option>
                    </select>
                  </Field>
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
                  Enviar Notificación
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
