import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVentasPos, anularVentaPos } from '../../services/pos.service'
import { Link } from 'react-router-dom'
import { Search, Printer, Eye, XCircle, Calendar, CreditCard, Banknote, Smartphone, CheckCircle, AlertTriangle, FileText, Send } from 'lucide-react'

const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)

export function VentasPosList() {
  const qc = useQueryClient()
  const getLocalDateString = () => {
    const d = new Date()
    const tzOffset = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0]
  }
  const [fecha, setFecha] = useState(getLocalDateString())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVenta, setSelectedVenta] = useState<any | null>(null)
  const [anularId, setAnularId] = useState<number | null>(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')

  const { data: ventas = [], isLoading } = useQuery({
    queryKey: ['ventas-pos', fecha],
    queryFn: () => getVentasPos({ fecha }),
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

  const filtradas = useMemo(() => {
    if (!searchQuery) return ventas
    return (ventas as any[]).filter((v: any) =>
      v.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.clienteNombre?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [ventas, searchQuery])

  // KPIs
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
        <div class="center">TICKET DE VENTA POS</div>
        <div class="line"></div>
        <div class="row"><span>Ticket:</span><span class="bold">${v.numero}</span></div>
        <div class="row"><span>Fecha:</span><span>${new Date(v.fecha).toLocaleString('es-CO')}</span></div>
        <div class="row"><span>Cliente:</span><span>${v.clienteNombre}</span></div>
        <div class="row"><span>Vendedor:</span><span>${v.vendedorNombre ?? '-'}</span></div>
        <div class="line"></div>
        ${(v.items ?? []).map((i: any) => `
          <div>
            <div class="bold">${i.producto?.nombre || 'Producto'}</div>
            <div class="row"><span>${Number(i.cantidad)} x ${cop(Number(i.precioUnitario))}</span><span>${cop(Number(i.cantidad) * Number(i.precioUnitario))}</span></div>
          </div>
        `).join('')}
        <div class="line"></div>
        <div class="row"><span>Subtotal:</span><span>${cop(Number(v.subtotal))}</span></div>
        ${Number(v.descuento) > 0 ? `<div class="row"><span>Descuento:</span><span>-${cop(Number(v.descuento))}</span></div>` : ''}
        <div class="row"><span>IVA 19%:</span><span>${cop(Number(v.iva19))}</span></div>
        <div class="row"><span>IVA 5%:</span><span>${cop(Number(v.iva5))}</span></div>
        <div class="line"></div>
        <div class="row big"><span>TOTAL:</span><span>${cop(Number(v.total))}</span></div>
        <div class="line"></div>
        ${Number(v.pagoEfectivo) > 0 ? `<div class="row"><span>Efectivo:</span><span>${cop(Number(v.pagoEfectivo))}</span></div>` : ''}
        ${Number(v.pagoTarjetaDebito) > 0 ? `<div class="row"><span>T. Débito:</span><span>${cop(Number(v.pagoTarjetaDebito))}</span></div>` : ''}
        ${Number(v.pagoTarjetaCredito) > 0 ? `<div class="row"><span>T. Crédito:</span><span>${cop(Number(v.pagoTarjetaCredito))}</span></div>` : ''}
        ${Number(v.pagoTransferencia) > 0 ? `<div class="row"><span>Transferencia:</span><span>${cop(Number(v.pagoTransferencia))}</span></div>` : ''}
        ${Number(v.pagoNequi) > 0 ? `<div class="row"><span>Nequi:</span><span>${cop(Number(v.pagoNequi))}</span></div>` : ''}
        ${Number(v.cambio) > 0 ? `<div class="row bold"><span>Cambio:</span><span>${cop(Number(v.cambio))}</span></div>` : ''}
        <div class="line"></div>
        ${v.estado === 'ANULADA' ? `<div class="center bold" style="color:red; font-size:12px">*** TICKET ANULADO ***<br/>Motivo: ${v.motivoAnulacion}</div>` : ''}
        <div class="center">¡Gracias por su compra!</div>
        <br/><br/>
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-indigo-650" size={26} /> Historial de Ventas POS
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Registro, reimpresión y anulación de tickets emitidos desde el Punto de Venta
          </p>
        </div>
        <Link to="/ventas/facturas/pendientes-emitir"
          className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-sm font-bold hover:bg-orange-100 transition-colors shadow-sm"
        >
          <Send size={14} /> Pendientes por emitir
        </Link>
      </div>

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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-slate-50/50 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
          <Search size={16} className="text-slate-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar ticket o cliente..."
            className="text-xs outline-none bg-transparent w-48 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 bg-slate-50/50 rounded-xl">
          <Calendar size={16} className="text-slate-400" />
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="text-xs outline-none bg-transparent font-bold text-slate-700"
          />
        </div>

        <span className="ml-auto text-xs text-slate-400 font-semibold">{filtradas.length} ticket(s) cargado(s)</span>
      </div>

      {/* Tabla */}
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
                  <th className="px-6 py-3.5 text-left">Número</th>
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
                      <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-700">{v.numero}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(v.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-xs block">{v.clienteNombre}</span>
                        {v.clienteDoc && <span className="text-[10px] text-slate-400 font-semibold">{v.clienteDoc}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2.5">
                          {hasEfectivo && (
                            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full border border-orange-100">
                              <Banknote size={10} /> Efectivo
                            </span>
                          )}
                          {hasTarjeta && (
                            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                              <CreditCard size={10} /> Tarjeta
                            </span>
                          )}
                          {hasTransfer && (
                            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full border border-sky-100">
                              <Smartphone size={10} /> Pasarela / Nequi
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">{cop(Number(v.total))}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          v.estado === 'ANULADA'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {v.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            title="Reimprimir Tirilla"
                            onClick={() => imprimirTirilla(v)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-650 rounded-lg transition-colors border border-slate-100 bg-slate-50/50"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            title="Ver Detalle"
                            onClick={() => setSelectedVenta(v)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-650 rounded-lg transition-colors border border-slate-100 bg-slate-50/50"
                          >
                            <Eye size={14} />
                          </button>
                          {v.estado !== 'ANULADA' && (
                            <button
                              title="Anular Venta"
                              onClick={() => setAnularId(v.id)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-lg transition-colors border border-slate-100 bg-slate-50/50"
                            >
                              <XCircle size={14} />
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

      {/* Modal Ver Detalle */}
      {selectedVenta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/20">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Detalle de Ticket POS</h3>
                <span className="font-mono text-xs text-indigo-700 font-bold">{selectedVenta.numero}</span>
              </div>
              <button
                onClick={() => setSelectedVenta(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Eye size={18} className="rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-550 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 block uppercase">Fecha</p>
                  <p className="text-slate-700 font-bold mt-0.5">{new Date(selectedVenta.fecha).toLocaleString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 block uppercase">Cliente</p>
                  <p className="text-slate-700 font-bold mt-0.5">{selectedVenta.clienteNombre}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 block uppercase">Cajero / Vendedor</p>
                  <p className="text-slate-700 font-bold mt-0.5">{selectedVenta.vendedorNombre ?? '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 block uppercase">Estado</p>
                  <p className={`font-bold mt-0.5 ${selectedVenta.estado === 'ANULADA' ? 'text-red-650' : 'text-emerald-700'}`}>{selectedVenta.estado}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Productos</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedVenta.items.map((i: any) => (
                    <div key={i.id} className="p-3 flex justify-between items-center text-xs bg-white">
                      <div>
                        <span className="font-bold text-slate-805 block">{i.producto?.nombre || 'Producto'}</span>
                        <span className="text-[10px] text-slate-450 font-semibold">{Number(i.cantidad)} u. x {cop(Number(i.precioUnitario))}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-750">{cop(Number(i.cantidad) * Number(i.precioUnitario))}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-slate-800">{cop(Number(selectedVenta.subtotal))}</span>
                </div>
                {Number(selectedVenta.descuento) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span>-{cop(Number(selectedVenta.descuento))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>IVA 19%:</span>
                  <span className="text-slate-800">{cop(Number(selectedVenta.iva19))}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA 5%:</span>
                  <span className="text-slate-800">{cop(Number(selectedVenta.iva5))}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-100">
                  <span>TOTAL:</span>
                  <span>{cop(Number(selectedVenta.total))}</span>
                </div>
              </div>

              {selectedVenta.estado === 'ANULADA' && (
                <div className="bg-red-50/50 border border-red-200/50 p-3.5 rounded-xl flex gap-2">
                  <AlertTriangle className="text-red-650 shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">Motivo de Anulación</span>
                    <p className="text-xs text-red-700 font-semibold mt-0.5">{selectedVenta.motivoAnulacion}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => imprimirTirilla(selectedVenta)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-650 rounded-xl transition-colors"
              >
                <Printer size={14} /> Reimprimir
              </button>
              <button
                type="button"
                onClick={() => setSelectedVenta(null)}
                className="px-4 py-2 bg-indigo-650 text-white hover:bg-indigo-750 text-xs font-bold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Anular */}
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
