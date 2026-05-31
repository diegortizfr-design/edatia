import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Edit3, Search, FileText, Shield,
  Layers, CheckCircle2, ChevronRight, Calculator, PlusCircle, AlertTriangle
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Regimen {
  id: number
  codigoDian: string
  nombre: string
  descripcion: string
}

interface CIIU {
  id: number
  codigo: string
  descripcion: string
  categoria: string
}

interface Responsabilidad {
  id: number
  codigo: string
  nombre: string
}

type TabType = 'regimenes' | 'ciiu' | 'responsabilidades'

// ── Helpers ──
function getLS(key: string, fallback: any = null) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function setLS(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function ConfigContable() {
  const [activeTab, setActiveTab] = useState<TabType>('regimenes')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // ── Modals & Forms State ──
  const [formRegimen, setFormRegimen] = useState({ codigoDian: '', nombre: '', descripcion: '' })
  const [formCiiu, setFormCiiu] = useState({ codigo: '', descripcion: '', categoria: 'Servicios' })
  const [formResponsabilidad, setFormResponsabilidad] = useState({ codigo: '', nombre: '' })

  // ── Data lists state ──
  const [regimenes, setRegimenes] = useState<Regimen[]>([])
  const [ciiuses, setCiiuses] = useState<CIIU[]>([])
  const [responsabilidades, setResponsabilidades] = useState<Responsabilidad[]>([])

  // ── Load & Seed Database ──
  useEffect(() => {
    // Regímenes Fiscales
    const regSeed: Regimen[] = [
      { id: 1, codigoDian: '48', nombre: 'Responsable de IVA', descripcion: 'Antiguo régimen común obligado a declarar IVA' },
      { id: 2, codigoDian: '49', nombre: 'No Responsable de IVA (Régimen Simple)', descripcion: 'Antiguo régimen simplificado, personas naturales' }
    ]
    setRegimenes(getLS('edatia_regimenes', regSeed))

    // CIIU
    const cSeed: CIIU[] = [
      { id: 1, codigo: '6201', descripcion: 'Actividades de desarrollo de sistemas informáticos', categoria: 'Tecnología' },
      { id: 2, codigo: '6202', descripcion: 'Actividades de consultoría informática y tecnología', categoria: 'Tecnología' },
      { id: 3, codigo: '4711', descripcion: 'Comercio al por menor en establecimientos no especializados', categoria: 'Comercio' },
      { id: 4, codigo: '4690', descripcion: 'Comercio al por mayor no especializado', categoria: 'Comercio' },
      { id: 5, codigo: '7020', descripcion: 'Actividades de consultoría de gestión empresarial', categoria: 'Servicios' }
    ]
    setCiiuses(getLS('edatia_ciiu', cSeed))

    // Responsabilidades
    const respSeed: Responsabilidad[] = [
      { id: 1, codigo: 'O-13', nombre: 'Gran contribuyente' },
      { id: 2, codigo: 'O-15', nombre: 'Autorretenedor' },
      { id: 3, codigo: 'O-23', nombre: 'Agente de retención en la fuente' },
      { id: 4, codigo: 'O-47', nombre: 'Régimen simple de tributación' },
      { id: 5, codigo: 'R-99-PN', nombre: 'No aplica — Otros' }
    ]
    setResponsabilidades(getLS('edatia_responsabilidades', respSeed))
  }, [])

  // Resetear filtros al cambiar de pestaña
  useEffect(() => {
    setSearchTerm('')
  }, [activeTab])

  // ── Sync to LocalStorage ──
  const syncData = (key: string, val: any, updater: any) => {
    setLS(key, val)
    updater(val)
  }

  // ── CRUD handlers ──
  const openNew = () => {
    setEditingId(null)
    setFormRegimen({ codigoDian: '', nombre: '', descripcion: '' })
    setFormCiiu({ codigo: '', descripcion: '', categoria: 'Servicios' })
    setFormResponsabilidad({ codigo: '', nombre: '' })
    setShowModal(true)
  }

  const openEdit = (item: any) => {
    setEditingId(item.id)
    if (activeTab === 'regimenes') setFormRegimen({ ...item })
    if (activeTab === 'ciiu') setFormCiiu({ ...item })
    if (activeTab === 'responsabilidades') setFormResponsabilidad({ ...item })
    setShowModal(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'regimenes') {
      if (!formRegimen.codigoDian || !formRegimen.nombre) return toast.error('Código y nombre son obligatorios')
      let updated
      if (editingId) {
        updated = regimenes.map(r => r.id === editingId ? { ...formRegimen, id: editingId } : r)
        toast.success('Régimen fiscal actualizado')
      } else {
        updated = [...regimenes, { ...formRegimen, id: Date.now() }]
        toast.success('Régimen fiscal creado')
      }
      syncData('edatia_regimenes', updated, setRegimenes)
    }

    if (activeTab === 'ciiu') {
      if (!formCiiu.codigo || !formCiiu.descripcion) return toast.error('Código y descripción son obligatorios')
      let updated
      if (editingId) {
        updated = ciiuses.map(c => c.id === editingId ? { ...formCiiu, id: editingId } : c)
        toast.success('Código CIIU actualizado')
      } else {
        updated = [...ciiuses, { ...formCiiu, id: Date.now() }]
        toast.success('Código CIIU creado')
      }
      syncData('edatia_ciiu', updated, setCiiuses)
    }

    if (activeTab === 'responsabilidades') {
      if (!formResponsabilidad.codigo || !formResponsabilidad.nombre) return toast.error('Código y nombre son obligatorios')
      let updated
      if (editingId) {
        updated = responsabilidades.map(r => r.id === editingId ? { ...formResponsabilidad, id: editingId } : r)
        toast.success('Responsabilidad fiscal actualizada')
      } else {
        updated = [...responsabilidades, { ...formResponsabilidad, id: Date.now() }]
        toast.success('Responsabilidad fiscal creada')
      }
      syncData('edatia_responsabilidades', updated, setResponsabilidades)
    }

    setShowModal(false)
  }

  const handleDelete = (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este registro maestro?')) return

    if (activeTab === 'regimenes') {
      const updated = regimenes.filter(r => r.id !== id)
      syncData('edatia_regimenes', updated, setRegimenes)
      toast.success('Régimen fiscal eliminado')
    }
    if (activeTab === 'ciiu') {
      const updated = ciiuses.filter(c => c.id !== id)
      syncData('edatia_ciiu', updated, setCiiuses)
      toast.success('Código CIIU de baja')
    }
    if (activeTab === 'responsabilidades') {
      const updated = responsabilidades.filter(r => r.id !== id)
      syncData('edatia_responsabilidades', updated, setResponsabilidades)
      toast.success('Responsabilidad eliminada')
    }
  }

  return (
    <div className="w-full space-y-6">
      <Toaster position="top-right" />

      {/* Header Premium */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Configuración</span>
            <ChevronRight size={12} />
            <span className="text-slate-500">General</span>
            <ChevronRight size={12} />
            <span className="text-slate-600 font-medium">Contable</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
            <Calculator size={24} className="text-indigo-600" />
            Configuración Contable
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Administra los maestros de regímenes fiscales, códigos de actividad económica CIIU y responsabilidades DIAN.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
          >
            <Plus size={16} />
            Crear Registro
          </button>
        </div>
      </div>

      {/* TABS DE SELECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-0.5">
        <nav className="flex items-center gap-6 overflow-x-auto custom-scrollbar scrollbar-none pb-2 sm:pb-0">
          {[
            { id: 'regimenes', label: 'Regímenes Fiscales', icon: Shield },
            { id: 'ciiu', label: 'Actividades Económicas CIIU', icon: FileText },
            { id: 'responsabilidades', label: 'Responsabilidades DIAN', icon: Layers }
          ].map(tab => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap flex items-center gap-1.5 ${
                  isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
              </button>
            )
          })}
        </nav>

        {/* Buscador */}
        <div className="relative w-full sm:w-72 pb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={`Buscar...`}
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-100/60 border border-slate-200/50 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* LISTADO TIPO TABLA */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Código</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre / Etiqueta</th>
                {activeTab === 'regimenes' && (
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                )}
                {activeTab === 'ciiu' && (
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                )}
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {activeTab === 'regimenes' && (
                regimenes
                  .filter(r => r.codigoDian.includes(searchTerm) || r.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-extrabold text-slate-700">{item.codigoDian}</td>
                      <td className="p-4 font-bold text-slate-800">{item.nombre}</td>
                      <td className="p-4 text-slate-500 text-xs">{item.descripcion}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}

              {activeTab === 'ciiu' && (
                ciiuses
                  .filter(c => c.codigo.includes(searchTerm) || c.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-extrabold text-slate-800 tracking-wider">{item.codigo}</td>
                      <td className="p-4 font-bold text-slate-800 text-xs">{item.descripcion}</td>
                      <td className="p-4 text-slate-500 text-xs">{item.categoria}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}

              {activeTab === 'responsabilidades' && (
                responsabilidades
                  .filter(r => r.codigo.includes(searchTerm) || r.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-extrabold text-slate-700">{item.codigo}</td>
                      <td className="p-4 font-bold text-slate-800">{item.nombre}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}

              {((activeTab === 'regimenes' && regimenes.length === 0) ||
                (activeTab === 'ciiu' && ciiuses.length === 0) ||
                (activeTab === 'responsabilidades' && responsabilidades.length === 0)) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No se encontraron registros en este catálogo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDICIÓN / REGISTRO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                {editingId ? 'Editar Registro' : 'Registrar Nuevo'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <ChevronRight size={18} className="rotate-90" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* REGIMENES */}
              {activeTab === 'regimenes' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Código DIAN *</label>
                    <input
                      type="text"
                      value={formRegimen.codigoDian}
                      onChange={e => setFormRegimen(f => ({ ...f, codigoDian: e.target.value }))}
                      placeholder="Ej. 48, 49"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre del Régimen *</label>
                    <input
                      type="text"
                      value={formRegimen.nombre}
                      onChange={e => setFormRegimen(f => ({ ...f, nombre: e.target.value }))}
                      placeholder="Ej. Responsable de IVA"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Descripción</label>
                    <textarea
                      value={formRegimen.descripcion}
                      onChange={e => setFormRegimen(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Indique los alcances fiscales de este régimen"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all h-20 resize-none"
                    />
                  </div>
                </>
              )}

              {/* CIIU */}
              {activeTab === 'ciiu' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Código CIIU (4 dígitos) *</label>
                    <input
                      type="text"
                      value={formCiiu.codigo}
                      onChange={e => setFormCiiu(f => ({ ...f, codigo: e.target.value }))}
                      placeholder="Ej. 6201"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoría *</label>
                    <select
                      value={formCiiu.categoria}
                      onChange={e => setFormCiiu(f => ({ ...f, categoria: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    >
                      <option value="Tecnología">Tecnología</option>
                      <option value="Comercio">Comercio</option>
                      <option value="Servicios">Servicios</option>
                      <option value="Manufactura">Manufactura</option>
                      <option value="Construcción">Construcción</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Actividad Económica *</label>
                    <textarea
                      value={formCiiu.descripcion}
                      onChange={e => setFormCiiu(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Descripción de la actividad según el RUT..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all h-20 resize-none"
                      required
                    />
                  </div>
                </>
              )}

              {/* RESPONSABILIDADES */}
              {activeTab === 'responsabilidades' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Código DIAN *</label>
                    <input
                      type="text"
                      value={formResponsabilidad.codigo}
                      onChange={e => setFormResponsabilidad(f => ({ ...f, codigo: e.target.value }))}
                      placeholder="Ej. O-13, O-15, R-99-PN"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre de la Responsabilidad *</label>
                    <input
                      type="text"
                      value={formResponsabilidad.nombre}
                      onChange={e => setFormResponsabilidad(f => ({ ...f, nombre: e.target.value }))}
                      placeholder="Ej. Gran contribuyente"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
