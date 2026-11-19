import { useState, useEffect, useMemo } from 'react'
import {
  Tag, Percent, TrendingUp, AlertTriangle, CheckCircle2,
  Save, Loader2, RefreshCw, Search, Filter, HelpCircle,
  ArrowRight, ShieldCheck, ArrowDown, Eye, Sliders,
  ShoppingBag, Sparkles, Check, X
} from 'lucide-react'
import api, { getMediaUrl } from '../../services/api'
import toast from 'react-hot-toast'

interface Categoria {
  id: number
  nombre: string
  parentId?: number | null
}

interface ProductoPreview {
  id: number
  nombre: string
  sku: string
  referencia?: string
  imagen?: string | null
  categoriaId?: number | null
  categoriaNombre: string
  costoPromedio: number
  precioBase: number
  precioWebManual?: number | null
  recargoPct: number
  precioRegular: number
  descuentoPct: number
  precioVenta: number
  precioAnterior?: number | null
  tieneDescuento: boolean
  alertaBajoCosto: boolean
  margenGanancia: number
  ivaPct: number
}

interface ReglasPrecios {
  recargos: {
    activo: boolean
    global: number
    redondeo: 'NINGUNO' | 'CENTENA' | 'MILLAR'
    categorias: Record<string, number>
  }
  descuentos: {
    activo: boolean
    global: number
    categorias: Record<string, number>
    productos: Record<string, number>
  }
}

const DEFAULT_REGLAS: ReglasPrecios = {
  recargos: {
    activo: true,
    global: 10,
    redondeo: 'CENTENA',
    categorias: {}
  },
  descuentos: {
    activo: false,
    global: 0,
    categorias: {},
    productos: {}
  }
}

export function GestionPrecios() {
  const [activeTab, setActiveTab] = useState<'recargos' | 'descuentos'>('recargos')
  const [reglas, setReglas] = useState<ReglasPrecios>(DEFAULT_REGLAS)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<ProductoPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('todas')
  const [filtroDescuento, setFiltroDescuento] = useState<'todos' | 'con_descuento' | 'sin_descuento'>('todos')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const res = await api.get('/digital/precios-preview')
      if (res.data) {
        setReglas({
          recargos: {
            activo: res.data.reglas?.recargos?.activo ?? true,
            global: Number(res.data.reglas?.recargos?.global ?? 0),
            redondeo: res.data.reglas?.recargos?.redondeo || 'CENTENA',
            categorias: res.data.reglas?.recargos?.categorias || {}
          },
          descuentos: {
            activo: res.data.reglas?.descuentos?.activo ?? false,
            global: Number(res.data.reglas?.descuentos?.global ?? 0),
            categorias: res.data.reglas?.descuentos?.categorias || {},
            productos: res.data.reglas?.descuentos?.productos || {}
          }
        })
        setCategorias(res.data.categorias || [])
        setProductos(res.data.productos || [])
      }
    } catch {
      toast.error('No se pudo cargar la vista de precios')
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    try {
      setSaving(true)
      await api.patch('/digital/reglas-precios', reglas)
      toast.success('¡Reglas de precios y descuentos actualizadas exitosamente!')
      // Recargar preview con el cálculo actualizado del backend
      await cargarDatos()
    } catch {
      toast.error('Error al guardar las reglas de precios')
    } finally {
      setSaving(false)
    }
  }

  // Helper de cálculo dinámico para previsualización inmediata en vivo
  const redondear = (val: number, modo: string) => {
    if (modo === 'CENTENA') return Math.round(val / 100) * 100
    if (modo === 'MILLAR') return Math.round(val / 1000) * 1000
    return Math.round(val)
  }

  const calcularSimulacion = (p: ProductoPreview) => {
    const base = p.precioWebManual && p.precioWebManual > 0 ? p.precioWebManual : p.precioBase
    const catId = p.categoriaId ? String(p.categoriaId) : null
    const prodId = String(p.id)

    // 1. Recargo
    let recargoPct = 0
    let precioRegularSubtotal = base
    const modoRedondeo = reglas.recargos.redondeo

    if (reglas.recargos.activo) {
      if (catId && reglas.recargos.categorias[catId] !== undefined && reglas.recargos.categorias[catId] !== null) {
        recargoPct = Number(reglas.recargos.categorias[catId])
      } else {
        recargoPct = Number(reglas.recargos.global || 0)
      }
      if (recargoPct !== 0) {
        precioRegularSubtotal = redondear(base * (1 + recargoPct / 100), modoRedondeo)
      }
    }

    // 2. Descuento
    let descuentoPct = 0
    let precioFinalSubtotal = precioRegularSubtotal
    let tieneDescuento = false

    if (reglas.descuentos.activo) {
      if (reglas.descuentos.productos[prodId] !== undefined && reglas.descuentos.productos[prodId] !== null) {
        descuentoPct = Number(reglas.descuentos.productos[prodId])
      } else if (catId && reglas.descuentos.categorias[catId] !== undefined && reglas.descuentos.categorias[catId] !== null) {
        descuentoPct = Number(reglas.descuentos.categorias[catId])
      } else {
        descuentoPct = Number(reglas.descuentos.global || 0)
      }

      if (descuentoPct > 0) {
        tieneDescuento = true
        const dctoMonto = precioRegularSubtotal * (descuentoPct / 100)
        precioFinalSubtotal = redondear(precioRegularSubtotal - dctoMonto, modoRedondeo)
      }
    }

    // IVA
    const ivaPct = p.ivaPct || 0
    const precioVenta = Math.round(precioFinalSubtotal * (1 + ivaPct / 100))
    const precioRegularTotal = Math.round(precioRegularSubtotal * (1 + ivaPct / 100))
    const precioAnterior = tieneDescuento && precioRegularTotal > precioVenta ? precioRegularTotal : null

    return {
      recargoPct,
      precioRegular: precioRegularTotal,
      descuentoPct,
      precioVenta,
      precioAnterior,
      tieneDescuento,
      alertaBajoCosto: p.costoPromedio > 0 && precioVenta < p.costoPromedio,
      ahorro: precioAnterior ? precioAnterior - precioVenta : 0
    }
  }

  // Filtrado de productos para la tabla
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const q = search.toLowerCase().trim()
      const matchesSearch = !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.referencia && p.referencia.toLowerCase().includes(q))

      const matchesCat = selectedCat === 'todas' || String(p.categoriaId) === selectedCat

      const sim = calcularSimulacion(p)
      const matchesDescuento =
        filtroDescuento === 'todos' ||
        (filtroDescuento === 'con_descuento' && sim.tieneDescuento) ||
        (filtroDescuento === 'sin_descuento' && !sim.tieneDescuento)

      return matchesSearch && matchesCat && matchesDescuento
    })
  }, [productos, search, selectedCat, filtroDescuento, reglas])

  const stats = useMemo(() => {
    let conRecargo = 0
    let conDescuento = 0
    let alertas = 0

    productos.forEach(p => {
      const s = calcularSimulacion(p)
      if (s.recargoPct > 0) conRecargo++
      if (s.tieneDescuento) conDescuento++
      if (s.alertaBajoCosto) alertas++
    })

    return {
      total: productos.length,
      conRecargo,
      conDescuento,
      alertas
    }
  }, [productos, reglas])

  const fmt = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Tag size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Gestión de Precios y Promociones Web</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Configura recargos porcentuales para el canal digital y activa descuentos promocionales sobre el catálogo de tu tienda virtual.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={cargarDatos}
            disabled={loading || saving}
            className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving || loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm shadow-indigo-200 cursor-pointer"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Publicados en Web</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Con Recargo Activo</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats.conRecargo}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Con Descuento / Oferta</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats.conDescuento}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Alerta de Margen</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.alertas}</p>
        </div>
      </div>

      {/* Selector de Pestañas Principales */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('recargos')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'recargos'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={16} />
          <span>1. Recargos Tienda Virtual (Markup Web)</span>
          {reglas.recargos.activo && (
            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-black">
              {reglas.recargos.global}% Activo
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('descuentos')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'descuentos'
              ? 'border-rose-600 text-rose-600 bg-rose-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Percent size={16} />
          <span>2. Descuentos y Promociones Web (Sale)</span>
          {reglas.descuentos.activo && (
            <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-black">
              Activo
            </span>
          )}
        </button>
      </div>

      {/* Contenido Pestaña 1: Recargos */}
      {activeTab === 'recargos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Configuración Global de Recargo */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Recargo General Web</h3>
                  <p className="text-[11px] text-slate-400">Aplica sobre el precio base del ERP.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reglas.recargos.activo}
                    onChange={(e) => setReglas(prev => ({
                      ...prev,
                      recargos: { ...prev.recargos, activo: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Porcentaje de Recargo Global
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={reglas.recargos.global}
                    onChange={(e) => setReglas(prev => ({
                      ...prev,
                      recargos: { ...prev.recargos, global: Number(e.target.value) }
                    }))}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    placeholder="10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Ejemplo: un producto de $100.000 con 10% queda en $110.000 en la web.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Redondeo Comercial
                </label>
                <select
                  value={reglas.recargos.redondeo}
                  onChange={(e) => setReglas(prev => ({
                    ...prev,
                    recargos: { ...prev.recargos, redondeo: e.target.value as any }
                  }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="CENTENA">A la centena más cercana (ej: $45.400)</option>
                  <option value="MILLAR">Al millar más cercano (ej: $45.000)</option>
                  <option value="NINGUNO">Sin redondeo (valor exacto)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <HelpCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  El recargo es dinámico: si compras o actualizas precios en el ERP, la tienda virtual sube automáticamente su precio con este porcentaje.
                </span>
              </div>
            </div>
          </div>

          {/* Recargos Específicos por Categoría */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Recargo Específico por Categoría</h3>
                  <p className="text-[11px] text-slate-400">
                    Sobrescribe el recargo global para categorías con márgenes especiales (ej: Pañales 3%, Juguetes 12%).
                  </p>
                </div>
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 pr-1">
                {categorias.map(cat => {
                  const catKey = String(cat.id)
                  const valorActual = reglas.recargos.categorias[catKey] ?? ''
                  return (
                    <div key={cat.id} className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-700 truncate">{cat.nombre}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-24">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={valorActual}
                            onChange={(e) => {
                              const val = e.target.value
                              setReglas(prev => {
                                const nextCats = { ...prev.recargos.categorias }
                                if (val === '' || val === null) {
                                  delete nextCats[catKey]
                                } else {
                                  nextCats[catKey] = Number(val)
                                }
                                return {
                                  ...prev,
                                  recargos: { ...prev.recargos, categorias: nextCats }
                                }
                              })
                            }}
                            placeholder={`${reglas.recargos.global}%`}
                            className="w-full pl-2.5 pr-6 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-300"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">%</span>
                        </div>
                        {valorActual !== '' && (
                          <button
                            type="button"
                            onClick={() => {
                              setReglas(prev => {
                                const nextCats = { ...prev.recargos.categorias }
                                delete nextCats[catKey]
                                return {
                                  ...prev,
                                  recargos: { ...prev.recargos, categorias: nextCats }
                                }
                              })
                            }}
                            className="text-slate-400 hover:text-rose-500 text-xs p-1"
                            title="Restablecer al global"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Pestaña 2: Descuentos */}
      {activeTab === 'descuentos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Configuración Global de Descuentos */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Descuentos Web (Sale)</h3>
                  <p className="text-[11px] text-slate-400">Activa promociones con precio tachado.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reglas.descuentos.activo}
                    onChange={(e) => setReglas(prev => ({
                      ...prev,
                      descuentos: { ...prev.descuentos, activo: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-800 space-y-1">
                <span className="font-extrabold flex items-center gap-1">
                  <Sparkles size={13} /> Regla de Descuentos:
                </span>
                <p>
                  El descuento se calcula <strong>SOBRE el precio de venta de la tienda virtual</strong> (con el recargo ya aplicado).
                </p>
                <p className="text-[10px] text-rose-600 font-medium">
                  En la tienda virtual se mostrará el precio con recargo <strong>tachado</strong>, el badge <strong>-X%</strong> y el precio final de venta.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descuento Global Toda la Tienda (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={reglas.descuentos.global}
                    onChange={(e) => setReglas(prev => ({
                      ...prev,
                      descuentos: { ...prev.descuentos, global: Number(e.target.value) }
                    }))}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Úsalo para campañas de toda la web (ej: Black Friday 15%). Deja en 0 para aplicar solo por categorías o productos.
                </p>
              </div>
            </div>
          </div>

          {/* Descuentos por Categoría */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Descuentos por Categoría</h3>
                <p className="text-[11px] text-slate-400">
                  Ingresa el porcentaje de descuento a aplicar para cada categoría (ej: 20% en Juguetería).
                </p>
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 pr-1">
                {categorias.map(cat => {
                  const catKey = String(cat.id)
                  const valorActual = reglas.descuentos.categorias[catKey] ?? ''
                  const tieneDcto = valorActual !== '' && Number(valorActual) > 0

                  return (
                    <div key={cat.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs font-semibold text-slate-700 truncate">{cat.nombre}</span>
                        {tieneDcto && (
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded">
                            -{valorActual}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-24">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={valorActual}
                            onChange={(e) => {
                              const val = e.target.value
                              setReglas(prev => {
                                const nextCats = { ...prev.descuentos.categorias }
                                if (val === '' || val === null || Number(val) === 0) {
                                  delete nextCats[catKey]
                                } else {
                                  nextCats[catKey] = Number(val)
                                }
                                return {
                                  ...prev,
                                  descuentos: { ...prev.descuentos, categorias: nextCats }
                                }
                              })
                            }}
                            placeholder="0%"
                            className={`w-full pl-2.5 pr-6 py-1 bg-slate-50 border rounded-lg text-xs font-bold outline-none focus:ring-1 ${
                              tieneDcto
                                ? 'border-rose-400 text-rose-700 bg-rose-50/50 focus:ring-rose-300'
                                : 'border-slate-200 text-slate-800 focus:ring-slate-300'
                            }`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">%</span>
                        </div>

                        {tieneDcto && (
                          <button
                            type="button"
                            onClick={() => {
                              setReglas(prev => {
                                const nextCats = { ...prev.descuentos.categorias }
                                delete nextCats[catKey]
                                return {
                                  ...prev,
                                  descuentos: { ...prev.descuentos, categorias: nextCats }
                                }
                              })
                            }}
                            className="text-slate-400 hover:text-rose-500 text-xs p-1"
                            title="Quitar descuento"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulador y Tabla de Previsualización en Vivo */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Barra de Filtros */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Simulador en Vivo del Catálogo ({productosFiltrados.length} productos)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Buscador */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, SKU..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 w-44 sm:w-56"
              />
            </div>

            {/* Categoría */}
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="todas">Todas las Categorías</option>
              {categorias.map(c => (
                <option key={c.id} value={String(c.id)}>{c.nombre}</option>
              ))}
            </select>

            {/* Filtro Descuento */}
            <select
              value={filtroDescuento}
              onChange={(e) => setFiltroDescuento(e.target.value as any)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="todos">Todos los productos</option>
              <option value="con_descuento">Solo en Oferta / Descuento</option>
              <option value="sin_descuento">Sin Descuento</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Precio Base ERP</th>
                <th className="py-3 px-3 text-center">Recargo Web</th>
                <th className="py-3 px-3 text-right">Precio Regular Tienda</th>
                <th className="py-3 px-3 text-center">Descuento</th>
                <th className="py-3 px-4 text-right">Precio a Cobrar (Web)</th>
                <th className="py-3 px-4 text-center">Cómo se ve en la Tienda</th>
                <th className="py-3 px-3 text-center">Margen / Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <Loader2 size={28} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Cargando catálogo y simulando precios...</span>
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                productosFiltrados.map(p => {
                  const sim = calcularSimulacion(p)
                  const imgUrl = p.imagen ? getMediaUrl(p.imagen) : null

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Producto */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {imgUrl ? (
                              <img src={imgUrl} alt={p.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag size={18} className="text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate max-w-[220px]" title={p.nombre}>
                              {p.nombre}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              SKU: {p.sku} {p.referencia ? `• Ref: ${p.referencia}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {p.categoriaNombre}
                        </span>
                      </td>

                      {/* Precio Base ERP */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-slate-700">{fmt(p.precioBase)}</span>
                        {p.precioWebManual && p.precioWebManual > 0 && (
                          <span className="block text-[9px] text-indigo-600 font-semibold" title="Precio manual fijado en ficha">
                            Web manual: {fmt(p.precioWebManual)}
                          </span>
                        )}
                      </td>

                      {/* Recargo Web */}
                      <td className="py-3 px-3 text-center">
                        {sim.recargoPct > 0 ? (
                          <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                            +{sim.recargoPct}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">0%</span>
                        )}
                      </td>

                      {/* Precio Regular Tienda */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-slate-800">{fmt(sim.precioRegular)}</span>
                      </td>

                      {/* Descuento */}
                      <td className="py-3 px-3 text-center">
                        {sim.tieneDescuento ? (
                          <span className="bg-rose-50 border border-rose-200 text-rose-700 font-black text-[10px] px-2 py-0.5 rounded-full">
                            -{sim.descuentoPct}%
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[10px]">—</span>
                        )}
                      </td>

                      {/* Precio Final Venta */}
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-black ${sim.tieneDescuento ? 'text-rose-600' : 'text-slate-900'}`}>
                          {fmt(sim.precioVenta)}
                        </span>
                        {sim.tieneDescuento && (
                          <span className="block text-[9px] text-slate-400 font-medium">
                            Ahorro: {fmt(sim.ahorro)}
                          </span>
                        )}
                      </td>

                      {/* Cómo se ve en la tienda */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
                          {sim.precioAnterior && (
                            <span className="text-[10px] text-slate-400 line-through leading-none font-medium mb-0.5">
                              {fmt(sim.precioAnterior)}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900">{fmt(sim.precioVenta)}</span>
                            {sim.tieneDescuento && (
                              <span className="bg-rose-500 text-white font-black text-[9px] px-1 py-0.2 rounded">
                                -{sim.descuentoPct}%
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Margen / Estado */}
                      <td className="py-3 px-3 text-center">
                        {sim.alertaBajoCosto ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md" title={`Costo: ${fmt(p.costoPromedio)}`}>
                            <AlertTriangle size={11} className="text-amber-500" />
                            Bajo Costo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                            <CheckCircle2 size={11} className="text-emerald-500" />
                            Margen OK
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
