import { useState } from 'react'
import {
  Plus, Trash2, Edit3, Search, FileText, Shield,
  Layers, ChevronRight, Calculator
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRegimenesFiscales, createRegimenFiscal, updateRegimenFiscal, deleteRegimenFiscal,
  getCodigosCIIU, createCodigoCIIU, updateCodigoCIIU, deleteCodigoCIIU,
  getResponsabilidadesFiscales, createResponsabilidadFiscal, updateResponsabilidadFiscal, deleteResponsabilidadFiscal
} from '../../services/configuracion.service'

type TabType = 'regimenes' | 'ciiu' | 'responsabilidades'

export function ConfigContable() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('regimenes')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [formRegimen, setFormRegimen] = useState({ codigo: '', nombre: '', descripcion: '' })
  const [formCiiu, setFormCiiu] = useState({ codigo: '', descripcion: '', categoria: 'Servicios' })
  const [formResponsabilidad, setFormResponsabilidad] = useState({ codigo: '', descripcion: '' })

  // ── Queries ──
  const { data: regimenes = [], isLoading: loadingReg } = useQuery({
    queryKey: ['regimenes-fiscales'],
    queryFn: getRegimenesFiscales,
  })

  const { data: ciiuses = [], isLoading: loadingCiiu } = useQuery({
    queryKey: ['codigos-ciiu'],
    queryFn: getCodigosCIIU,
  })

  const { data: responsabilidades = [], isLoading: loadingResp } = useQuery({
    queryKey: ['responsabilidades-fiscales'],
    queryFn: getResponsabilidadesFiscales,
  })

  // ── Mutations ──
  const mutRegimen = useMutation({
    mutationFn: (d: any) => editingId
      ? updateRegimenFiscal(editingId, d)
      : createRegimenFiscal(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regimenes-fiscales'] })
      toast.success(editingId ? 'Régimen actualizado' : 'Régimen creado')
      setShowModal(false)
    },
    onError: () => toast.error('Error al guardar régimen'),
  })

  const mutCiiu = useMutation({
    mutationFn: (d: any) => editingId
      ? updateCodigoCIIU(editingId, d)
      : createCodigoCIIU(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['codigos-ciiu'] })
      toast.success(editingId ? 'Código CIIU actualizado' : 'Código CIIU creado')
      setShowModal(false)
    },
    onError: () => toast.error('Error al guardar CIIU'),
  })

  const mutResponsabilidad = useMutation({
    mutationFn: (d: any) => editingId
      ? updateResponsabilidadFiscal(editingId, d)
      : createResponsabilidadFiscal(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['responsabilidades-fiscales'] })
      toast.success(editingId ? 'Responsabilidad actualizada' : 'Responsabilidad creada')
      setShowModal(false)
    },
    onError: () => toast.error('Error al guardar responsabilidad'),
  })

  const mutDeleteReg = useMutation({
    mutationFn: (id: number) => deleteRegimenFiscal(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['regimenes-fiscales'] }); toast.success('Régimen eliminado') },
    onError: () => toast.error('Error al eliminar'),
  })

  const mutDeleteCiiu = useMutation({
    mutationFn: (id: number) => deleteCodigoCIIU(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['codigos-ciiu'] }); toast.success('Código CIIU eliminado') },
    onError: () => toast.error('Error al eliminar'),
  })

  const mutDeleteResp = useMutation({
    mutationFn: (id: number) => deleteResponsabilidadFiscal(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['responsabilidades-fiscales'] }); toast.success('Responsabilidad eliminada') },
    onError: () => toast.error('Error al eliminar'),
  })

  const isLoading = loadingReg || loadingCiiu || loadingResp
  const isSaving = mutRegimen.isPending || mutCiiu.isPending || mutResponsabilidad.isPending

  const openNew = () => {
    setEditingId(null)
    setFormRegimen({ codigo: '', nombre: '', descripcion: '' })
    setFormCiiu({ codigo: '', descripcion: '', categoria: 'Servicios' })
    setFormResponsabilidad({ codigo: '', descripcion: '' })
    setShowModal(true)
  }

  const openEdit = (item: any) => {
    setEditingId(item.id)
    if (activeTab === 'regimenes') setFormRegimen({ codigo: item.codigo, nombre: item.nombre, descripcion: item.descripcion || '' })
    if (activeTab === 'ciiu') setFormCiiu({ codigo: item.codigo, descripcion: item.descripcion, categoria: item.categoria || 'Servicios' })
    if (activeTab === 'responsabilidades') setFormResponsabilidad({ codigo: item.codigo, descripcion: item.descripcion })
    setShowModal(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'regimenes') {
      if (!formRegimen.codigo || !formRegimen.nombre) return toast.error('Código y nombre son obligatorios')
      mutRegimen.mutate({ codigo: formRegimen.codigo, nombre: formRegimen.nombre })
    }
    if (activeTab === 'ciiu') {
      if (!formCiiu.codigo || !formCiiu.descripcion) return toast.error('Código y descripción son obligatorios')
      mutCiiu.mutate({ codigo: formCiiu.codigo, descripcion: formCiiu.descripcion })
    }
    if (activeTab === 'responsabilidades') {
      if (!formResponsabilidad.codigo || !formResponsabilidad.descripcion) return toast.error('Código y descripción son obligatorios')
      mutResponsabilidad.mutate({ codigo: formResponsabilidad.codigo, descripcion: formResponsabilidad.descripcion })
    }
  }

  const handleDelete = (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este registro maestro?')) return
    if (activeTab === 'regimenes') mutDeleteReg.mutate(id)
    if (activeTab === 'ciiu') mutDeleteCiiu.mutate(id)
    if (activeTab === 'responsabilidades') mutDeleteResp.mutate(id)
  }

  return (
    <div className="w-full space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
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
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <Plus size={16} /> Crear Registro
        </button>
      </div>

      {/* Tabs */}
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
                onClick={() => { setActiveTab(tab.id as TabType); setSearchTerm('') }}
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
        <div className="relative w-full sm:w-72 pb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-100/60 border border-slate-200/50 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando datos del servidor...</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Código</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre / Etiqueta</th>
                  {activeTab === 'regimenes' && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>}
                  {activeTab === 'ciiu' && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>}
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {activeTab === 'regimenes' && regimenes
                  .filter((r: any) => r.codigo?.includes(searchTerm) || r.nombre?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-extrabold text-slate-700">{item.codigo}</td>
                      <td className="p-4 font-bold text-slate-800">{item.nombre}</td>
                      <td className="p-4 text-slate-500 text-xs">{item.descripcion || '-'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
                {activeTab === 'ciiu' && ciiuses
                  .filter((c: any) => c.codigo?.includes(searchTerm) || c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-extrabold text-slate-800 tracking-wider">{item.codigo}</td>
                      <td className="p-4 font-bold text-slate-800 text-xs" colSpan={2}>{item.descripcion}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
                {activeTab === 'responsabilidades' && responsabilidades
                  .filter((r: any) => r.codigo?.includes(searchTerm) || r.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-extrabold text-slate-700">{item.codigo}</td>
                      <td className="p-4 font-bold text-slate-800" colSpan={2}>{item.descripcion}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
                {((activeTab === 'regimenes' && regimenes.length === 0) ||
                  (activeTab === 'ciiu' && ciiuses.length === 0) ||
                  (activeTab === 'responsabilidades' && responsabilidades.length === 0)) && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">No se encontraron registros en este catálogo.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                {editingId ? 'Editar Registro' : 'Registrar Nuevo'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {activeTab === 'regimenes' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Código DIAN *</label>
                    <input type="text" value={formRegimen.codigo} onChange={e => setFormRegimen(f => ({ ...f, codigo: e.target.value }))} placeholder="Ej. 48, 49" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" required />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre del Régimen *</label>
                    <input type="text" value={formRegimen.nombre} onChange={e => setFormRegimen(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Responsable de IVA" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" required />
                  </div>
                </>
              )}
              {activeTab === 'ciiu' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Código CIIU *</label>
                    <input type="text" value={formCiiu.codigo} onChange={e => setFormCiiu(f => ({ ...f, codigo: e.target.value }))} placeholder="Ej. 6201" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" required />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Actividad Económica *</label>
                    <textarea value={formCiiu.descripcion} onChange={e => setFormCiiu(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción de la actividad según el RUT..." className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all h-20 resize-none" required />
                  </div>
                </>
              )}
              {activeTab === 'responsabilidades' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Código DIAN *</label>
                    <input type="text" value={formResponsabilidad.codigo} onChange={e => setFormResponsabilidad(f => ({ ...f, codigo: e.target.value }))} placeholder="Ej. O-13, O-15" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" required />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre de la Responsabilidad *</label>
                    <input type="text" value={formResponsabilidad.descripcion} onChange={e => setFormResponsabilidad(f => ({ ...f, descripcion: e.target.value }))} placeholder="Ej. Gran contribuyente" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" required />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-bold transition-all">{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
