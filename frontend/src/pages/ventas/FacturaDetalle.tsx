import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFactura, emitirFactura, anularFactura, createNotaCredito,
} from '../../services/ventas.service'
import { getDocumentosConfig, incrementarConsecutivo, getEmpresaConfig } from '../../services/configuracion.service'
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
  CREADA:   'bg-slate-100 text-slate-600 border border-slate-200',
  EMITIDA:  'bg-emerald-50 text-emerald-700 border border-emerald-100',
  PAGADA:   'bg-green-50 text-green-700 border border-green-100',
  ANULADA:  'bg-red-50 text-red-700 border border-red-100',
  VENCIDA:  'bg-amber-50 text-amber-700 border border-amber-100',
}

const DIAN_COLOR: Record<string, string> = {
  PENDIENTE:  'bg-slate-100 text-slate-600',
  GENERADA:   'bg-blue-100 text-blue-700',
  ENVIADA:    'bg-indigo-100 text-indigo-700',
  ACEPTADA:   'bg-green-100 text-green-700',
  RECHAZADA:  'bg-red-100 text-red-700',
}

function formatNit(nit?: string, dv?: string) {
  if (!nit) return ''
  const trimmed = nit.trim()
  if (!dv) return trimmed
  if (trimmed.includes('-')) return trimmed
  return `${trimmed}-${dv}`
}

function getRegimenFiscalLabel(empresa: any): string {
  const resps: string[] = Array.isArray(empresa?.responsabilidades) ? empresa.responsabilidades : []
  if (resps.includes('49') || resps.includes('R-49')) return 'No Responsable de IVA'
  if (resps.includes('48') || resps.includes('O-48')) return 'Responsable de IVA'
  if (resps.includes('O-47') || resps.includes('47') || empresa?.regimenFiscal === '47') return 'Régimen Simple de Tributación'
  if (empresa?.regimenFiscal === '49') return 'No Responsable de IVA'
  if (empresa?.regimenFiscal === '48') return 'Responsable de IVA'
  return 'No Responsable de IVA'
}

export function FacturaDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmAnular, setConfirmAnular] = useState(false)
  const [showNcModal, setShowNcModal] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const { data: configEmpresaLive } = useQuery({
    queryKey: ['config-empresa'],
    queryFn: getEmpresaConfig,
  })

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
  const rawEmpresa = f.empresa || {}
  const empresa: any = {
    nombre: configEmpresaLive?.nombreComercial || configEmpresaLive?.nombre || rawEmpresa.nombre || 'EDATIA S.A.S',
    nit: configEmpresaLive?.nit || rawEmpresa.nit || '900.123.456',
    digitoVerificacion: configEmpresaLive?.digitoVerificacion ?? rawEmpresa.digitoVerificacion ?? '7',
    direccion: configEmpresaLive?.direccion || rawEmpresa.direccion || 'Calle 100 #15-30, Bogotá D.C.',
    telefono: configEmpresaLive?.telefono || rawEmpresa.telefono || '(601) 555-0199',
    correoFacturacion: configEmpresaLive?.correoFacturacion || configEmpresaLive?.email || rawEmpresa.correoFacturacion || rawEmpresa.email || 'info@edatia.com',
    email: configEmpresaLive?.correoFacturacion || configEmpresaLive?.email || rawEmpresa.email || 'info@edatia.com',
    regimenFiscal: configEmpresaLive?.regimenFiscal || rawEmpresa.regimenFiscal || '48',
    responsabilidades: configEmpresaLive?.responsabilidades || rawEmpresa.responsabilidades,
    municipio: configEmpresaLive?.ciudad || configEmpresaLive?.municipio || rawEmpresa.municipio || 'Bogotá',
    pais: configEmpresaLive?.pais || rawEmpresa.pais || 'CO',
    logo: configEmpresaLive?.logo || rawEmpresa.logo || '',
    slogan: configEmpresaLive?.slogan || rawEmpresa.slogan || '',
  }

  const retefuente = Number(f.retefuente ?? 0)
  const reteiva    = Number(f.reteiva ?? 0)
  const reteica    = Number(f.reteica ?? 0)
  const hayRetenciones = retefuente + reteiva + reteica > 0
  const saldoPendiente = Number(f.saldo ?? 0)

  const xmlUrl = `/api/ventas/facturas/${id}/xml`

  const handlePrint = () => {
    const prevTitle = document.title
    document.title = `Factura_${f.numero}`
    window.print()
    setTimeout(() => { document.title = prevTitle }, 1000)
  }

  const handleDownloadPdf = () => {
    const el = document.getElementById('printable-voucher')
    if (!el) return

    setDownloadingPdf(true)
    const win = window as any

    const generatePdf = () => {
      // Temporarily remove shadow and border so PDF has clean edges without card borders across page breaks
      const prevShadow = el.style.boxShadow
      const prevBorder = el.style.border
      const prevRadius = el.style.borderRadius
      el.style.boxShadow = 'none'
      el.style.border = 'none'
      el.style.borderRadius = '0'

      const opt = {
        margin:       [8, 6, 8, 6], // compact 8mm vertical, 6mm horizontal
        filename:     `Factura_${f.numero}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          scrollY: 0,
        },
        jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      }

      const restoreStyles = () => {
        el.style.boxShadow = prevShadow
        el.style.border = prevBorder
        el.style.borderRadius = prevRadius
        setDownloadingPdf(false)
      }

      win.html2pdf().set(opt).from(el).save().then(() => {
        restoreStyles()
      }).catch(() => {
        restoreStyles()
        handlePrint()
      })
    }

    if (win.html2pdf) {
      generatePdf()
    } else {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.onload = () => generatePdf()
      script.onerror = () => {
        setDownloadingPdf(false)
        handlePrint()
      }
      document.head.appendChild(script)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar / Actions Header */}
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

        {/* Acciones: Imprimir, Descargar PDF, Emitir, Anular, etc. */}
        <div className="flex items-center gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 bg-white rounded-lg text-sm hover:bg-slate-50 font-medium transition-all active:scale-95 shadow-sm">
            <Printer size={15} className="text-indigo-600" />
            Imprimir
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Descargar documento en PDF"
          >
            <Download size={15} />
            {downloadingPdf ? 'Generando PDF...' : 'Descargar PDF'}
          </button>

          {f.estado === 'CREADA' && (
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

          {['CREADA', 'EMITIDA'].includes(f.estado) && !confirmAnular && (
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

      {/* Banner de Cartera / Saldo Pendiente */}
      {saldoPendiente > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium print:hidden">
          <span>Factura con saldo pendiente: <strong>{fmt(saldoPendiente)}</strong></span>
          <Link to={`/ventas/recibos?clienteId=${f.clienteId}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-sm">
            <CreditCard size={14} /> Registrar Recibo de Caja
          </Link>
        </div>
      )}

      {/* Vista Principal de Documento Gráfico Oficial */}
      <div className="flex justify-center bg-slate-100/70 p-3 sm:p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-inner print:p-0 print:border-none print:bg-white">
        <div id="printable-voucher" className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-slate-200/90 p-5 sm:p-7 md:p-8 space-y-3.5 text-slate-800 select-text print:p-0 print:border-none print:shadow-none print:rounded-none">
          {/* Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b-2 border-slate-800 pb-3 text-slate-800 no-break">
            {/* Logo */}
            <div className="col-span-1 flex items-center justify-start">
              {empresa.logo ? (
                <img src={empresa.logo} alt="Logo" className="max-h-16 max-w-[170px] object-contain drop-shadow-sm" />
              ) : (
                <div className="h-12 w-12 bg-slate-800 text-white flex items-center justify-center rounded-xl font-black text-lg shadow-sm">ED</div>
              )}
            </div>

            {/* Company details */}
            <div className="col-span-2 text-center space-y-0.5">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">{empresa.nombre}</h2>
              {empresa.slogan && <p className="text-[10px] italic text-slate-500 font-medium">{empresa.slogan}</p>}
              <p className="text-[10.5px] font-extrabold text-slate-800">
                NIT {formatNit(empresa.nit, empresa.digitoVerificacion)} · {getRegimenFiscalLabel(empresa)}
              </p>
              <p className="text-[9.5px] text-slate-600">Dirección: {empresa.direccion || '—'}</p>
              <p className="text-[9.5px] text-slate-600">
                Tel: {empresa.telefono || '—'} · Correo: {empresa.correoFacturacion || empresa.email || '—'}
              </p>
              <p className="text-[9.5px] text-slate-600">{empresa.municipio || ''} - {empresa.pais || 'Colombia'}</p>
            </div>

            {/* QR code and Invoice card (Stacked) */}
            <div className="col-span-1 flex flex-col items-end gap-1.5 justify-center">
              {f.qrUrl ? (
                <div className="shrink-0 border border-slate-200 p-0.5 bg-white rounded shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(f.qrUrl)}`} 
                    alt="QR DIAN" 
                    className="w-11 h-11" 
                  />
                </div>
              ) : (
                <div className="shrink-0 border border-slate-200 p-0.5 bg-white rounded shadow-sm">
                  <div className="w-11 h-11 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">QR</div>
                </div>
              )}
              <div className="border-2 border-slate-800 p-1.5 text-center bg-white rounded-lg w-full max-w-[160px] shadow-sm">
                <p className="text-[8px] font-extrabold text-slate-600 uppercase tracking-wider leading-none">
                  {f.tipoDocumento === 'FVE' ? 'Factura electrónica de venta' : 'Factura de Venta'}
                </p>
                <p className="text-sm font-black text-slate-900 mt-0.5 font-mono tracking-tight">No. {f.numero}</p>
              </div>
            </div>
          </div>

          {/* Informative 2-Column Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10.5px] no-break">
            {/* Columna 1: Información del Cliente */}
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-100 px-3 py-1 font-extrabold text-slate-800 border-b border-slate-300 uppercase tracking-wider text-[9px]">
                Información del Cliente
              </div>
              <table className="w-full border-collapse">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Nombre / Razón Social:</td>
                    <td className="px-2.5 py-1 font-bold text-slate-900 uppercase">{f.cliente?.nombre || 'Consumidor Final'}</td>
                  </tr>
                  <tr>
                    <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Tipo de Documento:</td>
                    <td className="px-2.5 py-1 font-medium text-slate-800 uppercase">{f.cliente?.tipoDocumento || 'Cédula / NIT'}</td>
                  </tr>
                  <tr>
                    <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Número de Documento:</td>
                    <td className="px-2.5 py-1 font-mono font-bold text-slate-900">
                      {f.cliente?.numeroDocumento || '222222222222'}{f.cliente?.digitoVerificacion ? `-${f.cliente.digitoVerificacion}` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Dirección:</td>
                    <td className="px-2.5 py-1 text-slate-800">
                      {f.cliente?.direccion || f.direccion || '—'} {f.sucursalCliente ? `(${f.sucursalCliente})` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Ciudad:</td>
                    <td className="px-2.5 py-1 text-slate-800">
                      {f.cliente?.municipio || '—'}{f.cliente?.departamento ? ` · ${f.cliente.departamento}` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Teléfono:</td>
                    <td className="px-2.5 py-1 font-medium text-slate-800">{f.cliente?.celular || f.cliente?.telefono || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Columna 2: Información del Documento */}
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-100 px-3 py-1 font-extrabold text-slate-800 border-b border-slate-300 uppercase tracking-wider text-[9px]">
                Información del Documento
              </div>
              <table className="w-full border-collapse">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Nro. de Documento:</td>
                    <td className="px-2.5 py-1 font-mono font-black text-slate-900">{f.numero}</td>
                  </tr>
                  <tr>
                    <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Fecha de Expedición:</td>
                    <td className="px-2.5 py-1 font-medium text-slate-800">
                      {new Date(f.fecha).toLocaleDateString('es-CO')} {new Date(f.fecha).toTimeString().slice(0, 5)}
                    </td>
                  </tr>
                  <tr>
                    <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Fecha de Vencimiento:</td>
                    <td className="px-2.5 py-1 font-medium text-slate-800">
                      {new Date(f.fechaVencimiento || f.fecha).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                  <tr>
                    <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Forma de Pago:</td>
                    <td className="px-2.5 py-1 font-bold text-slate-900 uppercase">{f.formaPago || 'CONTADO'}</td>
                  </tr>
                  <tr>
                    <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Medio de Pago:</td>
                    <td className="px-2.5 py-1 font-semibold text-slate-900 uppercase">
                      {f.medioPago ? f.medioPago.replace('_', ' ') : 'EFECTIVO'}
                    </td>
                  </tr>
                  {f.vendedorNombre && (
                    <tr>
                      <td className="w-32 px-2.5 py-1 font-bold text-slate-600 bg-slate-50/50">Vendedor:</td>
                      <td className="px-2.5 py-1 text-slate-800">{f.vendedorNombre}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1 no-break">
            <h4 className="font-extrabold text-slate-700 uppercase tracking-wider text-[9.5px]">Detalle de Productos Facturados</h4>
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
              <table className="w-full table-fixed border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase tracking-wider text-[9px]">
                    <th className="py-2 px-2.5 text-left w-[15%]">Ref de Fábrica</th>
                    <th className="py-2 px-2.5 text-left w-[40%]">Descripción</th>
                    <th className="py-2 px-2 text-center w-[8%]">Cant.</th>
                    <th className="py-2 px-2.5 text-right w-[13%]">Valor Unitario</th>
                    <th className="py-2 px-1 text-center w-[6%]">IVA</th>
                    <th className="py-2 px-1 text-center w-[5%]">Dto</th>
                    <th className="py-2 px-2.5 text-right w-[13%]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {f.items?.map((item: any) => {
                    const tasaIva = item.tipoIva === 'IVA_19' ? 19 : item.tipoIva === 'IVA_5' ? 5 : 0
                    const cantNum = Number(item.cantidad)
                    const cantFmt = cantNum % 1 === 0 ? cantNum.toString() : cantNum.toFixed(2)
                    const refFabrica = item.producto?.referencia || item.producto?.sku || 'N/A'
                    return (
                      <tr key={item.id} className="text-slate-800 hover:bg-slate-50/50 [page-break-inside:avoid] [break-inside:avoid]">
                        <td className="py-1.5 px-2.5 font-mono text-[9.5px] text-slate-600 font-bold truncate">{refFabrica}</td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900 leading-snug break-words">
                          {item.producto?.nombre || item.descripcion}
                          {item.producto?.nombre && item.descripcion && item.descripcion !== item.producto.nombre && (
                            <span className="block text-[9.5px] text-slate-500 font-normal mt-0.5">{item.descripcion}</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center font-medium text-slate-800 whitespace-nowrap">{cantFmt} {item.unidad || 'UND'}</td>
                        <td className="py-1.5 px-2.5 text-right font-medium text-slate-800 tabular-nums whitespace-nowrap">{fmtDec(Number(item.precioUnitario))}</td>
                        <td className="py-1.5 px-1 text-center font-medium text-slate-800 whitespace-nowrap">{tasaIva > 0 ? `${tasaIva}%` : '0%'}</td>
                        <td className="py-1.5 px-1 text-center font-medium text-slate-800 whitespace-nowrap">{Number(item.descuentoPct || 0) > 0 ? `${item.descuentoPct}%` : '0%'}</td>
                        <td className="py-1.5 px-2.5 text-right font-black text-slate-900 tabular-nums whitespace-nowrap">{fmtDec(Number(item.total))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Section: Totals, In-Letters & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t-2 border-slate-800 text-xs items-start no-break">
            {/* Left Column: Valor en Letras, Total Items, Observaciones (spans 7 cols) */}
            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 uppercase text-[9.5px] tracking-wider">Total ítems:</span>
                <span className="text-slate-900 font-black px-1.5 py-0.5 bg-slate-100 rounded text-xs">{f.items?.length ?? 0}</span>
              </div>

              <div className="border border-slate-200 bg-slate-50/80 rounded-lg p-2.5 space-y-0.5">
                <p className="font-bold text-slate-500 uppercase text-[8.5px] tracking-wider">Valor en Letras:</p>
                <p className="text-[11px] font-black text-slate-900 uppercase leading-snug">
                  {numeroALetras(Number(f.total ?? 0))}
                </p>
              </div>

              {f.notas && (
                <div className="text-[10px] text-slate-700 border-l-2 border-indigo-400 pl-2 py-0.5">
                  <span className="font-bold text-slate-800">Observaciones: </span>
                  <span className="whitespace-pre-line text-slate-600">{f.notas}</span>
                </div>
              )}
            </div>

            {/* Right Column: Financial Totals Box (spans 5 cols) */}
            <div className="md:col-span-5">
              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                <table className="w-full border-collapse text-xs">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-2.5 py-1 text-slate-700 font-bold bg-slate-50/70 border-r border-slate-200">Subtotal</td>
                      <td className="px-2.5 py-1 text-right text-slate-900 font-semibold tabular-nums">{fmtDec(Number(f.subtotal ?? 0))}</td>
                    </tr>
                    {Number(f.descuento ?? 0) > 0 && (
                      <tr>
                        <td className="px-2.5 py-1 text-slate-600 font-bold bg-slate-50/70 border-r border-slate-200">Descuento</td>
                        <td className="px-2.5 py-1 text-right text-red-600 font-semibold tabular-nums">-{fmtDec(Number(f.descuento))}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-2.5 py-1 text-slate-700 font-bold bg-slate-50/70 border-r border-slate-200">
                        IVA {Number(f.iva19 ?? 0) > 0 ? '(19%)' : Number(f.iva5 ?? 0) > 0 ? '(5%)' : ''}
                      </td>
                      <td className="px-2.5 py-1 text-right text-slate-900 font-semibold tabular-nums">
                        {fmtDec(Number((f.iva19 || 0) + (f.iva5 || 0) || f.iva || 0))}
                      </td>
                    </tr>
                    {hayRetenciones && (
                      <>
                        {retefuente > 0 && (
                          <tr className="text-amber-800">
                            <td className="px-2.5 py-1 font-bold bg-slate-50/70 border-r border-slate-200">ReteFuente</td>
                            <td className="px-2.5 py-1 text-right font-semibold tabular-nums">-{fmtDec(retefuente)}</td>
                          </tr>
                        )}
                        {reteiva > 0 && (
                          <tr className="text-amber-800">
                            <td className="px-2.5 py-1 font-bold bg-slate-50/70 border-r border-slate-200">ReteIVA</td>
                            <td className="px-2.5 py-1 text-right font-semibold tabular-nums">-{fmtDec(reteiva)}</td>
                          </tr>
                        )}
                        {reteica > 0 && (
                          <tr className="text-amber-800">
                            <td className="px-2.5 py-1 font-bold bg-slate-50/70 border-r border-slate-200">ReteICA</td>
                            <td className="px-2.5 py-1 text-right font-semibold tabular-nums">-{fmtDec(reteica)}</td>
                          </tr>
                        )}
                      </>
                    )}
                    <tr className="bg-slate-900 text-white font-black text-sm">
                      <td className="px-2.5 py-1.5 uppercase tracking-wide">Total a Pagar</td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums">{fmtDec(Number(f.total ?? 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* DIAN Resolution Banner */}
          <div className="bg-slate-100 border border-slate-200 p-2 text-[8.5px] text-slate-700 space-y-0.5 text-center mt-2.5 rounded-lg leading-snug no-break">
            <p>
              A esta factura de venta aplican las normas relativas a la letra de cambio (artículo 5 Ley 1231 de 2008). Con esta el Comprador declara haber recibido real y materialmente las mercancías o prestación de servicios descritos en este título - Valor.
              {f.resolucion && (
                <>
                  {" "}Número Autorización Electrónica <span className="font-bold">{f.resolucion.numeroResolucion}</span> aprobado en {new Date(f.resolucion.fechaResolucion).toLocaleDateString('es-CO')} prefijo <span className="font-bold">{f.resolucion.prefijo || 'Ninguno'}</span> desde el número {f.resolucion.numeroInicial} al {f.resolucion.numeroFinal} Vigencia: {new Date(f.resolucion.fechaVigencia).toLocaleDateString('es-CO')}.
                </>
              )}
            </p>
            <p className="font-bold">
              {getRegimenFiscalLabel(empresa)} · Actividad Económica {empresa.actividadEconomica || '—'}
            </p>
            {f.cufe && (
              <p className="font-mono text-[8px] text-slate-600 select-all">
                CUFE: {f.cufe}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center text-[7.5px] text-slate-400 mt-2 px-1 no-break">
            <div>
              Firma electrónica: ver en el XML
            </div>
            <div>
              Fabricante Software: Edatia Software
            </div>
          </div>
        </div>
      </div>

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
            padding: 6mm 8mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          
          .no-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          thead {
            display: table-header-group !important;
          }
          
          @page {
            size: letter portrait;
            margin: 0;
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
