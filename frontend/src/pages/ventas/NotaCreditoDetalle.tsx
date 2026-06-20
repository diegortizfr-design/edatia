import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotaCredito, emitirNotaCredito, anularNotaCredito,
} from '../../services/ventas.service'
import {
  FileText, CheckCircle, XCircle, AlertTriangle, Send, Download,
  ArrowLeft, CreditCard, QrCode, Hash, Printer, RotateCcw, Link2,
} from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: 'bg-slate-100 text-slate-600',
  EMITIDA:  'bg-blue-100 text-blue-700',
  ANULADA:  'bg-red-100 text-red-700',
}

const DIAN_COLOR: Record<string, string> = {
  PENDIENTE:  'bg-slate-100 text-slate-600',
  GENERADA:   'bg-blue-100 text-blue-700',
  ACEPTADA:   'bg-green-100 text-green-700',
  RECHAZADA:  'bg-red-100 text-red-700',
}

const MOTIVO_LABEL: Record<string, string> = {
  DEVOLUCION: 'Devolución parcial de bienes/servicios',
  DESCUENTO:  'Descuento o rebaja comercial general',
  ANULACION:  'Anulación total de la factura de venta',
  OTRO:       'Otros motivos de ajuste contable',
}

export function NotaCreditoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmAnular, setConfirmAnular] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)

  const { data: notaCredito, isLoading, error } = useQuery({
    queryKey: ['nota-credito', id],
    queryFn: () => getNotaCredito(Number(id)),
    enabled: !!id,
  })

  const mutEmitir = useMutation({
    mutationFn: () => emitirNotaCredito(Number(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nota-credito', id] }),
  })

  const mutAnular = useMutation({
    mutationFn: () => anularNotaCredito(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nota-credito', id] })
      setConfirmAnular(false)
    },
  })

  if (isLoading) return <div className="flex items-center justify-center py-24 text-slate-400">Cargando nota crédito...</div>
  if (error || !notaCredito) return <div className="flex items-center justify-center py-24 text-red-500">Nota crédito no encontrada</div>

  const nc = notaCredito as any

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/ventas/notas-credito')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" />
              Nota Crédito {nc.numero}
            </h1>
            <p className="text-slate-550 text-sm mt-0.5">
              {new Date(nc.fecha || nc.createdAt).toLocaleDateString('es-CO', { dateStyle: 'full' })}
            </p>
          </div>
        </div>

        {/* Badges de estado */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ESTADO_COLOR[nc.estado] ?? 'bg-slate-100 text-slate-650'}`}>
            {nc.estado}
          </span>
          {nc.estadoDIAN && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${DIAN_COLOR[nc.estadoDIAN] ?? 'bg-slate-100 text-slate-650'}`}>
              DIAN: {nc.estadoDIAN}
            </span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPrintPreview(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 bg-white rounded-lg text-sm hover:bg-slate-50 font-medium transition-all active:scale-95 shadow-sm">
            <Printer size={15} /> Ver/Descargar PDF
          </button>

          {nc.estado === 'BORRADOR' && (
            <button onClick={() => mutEmitir.mutate()} disabled={mutEmitir.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 shadow-md">
              <Send size={15} />
              {mutEmitir.isPending ? 'Emitiendo...' : 'Emitir Nota Crédito'}
            </button>
          )}

          {nc.estado === 'BORRADOR' && !confirmAnular && (
            <button onClick={() => setConfirmAnular(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-650 rounded-lg text-sm hover:bg-red-50 font-medium transition-all active:scale-95">
              <XCircle size={15} /> Revertir (Anular)
            </button>
          )}

          {confirmAnular && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-xs text-red-700 font-medium">¿Confirmar reversión?</span>
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
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-800 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            {(mutEmitir.error as any)?.response?.data?.message ?? 'Error al emitir la Nota Crédito'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Información general */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-4">Información General</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Cliente</p>
                <p className="font-semibold text-slate-850">{nc.cliente?.nombre}</p>
                <p className="text-xs text-slate-500">{nc.cliente?.tipoDocumento} {nc.cliente?.numeroDocumento}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Cruce / Referencia</p>
                {nc.facturaId ? (
                  <Link 
                    to={`/ventas/facturas/${nc.facturaId}`}
                    className="font-semibold text-indigo-650 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Link2 size={13} />
                    Factura {nc.factura?.prefijo || ''}{nc.factura?.numero}
                  </Link>
                ) : (
                  <p className="font-medium text-amber-700 mt-0.5 italic">Ajuste libre (Sin Factura)</p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-0.5">Motivo</p>
                <p className="font-medium text-slate-700 mt-0.5">{MOTIVO_LABEL[nc.motivo] ?? nc.motivo}</p>
              </div>

              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-slate-400 mb-0.5">Observación / Notas</p>
                <p className="text-slate-650 text-xs mt-0.5 bg-slate-50 border border-slate-100 rounded-xl p-3 italic">
                  {nc.descripcion || 'Sin observaciones registradas.'}
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de ítems */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Productos Acreditados ({nc.items?.length ?? 0})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2.5 text-left font-semibold">Producto / Descripción</th>
                    <th className="px-4 py-2.5 text-right font-semibold w-24">Cant.</th>
                    <th className="px-4 py-2.5 text-right font-semibold w-32">Precio Unitario</th>
                    <th className="px-4 py-2.5 text-left font-semibold w-28">IVA</th>
                    <th className="px-4 py-2.5 text-right font-semibold w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {(nc.items ?? []).map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-slate-800">{item.descripcion}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-right text-slate-705 font-medium">
                        {Number(item.cantidad)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-right text-slate-705 font-medium">
                        {fmt(Number(item.precioUnitario))}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-150">
                          {item.tipoIva.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-right font-extrabold text-slate-900">
                        {fmt(Number(item.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Totales derecho */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-4">
            <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-4">Resumen de Ajuste</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Bruto</span>
                <span>{fmt(Number(nc.subtotal ?? 0))}</span>
              </div>
              <div className="flex justify-between text-slate-550">
                <span>Impuesto IVA</span>
                <span>{fmt(Number(nc.iva ?? 0))}</span>
              </div>
              <div className="border-t border-slate-200 pt-3.5 flex justify-between font-extrabold text-base">
                <span className="text-slate-800">TOTAL CREDITADO</span>
                <span className="text-indigo-700">{fmt(Number(nc.total ?? 0))}</span>
              </div>
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
                  Formato Gráfico de Nota Crédito de Venta
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
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-xl text-xs font-bold transition-all"
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
                    NOTA CRÉDITO DE VENTA
                  </div>
                  <h1 className="text-xl font-bold font-mono text-slate-800 mt-1">{nc.numero}</h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Documento Contable de Ajuste</p>
                </div>
              </div>

              {/* Informative Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-6">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">ADQUIRENTE (CLIENTE)</h4>
                  <div className="space-y-1 text-slate-650">
                    <p className="font-bold text-slate-800 text-sm">{nc.cliente?.nombre}</p>
                    <p className="font-semibold text-slate-700">NIT/CC: {nc.cliente?.tipoDocumento} {nc.cliente?.numeroDocumento} {nc.cliente?.digitoVerificacion ? `-${nc.cliente.digitoVerificacion}` : ''}</p>
                    <p><strong>Dirección:</strong> {nc.cliente?.direccion || 'N/A'}</p>
                    <p><strong>Ciudad:</strong> {nc.cliente?.municipio || 'N/A'} {nc.cliente?.departamento ? `· ${nc.cliente.departamento}` : ''}</p>
                    <p><strong>Correo:</strong> {nc.cliente?.email || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> {nc.cliente?.telefono || nc.cliente?.celular || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">DETALLE DE AJUSTE</h4>
                  <div className="space-y-1.5 text-slate-650 grid grid-cols-2 gap-x-2">
                    <p><strong>Fecha Ajuste:</strong></p>
                    <p>{new Date(nc.fecha || nc.createdAt).toLocaleDateString('es-CO')}</p>
                    <p><strong>Documento Afectado:</strong></p>
                    <p className="font-semibold text-indigo-700">
                      {nc.facturaId ? `Factura ${nc.factura?.prefijo || ''}${nc.factura?.numero}` : 'Sin Factura (Ajuste Libre)'}
                    </p>
                    <p><strong>Motivo DIAN:</strong></p>
                    <p>{MOTIVO_LABEL[nc.motivo] ?? nc.motivo}</p>
                    <p><strong>Estado Documento:</strong></p>
                    <p className="uppercase font-bold">{nc.estado}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Detalle de Conceptos Acreditados</h4>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2 px-2 text-left">Concepto / Descripción del Ajuste</th>
                      <th className="py-2 px-2 text-right w-20">Cantidad</th>
                      <th className="py-2 px-2 text-right w-28">Precio Unitario</th>
                      <th className="py-2 px-2 text-right w-20">Tarifa IVA</th>
                      <th className="py-2 px-2 text-right w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {nc.items?.map((item: any) => {
                      const tasaIva = item.tipoIva === 'IVA_19' ? 19 : item.tipoIva === 'IVA_5' ? 5 : 0
                      return (
                        <tr key={item.id} className="text-slate-700 hover:bg-slate-50/50">
                          <td className="py-2.5 px-2 font-semibold text-slate-800">{item.descripcion}</td>
                          <td className="py-2.5 px-2 text-right">{Number(item.cantidad)}</td>
                          <td className="py-2.5 px-2 text-right">{fmt(Number(item.precioUnitario))}</td>
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
                <div>
                  {nc.descripcion && (
                    <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl space-y-1">
                      <h5 className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-1">Notas / Observaciones de Ajuste</h5>
                      <p className="italic">{nc.descripcion}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-650 ml-auto w-full max-w-xs">
                  <div className="flex justify-between">
                    <span>Subtotal Acreditado:</span>
                    <span>{fmt(Number(nc.subtotal ?? 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impuesto IVA Liquidado:</span>
                    <span>{fmt(Number(nc.iva ?? 0))}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900 text-sm border-t border-slate-200 pt-2.5">
                    <span>VALOR TOTAL AJUSTE:</span>
                    <span>{fmt(Number(nc.total ?? 0))}</span>
                  </div>
                </div>
              </div>

              {/* DIAN E-Invoice Info Footer (CUDE + QR) */}
              {nc.estado === 'EMITIDA' && (
                <div className="flex gap-4 border-t border-indigo-100 pt-6 text-[10px] bg-slate-50/50 p-4 rounded-xl mt-6">
                  <div className="shrink-0 border border-slate-200 p-1.5 bg-white rounded-lg self-center">
                    {/* Generar un QR simulado con la url de validación */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://catalogo-vpfe.dian.gov.co/User/SearchDocument?uuid=' + (nc.cufde || 'simulated-uuid-cude-dian-edatia'))}`} 
                      alt="QR DIAN" 
                      className="w-20 h-20" 
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div>
                      <p className="font-extrabold text-indigo-800 uppercase tracking-widest text-[8px]">Código Único de Documento Electrónico (CUDE)</p>
                      <p className="font-mono text-[9px] text-slate-650 break-all select-all leading-normal bg-white p-2 border border-slate-100 rounded mt-1">
                        {nc.cufde || '555a1239f88c889a77ef77db8890123cbef890121111904a88bc98dbe88cbfa11234c000'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 leading-normal">
                        Este documento es una representación gráfica de una nota crédito electrónica de venta y cumple con los requisitos técnicos exigidos por la DIAN.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Signatures / Audit Log */}
              <div className="grid grid-cols-2 gap-12 pt-14 border-t border-slate-100 text-center text-xs text-slate-500">
                <div className="space-y-2 border-t border-dashed border-slate-200 pt-4 max-w-xs mx-auto w-full">
                  <p className="font-bold text-slate-700">Autorizado por (Contabilidad/Gerencia)</p>
                  <p className="text-[10px] text-slate-400">Edatia SaaS Cloud System</p>
                </div>
                <div className="space-y-2 border-t border-dashed border-slate-200 pt-4 max-w-xs mx-auto w-full">
                  <p className="font-bold text-slate-700">Firma Recibido / Cliente</p>
                  <p className="text-[10px] text-slate-400">Nombre, Cédula y Fecha</p>
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
    </div>
  )
}
