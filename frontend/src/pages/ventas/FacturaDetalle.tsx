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

function fmtDec(n: number) {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}


function numeroALetras(num: number): string {
  const unidades = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
  const especiales = ['once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

  const convertGroup = (n: number): string => {
    let out = ''
    if (n >= 100) {
      if (n === 100) return 'cien'
      out += centenas[Math.floor(n / 100)] + ' '
      n %= 100
    }
    if (n >= 10 && n < 20) {
      if (n - 10 <= 9 && n - 10 >= 1) {
        out += especiales[n - 11] + ' '
      } else {
        out += 'diez '
      }
      return out
    }
    if (n >= 20) {
      if (n === 20) return out + 'veinte '
      if (n < 30) return out + 'veinti' + unidades[n - 20] + ' '
      out += decenas[Math.floor(n / 10)] + ' '
      n %= 10
      if (n > 0) out += 'y '
    }
    if (n > 0) {
      out += unidades[n] + ' '
    }
    return out
  }

  if (num === 0) return 'Cero pesos m/cte'
  let result = ''
  num = Math.floor(num)

  if (num >= 1000000) {
    const mill = Math.floor(num / 1000000)
    result += (mill === 1 ? 'un millón' : convertGroup(mill) + ' millones') + ' '
    num %= 1000000
  }
  if (num >= 1000) {
    const miles = Math.floor(num / 1000)
    result += (miles === 1 ? 'mil' : convertGroup(miles) + ' mil') + ' '
    num %= 1000
  }
  if (num > 0) {
    result += convertGroup(num)
  }

  result = result.trim() + ' pesos m/cte'
  return result.charAt(0).toUpperCase() + result.slice(1)
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
  const empresa = f.empresa || {
    nombre: 'EDATIA S.A.S',
    nit: '900.123.456',
    digitoVerificacion: '7',
    direccion: 'Calle 100 #15-30, Bogotá D.C.',
    telefono: '(601) 555-0199',
    email: 'info@edatia.com',
    regimenFiscal: '48',
    municipio: 'Bogotá',
    pais: 'CO',
    logo: ''
  }
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
        <div className="flex flex-col gap-6">
        {/* Información cabecera (Compact Full-Width Grid) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-4">Información General</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Cliente</p>
              <p className="font-semibold text-slate-800">{f.cliente?.nombre || '—'}</p>
              {f.cliente && (
                <p className="text-xs text-slate-500">{f.cliente.tipoDocumento} {f.cliente.numeroDocumento}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Ciudad</p>
              <p className="font-semibold text-slate-850">
                {f.cliente?.municipio 
                  ? `${f.cliente.municipio}${f.cliente.departamento ? `, ${f.cliente.departamento}` : ''}` 
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Dirección de Despacho</p>
              <p className="font-semibold text-slate-850">{f.direccion || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Teléfono</p>
              <p className="font-semibold text-slate-850">{f.cliente?.telefono || f.cliente?.celular || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Forma de pago</p>
              <p className="font-semibold text-slate-850">{f.formaPago || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Medio de pago</p>
              <p className="font-semibold text-slate-850">{f.medioPago?.replace('_', ' ') || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Vencimiento</p>
              <p className="font-semibold text-slate-850">
                {f.fechaVencimiento ? new Date(f.fechaVencimiento).toLocaleDateString('es-CO') : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Bodega</p>
              <p className="font-semibold text-slate-850">{f.bodega?.nombre || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Vendedor</p>
              <p className="font-semibold text-slate-850">{f.vendedorNombre || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Canal de venta</p>
              <p className="font-semibold text-slate-850">{f.canal || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Nivel de precio</p>
              <p className="font-semibold text-slate-850">{f.nivel || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Sucursal Cliente</p>
              <p className="font-semibold text-slate-850">{f.sucursalCliente || '—'}</p>
            </div>
            <div className="col-span-2 md:col-span-4 lg:col-span-6 border-t border-slate-100 pt-3 mt-1">
              <p className="text-xs text-slate-400 mb-0.5">Observación / Notas</p>
              <p className="text-slate-600 text-xs italic bg-slate-50 border border-slate-100 rounded-xl p-3">
                {f.notas || 'Sin observaciones'}
              </p>
            </div>
          </div>
          
          {f.resolucion && (
            <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500">
              <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Autorización de Facturación DIAN</p>
              <p>
                Resolución No. <span className="font-semibold text-slate-700">{f.resolucion.numeroResolucion}</span> del {new Date(f.resolucion.fechaResolucion).toLocaleDateString('es-CO')}. 
                Vigente hasta {new Date(f.resolucion.fechaVigencia).toLocaleDateString('es-CO')}. Prefijo <span className="font-semibold text-slate-700">{f.resolucion.prefijo || 'Ninguno'}</span>, Rango desde No. <span className="font-semibold text-slate-700">{f.resolucion.numeroInicial}</span> al No. <span className="font-semibold text-slate-700">{f.resolucion.numeroFinal}</span>.
              </p>
            </div>
          )}
        </div>

        {/* Tabla de ítems (Full Width) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Ítems ({f.items?.length ?? 0})</h2>
          </div>
          <div className="overflow-x-auto w-full">
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
                    <td className="px-4 py-3 text-xs text-slate-660">{item.descripcion}</td>
                    <td className="px-4 py-3 text-xs text-right text-slate-700">{item.cantidad} {item.unidad || 'UND'}</td>
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

        {/* Bottom Section: Left (DIAN, Recibos) & Right (Totales) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
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
                        <td className="px-4 py-3 text-xs text-slate-660">
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
          <div className="lg:col-span-1">
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b-2 border-slate-800 pb-4 text-slate-800">
                {/* Logo and Dates */}
                <div className="col-span-1 flex flex-col items-start gap-1">
                  {empresa.logo ? (
                    <img src={empresa.logo} alt="Logo" className="max-h-14 object-contain" />
                  ) : (
                    <div className="h-12 w-12 bg-slate-800 text-white flex items-center justify-center rounded font-black text-lg">ED</div>
                  )}
                  <div className="text-[8px] text-slate-500 mt-2 space-y-0.5 leading-tight">
                    <p><span className="font-bold text-slate-600">Gen:</span> {new Date(f.fecha).toLocaleDateString('es-CO')} {new Date(f.fecha).toTimeString().slice(0, 5)}</p>
                    <p><span className="font-bold text-slate-600">Exp:</span> {new Date(f.fecha).toLocaleDateString('es-CO')} {new Date(f.fecha).toTimeString().slice(0, 5)}</p>
                    {f.fechaVencimiento && (
                      <p><span className="font-bold text-slate-600">Venc:</span> {new Date(f.fechaVencimiento).toLocaleDateString('es-CO')}</p>
                    )}
                  </div>
                </div>
                {/* Company details */}
                <div className="col-span-2 text-center text-[10px] text-slate-650 leading-tight space-y-0.5">
                  <h2 className="text-sm font-extrabold text-slate-800 uppercase">{empresa.nombre}</h2>
                  <p className="font-bold">NIT {empresa.nit}{empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''} · {empresa.regimenFiscal === '48' ? 'Responsable de IVA' : 'No Responsable de IVA'}</p>
                  <p>Dirección: {empresa.direccion || '—'}</p>
                  <p>Tel: {empresa.telefono || '—'} · Correo: {empresa.correoFacturacion || empresa.email || '—'}</p>
                  <p>{empresa.municipio || ''} - {empresa.pais || 'Colombia'}</p>
                </div>
                {/* QR code and Invoice card (Stacked) */}
                <div className="col-span-1 flex flex-col items-end gap-1.5">
                  {f.qrUrl ? (
                    <div className="shrink-0 border border-slate-200 p-0.5 bg-white rounded shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(f.qrUrl)}`} 
                        alt="QR DIAN" 
                        className="w-12 h-12" 
                      />
                    </div>
                  ) : (
                    <div className="shrink-0 border border-slate-200 p-0.5 bg-white rounded shadow-sm">
                      <div className="w-12 h-12 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">QR</div>
                    </div>
                  )}
                  <div className="border border-slate-300 p-1.5 text-center bg-white rounded-md w-full max-w-[170px] shadow-sm">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                      {f.tipoDocumento === 'FVE' ? 'Factura electrónica de venta' : 'Factura de Venta'}
                    </p>
                    <p className="text-xs font-black text-slate-800 mt-1 font-mono">No. {f.numero}</p>
                  </div>
                </div>
              </div>

              {/* Informative Columns */}
              <div className="border-b border-slate-200 pb-4">
                <table className="w-full border-collapse text-[11px]">
                  <tbody>
                    <tr className="border border-slate-200">
                      <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-slate-600 border-r border-slate-200 w-24">Señores</td>
                      <td className="px-2.5 py-1.5 font-semibold text-slate-800 border-r border-slate-200" colSpan={3}>{f.cliente?.nombre || '—'}</td>
                    </tr>
                    <tr className="border border-slate-200">
                      <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-slate-600 border-r border-slate-200 w-24">NIT</td>
                      <td className="px-2.5 py-1.5 font-medium border-r border-slate-200 w-44">{f.cliente?.numeroDocumento}{f.cliente?.digitoVerificacion ? `-${f.cliente.digitoVerificacion}` : ''}</td>
                      <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-slate-600 border-r border-slate-200 w-24">Teléfono</td>
                      <td className="px-2.5 py-1.5 font-medium">{f.cliente?.celular || f.cliente?.telefono || '—'}</td>
                    </tr>
                    <tr className="border border-slate-200">
                      <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-slate-600 border-r border-slate-200 w-24">Dirección</td>
                      <td className="px-2.5 py-1.5 font-medium border-r border-slate-200 w-44">{f.cliente?.direccion || '—'}</td>
                      <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-slate-600 border-r border-slate-200 w-24">Ciudad</td>
                      <td className="px-2.5 py-1.5 font-medium">{f.cliente?.municipio || '—'} {f.cliente?.departamento ? `· ${f.cliente.departamento}` : ''}</td>
                    </tr>
                    {(f.direccion || f.sucursalCliente) && (
                      <tr className="border border-slate-200">
                        <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-indigo-700 border-r border-slate-200 w-24">Dirección recepción</td>
                        <td className="px-2.5 py-1.5 font-semibold text-indigo-900" colSpan={3}>
                          {f.direccion || f.cliente?.direccion || '—'} {f.sucursalCliente ? `(${f.sucursalCliente})` : ''}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                          <td className="py-2.5 px-2 text-right">{Number(item.cantidad).toFixed(2)} {item.unidad || 'UND'}</td>
                          <td className="py-2.5 px-2 text-right">{fmtDec(Number(item.precioUnitario))}</td>
                          <td className="py-2.5 px-2 text-right">{Number(item.descuentoPct || 0) > 0 ? `${item.descuentoPct}%` : '0%'}</td>
                          <td className="py-2.5 px-2 text-right">{tasaIva}%</td>
                          <td className="py-2.5 px-2 text-right font-semibold text-slate-900">{fmtDec(Number(item.total))}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Section: Totals, Payment Info & DIAN Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-xs">
                {/* Left Column: Payment Details & Observaciones (spans 2 columns) */}
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <span className="font-bold text-slate-600">Total items: </span>
                    <span className="text-slate-800 font-semibold">{f.items?.length ?? 0}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-600">Valor en Letras:</p>
                    <p className="text-slate-800 font-medium">{numeroALetras(Number(f.total ?? 0))}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-600">Forma de pago:</p>
                    <p className="text-slate-800 font-medium">{f.formaPago || '—'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-600">Medio de pago:</p>
                    <p className="text-slate-800 font-medium">
                      {f.medioPago?.replace('_', ' ') || '—'} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $ {fmtDec(Number(f.total ?? 0))}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-600">Observaciones:</p>
                    <p className="text-slate-800 font-medium whitespace-pre-line">{f.notas || '—'}</p>
                  </div>
                </div>

                {/* Right Column: Totals Table (spans 1 column) */}
                <div className="md:col-span-1">
                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      <tr className="border border-slate-200">
                        <td className="px-3 py-2 text-slate-700 font-medium border-r border-slate-200">Total Bruto</td>
                        <td className="px-3 py-2 text-right text-slate-800 font-semibold">{fmtDec(Number(f.subtotal ?? 0))}</td>
                      </tr>
                      {Number(f.descuento ?? 0) > 0 && (
                        <tr className="border border-slate-200">
                          <td className="px-3 py-2 text-slate-700 font-medium border-r border-slate-200">Descuento</td>
                          <td className="px-3 py-2 text-right text-slate-800 font-semibold">-{fmtDec(Number(f.descuento))}</td>
                        </tr>
                      )}
                      {Number(f.iva19 ?? 0) > 0 && (
                        <tr className="border border-slate-200">
                          <td className="px-3 py-2 text-slate-700 font-medium border-r border-slate-200">IVA 19%</td>
                          <td className="px-3 py-2 text-right text-slate-800 font-semibold">{fmtDec(Number(f.iva19))}</td>
                        </tr>
                      )}
                      {Number(f.iva5 ?? 0) > 0 && (
                        <tr className="border border-slate-200">
                          <td className="px-3 py-2 text-slate-700 font-medium border-r border-slate-200">IVA 5%</td>
                          <td className="px-3 py-2 text-right text-slate-800 font-semibold">{fmtDec(Number(f.iva5))}</td>
                        </tr>
                      )}
                      {hayRetenciones && (
                        <>
                          {retefuente > 0 && (
                            <tr className="border border-slate-200 text-amber-800">
                              <td className="px-3 py-2 font-medium border-r border-slate-200">ReteFuente</td>
                              <td className="px-3 py-2 text-right font-semibold">-{fmtDec(retefuente)}</td>
                            </tr>
                          )}
                          {reteiva > 0 && (
                            <tr className="border border-slate-200 text-amber-800">
                              <td className="px-3 py-2 font-medium border-r border-slate-200">ReteIVA</td>
                              <td className="px-3 py-2 text-right font-semibold">-{fmtDec(reteiva)}</td>
                            </tr>
                          )}
                          {reteica > 0 && (
                            <tr className="border border-slate-200 text-amber-800">
                              <td className="px-3 py-2 font-medium border-r border-slate-200">ReteICA</td>
                              <td className="px-3 py-2 text-right font-semibold">-{fmtDec(reteica)}</td>
                            </tr>
                          )}
                        </>
                      )}
                      <tr className="border border-slate-250 bg-slate-100 font-bold">
                        <td className="px-3 py-2.5 text-slate-900 border-r border-slate-200">Total a Pagar</td>
                        <td className="px-3 py-2.5 text-right text-slate-900">{fmtDec(Number(f.total ?? 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DIAN Resolution Banner */}
              <div className="bg-slate-100 border border-slate-200 p-4 text-[10px] text-slate-700 space-y-1.5 text-center mt-6 rounded-lg">
                <p className="leading-relaxed">
                  A esta factura de venta aplican las normas relativas a la letra de cambio (artículo 5 Ley 1231 de 2008). Con esta el Comprador declara haber recibido real y materialmente las mercancías o prestación de servicios descritos en este título - Valor.
                  {f.resolucion && (
                    <>
                      {" "}Número Autorización Electrónica <span className="font-bold">{f.resolucion.numeroResolucion}</span> aprobado en {new Date(f.resolucion.fechaResolucion).toLocaleDateString('es-CO')} prefijo <span className="font-bold">{f.resolucion.prefijo || 'Ninguno'}</span> desde el número {f.resolucion.numeroInicial} al {f.resolucion.numeroFinal} Vigencia: {new Date(f.resolucion.fechaVigencia).toLocaleDateString('es-CO')}.
                    </>
                  )}
                </p>
                <p className="font-bold">
                  Responsable de IVA - Actividad Económica {empresa.actividadEconomica || '9329'} Otras actividades recreativas y de esparcimiento n.c.p. Tarifa ICA
                </p>
                {f.cufe && (
                  <p className="font-mono text-[9px] text-slate-650 select-all">
                    CUFE: {f.cufe}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center text-[8px] text-slate-400 mt-4 px-2">
                <div>
                  Firma electrónica: ver en el XML
                </div>
                <div>
                  Fabricante Software: Edatia Software
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



