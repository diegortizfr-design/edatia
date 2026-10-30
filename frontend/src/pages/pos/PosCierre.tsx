import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getSesion, cerrarCaja } from '../../services/pos.service'
import { getMediosPago } from '../../services/configuracion.service'
import { ChevronLeft, Printer, CheckCircle2, TrendingUp, Banknote, CreditCard, Smartphone, AlertTriangle, Building2, Coins, QrCode } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

function getMedioIcon(codigo: string = '', nombre: string = '') {
  const c = codigo.toUpperCase()
  const n = nombre.toUpperCase()
  if (c === 'EFECTIVO' || n.includes('EFECTIVO')) {
    return <Banknote size={14} className="text-green-500" />
  }
  if (c.includes('DEBITO') || n.includes('DEBITO') || c.includes('CREDITO') || n.includes('CREDITO') || c.includes('TARJETA') || n.includes('TARJETA') || c.includes('DATAFONO') || n.includes('DATAFONO')) {
    return <CreditCard size={14} className="text-blue-500" />
  }
  if (c.includes('NEQUI') || n.includes('NEQUI') || c.includes('DAVIPLATA') || n.includes('DAVIPLATA')) {
    return <Smartphone size={14} className="text-pink-500" />
  }
  if (c.includes('QR') || n.includes('QR')) {
    return <QrCode size={14} className="text-purple-600" />
  }
  if (c.includes('TRANSFERENCIA') || n.includes('TRANSFERENCIA') || c.includes('BANCO') || n.includes('PSE')) {
    return <Building2 size={14} className="text-cyan-500" />
  }
  return <Coins size={14} className="text-indigo-500" />
}

const BILLETES = [
  { key: 'b100000', label: '$100.000', valor: 100000 },
  { key: 'b50000',  label: '$50.000',  valor: 50000 },
  { key: 'b20000',  label: '$20.000',  valor: 20000 },
  { key: 'b10000',  label: '$10.000',  valor: 10000 },
  { key: 'b5000',   label: '$5.000',   valor: 5000 },
  { key: 'b2000',   label: '$2.000',   valor: 2000 },
  { key: 'b1000',   label: '$1.000 billete', valor: 1000 },
]
const MONEDAS = [
  { key: 'm1000', label: '$1.000 moneda', valor: 1000 },
  { key: 'm500',  label: '$500',          valor: 500 },
  { key: 'm200',  label: '$200',          valor: 200 },
  { key: 'm100',  label: '$100',          valor: 100 },
  { key: 'm50',   label: '$50',           valor: 50 },
]

const EMPTY_ARQUEO = {
  b100000: 0, b50000: 0, b20000: 0, b10000: 0, b5000: 0, b2000: 0, b1000: 0,
  m1000: 0, m500: 0, m200: 0, m100: 0, m50: 0,
}

export function PosCierre() {
  const { sesionId } = useParams<{ sesionId: string }>()
  const navigate = useNavigate()
  const sesId = parseInt(sesionId ?? '0')

  const [arqueo, setArqueo] = useState<any>({ ...EMPTY_ARQUEO })
  const [observaciones, setObservaciones] = useState('')
  const [cerrada, setCerrada] = useState<any>(null)

  const { data: sesion, isLoading } = useQuery(['sesion-pos', sesId], () => getSesion(sesId), { enabled: !!sesId })
  const { data: mediosPago = [] } = useQuery(['config-medios-pago'], getMediosPago)

  const resumenMedios = useMemo(() => {
    if (sesion?.resumenMediosPago && Array.isArray(sesion.resumenMediosPago) && sesion.resumenMediosPago.length > 0) {
      return sesion.resumenMediosPago
    }

    const active = (mediosPago || []).filter((mp: any) => mp.activo)
    if (active.length > 0) {
      const detalleTotals: Record<string, number> = {}
      let totalDetalle = 0
      ;(sesion?.ventas || []).forEach((v: any) => {
        if (v.pagosDetalle && typeof v.pagosDetalle === 'object') {
          Object.entries(v.pagosDetalle).forEach(([k, amt]) => {
            const num = Number(amt) || 0
            if (num > 0) {
              const ku = k.toUpperCase()
              detalleTotals[ku] = (detalleTotals[ku] || 0) + num
              totalDetalle += num
            }
          })
        }
      })

      const netEfectivo = Number(sesion?.totalEfectivo ?? 0)
      const debito = (sesion?.ventas || []).reduce((acc: number, v: any) => acc + Number(v.pagoTarjetaDebito ?? 0), 0)
      const credito = (sesion?.ventas || []).reduce((acc: number, v: any) => acc + Number(v.pagoTarjetaCredito ?? 0), 0)
      const transferencia = Number(sesion?.totalTransferencia ?? 0)
      const nequi = Number(sesion?.totalNequi ?? 0)
      const totalTarjeta = debito + credito > 0 ? (debito + credito) : Number(sesion?.totalTarjeta ?? 0)

      return active.map((m: any) => {
        const code = (m.codigo || '').toUpperCase()
        const name = (m.nombre || '').toUpperCase()
        let val = 0
        if (totalDetalle > 0) {
          if (detalleTotals[code] !== undefined) val = detalleTotals[code]
          else if (detalleTotals[name] !== undefined) val = detalleTotals[name]
          else if (detalleTotals[String(m.id)] !== undefined) val = detalleTotals[String(m.id)]
        }
        if (val === 0) {
          if (code === 'EFECTIVO' || name.includes('EFECTIVO')) {
          val = netEfectivo
        } else if (code.includes('DEBITO') || name.includes('DEBITO')) {
          val = debito
        } else if (code.includes('CREDITO') || name.includes('CREDITO')) {
          val = credito
        } else if (code.includes('TARJETA') || name.includes('TARJETA') || code.includes('DATAFONO') || name.includes('DATAFONO')) {
          val = totalTarjeta
        } else if (code.includes('NEQUI') || name.includes('NEQUI') || code.includes('DAVIPLATA') || name.includes('DAVIPLATA')) {
          val = nequi
        } else if (
          code.includes('TRANSFERENCIA') || name.includes('TRANSFERENCIA') ||
          code.includes('BANCO') || name.includes('PSE') ||
          code.includes('QR') || name.includes('QR') ||
          code.includes('BOLD') || name.includes('BOLD') ||
          code.includes('ADDI') || name.includes('ADDI') ||
          code.includes('SISTECREDITO') || name.includes('SISTECREDITO')
        ) {
          val = transferencia
        }
        }
        return {
          id: m.id,
          codigo: m.codigo,
          nombre: m.nombre,
          total: val,
        }
      })
    }

    return [
      { codigo: 'EFECTIVO', nombre: 'Efectivo', total: Number(sesion?.totalEfectivo ?? 0) },
      { codigo: 'TARJETA', nombre: 'Tarjeta', total: Number(sesion?.totalTarjeta ?? 0) },
      { codigo: 'TRANSFERENCIA', nombre: 'Transferencia', total: Number(sesion?.totalTransferencia ?? 0) },
      { codigo: 'NEQUI', nombre: 'Nequi', total: Number(sesion?.totalNequi ?? 0) },
    ]
  }, [sesion, mediosPago])

  const mutCerrar = useMutation({
    mutationFn: () => cerrarCaja(sesId, { arqueo, observaciones }),
    onSuccess: (data) => setCerrada(data),
  })

  const setArq = (key: string, val: number) => setArqueo((a: any) => ({ ...a, [key]: Math.max(0, val) }))

  const totalContado = [...BILLETES, ...MONEDAS].reduce((sum, d) => sum + (arqueo[d.key] ?? 0) * d.valor, 0)
  const totalSistema = isLoading ? 0 : Number(sesion?.montoInicial ?? 0) + Number(sesion?.totalEfectivo ?? 0)
  const diferencia = totalContado - totalSistema
  const tieneDocCierre = Boolean(sesion?.caja?.documentoCierreConfig || sesion?.caja?.documentoCierreConfigId)

  const imprimirCierre = () => {
    const w = window.open('', '_blank', 'width=320,height=700')
    if (!w || !sesion) return
    const numDoc = cerrada?.numeroCierre || sesion?.numeroCierre || '—'
    w.document.write(`
      <html><head><style>
        body{font-family:monospace;font-size:11px;margin:0;padding:8px;width:290px}
        .c{text-align:center}.b{font-weight:bold}.l{border-top:1px dashed #000;margin:4px 0}
        .r{display:flex;justify-content:space-between}
      </style></head><body>
        <div class="c b" style="font-size:14px">CIERRE DE CAJA</div>
        <div class="c b" style="font-size:12px;margin:2px 0 4px">${numDoc}</div>
        <div class="c">${sesion.caja?.nombre}</div>
        <div class="l"></div>
        <div class="r"><span>Comprobante:</span><span class="b">${numDoc}</span></div>
        <div class="r"><span>Vendedor:</span><span>${sesion.vendedorNombre}</span></div>
        <div class="r"><span>Apertura:</span><span>${new Date(sesion.abiertaAt).toLocaleString('es-CO')}</span></div>
        <div class="r"><span>Cierre:</span><span>${new Date().toLocaleString('es-CO')}</span></div>
        <div class="l"></div>
        <div class="r"><span>Transacciones:</span><span>${sesion.numTransacciones}</span></div>
        <div class="r"><span>Total ventas:</span><span>${fmt(Number(sesion.totalVentas))}</span></div>
        <div class="l"></div>
        <div class="c b" style="font-size:10px;margin:2px 0 3px">MEDIOS DE PAGO</div>
        ${resumenMedios.map((m: any) => `<div class="r"><span>${m.nombre}:</span><span>${fmt(Number(m.total ?? 0))}</span></div>`).join('')}
        <div class="l"></div>
        <div class="r"><span>Monto inicial:</span><span>${fmt(Number(sesion.montoInicial))}</span></div>
        <div class="r"><span>Total sistema:</span><span>${fmt(totalSistema)}</span></div>
        <div class="r"><span>Total contado:</span><span>${fmt(totalContado)}</span></div>
        <div class="r b"><span>Diferencia:</span><span>${diferencia >= 0 ? '+' : ''}${fmt(diferencia)}</span></div>
        <div class="l"></div>
        ${observaciones ? `<div>Obs: ${observaciones}</div><div class="l"></div>` : ''}
        <div class="c">Firma: ___________________</div>
        <br/>
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  if (cerrada) return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-slate-800 mb-1">¡Caja cerrada exitosamente!</h2>
      {cerrada.numeroCierre && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs mb-3">
          <span>Comprobante de Cierre:</span>
          <span className="font-mono">{cerrada.numeroCierre}</span>
        </div>
      )}
      <p className="text-slate-500 mb-2">Turno finalizado — {cerrada.caja?.nombre}</p>
      <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 mb-6 text-sm">
        {cerrada.numeroCierre && (
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500 font-medium">Comprobante Fiscal:</span>
            <span className="font-bold font-mono text-indigo-700">{cerrada.numeroCierre}</span>
          </div>
        )}
        <div className="flex justify-between"><span className="text-slate-500">Total ventas:</span><span className="font-bold text-green-600">{fmt(Number(cerrada.totalVentas))}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Monto contado:</span><span className="font-bold">{fmt(Number(cerrada.montoFinalDeclarado))}</span></div>
        <div className={`flex justify-between font-bold ${Number(cerrada.diferencia) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <span>Diferencia:</span><span>{Number(cerrada.diferencia) >= 0 ? '+' : ''}{fmt(Number(cerrada.diferencia))}</span>
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={imprimirCierre} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <Printer size={16} /> Imprimir comprobante
        </button>
        <button onClick={() => navigate('/pos')} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">
          Volver al POS
        </button>
      </div>
    </div>
  )

  if (isLoading) return <div className="text-center py-16 text-slate-400">Cargando...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/pos/screen/${sesId}`)} className="text-slate-400 hover:text-slate-700">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Cierre de Caja — {sesion?.caja?.nombre}</h1>
          <p className="text-slate-500 text-sm">Arqueo y cuadre del turno respaldado por Comprobante de Cierre [CF]</p>
        </div>
      </div>

      {!tieneDocCierre && !isLoading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 shadow-sm">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="text-sm">
            <strong className="font-bold block mb-0.5">Comprobante de Cierre [CF] no configurado</strong>
            Esta caja no tiene vinculado un documento de <strong>Comprobante de Cierre</strong>. En el ERP, todo cierre de caja debe estar respaldado por un documento oficial consecutivo.
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => navigate('/pos/config')}
                className="text-xs bg-amber-700 hover:bg-amber-800 text-white font-bold py-1.5 px-3 rounded-lg transition-colors shadow-sm"
              >
                Configurar Comprobante en la Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen del turno */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={16} /> Resumen del turno</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <span className="text-slate-600">Transacciones</span>
            <span className="font-bold text-slate-800">{sesion?.numTransacciones ?? 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
            <span className="text-slate-600 font-medium">Total ventas</span>
            <span className="font-bold text-green-700">{fmt(Number(sesion?.totalVentas ?? 0))}</span>
          </div>

          {resumenMedios.map((item: any, i: number) => (
            <div key={item.id || item.codigo || i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2 text-slate-600">
                {getMedioIcon(item.codigo, item.nombre)}
                <span>{item.nombre}</span>
              </div>
              <span className="font-bold text-slate-800">{fmt(Number(item.total ?? 0))}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Arqueo de caja */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><Banknote size={16} /> Arqueo de caja</h2>
        <p className="text-xs text-slate-500 mb-4">Cuenta el dinero físico en la caja e ingresa la cantidad de cada denominación.</p>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Billetes</div>
          {BILLETES.map(b => (
            <div key={b.key} className="flex items-center gap-3">
              <span className="w-28 text-sm text-slate-700 font-mono">{b.label}</span>
              <input type="number" min={0} value={arqueo[b.key] || ''}
                onChange={e => setArq(b.key, +e.target.value)}
                placeholder="0"
                className="w-20 p-2 border border-slate-200 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-indigo-200" />
              <span className="text-slate-400 text-sm">×</span>
              <span className="w-20 text-right text-sm text-slate-600 font-mono">{fmt((arqueo[b.key] ?? 0) * b.valor)}</span>
            </div>
          ))}

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 pt-2">Monedas</div>
          {MONEDAS.map(m => (
            <div key={m.key} className="flex items-center gap-3">
              <span className="w-28 text-sm text-slate-700 font-mono">{m.label}</span>
              <input type="number" min={0} value={arqueo[m.key] || ''}
                onChange={e => setArq(m.key, +e.target.value)}
                placeholder="0"
                className="w-20 p-2 border border-slate-200 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-indigo-200" />
              <span className="text-slate-400 text-sm">×</span>
              <span className="w-20 text-right text-sm text-slate-600 font-mono">{fmt((arqueo[m.key] ?? 0) * m.valor)}</span>
            </div>
          ))}
        </div>

        {/* Cuadre */}
        <div className="mt-5 border-t border-slate-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Total contado:</span>
            <span className="font-bold font-mono">{fmt(totalContado)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Monto inicial + ventas efectivo:</span>
            <span className="font-bold font-mono">{fmt(totalSistema)}</span>
          </div>
          <div className={`flex justify-between font-bold text-base pt-2 border-t ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span>Diferencia:</span>
            <span className="font-mono">{diferencia >= 0 ? '+' : ''}{fmt(diferencia)}</span>
          </div>
          {Math.abs(diferencia) > 0 && (
            <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${diferencia > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <AlertTriangle size={12} />
              {diferencia > 0 ? `Sobrante de ${fmt(diferencia)}` : `Faltante de ${fmt(-diferencia)}`}
            </div>
          )}
        </div>
      </div>

      {/* Observaciones */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Observaciones del cierre</label>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
          rows={3} placeholder="Diferencias encontradas, novedades del turno..."
          className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
      </div>

      <div className="flex gap-3">
        <button onClick={() => navigate(`/pos/screen/${sesId}`)}
          className="flex-1 border border-slate-200 rounded-xl py-3 text-slate-600 text-sm font-medium hover:bg-slate-50">
          Cancelar
        </button>
        <button onClick={() => mutCerrar.mutate()} disabled={mutCerrar.isLoading || !tieneDocCierre}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer disabled:cursor-not-allowed">
          {mutCerrar.isLoading ? 'Cerrando caja...' : '🔒 Confirmar cierre de caja'}
        </button>
      </div>
      {mutCerrar.isError && (
        <p className="text-red-600 text-sm text-center">{(mutCerrar.error as any)?.response?.data?.message ?? 'Error al cerrar la caja'}</p>
      )}
    </div>
  )
}
