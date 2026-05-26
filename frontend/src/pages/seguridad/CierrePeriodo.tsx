import { useState, useEffect } from 'react'
import { Lock, Unlock, Plus, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react'

interface CierreConfig {
  id: string;
  anio: number;
  mes: number;
  fechaCierre: string; // ISO string
  usuario: string; // ej. HECTOR
  estado: 'BLOQUEADO' | 'ABIERTO';
  comentario: string;
}

const DEFAULT_CIERRES: CierreConfig[] = [
  {
    id: 'cie_1',
    anio: 2026,
    mes: 3,
    fechaCierre: '2026-04-01T15:30:00.000Z',
    usuario: 'HECTOR',
    estado: 'BLOQUEADO',
    comentario: 'Cierre mensual de cuentas y facturación POS. Todo conciliado con exógena.'
  },
  {
    id: 'cie_2',
    anio: 2026,
    mes: 2,
    fechaCierre: '2026-03-02T10:15:00.000Z',
    usuario: 'patricia',
    estado: 'BLOQUEADO',
    comentario: 'Cierre de febrero consolidado y aprobado por revisoría fiscal.'
  },
  {
    id: 'cie_3',
    anio: 2026,
    mes: 1,
    fechaCierre: '2026-02-01T18:45:00.000Z',
    usuario: 'HECTOR',
    estado: 'BLOQUEADO',
    comentario: 'Cierre inicial del año gravable 2026.'
  }
];

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
];

export function CierrePeriodo() {
  const [data, setData] = useState<CierreConfig[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [savedAlert, setSavedAlert] = useState(false)

  // Estados del Formulario
  const [form, setForm] = useState<Partial<CierreConfig>>({})

  useEffect(() => {
    const saved = localStorage.getItem('edatia_seguridad_cierre')
    if (saved) {
      try {
        setData(JSON.parse(saved))
      } catch (e) {
        setData(DEFAULT_CIERRES)
      }
    } else {
      setData(DEFAULT_CIERRES)
      localStorage.setItem('edatia_seguridad_cierre', JSON.stringify(DEFAULT_CIERRES))
    }
  }, [])

  const saveToLocalStorage = (newState: CierreConfig[]) => {
    setData(newState)
    localStorage.setItem('edatia_seguridad_cierre', JSON.stringify(newState))
    setSavedAlert(true)
    setTimeout(() => setSavedAlert(false), 3000)
  }

  const handleOpenNew = () => {
    setForm({
      anio: 2026,
      mes: 4,
      estado: 'BLOQUEADO',
      comentario: ''
    })
    setViewMode('form')
  }

  const toggleEstado = (id: string) => {
    const confirmMsg = '¿Está seguro de cambiar el estado de este periodo? Abrir un periodo bloqueado puede generar inconsistencias tributarias y contables.'
    if (window.confirm(confirmMsg)) {
      const updated = data.map(c => {
        if (c.id === id) {
          const nuevoEstado = c.estado === 'BLOQUEADO' ? 'ABIERTO' : 'BLOQUEADO'
          return { ...c, estado: nuevoEstado } as CierreConfig
        }
        return c
      })
      saveToLocalStorage(updated)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.anio || !form.mes || !form.comentario) {
      return alert('Año, Mes y Comentario son campos obligatorios.')
    }

    // Verificar si ya existe ese periodo cerrado
    const existe = data.some(x => x.anio === Number(form.anio) && x.mes === Number(form.mes))
    if (existe) {
      return alert(`El periodo fiscal ${form.anio}-${form.mes} ya se encuentra cerrado o registrado en el sistema.`)
    }

    const nuevoCierre: CierreConfig = {
      id: `cie_${Date.now()}`,
      anio: Number(form.anio),
      mes: Number(form.mes),
      fechaCierre: new Date().toISOString(),
      usuario: 'HECTOR', // Simulado
      estado: form.estado || 'BLOQUEADO',
      comentario: form.comentario
    }

    const newState = [nuevoCierre, ...data]
    saveToLocalStorage(newState)
    setViewMode('list')
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
                Cerrar Nuevo Periodo
              </button>
            </div>
          </div>

          {/* Advertencia Informativa */}
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-800">
            <AlertTriangle className="shrink-0 text-amber-600" size={20} />
            <div className="text-xs space-y-1">
              <p className="font-bold">Advertencia Contable Legal</p>
              <p className="leading-relaxed">
                Los periodos marcados como **BLOQUEADO** impiden la facturación retroactiva, la anulación de documentos contables, y modificaciones del PUC de esos meses. Solo un usuario Administrador puede reabrir temporalmente un periodo cerrado para auditorías especiales.
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
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Año / Periodo</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mes</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha de Cierre</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Responsable</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Comentarios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {data.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <button
                          onClick={() => toggleEstado(item.id)}
                          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                            item.estado === 'BLOQUEADO'
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={item.estado === 'BLOQUEADO' ? 'Desbloquear Periodo' : 'Bloquear Periodo'}
                        >
                          {item.estado === 'BLOQUEADO' ? <Unlock size={15} /> : <Lock size={15} />}
                        </button>
                      </td>
                      <td className="p-4 font-bold text-slate-700">{item.anio}</td>
                      <td className="p-4 text-slate-800 font-medium">
                        {MESES.find(m => m.value === item.mes)?.label || item.mes}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(item.fechaCierre).toLocaleString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4 font-mono text-slate-600">{item.usuario}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          item.estado === 'BLOQUEADO'
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {item.estado === 'BLOQUEADO' ? <Lock size={11} /> : <Unlock size={11} />}
                          {item.estado}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs truncate max-w-xs" title={item.comuntario}>
                        {item.comentario}
                      </td>
                    </tr>
                  ))}
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
                <span className="text-slate-500 cursor-pointer hover:text-indigo-600" onClick={() => setViewMode('list')}>Cierre Periodo</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">Cerrar Periodo</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <ShieldAlert size={24} className="text-indigo-600" />
                Cierre de Periodo
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Selecciona las fechas y registra el comentario de cierre para congelar la contabilidad del periodo.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Controles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Año Fiscal *</label>
                  <select
                    value={form.anio || 2026}
                    onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-no-repeat bg-white cursor-pointer"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Mes a Cerrar *</label>
                  <select
                    value={form.mes || 4}
                    onChange={e => setForm(f => ({ ...f, mes: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-no-repeat bg-white cursor-pointer"
                  >
                    {MESES.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Estado Inicial *</label>
                  <select
                    value={form.estado || 'BLOQUEADO'}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-no-repeat bg-white cursor-pointer"
                  >
                    <option value="BLOQUEADO">BLOQUEADO (Recomendado)</option>
                    <option value="ABIERTO">ABIERTO (Solo auditorías)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Comentarios y Justificación de Cierre *</label>
                <textarea
                  value={form.comentario || ''}
                  onChange={e => setForm(f => ({ ...f, comentario: e.target.value }))}
                  placeholder="Ej. Cierre mensual conciliado con compras, facturación electrónica DIAN y balances contables del mes."
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
                  Confirmar Bloqueo y Cerrar
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
