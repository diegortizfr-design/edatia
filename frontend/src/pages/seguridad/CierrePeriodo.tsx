import { useState, useEffect } from 'react'
import { Lock, Unlock, Plus, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { getPeriodosCierre, createPeriodoCierre, cerrarPeriodo } from '../../services/erp.service'

interface CierreConfig {
  id: number;
  tipo: 'DIARIO' | 'MENSUAL' | 'ANUAL';
  periodo: string; // YYYY-MM o fecha
  fechaCierre: string | null;
  cerradoPor: number | null;
  estado: 'ABIERTO' | 'CERRADO';
  observaciones: string | null;
  createdAt: string;
}

const MESES = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
];

export function CierrePeriodo() {
  const [data, setData] = useState<CierreConfig[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados del Formulario
  const [form, setForm] = useState({
    tipo: 'MENSUAL',
    anio: '2026',
    mes: '04',
    observaciones: ''
  })

  // Estado de diálogo de observaciones para el cierre
  const [closingId, setClosingId] = useState<number | null>(null)
  const [closingObservaciones, setClosingObservaciones] = useState('')
  const [isClosingDialog, setIsClosingDialog] = useState(false)

  const fetchPeriodos = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getPeriodosCierre()
      setData(res || [])
    } catch (e: any) {
      console.error(e)
      setError('Fallo al obtener los periodos contables del servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPeriodos()
  }, [])

  const handleOpenNew = () => {
    setForm({
      tipo: 'MENSUAL',
      anio: '2026',
      mes: '04',
      observaciones: ''
    })
    setViewMode('form')
  }

  const handleOpenCerrarDialog = (id: number) => {
    setClosingId(id)
    setClosingObservaciones('')
    setIsClosingDialog(true)
  }

  const handleConfirmCerrar = async () => {
    if (!closingId) return
    try {
      await cerrarPeriodo(closingId, { observaciones: closingObservaciones })
      setIsClosingDialog(false)
      fetchPeriodos()
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Error al cerrar el periodo.')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.anio || !form.mes || !form.observaciones) {
      return alert('Año, Mes y Observaciones son campos obligatorios.')
    }

    const periodoStr = form.tipo === 'MENSUAL' ? `${form.anio}-${form.mes}` : `${form.anio}`

    // Verificar si ya existe ese periodo registrado
    const existe = data.some(x => x.tipo === form.tipo && x.periodo === periodoStr)
    if (existe) {
      return alert(`El periodo fiscal ${periodoStr} ya se encuentra registrado en el sistema.`)
    }

    try {
      await createPeriodoCierre({
        tipo: form.tipo,
        periodo: periodoStr,
        observaciones: form.observaciones
      })
      fetchPeriodos()
      setViewMode('list')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Error al registrar el periodo.')
    }
  }

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
                <span className="text-slate-600 font-medium">Cierre Periodo</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Lock size={24} className="text-indigo-600" />
                Cierre de Periodo Fiscal y Contable
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Bloquea periodos contables para evitar modificaciones accidentales en facturas, inventarios y PUC.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchPeriodos}
                className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all border border-slate-200"
                title="Refrescar periodos"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
              >
                <Plus size={16} />
                Abrir Nuevo Periodo
              </button>
            </div>
          </div>

          {/* Advertencia Informativa */}
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-800">
            <AlertTriangle className="shrink-0 text-amber-600" size={20} />
            <div className="text-xs space-y-1">
              <p className="font-bold">Advertencia Contable Legal</p>
              <p className="leading-relaxed">
                Los periodos marcados como **CERRADO** impiden la facturación retroactiva, la anulación de documentos contables, y modificaciones del PUC de esos meses. Solo un usuario Administrador puede reabrir temporalmente un periodo cerrado para auditorías especiales.
              </p>
            </div>
          </div>

          {/* Listado */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Acciones</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo Cierre</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Periodo</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha de Cierre</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Responsable ID</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Comentarios / Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">Cargando periodos contables...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-rose-500 bg-rose-50/50 font-semibold">{error}</td>
                    </tr>
                  ) : data.length > 0 ? (
                    data.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          {item.estado === 'ABIERTO' ? (
                            <button
                              onClick={() => handleOpenCerrarDialog(item.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center border border-rose-200"
                              title="Cerrar Periodo"
                            >
                              <Lock size={15} />
                              <span className="text-[10px] ml-1 font-bold">Cerrar</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 flex items-center gap-1 font-mono text-[10px]">
                              <Lock size={12} className="text-slate-400" /> Cerrado
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-700">{item.tipo}</td>
                        <td className="p-4 text-slate-800 font-medium">{item.periodo}</td>
                        <td className="p-4 text-slate-500">
                          {item.fechaCierre ? new Date(item.fechaCierre).toLocaleString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Aún abierto'}
                        </td>
                        <td className="p-4 font-mono text-slate-600">{item.cerradoPor || '—'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            item.estado === 'CERRADO'
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {item.estado === 'CERRADO' ? <Lock size={11} /> : <Unlock size={11} />}
                            {item.estado}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 text-xs truncate max-w-xs" title={item.observaciones || ''}>
                          {item.observaciones || '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">No se han registrado periodos contables.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diálogo Flotante de Cierre */}
          {isClosingDialog && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-rose-600">
                  <Lock size={20} />
                  <h3 className="font-bold text-slate-800">Confirmación de Bloqueo de Periodo</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ¿Deseas cerrar y bloquear permanentemente este periodo fiscal? Una vez cerrado, no se permitirán facturaciones retroactivas ni modificaciones contables.
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Observaciones y Justificación de Cierre *</label>
                  <textarea
                    value={closingObservaciones}
                    onChange={e => setClosingObservaciones(e.target.value)}
                    placeholder="Describe el estado de conciliación bancaria y balances..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-850 h-24 outline-none focus:border-indigo-500 transition-all resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsClosingDialog(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmCerrar}
                    disabled={!closingObservaciones.trim()}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar Cierre y Bloqueo
                  </button>
                </div>
              </div>
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
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Cierre Periodo</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">Abrir Periodo</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Unlock size={24} className="text-indigo-600" />
                Abrir Nuevo Periodo Fiscal
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Crea un nuevo registro contable y fiscal para iniciar el ingreso de transacciones contables del periodo.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Controles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Tipo Cierre *</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-white cursor-pointer"
                  >
                    <option value="MENSUAL">MENSUAL</option>
                    <option value="DIARIO">DIARIO</option>
                    <option value="ANUAL">ANUAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Año Fiscal *</label>
                  <select
                    value={form.anio}
                    onChange={e => setForm(f => ({ ...f, anio: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-white cursor-pointer"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>

                {form.tipo === 'MENSUAL' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Mes a Abrir *</label>
                    <select
                      value={form.mes}
                      onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-white cursor-pointer"
                    >
                      {MESES.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Comentarios y Notas de Apertura *</label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Ej. Apertura de periodo contable mensual para operaciones ordinarias."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all h-24 resize-none"
                />
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
                  Abrir Periodo
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
