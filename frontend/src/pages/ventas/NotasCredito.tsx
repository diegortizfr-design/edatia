import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, XCircle, FileText, X, Trash2 } from 'lucide-react'
import {
  getNotasCredito, createNotaCredito, anularNotaCredito,
  getFacturas,
} from '../../services/ventas.service'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const MOTIVO_CONFIG: Record<string, { label: string; color: string }> = {
  DEVOLUCION: { label: 'Devolución',  color: 'bg-orange-100 text-orange-700' },
  DESCUENTO:  { label: 'Descuento',   color: 'bg-blue-100 text-blue-700' },
  ANULACION:  { label: 'Anulación',   color: 'bg-red-100 text-red-700' },
  OTRO:       { label: 'Otro',        color: 'bg-slate-100 text-slate-600' },
}

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
  EMITIDA:  { label: 'Emitida',  color: 'bg-blue-100 text-blue-700' },
  ANULADA:  { label: 'Anulada',  color: 'bg-red-100 text-red-700' },
}

const DIAN_CONFIG: Record<string, { label: string; color: string }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-slate-100 text-slate-600' },
  GENERADA:  { label: 'Generada',  color: 'bg-blue-100 text-blue-700' },
  ACEPTADA:  { label: 'Aceptada',  color: 'bg-green-100 text-green-700' },
  RECHAZADA: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
}

function Badge({ value, config }: { value: string; config: Record<string, { label: string; color: string }> }) {
  const cfg = config[value] ?? { label: value, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

const TIPO_IVA_OPTIONS = ['IVA_19', 'IVA_5', 'IVA_0', 'EXCLUIDO']

const NC_LINE_DEFAULT = () => ({
  _key: Math.random().toString(36).slice(2),
  descripcion: '',
  cantidad: 1,
  precioUnitario: 0,
  tipoIva: 'IVA_19',
})

export function NotasCredito() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: notas = [], isLoading } = useQuery({
    queryKey: ['notas-credito'],
    queryFn: () => getNotasCredito(),
  })

  const mutAnular = useMutation({
    mutationFn: (id: number) => anularNotaCredito(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notas-credito'] }),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notas Crédito</h1>
          <p className="text-slate-500 text-sm mt-0.5">{(notas as any[]).length} nota(s) registrada(s)</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> Nueva nota crédito
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="text-center py-16 text-slate-400">Cargando notas crédito...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  {['Número', 'Factura ref.', 'Cliente', 'Motivo', 'Total', 'Estado', 'DIAN', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(notas as any[]).map((n: any) => (
                  <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-700">
                      {n.prefijo}{n.numero}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs font-mono">
                      {n.factura?.prefijo}{n.factura?.numero ?? '—'}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800 max-w-[140px] truncate">
                      {n.factura?.cliente?.nombre ?? n.cliente?.nombre ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      {n.motivo ? <Badge value={n.motivo} config={MOTIVO_CONFIG} /> : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-700">{fmt(Number(n.total ?? 0))}</td>
                    <td className="px-5 py-3">
                      <Badge value={n.estado} config={ESTADO_CONFIG} />
                    </td>
                    <td className="px-5 py-3">
                      {n.estadoDIAN ? <Badge value={n.estadoDIAN} config={DIAN_CONFIG} /> : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {n.estado !== 'ANULADA' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Anular la nota crédito ${n.prefijo ?? ''}${n.numero}?`)) {
                              mutAnular.mutate(n.id)
                            }
                          }}
                          disabled={mutAnular.isPending}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50">
                          <XCircle size={12} /> Anular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(notas as any[]).length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <FileText size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-400">No hay notas crédito registradas</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <NuevaNotaCreditoModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['notas-credito'] })
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

function NuevaNotaCreditoModal({ onClose, onSuccess }: any) {
  const [facturaQ, setFacturaQ] = useState('')
  const [facturaId, setFacturaId] = useState('')
  const [motivo, setMotivo] = useState('DEVOLUCION')
  const [descripcion, setDescripcion] = useState('')
  const [lines, setLines] = useState([NC_LINE_DEFAULT()])

  const { data: facturas = [] } = useQuery({
    queryKey: ['facturas'],
    queryFn: () => getFacturas(),
  })

  const mutCreate = useMutation({
    mutationFn: createNotaCredito,
    onSuccess,
  })

  const facturasFiltradas = facturaQ
    ? (facturas as any[]).filter((f: any) =>
        `${f.prefijo ?? ''}${f.numero}`.includes(facturaQ) ||
        f.cliente?.nombre?.toLowerCase().includes(facturaQ.toLowerCase()))
    : facturas as any[]

  const facturaSeleccionada = (facturas as any[]).find((f: any) => String(f.id) === facturaId)

  const updateLine = (key: string, field: string, value: any) =>
    setLines(prev => prev.map(l => l._key === key ? { ...l, [field]: value } : l))
  const removeLine = (key: string) => setLines(prev => prev.filter(l => l._key !== key))

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (!facturaId) return alert('Seleccione una factura')
    mutCreate.mutate({
      facturaId: Number(facturaId),
      motivo,
      descripcion,
      items: lines.map(l => ({
        descripcion: l.descripcion,
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
        tipoIva: l.tipoIva,
      })),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-800">Nueva Nota Crédito</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Factura */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Factura de referencia *</label>
            {facturaSeleccionada ? (
              <div className="flex items-center gap-3 p-2.5 border border-indigo-200 bg-indigo-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-800">
                    {facturaSeleccionada.prefijo}{facturaSeleccionada.numero} — {facturaSeleccionada.cliente?.nombre}
                  </p>
                  <p className="text-xs text-indigo-600">Total: {fmt(Number(facturaSeleccionada.total ?? 0))}</p>
                </div>
                <button type="button" onClick={() => { setFacturaId(''); setFacturaQ('') }}
                  className="text-xs text-red-500 hover:text-red-700">Cambiar</button>
              </div>
            ) : (
              <div className="relative">
                <input value={facturaQ} onChange={e => setFacturaQ(e.target.value)}
                  placeholder="Buscar por número o cliente..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                {facturaQ && facturasFiltradas.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                    {facturasFiltradas.slice(0, 8).map((f: any) => (
                      <button key={f.id} type="button"
                        onClick={() => { setFacturaId(String(f.id)); setFacturaQ(`${f.prefijo ?? ''}${f.numero}`) }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs">
                        <p className="font-medium">{f.prefijo}{f.numero} — {f.cliente?.nombre}</p>
                        <p className="text-slate-400">{fmt(Number(f.total ?? 0))}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Motivo *</label>
              <select required value={motivo} onChange={e => setMotivo(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                {Object.entries(MOTIVO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
              <input value={descripcion} onChange={e => setDescripcion(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>

          {/* Ítems */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Ítems *</label>
              <button type="button" onClick={() => setLines(prev => [...prev, NC_LINE_DEFAULT()])}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <Plus size={12} /> Agregar
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr className="text-slate-400 uppercase">
                    <th className="px-3 py-2 text-left font-semibold">Descripción</th>
                    <th className="px-3 py-2 text-right font-semibold w-16">Cant.</th>
                    <th className="px-3 py-2 text-right font-semibold w-24">Precio</th>
                    <th className="px-3 py-2 text-left font-semibold w-24">IVA</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lines.map(l => (
                    <tr key={l._key}>
                      <td className="px-3 py-1.5">
                        <input value={l.descripcion} onChange={e => updateLine(l._key, 'descripcion', e.target.value)}
                          required
                          className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-200" />
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="number" min={0} value={l.cantidad}
                          onChange={e => updateLine(l._key, 'cantidad', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-indigo-200" />
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="number" min={0} value={l.precioUnitario}
                          onChange={e => updateLine(l._key, 'precioUnitario', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-indigo-200" />
                      </td>
                      <td className="px-3 py-1.5">
                        <select value={l.tipoIva} onChange={e => updateLine(l._key, 'tipoIva', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-200 bg-white">
                          {TIPO_IVA_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {lines.length > 1 && (
                          <button type="button" onClick={() => removeLine(l._key)}
                            className="text-slate-300 hover:text-red-400">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {mutCreate.isError && (
            <p className="text-red-600 text-sm">
              {(mutCreate.error as any)?.response?.data?.message ?? 'Error al crear nota crédito'}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={mutCreate.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {mutCreate.isPending ? 'Creando...' : 'Crear nota crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
