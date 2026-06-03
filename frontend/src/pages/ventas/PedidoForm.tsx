import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, ChevronRight, ChevronLeft, FileText, CheckCircle, ArrowLeft } from 'lucide-react'
import {
  getClientes, getPedido, getPedidos, createPedido, updatePedido, cambiarEstadoPedido
} from '../../services/ventas.service'
import { getProductos, getBodegas } from '../../services/inventario.service'
import { getDocumentosConfig, incrementarConsecutivo } from '../../services/configuracion.service'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const TIPO_IVA_OPTIONS = [
  { value: 'IVA_19', label: 'IVA 19%' },
  { value: 'IVA_5',  label: 'IVA 5%' },
  { value: 'IVA_0',  label: 'IVA 0%' },
  { value: 'EXCLUIDO', label: 'Excluido' },
]

const LINE_DEFAULT = () => ({
  _key: Math.random().toString(36).slice(2),
  productoId: '',
  descripcion: '',
  unidad: 'UND',
  cantidad: 1,
  precioUnitario: 0,
  descuentoPct: 0,
  tipoIva: 'IVA_19',
})

function calcLine(line: any) {
  const cantidad = Number(line.cantidad || 0)
  const precioUnitario = Number(line.precioUnitario || 0)
  const descuentoPct = Number(line.descuentoPct || 0)

  const bruto = cantidad * precioUnitario
  const descuento = bruto * (descuentoPct / 100)
  const base = bruto - descuento
  const ivaPct = line.tipoIva === 'IVA_19' ? 0.19 : line.tipoIva === 'IVA_5' ? 0.05 : 0
  const iva = base * ivaPct
  return { bruto, descuento, base, iva, total: base + iva }
}

function calcTotals(lines: any[]) {
  let subtotal = 0, descuento = 0
  let baseIva19 = 0, iva19 = 0, baseIva5 = 0, iva5 = 0
  lines.forEach(l => {
    const c = calcLine(l)
    subtotal += c.bruto
    descuento += c.descuento
    if (l.tipoIva === 'IVA_19') { baseIva19 += c.base; iva19 += c.iva }
    if (l.tipoIva === 'IVA_5')  { baseIva5  += c.base; iva5  += c.iva }
  })
  return { subtotal, descuento, baseIva19, iva19, baseIva5, iva5, total: subtotal - descuento + iva19 + iva5 }
}

export function PedidoForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const qc = useQueryClient()
  const isEdit = !!id

  const [paso, setPaso] = useState<1 | 2>(1)
  const [pedidoData, setPedidoData] = useState<any>(null)

  // Cabecera
  const [clienteId, setClienteId] = useState('')
  const [clienteQ, setClienteQ] = useState('')
  const [bodegaId, setBodegaId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [notas, setNotas] = useState('')
  const [condicionesPago, setCondicionesPago] = useState('')

  const { data: docConfigs = [] } = useQuery({
    queryKey: ['documentos-config'],
    queryFn: getDocumentosConfig,
  })

  const { data: listPedidos = [] } = useQuery({
    queryKey: ['list-pedidos'],
    queryFn: () => getPedidos(),
  })

  // Calculate next consecutive
  const computedConsecutive = useMemo(() => {
    const doc = docConfigs.find((d: any) => d.sigla === 'PV' && d.activo)
    const basePrefix = doc?.prefijo || 'PV'
    const startSeq = doc?.consecutivoSiguiente || 1
    
    const matching = (listPedidos as any[]).filter((p: any) => p.numero && p.numero.startsWith(basePrefix))
    const nextSeq = Math.max(startSeq, matching.length + 1)
    return `${basePrefix}-${new Date().getFullYear()}-${String(nextSeq).padStart(5, '0')}`
  }, [listPedidos, docConfigs])

  // Items
  const [lines, setLines] = useState([LINE_DEFAULT()])
  const [productoQ, setProductoQ] = useState<Record<string, string>>({})

  const { isLoading: loadingPedido } = useQuery<any>({
    queryKey: ['pedido', id],
    queryFn: () => getPedido(Number(id)),
    enabled: isEdit,
    onSuccess: (d: any) => {
      setPedidoData(d)
      setClienteId(String(d.clienteId))
      setClienteQ(d.cliente?.nombre ?? '')
      setBodegaId(String(d.bodegaId ?? ''))
      setFecha(d.fecha?.slice(0, 10) ?? '')
      setFechaVencimiento(d.fechaVencimiento?.slice(0, 10) ?? '')
      setNotas(d.notas ?? '')
      setCondicionesPago(d.condicionesPago ?? '')
      if (d.items?.length) {
        setLines(d.items.map((it: any) => ({
          _key: Math.random().toString(36).slice(2),
          productoId: String(it.productoId ?? ''),
          descripcion: it.descripcion ?? '',
          unidad: it.unidad ?? 'UND',
          cantidad: Number(it.cantidad),
          precioUnitario: Number(it.precioUnitario),
          descuentoPct: Number(it.descuentoPct ?? 0),
          tipoIva: it.tipoIva ?? 'IVA_19',
        })))
      }
    },
  } as any)

  const { data: clientesAll = [] } = useQuery({ queryKey: ['clientes'], queryFn: () => getClientes() })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })
  const { data: productosAll = [] } = useQuery({ queryKey: ['productos'], queryFn: () => getProductos({ activo: true }) })

  const clientesFiltrados = useMemo(() =>
    clienteQ
      ? (clientesAll as any[]).filter((c: any) =>
          c.nombre.toLowerCase().includes(clienteQ.toLowerCase()) ||
          c.numeroDocumento?.includes(clienteQ))
      : clientesAll as any[]
  , [clientesAll, clienteQ])

  const clienteSeleccionado = (clientesAll as any[]).find((c: any) => String(c.id) === clienteId)
  const totals = useMemo(() => calcTotals(lines), [lines])

  const mutIncrementConsecutive = useMutation({
    mutationFn: (id: number) => incrementarConsecutivo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentos-config'] })
    }
  })

  const mutSave = useMutation({
    mutationFn: (data: any) => {
      if (isEdit) {
        return updatePedido(Number(id), data)
      } else {
        return createPedido(data)
      }
    },
    onSuccess: async () => {
      if (!isEdit) {
        const doc = docConfigs.find((d: any) => d.sigla === 'PV' && d.activo)
        if (doc) {
          try {
            await mutIncrementConsecutive.mutateAsync(doc.id)
          } catch (e) {
            console.error("Error updating consecutive on server:", e)
          }
        }
      }
      qc.invalidateQueries({ queryKey: ['pedidos'] })
      navigate('/ventas/pedidos')
    },
  })

  const mutEstado = useMutation({
    mutationFn: ({ id, e }: { id: number; e: string }) => cambiarEstadoPedido(id, e),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedido', id] })
      qc.invalidateQueries({ queryKey: ['pedidos'] })
    },
  })

  // Autofill client default terms on selection
  useEffect(() => {
    if (clienteSeleccionado && !isEdit) {
      if (clienteSeleccionado.plazoCredito) {
        setCondicionesPago(`Crédito ${clienteSeleccionado.plazoCredito} días`)
      } else {
        setCondicionesPago('Contado')
      }
    }
  }, [clienteSeleccionado, isEdit])

  const updateLine = (key: string, field: string, value: any) =>
    setLines(prev => prev.map(l => l._key === key ? { ...l, [field]: value } : l))

  const removeLine = (key: string) => setLines(prev => prev.filter(l => l._key !== key))
  const addLine = () => setLines(prev => [...prev, LINE_DEFAULT()])

  const selectProducto = (key: string, prod: any) => {
    setLines(prev => prev.map(l => l._key === key ? {
      ...l,
      productoId: prod.id,
      descripcion: prod.nombre,
      unidad: prod.unidad ?? 'UND',
      precioUnitario: Number(prod.precioBase ?? 0),
      tipoIva: prod.tipoIva === 'GRAVADO_19' ? 'IVA_19'
              : prod.tipoIva === 'GRAVADO_5' ? 'IVA_5'
              : prod.tipoIva === 'EXENTO' ? 'IVA_0'
              : 'EXCLUIDO',
    } : l))
    setProductoQ(prev => ({ ...prev, [key]: '' }))
  }

  const handleSubmit = () => {
    if (!clienteId) return alert('Seleccione un cliente')
    if (!bodegaId) return alert('Seleccione una bodega')
    if (lines.some(l => !l.productoId && !l.descripcion)) return alert('Todos los ítems deben tener producto o descripción')
    
    mutSave.mutate({
      numero: isEdit ? undefined : computedConsecutive,
      clienteId: Number(clienteId),
      bodegaId: Number(bodegaId),
      fecha,
      fechaVencimiento: fechaVencimiento || undefined,
      notas: notas || undefined,
      condicionesPago: condicionesPago || undefined,
      items: lines.map(l => ({
        productoId: l.productoId ? Number(l.productoId) : undefined,
        descripcion: l.descripcion,
        unidad: l.unidad,
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
        descuentoPct: Number(l.descuentoPct),
        tipoIva: l.tipoIva,
      })),
    })
  }

  const canEdit = !isEdit || (pedidoData?.estado === 'BORRADOR')

  if (isEdit && loadingPedido) {
    return <div className="text-center py-20 text-slate-400">Cargando pedido...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/ventas/pedidos')} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-lg border border-slate-200 shadow-sm">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isEdit ? `Pedido ${pedidoData?.numero ?? ''}` : `Nuevo Pedido (${computedConsecutive})`}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isEdit ? `Estado: ${pedidoData?.estado}` : `Paso ${paso} de 2 — ${paso === 1 ? 'Cabecera' : 'Detalles de Ítems'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEdit && pedidoData?.estado === 'BORRADOR' && (
            <button
              onClick={() => mutEstado.mutate({ id: pedidoData.id, e: 'APROBADO' })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              Aprobar Pedido
            </button>
          )}
          {isEdit && pedidoData?.estado === 'APROBADO' && (
            <button
              onClick={() => navigate(`/ventas/facturas/nueva?pedidoId=${pedidoData.id}`)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              Convertir a Factura
            </button>
          )}
        </div>
      </div>

      {/* PASO 1 / Cabecera Info */}
      {(paso === 1 || isEdit) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-3 text-sm">Información Comercial</h2>
          
          {/* Cliente Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Cliente *</label>
            {clienteSeleccionado ? (
              <div className="flex items-center gap-3 p-3 border border-pink-200 bg-pink-50/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-bold text-pink-800">{clienteSeleccionado.nombre}</p>
                  <p className="text-xs text-pink-600">{clienteSeleccionado.tipoDocumento} {clienteSeleccionado.numeroDocumento} • {clienteSeleccionado.correo}</p>
                </div>
                {canEdit && (
                  <button onClick={() => { setClienteId(''); setClienteQ('') }}
                    className="text-xs text-rose-500 hover:text-rose-700 font-medium">Cambiar</button>
                )}
              </div>
            ) : (
              <div className="relative">
                <input value={clienteQ} onChange={e => setClienteQ(e.target.value)}
                  placeholder="Escriba Nit o Nombre del cliente..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200 transition-all" />
                {clienteQ && clientesFiltrados.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto mt-1">
                    {clientesFiltrados.slice(0, 10).map((c: any) => (
                      <button key={c.id} type="button"
                        onClick={() => { setClienteId(String(c.id)); setClienteQ(c.nombre) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0">
                        <p className="font-semibold text-slate-800">{c.nombre}</p>
                        <p className="text-xs text-slate-400">{c.tipoDocumento} {c.numeroDocumento}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Fecha de Emisión *</label>
              <input type="date" disabled={!canEdit} value={fecha} onChange={e => setFecha(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Fecha de Vencimiento</label>
              <input type="date" disabled={!canEdit} value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-slate-50" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Bodega Despacho *</label>
              <select disabled={!canEdit} value={bodegaId} onChange={e => setBodegaId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white disabled:bg-slate-50">
                <option value="">Seleccione bodega...</option>
                {(bodegas as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Condiciones de Despacho / Pago</label>
              <input disabled={!canEdit} value={condicionesPago} onChange={e => setCondicionesPago(e.target.value)}
                placeholder="ej: Plazo 30 días, entrega inmediata"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-slate-50" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Notas adicionales</label>
            <textarea disabled={!canEdit} value={notas} onChange={e => setNotas(e.target.value)} rows={2}
              placeholder="Escriba comentarios para el cliente o detalles de envío..."
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-200 resize-none disabled:bg-slate-50" />
          </div>

          {!isEdit && (
            <div className="flex justify-end pt-2">
              <button onClick={() => { if (!clienteId) return alert('Seleccione un cliente'); if (!bodegaId) return alert('Seleccione una bodega'); setPaso(2) }}
                className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* PASO 2 / Items & Totales */}
      {(paso === 2 || isEdit) && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-semibold text-slate-800 text-sm">Detalles de Artículos</h2>
              {canEdit && (
                <button onClick={addLine}
                  className="flex items-center gap-1.5 text-xs text-pink-600 hover:text-pink-800 font-semibold transition-colors">
                  <Plus size={14} /> Agregar Fila
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold">Producto</th>
                    <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                    <th className="px-4 py-3 text-left font-semibold w-16">Und</th>
                    <th className="px-4 py-3 text-right font-semibold w-20">Cant</th>
                    <th className="px-4 py-3 text-right font-semibold w-32">Precio Unit</th>
                    <th className="px-4 py-3 text-right font-semibold w-16">Dcto %</th>
                    <th className="px-4 py-3 text-left font-semibold w-24">IVA</th>
                    <th className="px-4 py-3 text-right font-semibold w-32">Total</th>
                    {canEdit && <th className="px-3 py-3 w-8" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line: any) => {
                    const calcResult = calcLine(line)
                    const qKey = line._key
                    const prodQ = productoQ[qKey] ?? ''
                    const prodsFiltrados = prodQ
                      ? (productosAll as any[]).filter((p: any) =>
                          p.nombre.toLowerCase().includes(prodQ.toLowerCase()) ||
                          p.sku.toLowerCase().includes(prodQ.toLowerCase()))
                      : []

                    return (
                      <tr key={line._key} className="align-top hover:bg-slate-50/30 transition-colors">
                        {/* Selector de Producto */}
                        <td className="px-3 py-2.5 relative">
                          {line.productoId ? (
                            <div className="flex items-center gap-1.5 p-1 border border-slate-200 rounded bg-slate-50">
                              <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                                {(productosAll as any[]).find((p: any) => String(p.id) === String(line.productoId))?.nombre ?? `ID ${line.productoId}`}
                              </span>
                              {canEdit && (
                                <button onClick={() => updateLine(line._key, 'productoId', '')}
                                  className="text-slate-400 hover:text-red-500 font-bold shrink-0">×</button>
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <input value={prodQ} disabled={!canEdit}
                                onChange={e => setProductoQ(prev => ({ ...prev, [qKey]: e.target.value }))}
                                placeholder="Escriba SKU/Nombre..."
                                className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-pink-200" />
                              {prodQ && prodsFiltrados.length > 0 && (
                                <div className="absolute top-full left-0 bg-white border border-slate-200 rounded-lg shadow-xl z-30 min-w-[240px] max-h-44 overflow-y-auto mt-1">
                                  {prodsFiltrados.slice(0, 8).map((p: any) => (
                                    <button key={p.id} type="button"
                                      onClick={() => selectProducto(line._key, p)}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs border-b border-slate-100 last:border-0">
                                      <p className="font-semibold text-slate-800">{p.nombre}</p>
                                      <p className="text-slate-400 font-mono text-[10px]">SKU: {p.sku}</p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Descripción */}
                        <td className="px-3 py-2.5">
                          <input value={line.descripcion} disabled={!canEdit}
                            onChange={e => updateLine(line._key, 'descripcion', e.target.value)}
                            placeholder="Descripción..."
                            className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-pink-200 disabled:bg-slate-50" />
                        </td>

                        {/* Unidad */}
                        <td className="px-3 py-2.5">
                          <input value={line.unidad} disabled={!canEdit}
                            onChange={e => updateLine(line._key, 'unidad', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-pink-200 w-12 text-center disabled:bg-slate-50" />
                        </td>

                        {/* Cantidad */}
                        <td className="px-3 py-2.5">
                          <input type="number" min={0.0001} step="any" value={line.cantidad} disabled={!canEdit}
                            onChange={e => updateLine(line._key, 'cantidad', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-pink-200 disabled:bg-slate-50" />
                        </td>

                        {/* Precio Unitario */}
                        <td className="px-3 py-2.5">
                          <input type="number" min={0} step="any" value={line.precioUnitario} disabled={!canEdit}
                            onChange={e => updateLine(line._key, 'precioUnitario', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-pink-200 disabled:bg-slate-50" />
                        </td>

                        {/* Descuento Pct */}
                        <td className="px-3 py-2.5">
                          <input type="number" min={0} max={100} value={line.descuentoPct} disabled={!canEdit}
                            onChange={e => updateLine(line._key, 'descuentoPct', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs text-right outline-none focus:ring-1 focus:ring-pink-200 disabled:bg-slate-50" />
                        </td>

                        {/* IVA */}
                        <td className="px-3 py-2.5">
                          <select value={line.tipoIva} disabled={!canEdit}
                            onChange={e => updateLine(line._key, 'tipoIva', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-pink-200 bg-white disabled:bg-slate-50">
                            {TIPO_IVA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </td>

                        {/* Total Fila */}
                        <td className="px-3 py-2.5 text-right font-bold text-slate-700 text-xs whitespace-nowrap pt-3">
                          {fmt(calcResult.total)}
                        </td>

                        {/* Eliminar Fila */}
                        {canEdit && (
                          <td className="px-3 py-2.5 text-center pt-3">
                            {lines.length > 1 && (
                              <button onClick={() => removeLine(line._key)} className="text-slate-350 hover:text-red-500">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Total / Actions */}
          <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
            {isEdit && (
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-xs max-w-sm">
                Creado: {new Date(pedidoData?.createdAt).toLocaleString()}<br />
                Último cambio: {new Date(pedidoData?.updatedAt).toLocaleString()}
              </div>
            )}
            {!isEdit && (
              <button onClick={() => setPaso(1)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                <ChevronLeft size={16} /> Volver a Cabecera
              </button>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 w-full lg:max-w-sm space-y-3 shrink-0">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Resumen de Totales</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal bruto</span><span>{fmt(totals.subtotal)}</span></div>
                {totals.descuento > 0 && <div className="flex justify-between text-slate-500"><span>Descuentos (-)</span><span>-{fmt(totals.descuento)}</span></div>}
                {totals.iva19 > 0 && <div className="flex justify-between text-slate-650"><span>IVA 19%</span><span>{fmt(totals.iva19)}</span></div>}
                {totals.iva5 > 0 && <div className="flex justify-between text-slate-650"><span>IVA 5%</span><span>{fmt(totals.iva5)}</span></div>}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800 text-base">
                  <span>TOTAL</span>
                  <span className="text-pink-600">{fmt(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          {canEdit && (
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
              <button onClick={() => navigate('/ventas/pedidos')}
                className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={mutSave.isPending}
                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50">
                {mutSave.isPending ? 'Guardando...' : (isEdit ? 'Actualizar Pedido' : 'Guardar Pedido')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
