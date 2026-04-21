import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getComprobantes, getComprobante, createComprobante,
  anularComprobante, getCuentasAuxiliares,
} from '../../services/contabilidad.service'
import { FileText, Plus, Check, X, AlertCircle, Trash2 } from 'lucide-react'

const ESTADO_CFG: Record<string, string> = {
  APROBADO: 'bg-green-100 text-green-700',
  BORRADOR: 'bg-slate-100 text-slate-600',
  ANULADO:  'bg-red-100 text-red-700',
}
const TIPO_LABELS: Record<string, string> = {
  FV:'Factura Venta', FP:'Factura Proveedor', RC:'Recibo Caja',
  CP:'Comprobante Pago', AJ:'Ajuste', NC:'Nota Contabilidad', NI:'Nota Interna',
}

const cop = (n: number) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n)

export function Comprobantes() {
  const qc = useQueryClient()
  const [filtroTipo, setFiltroTipo] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: comprobantes = [], isLoading } = useQuery({
    queryKey: ['comprobantes', filtroTipo, desde, hasta],
    queryFn: () => getComprobantes({ tipo: filtroTipo || undefined, desde: desde || undefined, hasta: hasta || undefined }),
  })

  const { data: detalle } = useQuery({
    queryKey: ['comprobante', selectedId],
    queryFn: () => getComprobante(selectedId!),
    enabled: !!selectedId,
  })

  const mutAnular = useMutation({
    mutationFn: anularComprobante,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comprobantes'] })
      qc.invalidateQueries({ queryKey: ['comprobante', selectedId] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Comprobantes Contables</h1>
          <p className="text-slate-500 text-sm mt-0.5">Libro diario — registro de transacciones</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Nuevo comprobante
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
          className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
          className="p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
        <span className="ml-auto text-xs text-slate-400">{(comprobantes as any[]).length} comprobante(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading && <p className="text-center py-12 text-slate-400">Cargando...</p>}
          {!isLoading && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                    {['Número','Tipo','Concepto','Fecha','Débito','Estado'].map(h =>
                      <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(comprobantes as any[]).map(c => {
                    const totalDB = (c.lineas ?? []).reduce((a: number, l: any) => a + Number(l.debito), 0)
                    return (
                      <tr key={c.id} onClick={() => setSelectedId(c.id)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedId === c.id ? 'bg-indigo-50' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-700">{c.numero}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                            {TIPO_LABELS[c.tipo] ?? c.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs max-w-[160px] truncate">{c.concepto}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(c.fecha).toLocaleDateString('es-CO')}</td>
                        <td className="px-4 py-3 text-slate-700 text-xs font-medium">{cop(totalDB)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_CFG[c.estado] ?? ''}`}>{c.estado}</span>
                        </td>
                      </tr>
                    )
                  })}
                  {(comprobantes as any[]).length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No hay comprobantes registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detalle */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          {!detalle && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm gap-2">
              <FileText size={32} />
              <p>Selecciona un comprobante para ver el detalle</p>
            </div>
          )}
          {detalle && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 font-mono">{(detalle as any).numero}</p>
                  <p className="text-xs text-slate-500">{(detalle as any).concepto}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_CFG[(detalle as any).estado] ?? ''}`}>
                  {(detalle as any).estado}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100">
                      <th className="py-1 text-left font-semibold">Cuenta</th>
                      <th className="py-1 text-right font-semibold">Débito</th>
                      <th className="py-1 text-right font-semibold">Crédito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {((detalle as any).lineas ?? []).map((l: any) => (
                      <tr key={l.id}>
                        <td className="py-1.5">
                          <p className="font-mono text-indigo-700 font-bold">{l.cuenta?.codigo}</p>
                          <p className="text-slate-500">{l.cuenta?.nombre}</p>
                          {l.terceroNombre && <p className="text-slate-400">{l.terceroNombre}</p>}
                        </td>
                        <td className="py-1.5 text-right text-slate-700">{Number(l.debito) > 0 ? cop(Number(l.debito)) : ''}</td>
                        <td className="py-1.5 text-right text-slate-700">{Number(l.credito) > 0 ? cop(Number(l.credito)) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200">
                    {(() => {
                      const totalDB = ((detalle as any).lineas ?? []).reduce((a: number, l: any) => a + Number(l.debito), 0)
                      const totalCR = ((detalle as any).lineas ?? []).reduce((a: number, l: any) => a + Number(l.credito), 0)
                      const cuadra = Math.abs(totalDB - totalCR) < 0.01
                      return (
                        <tr>
                          <td className="py-2">
                            <span className={`text-xs font-bold flex items-center gap-1 ${cuadra ? 'text-green-600' : 'text-red-600'}`}>
                              {cuadra ? <Check size={12}/> : <AlertCircle size={12}/>}
                              {cuadra ? 'Cuadra ✓' : 'No cuadra ✗'}
                            </span>
                          </td>
                          <td className="py-2 text-right font-bold text-slate-800">{cop(totalDB)}</td>
                          <td className="py-2 text-right font-bold text-slate-800">{cop(totalCR)}</td>
                        </tr>
                      )
                    })()}
                  </tfoot>
                </table>
              </div>
              {(detalle as any).estado === 'APROBADO' && (
                <button onClick={() => { if(window.confirm('¿Anular este comprobante?')) mutAnular.mutate((detalle as any).id) }}
                  disabled={mutAnular.isPending}
                  className="w-full py-2 border border-red-200 rounded-lg text-red-600 text-sm hover:bg-red-50 disabled:opacity-50">
                  Anular comprobante
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <NuevoComprobanteModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['comprobantes'] }); setShowForm(false) }}
        />
      )}
    </div>
  )
}

function NuevoComprobanteModal({ onClose, onSuccess }: any) {
  const [tipo, setTipo] = useState('AJ')
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [lineas, setLineas] = useState([
    { cuentaId: 0, cuentaLabel: '', descripcion: '', debito: '', credito: '', terceroNit: '', terceroNombre: '' },
    { cuentaId: 0, cuentaLabel: '', descripcion: '', debito: '', credito: '', terceroNit: '', terceroNombre: '' },
  ])
  const [cuentaSearch, setCuentaSearch] = useState<Record<number, string>>({})
  const [cuentaResults, setCuentaResults] = useState<Record<number, any[]>>({})

  const mut = useMutation({ mutationFn: createComprobante, onSuccess })

  const totalDB = lineas.reduce((a, l) => a + (parseFloat(l.debito) || 0), 0)
  const totalCR = lineas.reduce((a, l) => a + (parseFloat(l.credito) || 0), 0)
  const cuadra  = Math.abs(totalDB - totalCR) < 0.01

  async function buscarCuenta(idx: number, q: string) {
    setCuentaSearch(s => ({ ...s, [idx]: q }))
    if (q.length < 2) { setCuentaResults(r => ({ ...r, [idx]: [] })); return }
    const res = await getCuentasAuxiliares(q)
    setCuentaResults(r => ({ ...r, [idx]: res }))
  }

  function seleccionarCuenta(idx: number, c: any) {
    setLineas(ls => ls.map((l, i) => i === idx ? { ...l, cuentaId: c.id, cuentaLabel: `${c.codigo} — ${c.nombre}` } : l))
    setCuentaSearch(s => ({ ...s, [idx]: '' }))
    setCuentaResults(r => ({ ...r, [idx]: [] }))
  }

  function updateLinea(idx: number, field: string, value: string) {
    setLineas(ls => ls.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function addLinea() {
    setLineas(ls => [...ls, { cuentaId: 0, cuentaLabel: '', descripcion: '', debito: '', credito: '', terceroNit: '', terceroNombre: '' }])
  }

  function removeLinea(idx: number) {
    if (lineas.length <= 2) return
    setLineas(ls => ls.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: any) {
    e.preventDefault()
    if (!cuadra) return
    mut.mutate({
      tipo, concepto, fecha,
      lineas: lineas.filter(l => l.cuentaId).map((l, idx) => ({
        cuentaId: l.cuentaId,
        descripcion: l.descripcion || concepto,
        debito: parseFloat(l.debito) || 0,
        credito: parseFloat(l.credito) || 0,
        terceroNit: l.terceroNit || undefined,
        terceroNombre: l.terceroNombre || undefined,
        orden: idx,
      })),
    })
  }

  const cop = (n: number) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Nuevo Comprobante Contable</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo *</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                {Object.entries(TIPO_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Concepto *</label>
              <input required value={concepto} onChange={e => setConcepto(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha *</label>
              <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>

          {/* Líneas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Líneas del comprobante</p>
              <button type="button" onClick={addLinea}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus size={12} /> Agregar línea
              </button>
            </div>
            <div className="space-y-2">
              {lineas.map((l, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  {/* Cuenta */}
                  <div className="col-span-4 relative">
                    {l.cuentaId ? (
                      <div className="flex items-center gap-1 p-2.5 border border-indigo-200 rounded-lg bg-indigo-50 text-xs">
                        <span className="flex-1 font-mono text-indigo-700 truncate">{l.cuentaLabel}</span>
                        <button type="button" onClick={() => setLineas(ls => ls.map((li, i) => i === idx ? {...li, cuentaId: 0, cuentaLabel:''} : li))}>
                          <X size={12} className="text-slate-400" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input value={cuentaSearch[idx] ?? ''} onChange={e => buscarCuenta(idx, e.target.value)}
                          placeholder="Buscar cuenta PUC..."
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200" />
                        {(cuentaResults[idx]?.length > 0) && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                            {cuentaResults[idx].map(c => (
                              <button key={c.id} type="button" onClick={() => seleccionarCuenta(idx, c)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 border-b border-slate-50 last:border-0">
                                <span className="font-mono text-indigo-600">{c.codigo}</span> — {c.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {/* Descripción */}
                  <div className="col-span-3">
                    <input value={l.descripcion} onChange={e => updateLinea(idx, 'descripcion', e.target.value)}
                      placeholder="Descripción"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                  {/* Débito */}
                  <div className="col-span-2">
                    <input type="number" min="0" step="0.01" value={l.debito} onChange={e => updateLinea(idx, 'debito', e.target.value)}
                      placeholder="Débito"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200 text-right" />
                  </div>
                  {/* Crédito */}
                  <div className="col-span-2">
                    <input type="number" min="0" step="0.01" value={l.credito} onChange={e => updateLinea(idx, 'credito', e.target.value)}
                      placeholder="Crédito"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200 text-right" />
                  </div>
                  {/* Eliminar */}
                  <div className="col-span-1 flex items-start justify-center pt-3">
                    <button type="button" onClick={() => removeLinea(idx)} className="text-slate-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales partida doble */}
            <div className={`mt-4 flex items-center justify-end gap-6 p-3 rounded-lg ${cuadra ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <span className={`text-sm font-bold flex items-center gap-1.5 ${cuadra ? 'text-green-700' : 'text-red-700'}`}>
                {cuadra ? <Check size={14}/> : <AlertCircle size={14}/>}
                {cuadra ? 'Cuadra ✓' : 'No cuadra ✗'}
              </span>
              <div className="text-xs text-slate-600">
                Débitos: <span className="font-bold">{cop(totalDB)}</span>
              </div>
              <div className="text-xs text-slate-600">
                Créditos: <span className="font-bold">{cop(totalCR)}</span>
              </div>
            </div>
          </div>

          {mut.isError && (
            <p className="text-red-600 text-sm">{(mut.error as any)?.response?.data?.message ?? 'Error al crear comprobante'}</p>
          )}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={mut.isPending || !cuadra}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {mut.isPending ? 'Guardando...' : 'Registrar comprobante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
