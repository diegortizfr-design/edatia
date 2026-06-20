import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFactura, emitirFactura, anularFactura, createNotaCredito,
} from '../../services/ventas.service'
import { getDocumentosConfig, incrementarConsecutivo } from '../../services/configuracion.service'
import {
  FileText, CheckCircle, XCircle, AlertTriangle, Send, Download,
  ArrowLeft, CreditCard, QrCode, Hash, Printer, RotateCcw, Plus, Trash2,
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
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [showNcModal, setShowNcModal] = useState(false)

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
          <button onClick={() => setShowPrintPreview(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 bg-white rounded-lg text-sm hover:bg-slate-50 font-medium transition-all active:scale-95 shadow-sm">
            <Printer size={15} /> Ver/Descargar PDF
          </button>
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
            <button onClick={() => setShowNcModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-700 rounded-lg text-sm hover:bg-orange-50 font-medium transition-all active:scale-95">
              <Plus size={15} /> Crear Nota Crédito
            </button>
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
      {mutEmitir.isError && (
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
              {f.vendedorNombre && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Vendedor</p>
                  <p className="font-medium text-slate-700">{f.vendedorNombre}</p>
                </div>
              )}
              {f.canal && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Canal de venta</p>
                  <p className="font-medium text-slate-700">{f.canal}</p>
                </div>
              )}
              {f.nivel && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Nivel de precio</p>
                  <p className="font-medium text-slate-700">{f.nivel}</p>
                </div>
              )}
              {f.resolucion && (
                <div className="col-span-2 md:col-span-3 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500">
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Autorización de Facturación DIAN</p>
                  <p>
                    Resolución No. <span className="font-semibold text-slate-700">{f.resolucion.numeroResolucion}</span> del {new Date(f.resolucion.fechaResolucion).toLocaleDateString('es-CO')}. 
                    Vigente hasta {new Date(f.resolucion.fechaVigencia).toLocaleDateString('es-CO')}. Prefijo <span className="font-semibold text-slate-700">{f.resolucion.prefijo || 'Ninguno'}</span>, Rango desde No. <span className="font-semibold text-slate-700">{f.resolucion.numeroInicial}</span> al No. <span className="font-semibold text-slate-700">{f.resolucion.numeroFinal}</span>.
                  </p>
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

      {/* Vista de Impresión / Formato Gráfico (Voucher) */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-start items-center overflow-y-auto z-50 p-4 md:p-8 select-text">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-4">
            
            {/* Modal Actions Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={18} />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Formato Gráfico de Factura de Venta
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div id="printable-voucher" className="p-8 md:p-12 bg-white space-y-6 text-slate-800 select-text overflow-y-auto">
              
              {/* Header Grid */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold tracking-tight text-indigo-700 font-sans">EDATIA S.A.S</h2>
                  <p className="text-xs text-slate-500 font-medium">NIT: 900.123.456-7 · Régimen Común</p>
                  <p className="text-xs text-slate-400">Teléfono: (601) 555-0199 · info@edatia.com</p>
                  <p className="text-xs text-slate-400">Dirección: Calle 100 #15-30, Bogotá D.C.</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-extrabold inline-block border border-indigo-150">
                    FACTURA ELECTRÓNICA DE VENTA
                  </div>
                  <h1 className="text-xl font-bold font-mono text-slate-800 mt-1">{f.numero}</h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Documento Oficial</p>
                </div>
              </div>

              {/* Informative Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-6">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">ADQUIRENTE (CLIENTE)</h4>
                  <div className="space-y-1 text-slate-650">
                    <p className="font-bold text-slate-800 text-sm">{f.cliente?.nombre}</p>
                    <p className="font-semibold text-slate-700">NIT/CC: {f.cliente?.tipoDocumento} {f.cliente?.numeroDocumento} {f.cliente?.digitoVerificacion ? `-${f.cliente.digitoVerificacion}` : ''}</p>
                    <p><strong>Dirección:</strong> {f.cliente?.direccion || 'N/A'}</p>
                    <p><strong>Ciudad:</strong> {f.cliente?.municipio || 'N/A'} {f.cliente?.departamento ? `· ${f.cliente.departamento}` : ''}</p>
                    <p><strong>Correo:</strong> {f.cliente?.email || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> {f.cliente?.telefono || f.cliente?.celular || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">DETALLE COMERCIAL</h4>
                  <div className="space-y-1 text-slate-650 grid grid-cols-2 gap-x-2">
                    <p><strong>Fecha Emisión:</strong></p>
                    <p>{new Date(f.fecha).toLocaleDateString('es-CO')}</p>
                    {f.fechaVencimiento && (
                      <>
                        <p><strong>Fecha Vencimiento:</strong></p>
                        <p>{new Date(f.fechaVencimiento).toLocaleDateString('es-CO')}</p>
                      </>
                    )}
                    <p><strong>Forma de Pago:</strong></p>
                    <p className="uppercase">{f.formaPago}</p>
                    <p><strong>Medio de Pago:</strong></p>
                    <p className="uppercase">{f.medioPago?.replace('_', ' ')}</p>
                    <p><strong>Vendedor:</strong></p>
                    <p>{f.vendedorNombre || '—'}</p>
                    <p><strong>Canal de Venta:</strong></p>
                    <p>{f.canal || '—'}</p>
                    <p><strong>Nivel de Precio:</strong></p>
                    <p>{f.nivel || '—'}</p>
                    <p><strong>Bodega Egreso:</strong></p>
                    <p>{f.bodega?.nombre || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Detalle de Productos Facturados</h4>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2 px-2 text-left w-24">SKU</th>
                      <th className="py-2 px-2 text-left">Descripción del Producto</th>
                      <th className="py-2 px-2 text-right w-16">Cant.</th>
                      <th className="py-2 px-2 text-right w-24">Precio Unit.</th>
                      <th className="py-2 px-2 text-right w-16">Dto %</th>
                      <th className="py-2 px-2 text-right w-16">IVA %</th>
                      <th className="py-2 px-2 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {f.items?.map((item: any) => {
                      const tasaIva = item.tipoIva === 'IVA_19' ? 19 : item.tipoIva === 'IVA_5' ? 5 : 0
                      return (
                        <tr key={item.id} className="text-slate-700 hover:bg-slate-50/50">
                          <td className="py-2.5 px-2 font-mono text-[10px] text-slate-500">{item.producto?.sku || 'N/A'}</td>
                          <td className="py-2.5 px-2 font-semibold text-slate-800">
                            {item.producto?.nombre || item.descripcion}
                            {item.producto?.nombre && item.descripcion && item.descripcion !== item.producto.nombre && (
                              <span className="block text-[10px] text-slate-450 font-normal mt-0.5">{item.descripcion}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right">{item.cantidad} {item.unidad || 'UND'}</td>
                          <td className="py-2.5 px-2 text-right">{fmt(Number(item.precioUnitario))}</td>
                          <td className="py-2.5 px-2 text-right">{Number(item.descuentoPct || 0) > 0 ? `${item.descuentoPct}%` : '0%'}</td>
                          <td className="py-2.5 px-2 text-right">{tasaIva}%</td>
                          <td className="py-2.5 px-2 text-right font-semibold text-slate-900">{fmt(Number(item.total))}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                <div className="space-y-4">
                  {f.notas && (
                    <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl space-y-1">
                      <h5 className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-1">Notas / Observaciones</h5>
                      <p className="italic">{f.notas}</p>
                    </div>
                  )}
                  {f.resolucion && (
                    <div className="text-[9px] text-slate-400 leading-relaxed font-medium">
                      <p className="font-semibold text-slate-500 uppercase tracking-wider text-[8px] mb-1">Resolución de Facturación DIAN</p>
                      <p>
                        Documento oficial emitido bajo la resolución de autorización de numeración de facturación No. {f.resolucion.numeroResolucion} del {new Date(f.resolucion.fechaResolucion).toLocaleDateString('es-CO')}. Prefijo {f.resolucion.prefijo || '—'}, Rango del No. {f.resolucion.numeroInicial} al No. {f.resolucion.numeroFinal}. Vigencia hasta {new Date(f.resolucion.fechaVigencia).toLocaleDateString('es-CO')}.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 ml-auto w-full max-w-xs">
                  <div className="flex justify-between">
                    <span>Subtotal Bruto:</span>
                    <span>{fmt(Number(f.subtotal ?? 0))}</span>
                  </div>
                  {Number(f.descuento ?? 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento Comercial:</span>
                      <span>-{fmt(Number(f.descuento))}</span>
                    </div>
                  )}
                  {Number(f.iva19 ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span>IVA 19%:</span>
                      <span>{fmt(Number(f.iva19))}</span>
                    </div>
                  )}
                  {Number(f.iva5 ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span>IVA 5%:</span>
                      <span>{fmt(Number(f.iva5))}</span>
                    </div>
                  )}
                  {hayRetenciones && (
                    <div className="border-y border-slate-100 py-1.5 my-1.5 space-y-1">
                      <span className="font-bold text-[9px] text-amber-700 uppercase tracking-wider block">Retenciones Aplicadas:</span>
                      {retefuente > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>ReteFuente:</span>
                          <span>-{fmt(retefuente)}</span>
                        </div>
                      )}
                      {reteiva > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>ReteIVA:</span>
                          <span>-{fmt(reteiva)}</span>
                        </div>
                      )}
                      {reteica > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>ReteICA:</span>
                          <span>-{fmt(reteica)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-slate-900 text-sm border-t border-slate-200 pt-2.5">
                    <span>TOTAL FACTURA:</span>
                    <span>{fmt(Number(f.total ?? 0))}</span>
                  </div>
                  {Number(f.total) !== saldoPendiente && (
                    <div className="space-y-1 pt-1.5 border-t border-dashed border-slate-150 mt-1">
                      <div className="flex justify-between text-green-600">
                        <span>Abonos Recibidos:</span>
                        <span>{fmt(Number(f.total) - saldoPendiente)}</span>
                      </div>
                      <div className={`flex justify-between font-extrabold ${saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        <span>SALDO PENDIENTE:</span>
                        <span>{fmt(saldoPendiente)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* DIAN E-Invoice Info Footer */}
              {f.cufe && (
                <div className="flex gap-4 border-t border-indigo-100 pt-6 text-[10px] bg-slate-50/50 p-4 rounded-xl mt-6">
                  {f.qrUrl && (
                    <div className="shrink-0 border border-slate-200 p-1.5 bg-white rounded-lg self-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(f.qrUrl)}`} 
                        alt="QR DIAN" 
                        className="w-20 h-20" 
                      />
                    </div>
                  )}
                  <div className="space-y-2 flex-1">
                    <div>
                      <p className="font-extrabold text-indigo-800 uppercase tracking-widest text-[8px]">Código Único de Factura Electrónica (CUFE)</p>
                      <p className="font-mono text-[9px] text-slate-650 break-all select-all leading-normal bg-white p-2 border border-slate-100 rounded mt-1">{f.cufe}</p>
                    </div>
                    {f.qrUrl && (
                      <div>
                        <p className="font-extrabold text-indigo-800 uppercase tracking-widest text-[8px]">Enlace Oficial de Validación DIAN</p>
                        <a href={f.qrUrl} target="_blank" rel="noreferrer" className="text-indigo-650 hover:underline break-all font-mono">
                          {f.qrUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Signatures / Audit Log */}
              <div className="grid grid-cols-2 gap-12 pt-14 border-t border-slate-100 text-center text-xs text-slate-500">
                <div className="space-y-2 border-t border-dashed border-slate-200 pt-4 max-w-xs mx-auto w-full">
                  <p className="font-bold text-slate-700">Emitido por (Facturación/Ventas)</p>
                  <p className="text-[10px] text-slate-400">Edatia SaaS Cloud System</p>
                </div>
                <div className="space-y-2 border-t border-dashed border-slate-200 pt-4 max-w-xs mx-auto w-full">
                  <p className="font-bold text-slate-700">Aceptado Adquirente / Cliente</p>
                  <p className="text-[10px] text-slate-400">Nombre, Firma y Sello</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Global CSS Style Tag for printing (hides app layout, shows ONLY the voucher card) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          
          #printable-voucher, #printable-voucher * {
            visibility: visible !important;
          }
          
          #printable-voucher {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0px !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          
          tr {
            page-break-inside: avoid !important;
          }
          
          @page {
            margin: 1.5cm;
          }
        }
      ` }} />

      {showNcModal && (
        <CrearNotaCreditoModal 
          factura={f} 
          onClose={() => setShowNcModal(false)} 
        />
      )}
    </div>
  )
}

function CrearNotaCreditoModal({ factura, onClose }: { factura: any; onClose: () => void }) {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [selectedDocId, setSelectedDocId] = useState('')
  const [motivo, setMotivo] = useState('DEVOLUCION')
  const [descripcion, setDescripcion] = useState('')
  const [ncMode, setNcMode] = useState<'PRODUCTOS' | 'MANUAL'>('PRODUCTOS')

  // Manual values
  const [manualTotal, setManualTotal] = useState('')
  const [manualIva, setManualIva] = useState('IVA_19')

  // Product checklist values
  const [lines, setLines] = useState<any[]>(() =>
    (factura.items ?? []).map((item: any) => ({
      id: item.id,
      productoId: item.productoId,
      descripcion: item.descripcion || item.producto?.nombre,
      maxCantidad: Number(item.cantidad),
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario),
      tipoIva: item.tipoIva,
      checked: true,
    }))
  )

  const { data: docConfigs = [] } = useQuery({
    queryKey: ['documentos-config'],
    queryFn: getDocumentosConfig,
  })

  const ncDocs = useMemo(() => 
    docConfigs.filter((d: any) => d.sigla === 'NC' && d.estado === 'ACTIVO'),
    [docConfigs]
  )

  useEffect(() => {
    if (ncDocs.length > 0 && !selectedDocId) {
      setSelectedDocId(String(ncDocs[0].id))
    }
  }, [ncDocs, selectedDocId])

  const mutIncrementConsecutive = useMutation({
    mutationFn: (id: number) => incrementarConsecutivo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentos-config'] })
    }
  })

  const mutCreate = useMutation({
    mutationFn: createNotaCredito,
    onSuccess: async (data: any) => {
      if (selectedDocId) {
        try {
          await mutIncrementConsecutive.mutateAsync(Number(selectedDocId))
        } catch (e) {
          console.error("Error updating consecutive on server:", e)
        }
      }
      qc.invalidateQueries({ queryKey: ['notas-credito'] })
      qc.invalidateQueries({ queryKey: ['factura', String(factura.id)] })
      onClose()
      navigate(`/ventas/notas-credito/${data.id}`)
    }
  })

  const computedConsecutive = useMemo(() => {
    if (!selectedDocId) return ''
    const doc = docConfigs.find((d: any) => String(d.id) === String(selectedDocId))
    if (!doc) return ''
    return `${doc.prefijo ?? ''}${doc.consecutivoSiguiente}`
  }, [selectedDocId, docConfigs])

  const toggleItem = (id: number) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, checked: !l.checked } : l))
  }

  const updateLine = (id: number, field: string, val: any) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDocId) return alert('Seleccione un documento/prefijo para la Nota Crédito')

    let payloadItems = []
    if (ncMode === 'MANUAL') {
      const val = parseFloat(manualTotal)
      if (isNaN(val) || val <= 0) return alert('Ingrese un valor manual válido mayor a cero')
      payloadItems.push({
        descripcion: `Ajuste de valor manual: ${descripcion || 'Ajuste general'}`,
        cantidad: 1,
        precioUnitario: val,
        tipoIva: manualIva,
      })
    } else {
      const checkedLines = lines.filter(l => l.checked)
      if (checkedLines.length === 0) return alert('Debe seleccionar al menos un producto para la devolución')
      
      for (const line of checkedLines) {
        const c = parseFloat(String(line.cantidad))
        const p = parseFloat(String(line.precioUnitario))
        if (isNaN(c) || c <= 0) return alert(`Cantidad inválida para: ${line.descripcion}`)
        if (c > line.maxCantidad) return alert(`La cantidad para "${line.descripcion}" no puede exceder la facturada (${line.maxCantidad})`)
        if (isNaN(p) || p < 0) return alert(`Precio inválido para: ${line.descripcion}`)
        
        payloadItems.push({
          productoId: line.productoId,
          descripcion: line.descripcion,
          cantidad: c,
          precioUnitario: p,
          tipoIva: line.tipoIva,
        })
      }
    }

    mutCreate.mutate({
      facturaId: factura.id,
      motivo,
      descripcion: descripcion || 'Nota Crédito generada desde Factura',
      numero: computedConsecutive,
      items: payloadItems,
    })
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Crear Nota Crédito de Venta</h2>
            <p className="text-xs text-slate-400 mt-0.5">Asociada a factura: <span className="font-semibold text-slate-650">{factura.numero}</span></p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prefijo Documento */}
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Prefijo / Consecutivo (Documento NC) *</label>
              <select 
                required 
                value={selectedDocId} 
                onChange={e => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                {ncDocs.length === 0 && <option value="">No hay prefijos NC configurados</option>}
                {ncDocs.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.prefijo || 'Sin prefijo'} - Sig. #{d.consecutivoSiguiente})
                  </option>
                ))}
              </select>
              {computedConsecutive && (
                <p className="text-[10px] text-indigo-650 font-bold mt-1">Número calculado: {computedConsecutive}</p>
              )}
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Motivo de Acreditación *</label>
              <select 
                required 
                value={motivo} 
                onChange={e => setMotivo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value="DEVOLUCION">Devolución parcial de bienes/servicios</option>
                <option value="DESCUENTO">Descuento o rebaja comercial general</option>
                <option value="ANULACION">Anulación total de la factura de venta</option>
                <option value="OTRO">Otros motivos de ajuste contable</option>
              </select>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Observaciones / Notas del Documento *</label>
            <textarea
              required
              rows={2}
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Explica detalladamente la razón de la nota crédito..."
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          {/* NC Mode Toggle */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">Método de Ajuste</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input 
                  type="radio" 
                  name="ncMode" 
                  value="PRODUCTOS" 
                  checked={ncMode === 'PRODUCTOS'} 
                  onChange={() => setNcMode('PRODUCTOS')}
                  className="accent-indigo-650"
                />
                Devolución por Ítems/Productos
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input 
                  type="radio" 
                  name="ncMode" 
                  value="MANUAL" 
                  checked={ncMode === 'MANUAL'} 
                  onChange={() => setNcMode('MANUAL')}
                  className="accent-indigo-650"
                />
                Ajuste de Valor Manual
              </label>
            </div>
          </div>

          {/* Mode: MANUAL */}
          {ncMode === 'MANUAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Valor de Ajuste (Bruto sin IVA) *</label>
                <input 
                  type="number" 
                  required
                  min="1" 
                  step="any"
                  placeholder="Ingrese el valor total bruto..."
                  value={manualTotal}
                  onChange={e => setManualTotal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tarifa de IVA Aplicable *</label>
                <select 
                  required 
                  value={manualIva} 
                  onChange={e => setManualIva(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value="IVA_19">IVA 19%</option>
                  <option value="IVA_5">IVA 5%</option>
                  <option value="IVA_0">IVA 0%</option>
                  <option value="EXCLUIDO">Excluido / No Sujeto</option>
                </select>
              </div>
            </div>
          )}

          {/* Mode: PRODUCTOS */}
          {ncMode === 'PRODUCTOS' && (
            <div className="space-y-2.5">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest">Seleccionar Ítems a Acreditar</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs bg-white">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                    <tr>
                      <th className="w-10 px-3 py-2 text-center"></th>
                      <th className="px-3 py-2 text-left">Ítem / Descripción</th>
                      <th className="px-3 py-2 text-right w-20">Cant. Fact.</th>
                      <th className="px-3 py-2 text-right w-24">Cant. Dev.</th>
                      <th className="px-3 py-2 text-right w-28">Precio Acreditado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((l: any) => (
                      <tr key={l.id} className={`hover:bg-slate-50/50 ${!l.checked ? 'opacity-60 bg-slate-50/20' : ''}`}>
                        <td className="px-3 py-2.5 text-center">
                          <input 
                            type="checkbox" 
                            checked={l.checked} 
                            onChange={() => toggleItem(l.id)}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-800">{l.descripcion}</p>
                          <span className="text-[10px] text-slate-400 font-mono">IVA: {l.tipoIva.replace('_', ' ')}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-500">{l.maxCantidad}</td>
                        <td className="px-3 py-2.5">
                          <input 
                            type="number" 
                            disabled={!l.checked}
                            required={l.checked}
                            min="0.001" 
                            step="any"
                            max={l.maxCantidad}
                            value={l.cantidad}
                            onChange={e => updateLine(l.id, 'cantidad', e.target.value)}
                            className="w-full px-2 py-1 text-right border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input 
                            type="number" 
                            disabled={!l.checked}
                            required={l.checked}
                            min="0" 
                            step="any"
                            value={l.precioUnitario}
                            onChange={e => updateLine(l.id, 'precioUnitario', e.target.value)}
                            className="w-full px-2 py-1 text-right border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white disabled:opacity-50"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mutCreate.isError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-800 text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{(mutCreate.error as any)?.response?.data?.message ?? 'Error al procesar la Nota Crédito'}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-650 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={mutCreate.isPending}
            className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md active:scale-95"
          >
            {mutCreate.isPending ? 'Creando Nota...' : 'Crear Nota Crédito'}
          </button>
        </div>

      </div>
    </div>
  )
}



