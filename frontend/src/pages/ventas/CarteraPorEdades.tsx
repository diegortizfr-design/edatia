import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, BarChart3, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { getFacturas } from '../../services/ventas.service'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

export function CarteraPorEdades() {
  const [expandedClients, setExpandedClients] = useState<Set<number>>(new Set())

  // Consultar todas las facturas pendientes
  const { data: facturasEmitidas = [], isLoading: loadingEmitidas } = useQuery({
    queryKey: ['facturas-cxc-emitidas'],
    queryFn: () => getFacturas({ estado: 'EMITIDA' }),
  })

  const { data: facturasParciales = [], isLoading: loadingParciales } = useQuery({
    queryKey: ['facturas-cxc-parciales'],
    queryFn: () => getFacturas({ estado: 'PARCIAL' }),
  })

  const loading = loadingEmitidas || loadingParciales
  const facturasPendientes = [...facturasEmitidas, ...facturasParciales]

  // Definición de Rangos de Antigüedad
  const ranges = {
    corriente: { label: 'Al Día', val: 0, color: 'bg-emerald-500' },
    r1_30:     { label: '1 - 30 Días', val: 0, color: 'bg-blue-500' },
    r31_60:    { label: '31 - 60 Días', val: 0, color: 'bg-amber-500' },
    r61_90:    { label: '61 - 90 Días', val: 0, color: 'bg-orange-500' },
    r91_plus:  { label: 'Más de 90 Días', val: 0, color: 'bg-rose-500' },
  }

  // Agrupamiento por cliente
  const clientBrackets: Record<number, {
    nombre: string;
    documento: string;
    total: number;
    corriente: number;
    r1_30: number;
    r31_60: number;
    r61_90: number;
    r91_plus: number;
    facturas: any[];
  }> = {}

  facturasPendientes.forEach((f: any) => {
    const saldoVal = Number(f.saldo ?? 0)
    const cId = f.clienteId
    const cName = f.cliente?.nombre ?? 'Cliente sin Nombre'
    const cDoc = f.cliente?.numeroDocumento ?? '—'

    // Inicializar cliente si no existe
    if (!clientBrackets[cId]) {
      clientBrackets[cId] = {
        nombre: cName,
        documento: cDoc,
        total: 0,
        corriente: 0,
        r1_30: 0,
        r31_60: 0,
        r61_90: 0,
        r91_plus: 0,
        facturas: [],
      }
    }

    const client = clientBrackets[cId]
    client.total += saldoVal
    client.facturas.push(f)

    // Clasificar deuda
    const isVencido = new Date(f.fechaVencimiento).getTime() < Date.now()
    if (!isVencido) {
      ranges.corriente.val += saldoVal
      client.corriente += saldoVal
    } else {
      const overdueMs = Date.now() - new Date(f.fechaVencimiento).getTime()
      const days = Math.floor(overdueMs / (1000 * 60 * 60 * 24))

      if (days <= 30) {
        ranges.r1_30.val += saldoVal
        client.r1_30 += saldoVal
      } else if (days <= 60) {
        ranges.r31_60.val += saldoVal
        client.r31_60 += saldoVal
      } else if (days <= 90) {
        ranges.r61_90.val += saldoVal
        client.r61_90 += saldoVal
      } else {
        ranges.r91_plus.val += saldoVal
        client.r91_plus += saldoVal
      }
    }
  })

  const totalGeneral = Object.values(ranges).reduce((sum, r) => sum + r.val, 0)

  const toggleClientExpansion = (clientId: number) => {
    setExpandedClients(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) next.delete(clientId)
      else next.add(clientId)
      return next
    })
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
          <span className="text-slate-650 font-medium">Antigüedad por Edades</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Calendar className="text-indigo-600" size={24} />
          Antigüedad de Cartera (Edades)
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Clasifica y analiza la antigüedad de los saldos pendientes para priorizar la gestión de cobranza.
        </p>
      </div>

      {/* Visual Aging Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <BarChart3 size={18} className="text-slate-500" />
          Distribución de la Deuda Contable
        </h2>
        
        {loading ? (
          <div className="h-6 bg-slate-100 rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-4">
            {/* Multi-segmented progress bar */}
            <div className="h-6 w-full bg-slate-150 rounded-xl overflow-hidden flex shadow-inner">
              {Object.entries(ranges).map(([key, r]) => {
                const pct = totalGeneral > 0 ? (r.val / totalGeneral) * 100 : 0
                if (pct === 0) return null
                return (
                  <div
                    key={key}
                    className={`${r.color} h-full transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${r.label}: ${fmt(r.val)} (${pct.toFixed(1)}%)`}
                  />
                )
              })}
              {totalGeneral === 0 && (
                <div className="h-full w-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-semibold">
                  Sin deudas activas
                </div>
              )}
            </div>

            {/* Range Legend Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
              {Object.entries(ranges).map(([key, r]) => {
                const pct = totalGeneral > 0 ? (r.val / totalGeneral) * 100 : 0
                return (
                  <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-left space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${r.color}`} />
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">{r.label}</span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-800">{fmt(r.val)}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{pct.toFixed(1)}% del total</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Aged Table by Client */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-16 text-slate-500">Analizando edades de cartera...</p>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3 w-8" />
                  <th className="p-3 text-left">Cliente</th>
                  <th className="p-3 text-right">Saldo Total</th>
                  <th className="p-3 text-right bg-emerald-50/50 text-emerald-800">Al Día</th>
                  <th className="p-3 text-right bg-blue-50/50 text-blue-800">1-30 Días</th>
                  <th className="p-3 text-right bg-amber-50/50 text-amber-800">31-60 Días</th>
                  <th className="p-3 text-right bg-orange-50/50 text-orange-850">61-90 Días</th>
                  <th className="p-3 text-right bg-rose-50/50 text-rose-800">Cuentas {'>'} 90d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {Object.entries(clientBrackets).length > 0 ? (
                  Object.entries(clientBrackets).map(([cIdStr, client]: [string, any]) => {
                    const cId = Number(cIdStr)
                    const isExpanded = expandedClients.has(cId)

                    return (
                      <React.Fragment key={cId}>
                        {/* Fila Principal del Cliente */}
                        <tr
                          onClick={() => toggleClientExpansion(cId)}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer font-medium text-slate-700"
                        >
                          <td className="p-3 text-center text-slate-400">
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {client.nombre}
                            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{client.documento}</span>
                          </td>
                          <td className="p-3 text-right font-extrabold text-slate-900">{fmt(client.total)}</td>
                          <td className="p-3 text-right font-semibold text-emerald-700 bg-emerald-50/20">{client.corriente > 0 ? fmt(client.corriente) : '—'}</td>
                          <td className="p-3 text-right font-semibold text-blue-700 bg-blue-50/20">{client.r1_30 > 0 ? fmt(client.r1_30) : '—'}</td>
                          <td className="p-3 text-right font-semibold text-amber-700 bg-amber-50/20">{client.r31_60 > 0 ? fmt(client.r31_60) : '—'}</td>
                          <td className="p-3 text-right font-semibold text-orange-800 bg-orange-50/20">{client.r61_90 > 0 ? fmt(client.r61_90) : '—'}</td>
                          <td className="p-3 text-right font-extrabold text-rose-700 bg-rose-50/20">{client.r91_plus > 0 ? fmt(client.r91_plus) : '—'}</td>
                        </tr>

                        {/* Desglose de Facturas si está expandido */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0 bg-slate-50/30">
                              <div className="px-10 py-3 bg-slate-50/80 border-t border-b border-slate-100 space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Desglose de Facturas Pendientes</p>
                                <div className="border border-slate-200/60 rounded-xl overflow-hidden bg-white max-w-3xl">
                                  <table className="w-full text-left text-[11px]">
                                    <thead className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
                                      <tr>
                                        <th className="p-2">Nº Factura</th>
                                        <th className="p-2">Fecha Emisión</th>
                                        <th className="p-2">Fecha Vencimiento</th>
                                        <th className="p-2 text-right">Saldo</th>
                                        <th className="p-2 text-center">Estado</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {client.facturas.map((f: any) => {
                                        const overdueMs = Date.now() - new Date(f.fechaVencimiento).getTime()
                                        const days = Math.floor(overdueMs / (1000 * 60 * 60 * 24))
                                        const isV = days > 0

                                        return (
                                          <tr key={f.id} className="hover:bg-slate-50/50">
                                            <td className="p-2 font-mono font-bold text-indigo-700">{f.numero}</td>
                                            <td className="p-2 text-slate-500">{new Date(f.fecha).toLocaleDateString('es-CO')}</td>
                                            <td className="p-2 font-medium">
                                              <span className={isV ? "text-rose-600 font-bold" : "text-slate-600"}>
                                                {new Date(f.fechaVencimiento).toLocaleDateString('es-CO')}
                                                {isV && ` (${days}d vencida)`}
                                              </span>
                                            </td>
                                            <td className="p-2 text-right font-semibold text-slate-800">{fmt(Number(f.saldo))}</td>
                                            <td className="p-2 text-center">
                                              <span className={`inline-flex px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold ${
                                                isV ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                              }`}>
                                                {isV ? 'Vencida' : 'Al Día'}
                                              </span>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400 italic">
                      No hay registros contables de cartera por edades.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
