import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFactura, emitirFactura, anularFactura,
} from '../../services/ventas.service'
import {
  FileText, CheckCircle, XCircle, AlertTriangle, Send, Download,
  ArrowLeft, CreditCard, QrCode, Hash,
} from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: 'bg-slate-100 text-slate-600',
  EMITIDA:  'bg-blue-100 text-blue-700',
  PAGADA:   'bg-green-100 text-green-700',
  ANULADA:  'bg-red-100 text-red-700',
  VENCIDA:  'bg-amber-100 text-amber-700',
}

const DIAN_COLOR: Record<string, string> = {
  PENDIENTE:  'bg-slate-100 text-slate-600',
  GENERADA:   'bg-blue-100 text-blue-700',
  ENVIADA:    'bg-indigo-100 text-indigo-700',
  ACEPTADA:   'bg-green-100 text-green-700',
  RECHAZADA:  'bg-red-100 text-red-700',
}

export function FacturaDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmAnular, setConfirmAnular] = useState(false)

  const { data: factura, isLoading, error } = useQuery({
    queryKey: ['factura', id],
    queryFn: () => getFactura(Number(id)),
    enabled: !!id,
  })

  const mutEmitir = useMutation({
    mutationFn: () => emitirFactura(Number(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['factura', id] }),
  })

  const mutAnular = useMutation({
    mutationFn: () => anularFactura(Number(id)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['factura', id] }); setConfirmAnular(false) },
  })

  if (isLoading) return <div className="flex items-center justify-center py-24 text-slate-400">Cargando factura...</div>
  if (error || !factura) return <div className="flex items-center justify-center py-24 text-red-500">Factura no encontrada</div>

  const f = factura as any
  const retefuente = Number(f.retefuente ?? 0)
  const reteiva    = Number(f.reteiva ?? 0)
  const reteica    = Number(f.reteica ?? 0)
  const hayRetenciones = retefuente + reteiva + reteica > 0
  const saldoPendiente = Number(f.saldo ?? 0)

  const xmlUrl = `/api/ventas/facturas/${id}/xml`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/ventas/facturas')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" />
              Factura {f.numero}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {new Date(f.fecha).toLocaleDateString('es-CO', { dateStyle: 'full' })}
            </p>
          </div>
        </div>

        {/* Badges de estado */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ESTADO_COLOR[f.estado] ?? 'bg-slate-100 text-slate-600'}`}>
            {f.estado}
          </span>
          {f.estadoDIAN && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${DIAN_COLOR[f.estadoDIAN] ?? 'bg-slate-100 text-slate-600'}`}>
              DIAN: {f.estadoDIAN}
            </span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {f.estado === 'BORRADOR' && (
            <button onClick={() => mutEmitir.mutate()} disabled={mutEmitir.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              <Send size={15} />
              {mutEmitir.isPending ? 'Emitiendo...' : 'Emitir Factura'}
            </button>
          )}
          {f.xmlDIAN && (
            <a href={xmlUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
              <Download size={15} /> XML DIAN
            </a>
          )}
          {f.estado === 'EMITIDA' && (
            <Link to={`/ventas/notas-credito?facturaId=${id}`}
              className="flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-700 rounded-lg text-sm hover:bg-orange-50">
              <XCircle size={15} /> Nota Crédito
            </Link>
          )}
          {['BORRADOR', 'EMITIDA'].includes(f.estado) && !confirmAnular && (
            <button onClick={() => setConfirmAnular(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
              <XCircle size={15} /> Anular
            </button>
          )}
          {confirmAnular && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-xs text-red-700 font-medium">¿Confirmar anulación?</span>
              <button onClick={() => mutAnular.mutate()} disabled={mutAnular.isPending}
                className="text-xs font-bold text-red-600 hover:text-red-800">
                {mutAnular.isPending ? 'Anulando...' : 'Sí, anular'}
              </button>
              <button onClick={() => setConfirmAnular(false)} className="text-xs text-slate-500 hover:text-slate-700">No</button>
            </div>
          )}
        </div>
      </div>

      {/* Error de emitir */}
      {mutEmitir.error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span className="text-red-800 text-sm">
            {(mutEmitir.error as any)?.response?.data?.message ?? 'Error al emitir la factura'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Información cabecera */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-4">Información</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Cliente</p>
                <p className="font-semibold text-slate-800">{f.cliente?.nombre}</p>
                <p className="text-xs text-slate-500">{f.cliente?.tipoDocumento} {f.cliente?.numeroDocumento}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Forma de pago</p>
                <p className="font-medium text-slate-700">{f.formaPago}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Medio de pago</p>
                <p className="font-medium text-slate-700">{f.medioPago?.replace('_', ' ')}</p>
              </div>
              {f.fechaVencimiento && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Vencimiento</p>
                  <p className="font-medium text-slate-700">{new Date(f.fechaVencimiento).toLocaleDateString('es-CO')}</p>
                </div>
              )}
              {f.bodega && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Bodega</p>
                  <p className="font-medium text-slate-700">{f.bodega.nombre}</p>
                </div>
              )}
              {f.notas && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-xs text-slate-400 mb-0.5">Notas</p>
                  <p className="text-slate-600 text-xs">{f.notas}</p>
                </div>
              )}
            </div>
          </div>

          {/* DIAN info */}
          {f.cufe && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-indigo-800 text-sm flex items-center gap-2">
                <CheckCircle size={15} /> Información DIAN
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-indigo-500 mb-0.5 flex items-center gap-1"><Hash size={11} /> CUFE</p>
                  <p className="font-mono text-[10px] text-indigo-900 break-all bg-white/60 rounded p-2">{f.cufe}</p>
                </div>
                {f.qrUrl && (
                  <div>
                    <p className="text-xs text-indigo-500 mb-0.5 flex items-center gap-1"><QrCode size={11} /> QR DIAN</p>
                    <a href={f.qrUrl} target="_blank" rel="noreferrer"
                      className="text-[10px] text-indigo-700 underline break-all">
                      {f.qrUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabla de ítems */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Ítems ({f.items?.length ?? 0})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2.5 text-left font-semibold">Producto</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Descripción</th>
                    <th className="px-4 py-2.5 text-right font-semibold w-16">Cant.</th>
                    <th className="px-4 py-2.5 text-right font-semibold w-28">Precio</th>
                    <th className="px-4 py-2.5 text-right font-semibold w-16">Dto %</th>
                    <th className="px-4 py-2.5 text-left font-semibold w-24">IVA</th>
                    <th className="px-4 py-2.5 text-right font-semibold w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(f.items ?? []).map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-slate-800">{item.producto?.nombre}</p>
                        <p className="text-xs text-slate-400">{item.producto?.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{item.descripcion}</td>
                      <td className="px-4 py-3 text-xs text-right text-slate-700">{item.cantidad} {item.unidad}</td>
                      <td className="px-4 py-3 text-xs text-right text-slate-700">{fmt(Number(item.precioUnitario))}</td>
                      <td className="px-4 py-3 text-xs text-right text-slate-600">{item.descuentoPct}%</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {item.tipoIva}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-semibold text-slate-700">
                        {fmt(Number(item.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historial de recibos */}
          {f.recibos?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <CreditCard size={15} className="text-green-600" /> Pagos recibidos
                </h2>
                <span className="text-xs text-slate-400">{f.recibos.length} pago(s)</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2.5 text-left font-semibold">Recibo</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Fecha</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {f.recibos.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-700">{r.recibo?.numero}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {r.recibo?.fecha ? new Date(r.recibo.fecha).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-semibold text-green-700">
                        {fmt(Number(r.recibo?.valor ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Columna derecha: totales */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-4">
            <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-4">Totales</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal bruto</span>
                <span>{fmt(Number(f.subtotal ?? 0))}</span>
              </div>
              {Number(f.descuento ?? 0) > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Descuento</span>
                  <span>-{fmt(Number(f.descuento))}</span>
                </div>
              )}
              {Number(f.iva19 ?? 0) > 0 && (
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>IVA 19%</span>
                  <span>{fmt(Number(f.iva19))}</span>
                </div>
              )}
              {Number(f.iva5 ?? 0) > 0 && (
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>IVA 5%</span>
                  <span>{fmt(Number(f.iva5))}</span>
                </div>
              )}

              {hayRetenciones && (
                <div className="border-t border-dashed border-slate-100 pt-2 mt-2 space-y-1.5">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Retenciones</p>
                  {retefuente > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>ReteFuente</span>
                      <span>-{fmt(retefuente)}</span>
                    </div>
                  )}
                  {reteiva > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>ReteIVA</span>
                      <span>-{fmt(reteiva)}</span>
                    </div>
                  )}
                  {reteica > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>ReteICA</span>
                      <span>-{fmt(reteica)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-base">
                <span className="text-slate-800">TOTAL</span>
                <span className="text-indigo-700">{fmt(Number(f.total ?? 0))}</span>
              </div>

              {Number(f.total) !== saldoPendiente && (
                <>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Pagado</span>
                    <span>{fmt(Number(f.total) - saldoPendiente)}</span>
                  </div>
                  <div className={`flex justify-between font-bold ${saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <span>Saldo</span>
                    <span>{fmt(saldoPendiente)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Botón cobrar */}
            {['EMITIDA', 'VENCIDA'].includes(f.estado) && saldoPendiente > 0 && (
              <Link to={`/ventas/recibos?clienteId=${f.clienteId}`}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                <CreditCard size={15} /> Registrar pago
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
