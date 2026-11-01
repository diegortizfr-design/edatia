import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVentasPos, anularVentaPos, getCajas, getSesiones, getSesion, sincronizarContabilidadPos } from '../../services/pos.service'
import { Link } from 'react-router-dom'
import { 
  Search, Printer, Eye, XCircle, Calendar, CreditCard, Banknote, Smartphone, 
  CheckCircle, AlertTriangle, FileText, Send, Lock, ArrowUpRight, TrendingUp, 
  Coins, User, CheckCircle2, Clock, ShieldCheck, X, Receipt, RefreshCw
} from 'lucide-react'

const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)

const BILLETES_CONFIG = [
  { key: 'b100000', label: '$100.000', valor: 100000 },
  { key: 'b50000',  label: '$50.000',  valor: 50000 },
  { key: 'b20000',  label: '$20.000',  valor: 20000 },
  { key: 'b10000',  label: '$10.000',  valor: 10000 },
  { key: 'b5000',   label: '$5.000',   valor: 5000 },
  { key: 'b2000',   label: '$2.000',   valor: 2000 },
  { key: 'b1000',   label: '$1.000 (billete)', valor: 1000 },
]

const MONEDAS_CONFIG = [
  { key: 'm1000', label: '$1.000 (moneda)', valor: 1000 },
  { key: 'm500',  label: '$500',  valor: 500 },
  { key: 'm200',  label: '$200',  valor: 200 },
  { key: 'm100',  label: '$100',  valor: 100 },
  { key: 'm50',   label: '$50',   valor: 50 },
]

export function VentasPosList() {
  const qc = useQueryClient()
  const getLocalDateString = () => {
    const d = new Date()
    const tzOffset = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0]
  }

  // Pestaña principal: Tickets de Venta vs Documentos de Cierre
  const [activeTab, setActiveTab] = useState<'ventas' | 'cierres'>('ventas')

  // Filtros de Tickets
  const [desde, setDesde] = useState(getLocalDateString())
  const [hasta, setHasta] = useState(getLocalDateString())
  const [cajaId, setCajaId] = useState('')
  const [prefijo, setPrefijo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVenta, setSelectedVenta] = useState<any | null>(null)
  const [anularId, setAnularId] = useState<number | null>(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')

  // Filtros de Documentos de Cierre
  const [cierreDesde, setCierreDesde] = useState('')
  const [cierreHasta, setCierreHasta] = useState('')
  const [cierreCajaId, setCierreCajaId] = useState('')
  const [cierreSearchQuery, setCierreSearchQuery] = useState('')
  const [selectedCierre, setSelectedCierre] = useState<any | null>(null)

  const { data: cajas = [] } = useQuery(['pos-cajas'], getCajas)

  // 1. Query Ventas POS
  const { data: ventas = [], isLoading } = useQuery({
    queryKey: ['ventas-pos', desde, hasta, cajaId, prefijo],
    queryFn: () => getVentasPos({
      desde: desde || undefined,
      hasta: hasta || undefined,
      cajaId: cajaId ? +cajaId : undefined,
      prefijo: prefijo || undefined
    }),
    enabled: activeTab === 'ventas',
  })

  // 2. Query Documentos de Cierre (Sesiones cerradas)
  const { data: sesionesCierre = [], isLoading: isLoadingCierres } = useQuery({
    queryKey: ['pos-sesiones-cierre', cierreDesde, cierreHasta, cierreCajaId, cierreSearchQuery],
    queryFn: () => getSesiones({
      cajaId: cierreCajaId ? +cierreCajaId : undefined,
      estado: 'CERRADA',
      desde: cierreDesde || undefined,
      hasta: cierreHasta || undefined,
      numeroCierre: cierreSearchQuery || undefined,
    }),
    enabled: activeTab === 'cierres',
  })

  const mutAnular = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => anularVentaPos(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventas-pos'] })
      setAnularId(null)
      setMotivoAnulacion('')
      alert('Venta POS anulada con éxito')
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Error al anular la venta')
    }
  })

  const mutSync = useMutation({
    mutationFn: sincronizarContabilidadPos,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ventas-pos'] })
      qc.invalidateQueries({ queryKey: ['sesiones-pos'] })
      alert(data?.message || 'Ventas y recibos sincronizados exitosamente con Tesorería')
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Error al sincronizar con tesorería')
    }
  })

  const filtradas = useMemo(() => {
    if (!searchQuery) return ventas
    return (ventas as any[]).filter((v: any) =>
      v.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.clienteNombre?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [ventas, searchQuery])

  // KPIs de Ventas
  const totalHoy = useMemo(() =>
    filtradas.filter((v: any) => v.estado !== 'ANULADA').reduce((a: number, b: any) => a + Number(b.total), 0)
  , [filtradas])

  const countTransacciones = useMemo(() =>
    filtradas.filter((v: any) => v.estado !== 'ANULADA').length
  , [filtradas])

  const totalEfectivo = useMemo(() =>
    filtradas.filter((v: any) => v.estado !== 'ANULADA').reduce((a: number, b: any) => a + (Number(b.pagoEfectivo) - Number(b.cambio)), 0)
  , [filtradas])

  const totalBancosPasarelas = useMemo(() =>
    filtradas.filter((v: any) => v.estado !== 'ANULADA').reduce((a: number, b: any) =>
      a + Number(b.pagoTarjetaDebito) + Number(b.pagoTarjetaCredito) + Number(b.pagoTransferencia) + Number(b.pagoNequi)
    , 0)
  , [filtradas])

  // Filtrado y KPIs de Cierres
  const cierresFiltrados = useMemo(() => {
    let list = sesionesCierre as any[]
    if (cierreSearchQuery) {
      const q = cierreSearchQuery.toLowerCase()
      list = list.filter((s: any) => 
        s.numeroCierre?.toLowerCase().includes(q) ||
        s.vendedorNombre?.toLowerCase().includes(q) ||
        s.caja?.nombre?.toLowerCase().includes(q)
      )
    }
    return list
  }, [sesionesCierre, cierreSearchQuery])

  const totalCierresRealizados = cierresFiltrados.length
  const totalVentasCierres = useMemo(() => 
    cierresFiltrados.reduce((acc, s) => acc + Number(s.totalVentas || 0), 0)
  , [cierresFiltrados])

  const totalEfectivoContado = useMemo(() => 
    cierresFiltrados.reduce((acc, s) => acc + Number(s.montoFinalDeclarado || 0), 0)
  , [cierresFiltrados])

  const totalDiferenciaCierres = useMemo(() => 
    cierresFiltrados.reduce((acc, s) => acc + Number(s.diferencia || 0), 0)
  , [cierresFiltrados])

  const handleAnular = (e: React.FormEvent) => {
    e.preventDefault()
    if (!anularId || !motivoAnulacion.trim()) return
    mutAnular.mutate({ id: anularId, motivo: motivoAnulacion })
  }

  const imprimirTirilla = (v: any) => {
    const w = window.open('', '_blank', 'width=300,height=600')
    if (!w) return
    w.document.write(`
      <html><head><style>
        body { font-family: monospace; font-size: 11px; margin: 0; padding: 8px; width: 280px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 4px 0; }
        .row { display: flex; justify-content: space-between; }
        .big { font-size: 14px; font-weight: bold; }
      </style></head><body>
        <div class="center bold" style="font-size:13px">EDATIA ERP</div>
        <div class="center" style="font-size:10px; color:#555">SISTEMA POS INTEGRADO</div>
        <div class="center bold" style="margin: 4px 0;">${v.numero}</div>
        <div class="line"></div>
        <div class="row"><span>Fecha:</span><span>${new Date(v.fecha).toLocaleString('es-CO')}</span></div>
        <div class="row"><span>Caja:</span><span>${v.sesion?.caja?.nombre || 'General'}</span></div>
        <div class="row"><span>Cliente:</span><span>${v.clienteNombre}</span></div>
        ${v.clienteDoc ? `<div class="row"><span>Doc/NIT:</span><span>${v.clienteDoc}</span></div>` : ''}
        <div class="line"></div>
        ${v.reciboCaja?.numero ? `<div class="row"><span>Recibo Caja (RC):</span><span class="bold">${v.reciboCaja.numero}</span></div>` : ''}
        <div class="line"></div>
        <div class="bold" style="margin-bottom:2px">PRODUCTOS</div>
        ${v.items?.map((it: any) => `
          <div style="margin-bottom: 2px;">
            <div class="bold">${it.descripcion || it.producto?.nombre || 'Producto'}</div>
            <div class="row">
              <span>${Number(it.cantidad)} x ${cop(Number(it.precioUnitario || 0))}</span>
              <span>${cop(Number(it.subtotal || it.total || 0))}</span>
            </div>
          </div>
        `).join('')}
        <div class="line"></div>
        <div class="row"><span>Subtotal:</span><span>${cop(Number(v.subtotal))}</span></div>
        ${Number(v.descuento) > 0 ? `<div class="row"><span>Descuento:</span><span>-${cop(Number(v.descuento))}</span></div>` : ''}
        <div class="row"><span>IVA / Impuestos:</span><span>${cop(Number(v.iva19 || 0) + Number(v.iva5 || 0) + Number(v.iva || 0))}</span></div>
        <div class="row big" style="margin: 4px 0;"><span>TOTAL:</span><span>${cop(Number(v.total))}</span></div>
        <div class="line"></div>
        <div class="bold" style="margin-bottom:2px">PAGOS</div>
        ${Number(v.pagoEfectivo) > 0 ? `<div class="row"><span>Efectivo:</span><span>${cop(Number(v.pagoEfectivo))}</span></div>` : ''}
        ${Number(v.cambio) > 0 ? `<div class="row"><span>Cambio:</span><span>${cop(Number(v.cambio))}</span></div>` : ''}
        ${Number(v.pagoTarjetaDebito) > 0 ? `<div class="row"><span>T. Débito:</span><span>${cop(Number(v.pagoTarjetaDebito))}</span></div>` : ''}
        ${Number(v.pagoTarjetaCredito) > 0 ? `<div class="row"><span>T. Crédito:</span><span>${cop(Number(v.pagoTarjetaCredito))}</span></div>` : ''}
        ${Number(v.pagoTransferencia) > 0 ? `<div class="row"><span>Transferencia:</span><span>${cop(Number(v.pagoTransferencia))}</span></div>` : ''}
        ${Number(v.pagoNequi) > 0 ? `<div class="row"><span>Nequi / Daviplata:</span><span>${cop(Number(v.pagoNequi))}</span></div>` : ''}
        <div class="line"></div>
        <div class="center" style="margin-top:6px; font-size:10px">¡Gracias por su compra!</div>
      </body></html>
    `)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 250)
  }

  const imprimirTirillaCierre = (cierre: any) => {
    const w = window.open('', '_blank', 'width=320,height=700')
    if (!w) return
    const numDoc = cierre.numeroCierre || 'CF-S/N'
    const arqueo = cierre.arqueo || {}
    const diferencia = Number(cierre.diferencia || 0)
    const totalSistema = Number(cierre.montoInicial || 0) + Number(cierre.totalEfectivo || 0)

    w.document.write(`
      <html><head><style>
        body { font-family: monospace; font-size: 11px; margin: 0; padding: 10px; width: 290px; color: #111; }
        .c { text-align: center; }
        .b { font-weight: bold; }
        .l { border-top: 1px dashed #000; margin: 5px 0; }
        .r { display: flex; justify-content: space-between; }
        .big { font-size: 13px; font-weight: bold; }
      </style></head><body>
        <div class="c b" style="font-size:14px">DOCUMENTO DE CIERRE DE CAJA</div>
        <div class="c b" style="font-size:12px; margin: 2px 0 4px">${numDoc}</div>
        <div class="c">${cierre.caja?.nombre || 'Caja POS'}</div>
        <div class="l"></div>
        <div class="r"><span>Comprobante:</span><span class="b">${numDoc}</span></div>
        <div class="r"><span>Cajero / Resp:</span><span>${cierre.vendedorNombre || '—'}</span></div>
        <div class="r"><span>Apertura:</span><span>${new Date(cierre.abiertaAt).toLocaleString('es-CO')}</span></div>
        <div class="r"><span>Cierre:</span><span>${cierre.cerradaAt ? new Date(cierre.cerradaAt).toLocaleString('es-CO') : '—'}</span></div>
        <div class="l"></div>
        <div class="r"><span>Base Inicial Efectivo:</span><span class="b">${cop(Number(cierre.montoInicial || 0))}</span></div>
        <div class="r"><span>Ventas Efectivo:</span><span>${cop(Number(cierre.totalEfectivo || 0))}</span></div>
        <div class="r"><span>Total Ventas Turno:</span><span class="b">${cop(Number(cierre.totalVentas || 0))}</span></div>
        <div class="l"></div>
        <div class="r"><span>Total Efectivo Sistema:</span><span class="b">${cop(totalSistema)}</span></div>
        <div class="r"><span>Total Contado (Arqueo):</span><span class="b">${cop(Number(cierre.montoFinalDeclarado || 0))}</span></div>
        <div class="r big" style="margin: 4px 0;">
          <span>Diferencia:</span>
          <span>${diferencia >= 0 ? '+' : ''}${cop(diferencia)}</span>
        </div>
        <div class="l"></div>
        ${cierre.observacionesCierre ? `<div><strong>Notas:</strong> ${cierre.observacionesCierre}</div><div class="l"></div>` : ''}
        <div class="c" style="margin-top: 20px;">_______________________________<br/>Firma Responsable de Caja</div>
        <br/>
      </body></html>
    `)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 250)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Ventas y Facturación POS</h1>
          <p className="text-xs text-slate-500 font-medium">Historial de tickets, arqueos y documentos de cierre de caja</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setActiveTab('ventas')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ventas'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={14} /> Tickets de Venta
            </button>
            <button
              onClick={() => setActiveTab('cierres')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'cierres'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock size={14} /> Documentos de Cierre [CF]
            </button>
          </div>

          <button
            onClick={() => mutSync.mutate()}
            disabled={mutSync.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
            title="Sincronizar ventas y recibos con tesorería"
          >
            <RefreshCw size={13} className={mutSync.isPending ? 'animate-spin' : ''} />
            {mutSync.isPending ? 'Sincronizando...' : 'Sincronizar Tesorería'}
          </button>

          <Link to="/ventas/facturas/pendientes-emitir"
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors shadow-sm"
          >
            <Send size={13} /> Pendientes DIAN
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: TICKETS DE VENTA POS                                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ventas' && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <div className="bg-indigo-50 text-indigo-650 p-2.5 rounded-xl">
                <Calendar size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total de Ventas POS</span>
                <span className="text-lg font-bold text-slate-800">{cop(totalHoy)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                <CheckCircle size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Tickets Emitidos</span>
                <span className="text-lg font-bold text-slate-800">{countTransacciones} trans.</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl">
                <Banknote size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Recaudado en Efectivo</span>
                <span className="text-lg font-bold text-slate-800">{cop(totalEfectivo)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <div className="bg-sky-50 text-sky-600 p-2.5 rounded-xl">
                <CreditCard size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Bancos / Pasarelas</span>
                <span className="text-lg font-bold text-slate-800">{cop(totalBancosPasarelas)}</span>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center w-full">
            {/* Búsqueda rápida */}
            <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-slate-50/50 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
              <Search size={14} className="text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar ticket o cliente..."
                className="text-xs outline-none bg-transparent w-44 font-medium"
              />
            </div>

            {/* Rango de Fechas */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-slate-50/50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Desde</span>
                <input
                  type="date"
                  value={desde}
                  onChange={e => setDesde(e.target.value)}
                  className="text-xs outline-none bg-transparent font-bold text-slate-700"
                />
              </div>
              <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-slate-50/50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Hasta</span>
                <input
                  type="date"
                  value={hasta}
                  onChange={e => setHasta(e.target.value)}
                  className="text-xs outline-none bg-transparent font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Caja POS */}
            <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-slate-50/50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Caja</span>
              <select
                value={cajaId}
                onChange={e => setCajaId(e.target.value)}
                className="text-xs outline-none bg-transparent font-bold text-slate-700 bg-white cursor-pointer"
              >
                <option value="">Todas las cajas</option>
                {cajas.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Prefijo */}
            <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-slate-50/50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Prefijo</span>
              <input
                type="text"
                value={prefijo}
                onChange={e => setPrefijo(e.target.value)}
                placeholder="Ej: FVP"
                className="text-xs outline-none bg-transparent font-bold text-slate-700 w-20 uppercase"
              />
            </div>

            <span className="ml-auto text-xs text-slate-400 font-semibold">{filtradas.length} ticket(s) cargado(s)</span>
          </div>

          {/* Tabla de Tickets */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading && <p className="text-center py-16 text-slate-400 text-sm font-medium">Cargando historial...</p>}
            {!isLoading && filtradas.length === 0 && (
              <div className="p-16 text-center text-slate-400">
                <FileText className="mx-auto mb-3 opacity-20" size={40} />
                <p className="text-sm font-semibold">No se encontraron ventas POS para esta fecha.</p>
              </div>
            )}
            {!isLoading && filtradas.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 bg-slate-50/20">
                      <th className="px-6 py-3.5 text-left">Ticket / Recibo Caja</th>
                      <th className="px-6 py-3.5 text-left">Caja POS</th>
                      <th className="px-6 py-3.5 text-left">Fecha</th>
                      <th className="px-6 py-3.5 text-left">Cliente</th>
                      <th className="px-6 py-3.5 text-left">Medios de Pago</th>
                      <th className="px-6 py-3.5 text-right">Total</th>
                      <th className="px-6 py-3.5 text-center">Estado</th>
                      <th className="px-6 py-3.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtradas.map((v: any) => {
                      const hasEfectivo = Number(v.pagoEfectivo) - Number(v.cambio) > 0
                      const hasTarjeta = Number(v.pagoTarjetaDebito) + Number(v.pagoTarjetaCredito) > 0
                      const hasTransfer = Number(v.pagoTransferencia) + Number(v.pagoNequi) > 0
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-mono font-bold text-xs text-indigo-700 flex items-center gap-1.5">
                              <FileText size={13} className="text-indigo-400" />
                              <span>{v.numero}</span>
                            </div>
                            {v.reciboCaja?.numero ? (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Receipt size={10} /> RC: {v.reciboCaja.numero}
                                </span>
                              </div>
                            ) : (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100">
                                  Sin RC
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-800 text-xs">{v.sesion?.caja?.nombre || '—'}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {new Date(v.fecha).toLocaleDateString('es-CO', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800 block text-xs">{v.clienteNombre}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{v.clienteDoc || '222222222222'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {hasEfectivo && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Banknote size={10} /> Efectivo
                                </span>
                              )}
                              {hasTarjeta && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <CreditCard size={10} /> Datafono
                                </span>
                              )}
                              {hasTransfer && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                                  <Smartphone size={10} /> Transfer/QR
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-slate-800 text-xs">
                            {cop(Number(v.total))}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {v.estado === 'COMPLETADA' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle size={10} /> Exitosa
                              </span>
                            )}
                            {v.estado === 'ANULADA' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                <XCircle size={10} /> Anulada
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedVenta(v)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Ver Detalle Ticket"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => imprimirTirilla(v)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Reimprimir Tirilla"
                              >
                                <Printer size={15} />
                              </button>
                              {v.estado !== 'ANULADA' && (
                                <button
                                  onClick={() => setAnularId(v.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Anular Transacción"
                                >
                                  <XCircle size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: DOCUMENTOS DE CIERRE [CF]                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'cierres' && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Cards de Cierres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <div className="bg-purple-50 text-purple-650 p-2.5 rounded-xl">
                <Lock size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Cierres Realizados</span>
                <span className="text-lg font-bold text-slate-800">{totalCierresRealizados} turnos</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Ventas Acumuladas en Turnos</span>
                <span className="text-lg font-bold text-emerald-700">{cop(totalVentasCierres)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
                <Banknote size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Efectivo Contado Declarado</span>
                <span className="text-lg font-bold text-slate-800">{cop(totalEfectivoContado)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${totalDiferenciaCierres >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                <Coins size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Balance Diferencias Arqueo</span>
                <span className={`text-lg font-bold ${totalDiferenciaCierres >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                  {totalDiferenciaCierres >= 0 ? '+' : ''}{cop(totalDiferenciaCierres)}
                </span>
              </div>
            </div>
          </div>

          {/* Filtros de Cierres */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center w-full">
            {/* Búsqueda por documento CF o Cajero */}
            <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-slate-50/50 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
              <Search size={14} className="text-slate-400" />
              <input
                value={cierreSearchQuery}
                onChange={e => setCierreSearchQuery(e.target.value)}
                placeholder="Buscar por N° Cierre o Cajero..."
                className="text-xs outline-none bg-transparent w-52 font-medium"
              />
            </div>

            {/* Rango de Fechas */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-slate-50/50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Desde</span>
                <input
                  type="date"
                  value={cierreDesde}
                  onChange={e => setCierreDesde(e.target.value)}
                  className="text-xs outline-none bg-transparent font-bold text-slate-700"
                />
              </div>
              <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-slate-50/50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Hasta</span>
                <input
                  type="date"
                  value={cierreHasta}
                  onChange={e => setCierreHasta(e.target.value)}
                  className="text-xs outline-none bg-transparent font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Caja POS */}
            <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-slate-50/50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Caja</span>
              <select
                value={cierreCajaId}
                onChange={e => setCierreCajaId(e.target.value)}
                className="text-xs outline-none bg-transparent font-bold text-slate-700 bg-white cursor-pointer"
              >
                <option value="">Todas las cajas</option>
                {cajas.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <span className="ml-auto text-xs text-slate-400 font-semibold">{cierresFiltrados.length} cierre(s) cargado(s)</span>
          </div>

          {/* Tabla de Documentos de Cierre */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoadingCierres && <p className="text-center py-16 text-slate-400 text-sm font-medium">Cargando documentos de cierre...</p>}
            {!isLoadingCierres && cierresFiltrados.length === 0 && (
              <div className="p-16 text-center text-slate-400">
                <Lock className="mx-auto mb-3 opacity-20" size={40} />
                <p className="text-sm font-semibold">No se encontraron documentos de cierre de caja en este período.</p>
              </div>
            )}
            {!isLoadingCierres && cierresFiltrados.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 bg-slate-50/20">
                      <th className="px-6 py-3.5 text-left">N° Documento Cierre</th>
                      <th className="px-6 py-3.5 text-left">Caja POS</th>
                      <th className="px-6 py-3.5 text-left">Cajero / Resp.</th>
                      <th className="px-6 py-3.5 text-left">Apertura</th>
                      <th className="px-6 py-3.5 text-left">Cierre</th>
                      <th className="px-6 py-3.5 text-right">Base Inicial</th>
                      <th className="px-6 py-3.5 text-right">Total Ventas</th>
                      <th className="px-6 py-3.5 text-right">Efectivo Contado</th>
                      <th className="px-6 py-3.5 text-right">Diferencia</th>
                      <th className="px-6 py-3.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cierresFiltrados.map((ses: any) => {
                      const dif = Number(ses.diferencia || 0)
                      return (
                        <tr key={ses.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                              <FileText size={12} /> {ses.numeroCierre || `CF-SES#${ses.id}`}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800 text-xs">
                            {ses.caja?.nombre || 'Caja General'}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <User size={13} className="text-slate-400" />
                              <span>{ses.vendedorNombre || 'Admin / Cajero'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                            {new Date(ses.abiertaAt).toLocaleString('es-CO', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                            {ses.cerradaAt ? new Date(ses.cerradaAt).toLocaleString('es-CO', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            }) : '—'}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-slate-600 text-xs">
                            {cop(Number(ses.montoInicial || 0))}
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-slate-800 text-xs">
                            {cop(Number(ses.totalVentas || 0))}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-indigo-700 text-xs">
                            {cop(Number(ses.montoFinalDeclarado || 0))}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center font-mono font-bold text-xs px-2 py-0.5 rounded-full border ${
                              dif === 0 
                                ? 'bg-slate-50 text-slate-700 border-slate-200' 
                                : dif > 0 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {dif >= 0 ? '+' : ''}{cop(dif)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedCierre(ses)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-all"
                                title="Ver Arqueo Completo"
                              >
                                <Eye size={13} /> Detalle
                              </button>
                              <button
                                onClick={() => imprimirTirillaCierre(ses)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                                title="Reimprimir Comprobante de Cierre"
                              >
                                <Printer size={13} /> Imprimir
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL DETALLE DE TICKET POS                                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedVenta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Detalle de Transacción</span>
                <h3 className="font-mono font-bold text-indigo-700 text-sm">{selectedVenta.numero}</h3>
              </div>
              <button onClick={() => setSelectedVenta(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Recibo de Caja y Comprobante Contable Vinculados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Recibo de Caja (RC)</span>
                    <span className="font-mono font-bold text-emerald-900 text-xs">
                      {selectedVenta.reciboCaja?.numero || 'Generado en POS'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {selectedVenta.reciboCaja?.estado || 'ACTIVO'}
                  </span>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Asiento Tesorería</span>
                    <span className="font-mono font-bold text-indigo-900 text-xs">
                      {selectedVenta.comprobante?.numero || 'Generado'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {selectedVenta.comprobante?.estado || 'CONTABILIZADO'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Fecha y Hora:</span>
                <span className="font-semibold text-slate-800">{new Date(selectedVenta.fecha).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Cliente:</span>
                <span className="font-semibold text-slate-800">{selectedVenta.clienteNombre}</span>
              </div>
              {selectedVenta.clienteDoc && (
                <div className="flex justify-between text-slate-500">
                  <span>Documento:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedVenta.clienteDoc}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Caja POS:</span>
                <span className="font-semibold text-slate-800">{selectedVenta.sesion?.caja?.nombre || 'General'}</span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-800 block mb-2">Productos</span>
                <div className="space-y-2">
                  {selectedVenta.items?.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start text-slate-700 py-1.5 border-b border-slate-50 last:border-0">
                      <div>
                        <span className="font-semibold text-slate-800 block text-xs">
                          {it.descripcion || it.producto?.nombre || 'Producto'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {Number(it.cantidad)} x {cop(Number(it.precioUnitario || 0))} {it.sku || it.producto?.sku ? `· SKU: ${it.sku || it.producto?.sku}` : ''}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {cop(Number(it.subtotal || it.total || 0))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{cop(Number(selectedVenta.subtotal || 0))}</span>
                </div>
                {Number(selectedVenta.descuento) > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Descuento:</span>
                    <span className="text-red-500">-{cop(Number(selectedVenta.descuento))}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Impuestos (IVA):</span>
                  <span>{cop(Number(selectedVenta.iva19 || 0) + Number(selectedVenta.iva5 || 0) + Number(selectedVenta.iva || 0))}</span>
                </div>
                {Number(selectedVenta.recargoMedioPago) > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Recargo Medio de Pago:</span>
                    <span>+{cop(Number(selectedVenta.recargoMedioPago))}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-800 pt-1 border-t border-slate-100">
                  <span>TOTAL:</span>
                  <span className="text-indigo-650 font-extrabold">{cop(Number(selectedVenta.total || 0))}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1">
                <span className="font-bold text-slate-800 block mb-1">Medios de Pago</span>
                {selectedVenta.pagosDetalle && typeof selectedVenta.pagosDetalle === 'object' && Object.keys(selectedVenta.pagosDetalle).length > 0 ? (
                  Object.entries(selectedVenta.pagosDetalle)
                    .filter(([_, amt]) => Number(amt) > 0)
                    .map(([medio, amt]: any) => (
                      <div key={medio} className="flex justify-between text-slate-600">
                        <span>{medio}:</span>
                        <span className="font-mono font-semibold">{cop(Number(amt))}</span>
                      </div>
                    ))
                ) : (
                  <>
                    {Number(selectedVenta.pagoEfectivo) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Efectivo:</span>
                        <span className="font-mono">{cop(Number(selectedVenta.pagoEfectivo))}</span>
                      </div>
                    )}
                    {Number(selectedVenta.pagoTarjetaDebito) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Tarjeta Débito:</span>
                        <span className="font-mono">{cop(Number(selectedVenta.pagoTarjetaDebito))}</span>
                      </div>
                    )}
                    {Number(selectedVenta.pagoTarjetaCredito) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Tarjeta Crédito:</span>
                        <span className="font-mono">{cop(Number(selectedVenta.pagoTarjetaCredito))}</span>
                      </div>
                    )}
                    {Number(selectedVenta.pagoTransferencia) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Transferencia:</span>
                        <span className="font-mono">{cop(Number(selectedVenta.pagoTransferencia))}</span>
                      </div>
                    )}
                    {Number(selectedVenta.pagoNequi) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Nequi / Daviplata:</span>
                        <span className="font-mono">{cop(Number(selectedVenta.pagoNequi))}</span>
                      </div>
                    )}
                  </>
                )}
                {Number(selectedVenta.cambio) > 0 && (
                  <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                    <span>Cambio Devuelto:</span>
                    <span className="font-mono text-emerald-600 font-bold">-{cop(Number(selectedVenta.cambio))}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => imprimirTirilla(selectedVenta)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Printer size={14} /> Reimprimir Tirilla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL DETALLE DE CIERRE DE CAJA [CF]                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedCierre && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                  <Lock size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-purple-600 font-bold block uppercase tracking-wider">Comprobante de Cierre de Caja</span>
                  <h3 className="font-mono font-bold text-slate-800 text-sm">
                    {selectedCierre.numeroCierre || `CF-SES#${selectedCierre.id}`}
                  </h3>
                </div>
              </div>
              <button onClick={() => setSelectedCierre(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Caja POS</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedCierre.caja?.nombre || 'General'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Cajero Responsable</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedCierre.vendedorNombre || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Apertura</span>
                  <span className="font-mono text-slate-700">{new Date(selectedCierre.abiertaAt).toLocaleString('es-CO')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Cierre</span>
                  <span className="font-mono text-slate-700">{selectedCierre.cerradaAt ? new Date(selectedCierre.cerradaAt).toLocaleString('es-CO') : '—'}</span>
                </div>
              </div>

              {/* Balances */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Base Inicial en Efectivo:</span>
                  <span className="font-mono font-bold text-slate-800">{cop(Number(selectedCierre.montoInicial || 0))}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ventas en Efectivo:</span>
                  <span className="font-mono font-semibold">{cop(Number(selectedCierre.totalEfectivo || 0))}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Ventas del Turno:</span>
                  <span className="font-mono font-bold text-emerald-700">{cop(Number(selectedCierre.totalVentas || 0))}</span>
                </div>
                <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-2">
                  <span>Efectivo Esperado por Sistema:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {cop(Number(selectedCierre.montoInicial || 0) + Number(selectedCierre.totalEfectivo || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Efectivo Físico Declarado (Arqueo):</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {cop(Number(selectedCierre.montoFinalDeclarado || 0))}
                  </span>
                </div>
                <div className={`flex justify-between font-bold text-sm p-2.5 rounded-xl border ${
                  Number(selectedCierre.diferencia || 0) >= 0 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  <span>Diferencia Arqueo:</span>
                  <span className="font-mono">
                    {Number(selectedCierre.diferencia || 0) >= 0 ? '+' : ''}{cop(Number(selectedCierre.diferencia || 0))}
                  </span>
                </div>
              </div>

              {/* Desglose Arqueo Físico */}
              {selectedCierre.arqueo && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="font-bold text-slate-800 block mb-2 uppercase text-[10px] tracking-wider">
                    Desglose de Conteo de Monedas y Billetes
                  </span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {BILLETES_CONFIG.map(b => {
                      const cant = Number(selectedCierre.arqueo[b.key] || 0)
                      if (cant === 0) return null
                      return (
                        <div key={b.key} className="flex justify-between">
                          <span className="text-slate-500">{cant}× {b.label}:</span>
                          <span className="font-bold text-slate-800">{cop(cant * b.valor)}</span>
                        </div>
                      )
                    })}
                    {MONEDAS_CONFIG.map(m => {
                      const cant = Number(selectedCierre.arqueo[m.key] || 0)
                      if (cant === 0) return null
                      return (
                        <div key={m.key} className="flex justify-between">
                          <span className="text-slate-500">{cant}× {m.label}:</span>
                          <span className="font-bold text-slate-800">{cop(cant * m.valor)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {selectedCierre.observacionesCierre && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="font-bold text-slate-800 block mb-1">Observaciones del Cierre</span>
                  <p className="bg-slate-50 p-2.5 rounded-lg text-slate-600 text-xs italic border border-slate-100">
                    "{selectedCierre.observacionesCierre}"
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedCierre(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-white rounded-xl text-xs font-bold transition-all"
              >
                Cerrar
              </button>
              <button
                onClick={() => imprimirTirillaCierre(selectedCierre)}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Printer size={14} /> Imprimir Tirilla Cierre (CF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL ANULAR TRANSACCIÓN POS                                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {anularId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAnular} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle className="text-red-550" size={20} />
              <h3 className="font-bold text-slate-800 text-sm">Anular Transacción POS</h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                ¿Está seguro de que desea anular esta venta POS? Esto revertirá los inventarios (salidas del Kardex) y marcará el comprobante contable asociado como anulado.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">
                  Motivo de Anulación *
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoAnulacion}
                  onChange={e => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej. Error en medio de pago seleccionado..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAnularId(null)}
                className="px-4 py-2 border border-slate-250 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutAnular.isLoading}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-750 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {mutAnular.isLoading ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
