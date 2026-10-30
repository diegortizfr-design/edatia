import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  DollarSign, Truck, AlertCircle, FileText, Search, CreditCard, 
  Clock, CheckCircle2, X, Plus, Calendar, ShieldCheck 
} from 'lucide-react'
import { 
  getSaldosProveedores, getFacturasCompra, registrarPagoFacturaCompra, FacturaCompra 
} from '../../services/inventario.service'
import { getMediosPago } from '../../services/configuracion.service'
import { CurrencyInput } from '../../components/CurrencyInput'
import { getApiError } from '../../services/api'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

export function CarteraCxP() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'proveedores' | 'facturas' | 'contado'>('proveedores')
  const [search, setSearch] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedFc, setSelectedFc] = useState<any | null>(null)
  const [selectedProveedorId, setSelectedProveedorId] = useState<number | null>(null)

  // Consultar saldos acumulados por proveedor
  const { data: saldosProveedores = [], isLoading: loadingSaldos } = useQuery({
    queryKey: ['saldos-proveedores'],
    queryFn: getSaldosProveedores,
  })

  // Consultar todas las facturas de compra
  const { data: todasFacturas = [], isLoading: loadingFacturas } = useQuery({
    queryKey: ['facturas-compra'],
    queryFn: () => getFacturasCompra(),
  })

  const loading = loadingSaldos || loadingFacturas

  // Separar crédito (pendientes de pago) vs contado
  const facturasCredito = useMemo(() => {
    return (todasFacturas as any[]).filter((f: any) => {
      const saldo = f.saldo !== null && f.saldo !== undefined ? Number(f.saldo) : (f.formaPago === 'CONTADO' ? 0 : Number(f.total))
      const isCred = f.formaPago === 'CREDITO' || (f.fechaVencimiento && f.formaPago !== 'CONTADO')
      return (isCred || saldo > 0) && f.estado !== 'ANULADA' && saldo > 0
    }).sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime())
  }, [todasFacturas])

  const facturasContado = useMemo(() => {
    return (todasFacturas as any[]).filter((f: any) => {
      const saldo = f.saldo !== null && f.saldo !== undefined ? Number(f.saldo) : (f.formaPago === 'CONTADO' ? 0 : Number(f.total))
      return (f.formaPago === 'CONTADO' || f.estado === 'PAGADA') && saldo <= 0
    }).sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime())
  }, [todasFacturas])

  // KPIs
  const totalCxp = useMemo(() => {
    return facturasCredito.reduce((sum, f) => {
      const saldo = f.saldo !== null && f.saldo !== undefined ? Number(f.saldo) : Number(f.total)
      return sum + saldo
    }, 0)
  }, [facturasCredito])

  const totalVencido = useMemo(() => {
    const now = Date.now()
    return facturasCredito.reduce((sum, f) => {
      if (!f.fechaVencimiento) return sum
      const isOverdue = new Date(f.fechaVencimiento).getTime() < now
      const saldo = f.saldo !== null && f.saldo !== undefined ? Number(f.saldo) : Number(f.total)
      return isOverdue ? sum + saldo : sum
    }, 0)
  }, [facturasCredito])

  const proveedoresConDeudaCount = (saldosProveedores as any[]).length

  // Filtrado según búsqueda
  const filteredProveedores = useMemo(() => {
    return (saldosProveedores as any[]).filter((p: any) =>
      (p.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.numeroDocumento || '').includes(search)
    )
  }, [saldosProveedores, search])

  const filteredFacturasCredito = useMemo(() => {
    return facturasCredito.filter((f: any) =>
      (f.numero || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.consecutivoProveedor || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.proveedor?.nombre || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [facturasCredito, search])

  const filteredFacturasContado = useMemo(() => {
    return facturasContado.filter((f: any) =>
      (f.numero || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.consecutivoProveedor || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.proveedor?.nombre || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [facturasContado, search])

  const handleOpenPagoFactura = (fc: any) => {
    setSelectedFc(fc)
    setSelectedProveedorId(fc.proveedorId)
    setShowPaymentModal(true)
  }

  const handleOpenPagoProveedor = (proveedorId: number) => {
    const primeraFc = facturasCredito.find((f: any) => f.proveedorId === proveedorId)
    setSelectedFc(primeraFc || null)
    setSelectedProveedorId(proveedorId)
    setShowPaymentModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span>Cartera</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">Cuentas por Pagar (CXP)</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <CreditCard className="text-indigo-600" size={24} />
          Cuentas por Pagar (CXP) - Proveedores
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Control de compromisos adquiridos, facturas de compra a crédito, vencimientos y registro de abonos a proveedores.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Total CXP */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cuentas por Pagar</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{fmt(totalCxp)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {facturasCredito.length} factura(s) de compra pendientes
            </p>
          </div>
        </div>

        {/* KPI 2: CXP Vencida */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deuda Proveedores Vencida</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{fmt(totalVencido)}</p>
            <p className="text-[10px] text-rose-600/80 font-medium mt-0.5">
              Superaron la fecha de vencimiento acordada
            </p>
          </div>
        </div>

        {/* KPI 3: Proveedores con Saldo */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-700 rounded-xl">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedores con Saldo Activo</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{proveedoresConDeudaCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Empresas con obligaciones por saldar
            </p>
          </div>
        </div>
      </div>

      {/* Search & Tabs bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex gap-1.5 p-1 bg-slate-100/70 border border-slate-200/50 rounded-xl overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('proveedores'); setSearch('') }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'proveedores'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Saldos por Proveedor
          </button>
          <button
            onClick={() => { setActiveTab('facturas'); setSearch('') }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'facturas'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Facturas de Compra a Crédito</span>
            {facturasCredito.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'facturas' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                {facturasCredito.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('contado'); setSearch('') }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'contado'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Facturas Contado Pagadas</span>
            {facturasContado.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                {facturasContado.length}
              </span>
            )}
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === 'proveedores' ? "Buscar proveedor o NIT..." : "Buscar factura o proveedor..."}
            className="w-full pl-9 pr-3.5 py-2.0 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-16 text-slate-400">Cargando cuentas por pagar...</p>
          ) : activeTab === 'proveedores' ? (
            /* TAB 1: SALDOS POR PROVEEDOR */
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NIT / Cédula</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Comprado</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Saldo por Pagar</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-36">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProveedores.length > 0 ? (
                  filteredProveedores.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{item.nombre}</td>
                      <td className="p-4 font-mono font-medium text-slate-600 text-xs">{item.numeroDocumento || '—'}</td>
                      <td className="p-4 text-slate-500 text-xs">{item.telefono || '—'}</td>
                      <td className="p-4 text-right text-slate-600 font-medium">{fmt(Number(item.totalFacturado ?? 0))}</td>
                      <td className="p-4 text-right font-black text-indigo-900">{fmt(Number(item.saldo ?? 0))}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpenPagoProveedor(item.id)}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 hover:border-indigo-200 transition-all active:scale-[0.98]"
                        >
                          Abonar / Pagar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                      No hay deudas vigentes con proveedores.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : activeTab === 'facturas' ? (
            /* TAB 2: FACTURAS A CRÉDITO */
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Factura Interna</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nº Factura Proveedor</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Emisión</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vencimiento</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor Total</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Saldo Pendiente</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-36">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFacturasCredito.length > 0 ? (
                  filteredFacturasCredito.map((fc: any) => {
                    const hasVenc = !!fc.fechaVencimiento
                    const isOverdue = hasVenc && new Date(fc.fechaVencimiento).getTime() < Date.now()
                    const overdueMs = hasVenc ? Date.now() - new Date(fc.fechaVencimiento).getTime() : 0
                    const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24))
                    const saldo = fc.saldo !== null && fc.saldo !== undefined ? Number(fc.saldo) : Number(fc.total)
                    const totalPagado = Number(fc.totalPagado ?? 0)

                    return (
                      <tr key={fc.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-700 text-xs">
                          {fc.numero}
                        </td>
                        <td className="p-4 font-semibold text-slate-800 text-xs">
                          {fc.prefijoProveedor ? `${fc.prefijoProveedor}-` : ''}{fc.consecutivoProveedor}
                        </td>
                        <td className="p-4 font-medium text-slate-700">{fc.proveedor?.nombre ?? '—'}</td>
                        <td className="p-4 text-slate-500 text-xs">{new Date(fc.fechaEmision).toLocaleDateString('es-CO')}</td>
                        <td className="p-4 text-xs">
                          {hasVenc ? (
                            <span className={isOverdue ? "text-rose-600 font-bold" : "text-slate-600 font-medium"}>
                              {new Date(fc.fechaVencimiento).toLocaleDateString('es-CO')}
                              {isOverdue && ` (${overdueDays}d vencida)`}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sin vencimiento</span>
                          )}
                        </td>
                        <td className="p-4 text-right text-slate-600 font-medium">{fmt(Number(fc.total ?? 0))}</td>
                        <td className="p-4 text-right font-black text-indigo-900">{fmt(saldo)}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            totalPagado > 0
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {totalPagado > 0 ? 'Abonada' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenPagoFactura(fc)}
                            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 hover:border-indigo-200 transition-all active:scale-[0.98]"
                          >
                            Abonar / Pagar
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                      No hay facturas de compra a crédito con saldo pendiente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* TAB 3: FACTURAS CONTADO PAGADAS */
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-emerald-50/40 border-b border-emerald-100">
                  <th className="p-4 text-xs font-bold text-emerald-900 uppercase tracking-wider">Factura Interna</th>
                  <th className="p-4 text-xs font-bold text-emerald-900 uppercase tracking-wider">Nº Factura Proveedor</th>
                  <th className="p-4 text-xs font-bold text-emerald-900 uppercase tracking-wider">Proveedor</th>
                  <th className="p-4 text-xs font-bold text-emerald-900 uppercase tracking-wider">Fecha Emisión</th>
                  <th className="p-4 text-xs font-bold text-emerald-900 uppercase tracking-wider text-right">Total Factura</th>
                  <th className="p-4 text-xs font-bold text-emerald-900 uppercase tracking-wider text-center">Estado Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFacturasContado.length > 0 ? (
                  filteredFacturasContado.map((fc: any) => (
                    <tr key={fc.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="p-4 font-mono text-xs font-bold text-slate-700">
                        {fc.numero}
                      </td>
                      <td className="p-4 font-semibold text-slate-800 text-xs">
                        {fc.prefijoProveedor ? `${fc.prefijoProveedor}-` : ''}{fc.consecutivoProveedor}
                      </td>
                      <td className="p-4 font-medium text-slate-700">{fc.proveedor?.nombre ?? '—'}</td>
                      <td className="p-4 text-slate-500 text-xs">{new Date(fc.fechaEmision).toLocaleDateString('es-CO')}</td>
                      <td className="p-4 text-right font-bold text-slate-800">{fmt(Number(fc.total ?? 0))}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={11} /> Pagada de Contado
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                      No hay facturas de contado registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal para Registrar Pago a Proveedor */}
      {showPaymentModal && (
        <PagoProveedorModal
          factura={selectedFc}
          proveedorId={selectedProveedorId}
          todasFacturasCredito={facturasCredito}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedFc(null)
            setSelectedProveedorId(null)
          }}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['saldos-proveedores'] })
            qc.invalidateQueries({ queryKey: ['facturas-compra'] })
            setShowPaymentModal(false)
            setSelectedFc(null)
            setSelectedProveedorId(null)
          }}
        />
      )}
    </div>
  )
}

// ── Modal para Registrar Abono / Pago a Proveedor ──
function PagoProveedorModal({ factura, proveedorId, todasFacturasCredito, onClose, onSuccess }: any) {
  const qc = useQueryClient()
  const [selectedFacturaId, setSelectedFacturaId] = useState<string>(factura ? String(factura.id) : '')
  const [valor, setValor] = useState<string>('')
  const [medioPago, setMedioPago] = useState<string>('')
  const [referencia, setReferencia] = useState<string>('')
  const [notas, setNotas] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Facturas disponibles para ese proveedor
  const facturasDelProveedor = useMemo(() => {
    if (!proveedorId) return todasFacturasCredito
    return todasFacturasCredito.filter((f: any) => f.proveedorId === proveedorId)
  }, [proveedorId, todasFacturasCredito])

  // Factura actualmente seleccionada
  const activeFc = useMemo(() => {
    return facturasDelProveedor.find((f: any) => String(f.id) === String(selectedFacturaId)) || factura
  }, [facturasDelProveedor, selectedFacturaId, factura])

  const saldoPendienteFc = activeFc ? (activeFc.saldo !== null && activeFc.saldo !== undefined ? Number(activeFc.saldo) : Number(activeFc.total)) : 0

  // Prellenar valor sugerido con el saldo completo de la factura
  useState(() => {
    if (saldoPendienteFc > 0 && !valor) {
      setValor(String(Math.round(saldoPendienteFc)))
    }
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
      { id: 1, codigo: 'TRANSFERENCIA', nombre: 'Transferencia Bancaria' },
      { id: 2, codigo: 'EFECTIVO', nombre: 'Efectivo' },
      { id: 3, codigo: 'CHEQUE', nombre: 'Cheque' },
    ]
  }, [mediosPagoList])

  useState(() => {
    if (mediosActivos.length > 0 && !medioPago) {
      setMedioPago(mediosActivos[0].codigo)
    }
  })

  const mutPago = useMutation({
    mutationFn: (data: { fcId: number; payload: any }) => registrarPagoFacturaCompra(data.fcId, data.payload),
    onSuccess: () => {
      onSuccess()
    },
    onError: (err: any) => {
      setErrorMsg(getApiError(err, 'Error al registrar el pago al proveedor'))
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    const valNum = Number(valor || 0)
    if (!activeFc) return setErrorMsg('Selecciona una factura de compra')
    if (valNum <= 0) return setErrorMsg('Ingresa un valor válido')
    if (valNum > saldoPendienteFc) {
      return setErrorMsg(`El valor a pagar (${fmt(valNum)}) supera el saldo de la factura (${fmt(saldoPendienteFc)})`)
    }

    mutPago.mutate({
      fcId: activeFc.id,
      payload: {
        valor: valNum,
        medioPago,
        referencia: referencia || undefined,
        notas: notas || undefined,
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Registrar Pago a Proveedor</h2>
              <p className="text-[11px] text-slate-400">Abono o liquidación de Factura de Compra (CXP)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Información del Proveedor y Factura */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Proveedor:</span>
              <span className="font-bold text-slate-800">{activeFc?.proveedor?.nombre ?? '—'}</span>
            </div>
            {facturasDelProveedor.length > 1 ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Factura de Compra a Pagar
                </label>
                <select
                  value={selectedFacturaId}
                  onChange={e => {
                    setSelectedFacturaId(e.target.value)
                    const f = facturasDelProveedor.find((it: any) => String(it.id) === e.target.value)
                    if (f) {
                      const s = f.saldo !== null && f.saldo !== undefined ? Number(f.saldo) : Number(f.total)
                      setValor(String(Math.round(s)))
                    }
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {facturasDelProveedor.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.numero} (N° Prov: {f.consecutivoProveedor}) - Saldo: {fmt(Number(f.saldo ?? f.total))}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Factura Compra:</span>
                <span className="font-mono font-bold text-indigo-700">{activeFc?.numero} (N° {activeFc?.consecutivoProveedor})</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Saldo Pendiente:</span>
              <span className="font-black text-rose-600 text-sm">{fmt(saldoPendienteFc)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Valor a Abonar / Pagar *</label>
              <CurrencyInput
                value={valor}
                onChange={setValor}
                placeholder="0"
                required
                className="w-full !pl-7 !pr-3 !py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Medio de Pago *</label>
              <select
                value={medioPago}
                onChange={e => setMedioPago(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
              >
                {mediosActivos.map((m: any) => (
                  <option key={m.id || m.codigo} value={m.codigo}>
                    {m.nombre} {m.cajaBanco?.nombre ? `(${m.cajaBanco.nombre})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Comprobante / Referencia</label>
              <input
                value={referencia}
                onChange={e => setReferencia(e.target.value)}
                placeholder="N° transacción, cheque, CE..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notas / Observaciones</label>
              <input
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Abono a proveedor..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutPago.isPending}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-100"
            >
              {mutPago.isPending ? 'Guardando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

