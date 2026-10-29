import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, DollarSign, X } from 'lucide-react'
import {
  getRecibos, createRecibo, getFacturasPendientes, getClientes, getDocumentosTesoreria,
} from '../../services/ventas.service'
import { getMediosPago } from '../../services/configuracion.service'
import { CurrencyInput } from '../../components/CurrencyInput'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const MEDIO_PAGO_CONFIG: Record<string, { label: string; color: string }> = {
  EFECTIVO:         { label: 'Efectivo',         color: 'bg-green-100 text-green-700' },
  TRANSFERENCIA:    { label: 'Transferencia',     color: 'bg-blue-100 text-blue-700' },
  CHEQUE:           { label: 'Cheque',            color: 'bg-amber-100 text-amber-700' },
  TARJETA_CREDITO:  { label: 'Tarjeta crédito',  color: 'bg-purple-100 text-purple-700' },
  TARJETA_DEBITO:   { label: 'Tarjeta débito',   color: 'bg-indigo-100 text-indigo-700' },
  OTRO:             { label: 'Otro',              color: 'bg-slate-100 text-slate-600' },
}

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVO:   { label: 'Activo',   color: 'bg-green-100 text-green-700' },
  ANULADO:  { label: 'Anulado',  color: 'bg-red-100 text-red-700' },
}

function Badge({ value, config }: { value: string; config: Record<string, { label: string; color: string }> }) {
  const cfg = config[value] ?? { label: value, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export function ReciboCaja() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: recibos = [], isLoading } = useQuery({
    queryKey: ['recibos'],
    queryFn: () => getRecibos(),
  })

  // Medios de pago dinámicos desde configuración general
  const { data: mediosPagoList = [] } = useQuery({
    queryKey: ['config-medios-pago'],
    queryFn: getMediosPago,
  })

  const mediosMap = useMemo(() => {
    const map = new Map<string, string>()
    ;(mediosPagoList as any[]).forEach((m: any) => {
      map.set(m.codigo, m.nombre)
    })
    return map
  }, [mediosPagoList])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recibos de Caja</h1>
          <p className="text-slate-500 text-sm mt-0.5">{(recibos as any[]).length} recibo(s)</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> Nuevo recibo
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="text-center py-16 text-slate-400">Cargando recibos...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  {['Número', 'Cliente', 'Fecha', 'Concepto', 'Valor', 'Medio de pago', 'Estado'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(recibos as any[]).map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-700">
                      {r.numero}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800 max-w-[140px] truncate">
                      {r.cliente?.nombre ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {r.fecha ? new Date(r.fecha).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs max-w-[160px] truncate">
                      {r.concepto || '—'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      {fmt(Number(r.valor ?? 0))}
                    </td>
                    <td className="px-5 py-3">
                      {r.medioPago ? (
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {mediosMap.get(r.medioPago) || MEDIO_PAGO_CONFIG[r.medioPago]?.label || r.medioPago}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge value={r.estado ?? 'ACTIVO'} config={ESTADO_CONFIG} />
                    </td>
                  </tr>
                ))}
                {(recibos as any[]).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <DollarSign size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-400">No hay recibos de caja registrados</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <NuevoReciboModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['recibos'] })
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

export function NuevoReciboModal({ onClose, onSuccess, initialClienteId, initialFacturaId }: any) {
  const [clienteId, setClienteId] = useState(initialClienteId ? String(initialClienteId) : '')
  const [clienteQ, setClienteQ] = useState('')
  const [valor, setValor] = useState('')
  const [medioPago, setMedioPago] = useState('')
  const [referencia, setReferencia] = useState('')
  const [concepto, setConcepto] = useState('')
  const [documentoConfigId, setDocumentoConfigId] = useState('')

  // Facturas pendientes a aplicar: { facturaId, valorAplicar }
  const [aplicaciones, setAplicaciones] = useState<Record<number, string>>({})
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set())

  const { data: clientes = [] } = useQuery({ queryKey: ['clientes'], queryFn: () => getClientes() })
  const { data: facturasPendientes = [], refetch: refetchPendientes } = useQuery({
    queryKey: ['facturas-pendientes', clienteId],
    queryFn: () => getFacturasPendientes(Number(clienteId)),
    enabled: !!clienteId,
  })
  
  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos-tesoreria'],
    queryFn: () => getDocumentosTesoreria(),
  })

  // Medios de pago dinámicos desde configuración general
  const { data: mediosPagoList = [] } = useQuery({
    queryKey: ['config-medios-pago'],
    queryFn: getMediosPago,
  })

  const mediosActivos = useMemo(() => {
    const list = (mediosPagoList as any[]).filter((m: any) => m.activo !== false)
    if (list.length > 0) return list
    return [
      { id: 1, codigo: 'EFECTIVO', nombre: 'Efectivo' },
      { id: 2, codigo: 'TRANSFERENCIA', nombre: 'Transferencia Bancaria' },
      { id: 3, codigo: 'CHEQUE', nombre: 'Cheque' },
      { id: 4, codigo: 'TARJETA_CREDITO', nombre: 'Tarjeta de Crédito' },
      { id: 5, codigo: 'TARJETA_DEBITO', nombre: 'Tarjeta de Débito' },
    ]
  }, [mediosPagoList])

  useEffect(() => {
    if (mediosActivos.length > 0 && (!medioPago || !mediosActivos.some((m: any) => m.codigo === medioPago))) {
      setMedioPago(mediosActivos[0].codigo)
    }
  }, [mediosActivos, medioPago])

  useEffect(() => {
    if (documentos.length > 0 && !documentoConfigId) {
      setDocumentoConfigId(String(documentos[0].id))
    }
  }, [documentos, documentoConfigId])

  useEffect(() => {
    if (clienteId) {
      setSeleccionadas(new Set())
      setAplicaciones({})
      refetchPendientes()
    }
  }, [clienteId])

  // Si viene con initialFacturaId, pre-seleccionar automáticamente la factura y sugerir saldo
  useEffect(() => {
    if (initialFacturaId && facturasPendientes.length > 0) {
      const fid = Number(initialFacturaId)
      const fact = (facturasPendientes as any[]).find((f: any) => f.id === fid)
      if (fact) {
        setSeleccionadas(new Set([fid]))
        const saldoStr = String(Math.round(Number(fact.saldo ?? 0)))
        setAplicaciones({ [fid]: saldoStr })
        if (!valor) {
          setValor(saldoStr)
        }
      }
    }
  }, [initialFacturaId, facturasPendientes])

  const mutCreate = useMutation({ mutationFn: createRecibo, onSuccess })

  const clientesFiltrados = clienteQ
    ? (clientes as any[]).filter((c: any) =>
        c.nombre?.toLowerCase().includes(clienteQ.toLowerCase()) ||
        c.numeroDocumento?.includes(clienteQ))
    : (clientes as any[])

  const clienteSeleccionado = (clientes as any[]).find((c: any) => String(c.id) === String(clienteId))

  const totalAplicado = Array.from(seleccionadas).reduce(
    (sum, fid) => sum + Number(aplicaciones[fid] ?? 0), 0
  )
  const valorNum = Number(valor || 0)
  const excede = totalAplicado > valorNum

  const toggleFactura = (fid: number) => {
    setSeleccionadas(prev => {
      const next = new Set(prev)
      if (next.has(fid)) {
        next.delete(fid)
        setAplicaciones(a => {
          const n = { ...a }
          delete n[fid]
          return n
        })
      } else {
        next.add(fid)
        const fact = (facturasPendientes as any[]).find((f: any) => f.id === fid)
        if (fact) {
          const saldo = Math.round(Number(fact.saldo ?? 0))
          const yaAplicado = Array.from(next).filter(id => id !== fid).reduce(
            (sum, id) => sum + Number(aplicaciones[id] ?? 0), 0
          )
          const restante = Math.max(0, valorNum - yaAplicado)
          const sugerido = (valorNum > 0 && restante > 0) ? Math.min(saldo, restante) : saldo
          setAplicaciones(a => ({ ...a, [fid]: String(sugerido) }))
        }
      }
      return next
    })
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (!clienteId) return alert('Seleccione un cliente')
    if (!valor || valorNum <= 0) return alert('Ingrese un valor válido para el recibo')
    if (excede) return alert('El total aplicado a las facturas supera el valor del recibo')

    for (const fid of seleccionadas) {
      const valAp = Number(aplicaciones[fid] ?? 0)
      const fact = (facturasPendientes as any[]).find((f: any) => f.id === fid)
      if (fact && valAp > Number(fact.saldo ?? 0)) {
        return alert(`El valor a aplicar en la factura ${fact.prefijo || ''}${fact.numero} supera su saldo (${fmt(Number(fact.saldo))})`)
      }
    }

    const aplicacionesArr = Array.from(seleccionadas).map(fid => ({
      facturaId: fid,
      valor: Number(aplicaciones[fid] ?? 0),
    })).filter(a => a.valor > 0)

    mutCreate.mutate({
      clienteId: Number(clienteId),
      valor: valorNum,
      medioPago,
      referencia: referencia || undefined,
      concepto: concepto || undefined,
      aplicaciones: aplicacionesArr,
      documentoConfigId: documentoConfigId ? Number(documentoConfigId) : undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign size={18} />
            </div>
            <h2 className="font-bold text-slate-800">Nuevo Recibo de Caja</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cliente *</label>
            {clienteSeleccionado ? (
              <div className="flex items-center gap-3 p-2.5 border border-indigo-200 bg-indigo-50/70 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-bold text-indigo-900">{clienteSeleccionado.nombre}</p>
                  <p className="text-xs text-indigo-600 font-medium">
                    {clienteSeleccionado.tipoDocumento} {clienteSeleccionado.numeroDocumento}
                  </p>
                </div>
                <button type="button" onClick={() => { setClienteId(''); setClienteQ(''); setSeleccionadas(new Set()); setAplicaciones({}) }}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 hover:bg-red-50 rounded">
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <input value={clienteQ} onChange={e => setClienteQ(e.target.value)}
                  placeholder="Buscar cliente por nombre o identificación..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                {clienteQ && clientesFiltrados.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto mt-1">
                    {clientesFiltrados.slice(0, 8).map((c: any) => (
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

          {/* Consecutivo de Tesorería */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Documento de Control (Consecutivo)</label>
            <select
              value={documentoConfigId}
              onChange={e => setDocumentoConfigId(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              {documentos.length === 0 ? (
                <option value="">Consecutivo automático del sistema (RC-YYYY-XXXXX)</option>
              ) : (
                documentos.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.prefijo} - consecutivo actual: {d.consecutivoSiguiente})
                  </option>
                ))
              )}
            </select>
            {documentos.length === 0 && (
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                ℹ️ Se usará el consecutivo secuencial automático del sistema (RC-YYYY-00001).
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Valor total *</label>
              <CurrencyInput
                value={valor}
                onChange={setValor}
                placeholder="0"
                required
                className="w-full !pl-7 !pr-3 !py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Medio de pago *</label>
              <select
                required
                value={medioPago}
                onChange={e => setMedioPago(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
              >
                {mediosActivos.map((m: any) => (
                  <option key={m.id || m.codigo} value={m.codigo}>
                    {m.nombre} {m.cajaBanco?.nombre ? `(${m.cajaBanco.nombre})` : ''}
                  </option>
                ))}
              </select>
              {mediosActivos.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1">Cargando medios de pago...</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Referencia</label>
              <input value={referencia} onChange={e => setReferencia(e.target.value)}
                placeholder="Nº transacción, cheque..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Concepto</label>
              <input value={concepto} onChange={e => setConcepto(e.target.value)}
                placeholder="Pago factura, abono a cartera..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>

          {/* Facturas pendientes */}
          {clienteId && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Aplicar a facturas pendientes
                {valorNum > 0 && (
                  <span className={`ml-2 font-semibold ${excede ? 'text-red-600' : 'text-green-600'}`}>
                    Aplicado: {fmt(totalAplicado)} / {fmt(valorNum)}
                  </span>
                )}
              </label>
              {(facturasPendientes as any[]).length === 0 ? (
                <p className="text-xs text-slate-400 py-3 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 text-center">
                  No hay facturas pendientes para este cliente (el recibo quedará como anticipo / saldo a favor)
                </p>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-400 uppercase">
                        <th className="px-3 py-2 w-8" />
                        <th className="px-3 py-2 text-left font-semibold">Factura</th>
                        <th className="px-3 py-2 text-right font-semibold">Total</th>
                        <th className="px-3 py-2 text-right font-semibold">Saldo</th>
                        <th className="px-3 py-2 text-right font-semibold w-36">A aplicar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(facturasPendientes as any[]).map((f: any) => (
                        <tr key={f.id} className={seleccionadas.has(f.id) ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={seleccionadas.has(f.id)}
                              onChange={() => toggleFactura(f.id)}
                              className="rounded border-slate-300 accent-indigo-600 cursor-pointer" />
                          </td>
                          <td className="px-3 py-2 font-mono font-semibold text-indigo-700">
                            {f.prefijo}{f.numero}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-500">{fmt(Number(f.total ?? 0))}</td>
                          <td className="px-3 py-2 text-right font-bold text-amber-700">{fmt(Number(f.saldo ?? 0))}</td>
                          <td className="px-3 py-2">
                            {seleccionadas.has(f.id) && (
                              <CurrencyInput
                                value={aplicaciones[f.id] ?? ''}
                                onChange={raw => setAplicaciones(prev => ({ ...prev, [f.id]: raw }))}
                                placeholder="0"
                                className="!py-1 !pl-6 !pr-2 !text-xs font-mono font-medium"
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {excede && (
                <p className="text-red-600 text-xs mt-1 font-medium">
                  El total aplicado ({fmt(totalAplicado)}) supera el valor del recibo ({fmt(valorNum)})
                </p>
              )}
            </div>
          )}

          {mutCreate.isError && (
            <p className="text-red-600 text-sm">
              {(mutCreate.error as any)?.response?.data?.message ?? 'Error al crear recibo'}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={mutCreate.isPending || excede}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
              {mutCreate.isPending ? 'Guardando...' : 'Crear recibo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
