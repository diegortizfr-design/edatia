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
  const empresa = nc.empresa || {
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

      <div className="flex flex-col gap-6">
        {/* Información General (Compact Full-Width Grid) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-4">Información General</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Cliente</p>
              <p className="font-semibold text-slate-800">{nc.cliente?.nombre || '—'}</p>
              {nc.cliente && (
                <p className="text-xs text-slate-500">{nc.cliente.tipoDocumento} {nc.cliente.numeroDocumento}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Ciudad</p>
              <p className="font-semibold text-slate-850">
                {nc.cliente?.municipio 
                  ? `${nc.cliente.municipio}${nc.cliente.departamento ? `, ${nc.cliente.departamento}` : ''}` 
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Dirección de Despacho</p>
              <p className="font-semibold text-slate-850">
                {nc.factura?.direccion || nc.cliente?.direccion || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Teléfono</p>
              <p className="font-semibold text-slate-850">{nc.cliente?.telefono || nc.cliente?.celular || '—'}</p>
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
              <p className="font-semibold text-slate-850 mt-0.5">{MOTIVO_LABEL[nc.motivo] ?? nc.motivo}</p>
            </div>
            <div className="col-span-2 md:col-span-4 lg:col-span-6 border-t border-slate-100 pt-3 mt-1">
              <p className="text-xs text-slate-400 mb-0.5">Observación / Notas</p>
              <p className="text-slate-600 text-xs italic bg-slate-50 border border-slate-100 rounded-xl p-3">
                {nc.descripcion || 'Sin observaciones'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de ítems (Full Width) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Productos Acreditados ({nc.items?.length ?? 0})</h2>
          </div>
          <div className="overflow-x-auto w-full">
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

        {/* Bottom Section: Left (DIAN info if emitted) & Right (Totals) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* DIAN E-Invoice Info Footer (CUDE + QR) */}
            {nc.estado === 'EMITIDA' && (
              <div className="flex gap-4 border border-indigo-200 bg-indigo-50/50 p-4 rounded-xl">
                <div className="shrink-0 border border-slate-200 p-1.5 bg-white rounded-lg self-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://catalogo-vpfe.dian.gov.co/User/SearchDocument?uuid=' + (nc.cufde || 'simulated-uuid-cude-dian-edatia'))}`} 
                    alt="QR DIAN" 
                    className="w-16 h-16" 
                  />
                </div>
                <div className="space-y-1.5 flex-1 text-xs">
                  <div>
                    <p className="font-bold text-indigo-850 uppercase tracking-wider text-[10px]">Código Único de Documento Electrónico (CUDE)</p>
                    <p className="font-mono text-[9px] text-slate-655 break-all select-all leading-normal bg-white p-2 border border-slate-100 rounded mt-1">
                      {nc.cufde || '555a1239f88c889a77ef77db8890123cbef890121111904a88bc98dbe88cbfa11234c000'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Totales derecho */}
          <div className="lg:col-span-1">
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
                    <p><span className="font-bold text-slate-600">Gen:</span> {new Date(nc.fecha || nc.createdAt).toLocaleDateString('es-CO')} {new Date(nc.fecha || nc.createdAt).toTimeString().slice(0, 5)}</p>
                    {nc.facturaId && (
                      <p><span className="font-bold text-slate-600">Ref:</span> {nc.factura?.prefijo || ''}{nc.factura?.numero}</p>
                    )}
                    <p><span className="font-bold text-slate-600">Motivo:</span> {nc.motivo === 'DEVOLUCION' ? 'Devolución' : nc.motivo === 'DESCUENTO' ? 'Descuento' : nc.motivo === 'ANULACION' ? 'Anulación' : 'Otro'}</p>
                  </div>
                </div>
                {/* Company details */}
                <div className="col-span-2 text-center text-[10px] text-slate-655 leading-tight space-y-0.5">
                  <h2 className="text-sm font-extrabold text-slate-800 uppercase">{empresa.nombre}</h2>
                  <p className="font-bold">NIT {empresa.nit}{empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''} · {empresa.regimenFiscal === '48' ? 'Responsable de IVA' : 'No Responsable de IVA'}</p>
                  <p>Dirección: {empresa.direccion || '—'}</p>
                  <p>Tel: {empresa.telefono || '—'} · Correo: {empresa.correoFacturacion || empresa.email || '—'}</p>
                  <p>{empresa.municipio || ''} - {empresa.pais || 'Colombia'}</p>
                </div>
                {/* QR code and NC card (Stacked) */}
                <div className="col-span-1 flex flex-col items-end gap-1.5">
                  <div className="shrink-0 border border-slate-200 p-0.5 bg-white rounded shadow-sm">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent('https://catalogo-vpfe.dian.gov.co/User/SearchDocument?uuid=' + (nc.cufde || 'simulated-uuid-cude-dian-edatia'))}`} 
                      alt="QR DIAN" 
                      className="w-12 h-12" 
                    />
                  </div>
                  <div className="border border-slate-350 p-1.5 text-center bg-white rounded-md w-full max-w-[170px] shadow-sm">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                      Nota Crédito de Venta
                    </p>
                    <p className="text-xs font-black text-slate-800 mt-1 font-mono">No. {nc.numero}</p>
                  </div>
                </div>
              </div>

              {/* Informative Columns */}
              <div className="border-b border-slate-200 pb-4">
                <table className="w-full border-collapse text-[11px]">
                  <tbody>
                    <tr className="border border-slate-200">
                      <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-slate-600 border-r border-slate-200 w-24">Señores</td>
                      <td className="px-2.5 py-1.5 font-semibold text-slate-800 border-r border-slate-200" colSpan={3}>{nc.cliente?.nombre || '—'}</td>
                    </tr>
                    <tr className="border border-slate-200">
                      <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-slate-600 border-r border-slate-200 w-24">NIT</td>
                      <td className="px-2.5 py-1.5 font-medium border-r border-slate-200 w-44">{nc.cliente?.numeroDocumento}{nc.cliente?.digitoVerificacion ? `-${nc.cliente.digitoVerificacion}` : ''}</td>
                      <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-slate-600 border-r border-slate-200 w-24">Teléfono</td>
                      <td className="px-2.5 py-1.5 font-medium">{nc.cliente?.celular || nc.cliente?.telefono || '—'}</td>
                    </tr>
                    <tr className="border border-slate-200">
                      <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-slate-600 border-r border-slate-200 w-24">Dirección</td>
                      <td className="px-2.5 py-1.5 font-medium border-r border-slate-200 w-44">{nc.cliente?.direccion || '—'}</td>
                      <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-slate-600 border-r border-slate-200 w-24">Ciudad</td>
                      <td className="px-2.5 py-1.5 font-medium">{nc.cliente?.municipio || '—'} {nc.cliente?.departamento ? `· ${nc.cliente.departamento}` : ''}</td>
                    </tr>
                    {(nc.factura?.direccion || nc.factura?.sucursalCliente) && (
                      <tr className="border border-slate-200">
                        <td className="bg-slate-100/80 px-2.5 py-1.5 font-bold text-indigo-700 border-r border-slate-200 w-24">Dirección recepción</td>
                        <td className="px-2.5 py-1.5 font-semibold text-indigo-900" colSpan={3}>
                          {nc.factura?.direccion || nc.cliente?.direccion || '—'} {nc.factura?.sucursalCliente ? `(${nc.factura.sucursalCliente})` : ''}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                          <td className="py-2.5 px-2 text-right">{Number(item.cantidad).toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-right">{fmtDec(Number(item.precioUnitario))}</td>
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
                {/* Left Column: Observaciones & Info */}
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <span className="font-bold text-slate-600">Total items: </span>
                    <span className="text-slate-800 font-semibold">{nc.items?.length ?? 0}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-600">Valor en Letras:</p>
                    <p className="text-slate-800 font-medium">{numeroALetras(Number(nc.total ?? 0))}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-600">Observaciones:</p>
                    <p className="text-slate-800 font-medium whitespace-pre-line">{nc.descripcion || '—'}</p>
                  </div>
                </div>

                {/* Right Column: Totals Table */}
                <div className="md:col-span-1">
                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      <tr className="border border-slate-200">
                        <td className="px-3 py-2 text-slate-700 font-medium border-r border-slate-200">Subtotal Acreditado</td>
                        <td className="px-3 py-2 text-right text-slate-800 font-semibold">{fmtDec(Number(nc.subtotal ?? 0))}</td>
                      </tr>
                      {Number(nc.iva ?? 0) > 0 && (
                        <tr className="border border-slate-200">
                          <td className="px-3 py-2 text-slate-700 font-medium border-r border-slate-200">IVA Liquidado</td>
                          <td className="px-3 py-2 text-right text-slate-800 font-semibold">{fmtDec(Number(nc.iva ?? 0))}</td>
                        </tr>
                      )}
                      <tr className="border border-slate-250 bg-slate-100 font-bold">
                        <td className="px-3 py-2.5 text-slate-900 border-r border-slate-200">Total Acreditado</td>
                        <td className="px-3 py-2.5 text-right text-slate-900">{fmtDec(Number(nc.total ?? 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DIAN E-Invoice Info Footer (CUDE + QR) */}
              <div className="bg-slate-100 border border-slate-200 p-4 text-[10px] text-slate-700 space-y-1.5 text-center mt-6 rounded-lg">
                <p className="leading-relaxed">
                  Este documento es una representación gráfica de una nota crédito electrónica de venta y cumple con los requisitos técnicos exigidos por la DIAN.
                </p>
                <p className="font-bold">
                  Responsable de IVA - Actividad Económica {empresa.actividadEconomica || '9329'} Otras actividades recreativas y de esparcimiento n.c.p. Tarifa ICA
                </p>
                {nc.estado === 'EMITIDA' && nc.cufde && (
                  <p className="font-mono text-[9px] text-slate-655 select-all">
                    CUDE: {nc.cufde}
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
    </div>
  )
}
