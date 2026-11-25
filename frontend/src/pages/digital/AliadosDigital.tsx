import { useState, useEffect, useMemo } from 'react'
import {
  Users, Wallet, Settings, CheckCircle2, XCircle, Clock,
  Copy, Check, Search, Loader2, Save, ExternalLink, RefreshCw,
  DollarSign, ShieldCheck, MessageCircle, Sparkles
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

interface AliadoRow {
  id: number
  nombre: string
  tipoDocumento: string
  numeroDocumento: string
  telefono: string
  ciudad?: string | null
  medioPago: string
  cuentaPago: string
  codigoReferido: string
  porcentajeUtilidad: number
  porcentajePersonalizado?: number | null
  estado: 'PENDIENTE' | 'ACTIVO' | 'SUSPENDIDO'
  notas?: string | null
  urlTiendaReferido: string
  createdAt: string
  resumen: {
    pedidosCount: number
    totalVentas: number
    saldoPendiente: number
    saldoAprobado: number
    saldoPagado: number
  }
}

interface ComisionRow {
  id: number
  pedidoNumero?: string | null
  origen: string
  clienteNombre: string
  clienteTelefono: string
  montoVenta: number
  costoTotal: number
  utilidadNeta: number
  porcentajeAplicado: number
  valorComision: number
  estado: 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'ANULADA'
  comprobantePago?: string | null
  notas?: string | null
  createdAt: string
  aliado: {
    id: number
    nombre: string
    codigoReferido: string
    telefono: string
    medioPago: string
    cuentaPago: string
  }
}

interface ConfigAliados {
  activo: boolean
  porcentajeUtilidad: number
  montoMinimoRetiro: number
  requiereAprobacion: boolean
  codigoInvitacion: string
  categoriasHabilitadas: number[]
  bloquearAutocompra: boolean
  stockMinimoCatalogo: number
  redondeoComision: number
}

interface CategoriaDisponible {
  id: number
  nombre: string
  esPadre: boolean
}

export function AliadosDigital() {
  const [tab, setTab] = useState<'aliados' | 'comisiones' | 'config'>('aliados')
  const [loading, setLoading] = useState(true)
  const [aliados, setAliados] = useState<AliadoRow[]>([])
  const [comisiones, setComisiones] = useState<ComisionRow[]>([])
  const [config, setConfig] = useState<ConfigAliados | null>(null)
  const [urlPortal, setUrlPortal] = useState('')
  const [categorias, setCategorias] = useState<CategoriaDisponible[]>([])
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  // Modal de liquidación
  const [liquidarAliado, setLiquidarAliado] = useState<AliadoRow | null>(null)
  const [comprobantePago, setComprobantePago] = useState('')
  const [liquidando, setLiquidando] = useState(false)

  const fmtPrice = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0)

  const cargarTodo = async () => {
    try {
      setLoading(true)
      const [resAliados, resCom, resCfg] = await Promise.all([
        api.get('/digital/aliados'),
        api.get('/digital/aliados/comisiones'),
        api.get('/digital/aliados/config'),
      ])
      setAliados(Array.isArray(resAliados.data) ? resAliados.data : [])
      setComisiones(Array.isArray(resCom.data) ? resCom.data : [])
      setConfig(resCfg.data?.configAliados || null)
      setUrlPortal(resCfg.data?.urlPortalAliados || '')
      setCategorias(Array.isArray(resCfg.data?.categoriasDisponibles) ? resCfg.data.categoriasDisponibles : [])
    } catch {
      toast.error('No se pudo cargar la información del programa de aliados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTodo()
  }, [])

  const totalesGlobales = useMemo(() => {
    return aliados.reduce(
      (acc, a) => ({
        activos: acc.activos + (a.estado === 'ACTIVO' ? 1 : 0),
        pendiente: acc.pendiente + (a.resumen?.saldoPendiente || 0),
        aprobado: acc.aprobado + (a.resumen?.saldoAprobado || 0),
        pagado: acc.pagado + (a.resumen?.saldoPagado || 0),
      }),
      { activos: 0, pendiente: 0, aprobado: 0, pagado: 0 },
    )
  }, [aliados])

  const aliadosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return aliados
    return aliados.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        a.codigoReferido.toLowerCase().includes(q) ||
        a.telefono.includes(q) ||
        a.numeroDocumento.includes(q),
    )
  }, [aliados, search])

  const comisionesFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase()
    return comisiones.filter((c) => {
      if (estadoFiltro && c.estado !== estadoFiltro) return false
      if (!q) return true
      return (
        (c.pedidoNumero || '').toLowerCase().includes(q) ||
        c.clienteNombre.toLowerCase().includes(q) ||
        (c.aliado?.nombre || '').toLowerCase().includes(q) ||
        (c.aliado?.codigoReferido || '').toLowerCase().includes(q)
      )
    })
  }, [comisiones, estadoFiltro, search])

  const cambiarEstadoAliado = async (id: number, estado: string) => {
    try {
      await api.patch(`/digital/aliados/${id}`, { estado })
      toast.success(`Aliado actualizado a ${estado}`)
      cargarTodo()
    } catch {
      toast.error('No se pudo actualizar el estado del aliado')
    }
  }

  const cambiarEstadoComision = async (comisionId: number, estado: 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'ANULADA') => {
    try {
      let comprobante: string | undefined
      if (estado === 'PAGADA') {
        comprobante = window.prompt('Ingresa el número o referencia de transferencia (opcional):') || 'Transferencia directa'
      }
      await api.patch(`/digital/aliados/comisiones/${comisionId}`, { estado, comprobantePago: comprobante })
      toast.success(`Comisión marcada como ${estado}`)
      cargarTodo()
    } catch {
      toast.error('No se pudo actualizar la comisión')
    }
  }

  const handleLiquidar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!liquidarAliado) return
    try {
      setLiquidando(true)
      const res = await api.post(`/digital/aliados/${liquidarAliado.id}/liquidar`, {
        comprobantePago: comprobantePago.trim() || 'Transferencia Nequi/Daviplata',
      })
      toast.success(`Liquidadas ${res.data?.cantidadLiquidadas} comisiones por ${fmtPrice(res.data?.totalPagado)}`)
      setLiquidarAliado(null)
      setComprobantePago('')
      cargarTodo()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al registrar la liquidación')
    } finally {
      setLiquidando(false)
    }
  }

  const guardarConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return
    try {
      setSavingConfig(true)
      await api.patch('/digital/aliados/config', config)
      toast.success('Configuración del programa guardada')
      cargarTodo()
    } catch {
      toast.error('Error guardando la configuración')
    } finally {
      setSavingConfig(false)
    }
  }

  const toggleCategoria = (catId: number) => {
    if (!config) return
    const exists = config.categoriasHabilitadas.includes(catId)
    setConfig({
      ...config,
      categoriasHabilitadas: exists
        ? config.categoriasHabilitadas.filter((id) => id !== catId)
        : [...config.categoriasHabilitadas, catId],
    })
  }

  const copiarUrlPortal = async () => {
    if (!urlPortal) return
    await navigator.clipboard.writeText(urlPortal)
    setCopiedLink(true)
    toast.success('Enlace privado del piloto copiado')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const badgeEstado = (estado: string) => {
    if (estado === 'ACTIVO' || estado === 'APROBADA') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (estado === 'PAGADA') return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    if (estado === 'SUSPENDIDO' || estado === 'ANULADA') return 'bg-rose-50 text-rose-700 border-rose-200'
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  if (loading && !config) {
    return (
      <div className="p-10 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={30} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles size={20} />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Aliados Comerciales & Social Selling</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestiona vendedores independientes, valida entregas contra entrega y liquida comisiones sobre utilidad real.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {urlPortal && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">Enlace piloto:</span>
              <code className="font-bold text-indigo-600 truncate max-w-[210px]">{urlPortal}</code>
              <button type="button" onClick={copiarUrlPortal} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer" title="Copiar enlace">
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
              <a href={urlPortal} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-100 rounded-lg text-slate-600" title="Abrir portal">
                <ExternalLink size={14} />
              </a>
            </div>
          )}
          <button
            type="button"
            onClick={cargarTodo}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Aliados Activos</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalesGlobales.activos}</p>
          <span className="text-[11px] text-slate-400">De {aliados.length} registrados</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase">Por Validar (Pendiente)</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{fmtPrice(totalesGlobales.pendiente)}</p>
          <span className="text-[11px] text-slate-400">Pedidos en proceso / entrega</span>
        </div>
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase">Aprobado por Pagar</span>
          <p className="text-2xl font-black text-emerald-800 mt-1">{fmtPrice(totalesGlobales.aprobado)}</p>
          <span className="text-[11px] text-emerald-700">Listo para transferir a aliados</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase">Total Pagado Histórico</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{fmtPrice(totalesGlobales.pagado)}</p>
          <span className="text-[11px] text-slate-400">Comisiones liquidadas</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab('aliados')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer ${
            tab === 'aliados' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={15} /> Aliados ({aliados.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('comisiones')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer ${
            tab === 'comisiones' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet size={15} /> Comisiones ({comisiones.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('config')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer ${
            tab === 'config' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings size={15} /> Configuración del Piloto
        </button>
      </div>

      {tab !== 'config' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'aliados' ? 'Buscar por nombre, código, cédula o WhatsApp...' : 'Buscar por pedido, cliente o aliado...'}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {tab === 'comisiones' && (
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendientes (En entrega)</option>
              <option value="APROBADA">Aprobadas (Por pagar)</option>
              <option value="PAGADA">Pagadas</option>
              <option value="ANULADA">Anuladas</option>
            </select>
          )}
        </div>
      )}

      {tab === 'aliados' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Aliado / Código</th>
                  <th className="px-4 py-3">Contacto & Pago</th>
                  <th className="px-4 py-3 text-right">Ventas</th>
                  <th className="px-4 py-3 text-right">Pendiente</th>
                  <th className="px-4 py-3 text-right">Aprobado</th>
                  <th className="px-4 py-3 text-right">Pagado</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aliadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No hay aliados registrados aún. Comparte el enlace del piloto para iniciar pruebas.
                    </td>
                  </tr>
                ) : (
                  aliadosFiltrados.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{a.nombre}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{a.codigoReferido}</code>
                          <span className="text-[10px] text-slate-400">{a.tipoDocumento} {a.numeroDocumento}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://wa.me/57${a.telefono}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                        >
                          <MessageCircle size={12} /> {a.telefono}
                        </a>
                        <p className="text-[11px] text-slate-500 mt-0.5">{a.medioPago}: <b>{a.cuentaPago}</b></p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-slate-900 block">{fmtPrice(a.resumen.totalVentas)}</span>
                        <span className="text-[10px] text-slate-400">{a.resumen.pedidosCount} ped.</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-700">{fmtPrice(a.resumen.saldoPendiente)}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700">{fmtPrice(a.resumen.saldoAprobado)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-700">{fmtPrice(a.resumen.saldoPagado)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={a.estado}
                          onChange={(e) => cambiarEstadoAliado(a.id, e.target.value)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border outline-none cursor-pointer ${badgeEstado(a.estado)}`}
                        >
                          <option value="ACTIVO">ACTIVO</option>
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="SUSPENDIDO">SUSPENDIDO</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {a.resumen.saldoAprobado > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setLiquidarAliado(a)
                              setComprobantePago('')
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <DollarSign size={12} /> Pagar
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Sin saldo por pagar</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'comisiones' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Fecha / Pedido</th>
                  <th className="px-4 py-3">Aliado</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 text-right">Venta</th>
                  <th className="px-4 py-3 text-right">Costo</th>
                  <th className="px-4 py-3 text-right">Utilidad</th>
                  <th className="px-4 py-3 text-right">Comisión ({config?.porcentajeUtilidad || 30}%)</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comisionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      No hay comisiones registradas con este filtro.
                    </td>
                  </tr>
                ) : (
                  comisionesFiltradas.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{c.pedidoNumero || `#${c.id}`}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString('es-CO')} • {c.origen === 'PEDIDO_ALIADO' ? 'Cargado por Aliado' : 'Link Web'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{c.aliado?.nombre}</p>
                        <code className="text-[10px] text-indigo-600">{c.aliado?.codigoReferido}</code>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800">{c.clienteNombre}</p>
                        <span className="text-[10px] text-slate-400">{c.clienteTelefono}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{fmtPrice(c.montoVenta)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{fmtPrice(c.costoTotal)}</td>
                      <td className="px-4 py-3 text-right text-slate-700 font-semibold">{fmtPrice(c.utilidadNeta)}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700">{fmtPrice(c.valorComision)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeEstado(c.estado)}`}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        {c.estado === 'PENDIENTE' && (
                          <>
                            <button
                              type="button"
                              onClick={() => cambiarEstadoComision(c.id, 'APROBADA')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              title="Aprobar tras verificar entrega y pago"
                            >
                              <CheckCircle2 size={11} className="inline mr-0.5" /> Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => cambiarEstadoComision(c.id, 'ANULADA')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold cursor-pointer"
                              title="Anular por devolución o cancelación"
                            >
                              <XCircle size={11} className="inline" />
                            </button>
                          </>
                        )}
                        {c.estado === 'APROBADA' && (
                          <button
                            type="button"
                            onClick={() => cambiarEstadoComision(c.id, 'PAGADA')}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Marcar Pagada
                          </button>
                        )}
                        {c.estado === 'PAGADA' && c.comprobantePago && (
                          <span className="text-[10px] text-slate-400">Ref: {c.comprobantePago}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : config ? (
        /* TAB 3: CONFIGURACIÓN DEL PROGRAMA */
        <form onSubmit={guardarConfig} className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900">Reglas del Programa de Aliados</h3>
              <p className="text-xs text-slate-500">Define el porcentaje de utilidad, retiro mínimo, seguridad anti-autocompra y categorías habilitadas.</p>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.activo}
                onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="text-xs font-bold text-slate-800">Programa Activo</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">% de la Utilidad para Aliado</label>
              <input
                type="number"
                min={1}
                max={80}
                value={config.porcentajeUtilidad}
                onChange={(e) => setConfig({ ...config, porcentajeUtilidad: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Se calcula sobre (Precio sin IVA - Costo).</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mínimo de Retiro (COP)</label>
              <input
                type="number"
                min={0}
                step={5000}
                value={config.montoMinimoRetiro}
                onChange={(e) => setConfig({ ...config, montoMinimoRetiro: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Código Invitación Piloto (Opcional)</label>
              <input
                type="text"
                value={config.codigoInvitacion}
                onChange={(e) => setConfig({ ...config, codigoInvitacion: e.target.value.toUpperCase() })}
                placeholder="Ej: BABY2026 (vacío = libre)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm uppercase font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Útil para restringir el registro durante el piloto.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Stock Mínimo para Mostrar</label>
              <input
                type="number"
                min={1}
                value={config.stockMinimoCatalogo}
                onChange={(e) => setConfig({ ...config, stockMinimoCatalogo: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.bloquearAutocompra}
                onChange={(e) => setConfig({ ...config, bloquearAutocompra: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-600" /> Bloquear Autocompras
                </span>
                <span className="text-[11px] text-slate-500">Si el comprador usa el mismo WhatsApp o cédula del aliado, el pedido no genera comisión.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.requiereAprobacion}
                onChange={(e) => setConfig({ ...config, requiereAprobacion: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block flex items-center gap-1">
                  <Clock size={14} className="text-amber-600" /> Aprobación Manual de Nuevos Aliados
                </span>
                <span className="text-[11px] text-slate-500">Si está activo, los nuevos aliados entran en estado PENDIENTE hasta que los apruebes.</span>
              </div>
            </label>
          </div>

          {/* Categorías habilitadas */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 block">
              Categorías Habilitadas para Aliados
            </label>
            <p className="text-[11px] text-slate-500">
              Si no marcas ninguna, el sistema habilita automáticamente únicamente categorías de <b>Juguetería / Didácticos</b> (y siempre exige que el producto tenga costo cargado &gt; $0).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1 max-h-56 overflow-y-auto p-1">
              {categorias.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${
                    config.categoriasHabilitadas.includes(c.id)
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={config.categoriasHabilitadas.includes(c.id)}
                    onChange={() => toggleCategoria(c.id)}
                    className="rounded text-indigo-600"
                  />
                  <span className="truncate">{c.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {savingConfig ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      ) : null}

      {/* Modal de Liquidación en Lote */}
      {liquidarAliado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form onSubmit={handleLiquidar} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Registrar Pago a Aliado</h3>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
              <p className="font-bold text-slate-900">{liquidarAliado.nombre} ({liquidarAliado.codigoReferido})</p>
              <p className="text-slate-600">Transferir a: <b>{liquidarAliado.medioPago} — {liquidarAliado.cuentaPago}</b></p>
              <p className="text-base font-black text-emerald-700 pt-1">
                Total a pagar: {fmtPrice(liquidarAliado.resumen.saldoAprobado)}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Número / Referencia del Comprobante *</label>
              <input
                type="text"
                required
                value={comprobantePago}
                onChange={(e) => setComprobantePago(e.target.value)}
                placeholder="Ej: Nequi M1234567"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLiquidarAliado(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={liquidando}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {liquidando && <Loader2 size={14} className="animate-spin" />}
                <span>Confirmar Pago</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
