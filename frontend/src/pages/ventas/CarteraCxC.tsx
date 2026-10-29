import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DollarSign, User, AlertCircle, FileText, Search, CreditCard, Clock, CheckCircle2 } from 'lucide-react'
import { getSaldosClientes, getFacturas } from '../../services/ventas.service'
import { NuevoReciboModal } from './ReciboCaja'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

export function CarteraCxC() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'clientes' | 'facturas' | 'contado_pdte'>('clientes')
  const [search, setSearch] = useState('')
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)

  // Consultar saldos acumulados por cliente
  const { data: saldosClientes = [], isLoading: loadingSaldos } = useQuery({
    queryKey: ['saldos-clientes'],
    queryFn: getSaldosClientes,
  })

  // Consultar facturas de venta pendientes (EMITIDA y PARCIAL)
  const { data: facturasEmitidas = [], isLoading: loadingEmitidas } = useQuery({
    queryKey: ['facturas-cxc-emitidas'],
    queryFn: () => getFacturas({ estado: 'EMITIDA' }),
  })

  const { data: facturasParciales = [], isLoading: loadingParciales } = useQuery({
    queryKey: ['facturas-cxc-parciales'],
    queryFn: () => getFacturas({ estado: 'PARCIAL' }),
  })

  const loading = loadingSaldos || loadingEmitidas || loadingParciales

  // Combinar facturas con saldo pendiente
  const facturasPendientes = [...facturasEmitidas, ...facturasParciales].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  // Separar crédito vs contado sin recibo de caja
  const facturasCredito = facturasPendientes.filter((f: any) => f.formaPago !== 'CONTADO')
  const facturasContadoPdte = facturasPendientes.filter((f: any) => f.formaPago === 'CONTADO' && Number(f.saldo ?? 0) > 0)

  // Cálculos de KPIs
  const totalCartera = facturasPendientes.reduce((sum, f) => sum + Number(f.saldo ?? 0), 0)
  const totalContadoPdte = facturasContadoPdte.reduce((sum, f) => sum + Number(f.saldo ?? 0), 0)
  
  const totalVencido = facturasCredito.reduce((sum, f) => {
    if (!f.fechaVencimiento) return sum
    const isVencido = new Date(f.fechaVencimiento).getTime() < Date.now()
    return isVencido ? sum + Number(f.saldo ?? 0) : sum
  }, 0)

  const clientesEnMoraCount = saldosClientes.filter((c: any) => Number(c.saldo ?? 0) > 0).length

  // Filtrar según el tab activo
  const filteredClientes = (saldosClientes as any[]).filter((c: any) =>
    (c.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.numeroDocumento || '').includes(search)
  )

  const filteredFacturas = facturasCredito.filter((f: any) =>
    (f.numero || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.cliente?.nombre || '').toLowerCase().includes(search.toLowerCase())
  )

  const filteredFacturasContado = facturasContadoPdte.filter((f: any) =>
    (f.numero || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.cliente?.nombre || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenReceipt = (clienteId: number) => {
    setSelectedClienteId(String(clienteId))
    setShowReceiptModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span>Ventas</span>
          <span className="text-slate-300">/</span>
          <span>Cartera</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-650 font-medium">Cuentas por Cobrar</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <CreditCard className="text-indigo-600" size={24} />
          Cuentas por Cobrar (CxC)
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Monitorea las deudas vigentes de clientes, facturas a crédito y facturas de contado pendientes por recaudar.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Cartera Total */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cartera Pendiente</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{fmt(totalCartera)}</p>
            {totalContadoPdte > 0 && (
              <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                Incluye {fmt(totalContadoPdte)} de contado sin recibo
              </p>
            )}
          </div>
        </div>

        {/* KPI 2: Cartera Vencida */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cartera a Crédito Vencida</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{fmt(totalVencido)}</p>
          </div>
        </div>

        {/* KPI 3: Clientes con Deuda */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-650 rounded-xl">
            <User size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clientes con Saldos Activos</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{clientesEnMoraCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Tabs bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex gap-1.5 p-1 bg-slate-100/70 border border-slate-200/50 rounded-xl overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('clientes'); setSearch('') }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'clientes'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Saldos por Cliente
          </button>
          <button
            onClick={() => { setActiveTab('facturas'); setSearch('') }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'facturas'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            <span>Facturas a Crédito</span>
            {facturasCredito.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'facturas' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                {facturasCredito.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('contado_pdte'); setSearch('') }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'contado_pdte'
                ? 'bg-white text-amber-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            <span>Facturas contado pdtes por pagar</span>
            {facturasContadoPdte.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 animate-pulse">
                {facturasContadoPdte.length}
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
            placeholder={activeTab === 'clientes' ? "Buscar cliente..." : "Buscar factura o cliente..."}
            className="w-full pl-9 pr-3.5 py-2.0 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-16 text-slate-550">Cargando información contable...</p>
          ) : activeTab === 'clientes' ? (
            /* TAB 1: SALDOS POR CLIENTE */
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nº Documento</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Facturado</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Saldo Pendiente</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-36">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.length > 0 ? (
                  filteredClientes.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{item.nombre}</td>
                      <td className="p-4 font-mono font-medium text-slate-650 text-xs">{item.numeroDocumento || '—'}</td>
                      <td className="p-4 text-right text-slate-600 font-medium">{fmt(Number(item.totalFacturado ?? 0))}</td>
                      <td className="p-4 text-right font-bold text-indigo-900">{fmt(Number(item.saldo ?? 0))}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpenReceipt(item.id)}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 hover:border-indigo-200 transition-all active:scale-[0.98]"
                        >
                          Recibir Pago
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      No se encontraron clientes con deudas vigentes.
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
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Factura</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Emisión</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vencimiento</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor Total</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Saldo Pendiente</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-36">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFacturas.length > 0 ? (
                  filteredFacturas.map((item: any) => {
                    const hasVenc = !!item.fechaVencimiento
                    const isOverdue = hasVenc && new Date(item.fechaVencimiento).getTime() < Date.now()
                    const overdueMs = hasVenc ? Date.now() - new Date(item.fechaVencimiento).getTime() : 0
                    const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24))

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-4 font-mono text-xs">
                          <span className="font-bold text-slate-800">{item.numero}</span>
                          {item.numeroCxc && (
                            <span className="block text-[10px] text-indigo-600 font-semibold mt-0.5">
                              Doc CXC: {item.numeroCxc}
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-medium text-slate-700">{item.cliente?.nombre ?? '—'}</td>
                        <td className="p-4 text-slate-500 text-xs">{new Date(item.fecha).toLocaleDateString('es-CO')}</td>
                        <td className="p-4 text-xs">
                          {hasVenc ? (
                            <span className={isOverdue ? "text-rose-600 font-bold" : "text-slate-500"}>
                              {new Date(item.fechaVencimiento).toLocaleDateString('es-CO')}
                              {isOverdue && ` (${overdueDays}d vencida)`}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sin vencimiento</span>
                          )}
                        </td>
                        <td className="p-4 text-right text-slate-600 font-medium">{fmt(Number(item.total ?? 0))}</td>
                        <td className="p-4 text-right font-bold text-indigo-900">{fmt(Number(item.saldo ?? 0))}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            item.estado === 'PARCIAL'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {item.estado === 'PARCIAL' ? 'Abonado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenReceipt(item.clienteId)}
                            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 hover:border-indigo-200 transition-all active:scale-[0.98]"
                          >
                            Recibir Pago
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                      No hay facturas a crédito pendientes con saldo en cobro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* TAB 3: FACTURAS CONTADO PDTES POR PAGAR / RECAUDAR */
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-amber-50/50 border-b border-amber-100/70">
                  <th className="p-4 text-xs font-bold text-amber-900 uppercase tracking-wider">Factura Contado</th>
                  <th className="p-4 text-xs font-bold text-amber-900 uppercase tracking-wider">Cliente</th>
                  <th className="p-4 text-xs font-bold text-amber-900 uppercase tracking-wider">Emisión</th>
                  <th className="p-4 text-xs font-bold text-amber-900 uppercase tracking-wider text-right">Total Factura</th>
                  <th className="p-4 text-xs font-bold text-amber-900 uppercase tracking-wider text-right">Saldo por Recaudar</th>
                  <th className="p-4 text-xs font-bold text-amber-900 uppercase tracking-wider text-center">Estado Cobro</th>
                  <th className="p-4 text-xs font-bold text-amber-900 uppercase tracking-wider text-center w-40">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFacturasContado.length > 0 ? (
                  filteredFacturasContado.map((item: any) => (
                    <tr key={item.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="p-4 font-mono text-xs">
                        <span className="font-bold text-slate-800">{item.numero}</span>
                        <span className="inline-block ml-2 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                          CONTADO
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{item.cliente?.nombre ?? '—'}</td>
                      <td className="p-4 text-slate-500 text-xs">{new Date(item.fecha).toLocaleDateString('es-CO')}</td>
                      <td className="p-4 text-right text-slate-600 font-medium">{fmt(Number(item.total ?? 0))}</td>
                      <td className="p-4 text-right font-black text-amber-700">{fmt(Number(item.saldo ?? 0))}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock size={11} /> Pendiente Recibo
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpenReceipt(item.clienteId)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
                        >
                          Generar Recibo
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                      No hay facturas de contado pendientes por recaudar. Todas cuentan con recibo de caja.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showReceiptModal && (
        <ReciboCajaModalWrapper
          clienteId={selectedClienteId}
          onClose={() => {
            setShowReceiptModal(false)
            setSelectedClienteId(null)
          }}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['saldos-clientes'] })
            qc.invalidateQueries({ queryKey: ['facturas-cxc-emitidas'] })
            qc.invalidateQueries({ queryKey: ['facturas-cxc-parciales'] })
            setShowReceiptModal(false)
            setSelectedClienteId(null)
          }}
        />
      )}
    </div>
  )
}

// Wrapper local para instanciar el modal importado
function ReciboCajaModalWrapper({ clienteId, onClose, onSuccess }: any) {
  return (
    <NuevoReciboModal
      onClose={onClose}
      onSuccess={onSuccess}
      initialClienteId={clienteId}
    />
  )
}
