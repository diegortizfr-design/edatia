import { useState, useEffect } from 'react'
import {
  Globe, Phone, Save, Loader2, Warehouse,
  ExternalLink, Copy, Check, CheckCircle2,
  AlertCircle, ShieldCheck, Truck, Instagram, Store, Layers
} from 'lucide-react'
import api from '../../services/api'
import { getBodegas, Bodega } from '../../services/inventario.service'
import toast from 'react-hot-toast'

interface TiendaConfig {
  nombreTienda: string
  slugTienda: string
  dominioPropio?: string
  whatsappVentas: string
  instagramUrl: string
  costoEnvioBase: number
  montoEnvioGratis: number
  bodegasIds: number[]
  bodegaDespachoId?: number | null
  activo: boolean
}

export function ConfigTienda() {
  const [config, setConfig] = useState<TiendaConfig | null>(null)
  const [bodegas, setBodegas] = useState<Bodega[]>([])
  const [modoBodegas, setModoBodegas] = useState<'todas' | 'especificas'>('todas')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [resConfig, listaBodegas] = await Promise.all([
        api.get('/digital/config'),
        getBodegas()
      ])

      const cfg: TiendaConfig = {
        nombreTienda: resConfig.data?.nombreTienda || '',
        slugTienda: resConfig.data?.slugTienda || '',
        dominioPropio: resConfig.data?.dominioPropio || '',
        whatsappVentas: resConfig.data?.whatsappVentas || '',
        instagramUrl: resConfig.data?.instagramUrl || '',
        costoEnvioBase: Number(resConfig.data?.costoEnvioBase ?? 8000),
        montoEnvioGratis: Number(resConfig.data?.montoEnvioGratis ?? 150000),
        bodegasIds: Array.isArray(resConfig.data?.bodegasIds) ? resConfig.data.bodegasIds : [],
        bodegaDespachoId: resConfig.data?.bodegaDespachoId || null,
        activo: resConfig.data?.activo !== false
      }

      setConfig(cfg)
      setBodegas((listaBodegas || []).filter((b: Bodega) => b.activo !== false))
      setModoBodegas(cfg.bodegasIds && cfg.bodegasIds.length > 0 ? 'especificas' : 'todas')
    } catch (error) {
      toast.error('No se pudo cargar la configuración de la tienda')
    } finally {
      setLoading(false)
    }
  }

  const toggleBodega = (bodegaId: number) => {
    if (!config) return
    const actuales = config.bodegasIds || []
    const yaExiste = actuales.includes(bodegaId)
    const nuevos = yaExiste ? actuales.filter(id => id !== bodegaId) : [...actuales, bodegaId]
    setConfig({ ...config, bodegasIds: nuevos })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return

    try {
      setSaving(true)
      const payload = {
        ...config,
        bodegasIds: modoBodegas === 'todas' ? [] : config.bodegasIds,
        costoEnvioBase: Number(config.costoEnvioBase || 0),
        montoEnvioGratis: Number(config.montoEnvioGratis || 0)
      }

      await api.patch('/digital/config', payload)
      toast.success('Ajustes de tienda guardados exitosamente')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 size={36} className="animate-spin mb-3 text-indigo-600" />
        <p className="text-sm font-medium">Cargando ajustes de la tienda virtual...</p>
      </div>
    )
  }

  const storeUrlReal = config.dominioPropio
    ? `https://${config.dominioPropio}`
    : `https://${config.slugTienda}.edatia.com`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrlReal)
    setCopied(true)
    toast.success('Enlace copiado al portapapeles')
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Store className="text-indigo-600" size={26} />
            <span>Ajustes de Tienda Virtual</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Controla la presencia online, bodegas que alimentan el inventario web y canales de atención.
          </p>
        </div>

        {/* Acceso directo a la tienda en vivo */}
        {config.slugTienda && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-slate-400" />}
              <span>{copied ? 'Copiado' : 'Copiar URL'}</span>
            </button>
            <a
              href={storeUrlReal}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span>Abrir Tienda</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* TARJETA 1: Presencia Online y Dominios */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <Globe size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">1. Presencia Online y Dominios</h2>
                <p className="text-xs text-slate-500">Configura la identidad y la dirección web de tu storefront</p>
              </div>
            </div>

            {/* Toggle de Estado Activo */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-bold text-slate-600">
                {config.activo ? '🟢 Tienda Activa' : '🟡 En Mantenimiento'}
              </span>
              <input
                type="checkbox"
                checked={config.activo}
                onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nombre de la Tienda *
              </label>
              <input
                type="text"
                value={config.nombreTienda}
                onChange={(e) => setConfig({ ...config, nombreTienda: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Ej: Distribuidora Baby World"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Nombre comercial visible en el catálogo y comunicaciones.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Identificador de la Tienda (Slug) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={config.slugTienda}
                  onChange={(e) => {
                    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    setConfig({ ...config, slugTienda: clean })
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="ej: distribuidorababyworld"
                  required
                />
              </div>
              <p className="text-[11px] text-indigo-600 mt-1 font-mono">
                URL por defecto: https://{config.slugTienda || 'tu-tienda'}.edatia.com
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Dominio Propio Personalizado (Opcional)
              </label>
              <input
                type="text"
                value={config.dominioPropio || ''}
                onChange={(e) => {
                  const clean = e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '')
                  setConfig({ ...config, dominioPropio: clean })
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="ej: distribuidorababyworld.com"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Si cuentas con dominio propio, regístralo aquí y crea un registro tipo <strong>A</strong> que apunte a la IP de tu servidor VPS (<strong>187.127.10.22</strong>).
              </p>
            </div>
          </div>
        </div>

        {/* TARJETA 2: Gestión de Inventario y Bodegas Ancladas */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Warehouse size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">2. Inventario y Bodegas Ancladas</h2>
                <p className="text-xs text-slate-500">
                  Controla de qué bodegas lee existencias la tienda virtual para evitar vender mercancía reservada o de otras sucursales.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Modo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              onClick={() => setModoBodegas('todas')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                modoBodegas === 'todas'
                  ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="modoBodegas"
                checked={modoBodegas === 'todas'}
                onChange={() => setModoBodegas('todas')}
                className="mt-0.5"
              />
              <div>
                <span className="text-xs font-bold block">Consolidar todas las bodegas activas</span>
                <span className="text-[11px] text-slate-500">Suma las existencias de todos los almacenes de la empresa.</span>
              </div>
            </label>

            <label
              onClick={() => setModoBodegas('especificas')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                modoBodegas === 'especificas'
                  ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="modoBodegas"
                checked={modoBodegas === 'especificas'}
                onChange={() => setModoBodegas('especificas')}
                className="mt-0.5"
              />
              <div>
                <span className="text-xs font-bold block">Anclar bodegas específicas (Recomendado)</span>
                <span className="text-[11px] text-slate-500">El stock web solo se leerá de las bodegas que marques a continuación.</span>
              </div>
            </label>
          </div>

          {/* Listado de Bodegas Anclables */}
          {modoBodegas === 'especificas' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>Selecciona las bodegas autorizadas para la web:</span>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {config.bodegasIds.length} de {bodegas.length} bodegas seleccionadas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {bodegas.map((bodega) => {
                  const isChecked = config.bodegasIds.includes(bodega.id)
                  return (
                    <div
                      key={bodega.id}
                      onClick={() => toggleBodega(bodega.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/30 text-emerald-950 font-medium'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">{bodega.nombre}</span>
                          {bodega.esPrincipal && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Cód: {bodega.codigo}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-slate-50'
                      }`}>
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </div>
                    </div>
                  )
                })}
              </div>

              {config.bodegasIds.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-amber-600" />
                  <span>Si no marcas ninguna bodega específica, la tienda virtual mostrará stock en 0 para evitar sobreventas.</span>
                </div>
              )}
            </div>
          )}

          {/* Bodega de Despacho por Defecto */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Bodega de Despacho de Pedidos Web (Fulfillment)
            </label>
            <select
              value={config.bodegaDespachoId || ''}
              onChange={(e) => setConfig({ ...config, bodegaDespachoId: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">Selección automática (Bodega Principal del ERP)</option>
              {bodegas.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre} ({b.codigo}) {b.esPrincipal ? '— [Principal]' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Los pedidos realizados en la tienda virtual se crearán en el ERP asignados a esta bodega para el descargue y facturación del inventario.
            </p>
          </div>
        </div>

        {/* TARJETA 3: Canales de Venta y Envíos */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Truck size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">3. Canales de Venta y Tarifas de Envío</h2>
                <p className="text-xs text-slate-500">Configura el WhatsApp de contacto directo y tus reglas de domicilio</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                WhatsApp Oficial de Pedidos
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={config.whatsappVentas}
                  onChange={(e) => setConfig({ ...config, whatsappVentas: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="+57 302 386 3380"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Alimentará los botones de chat y confirmación rápida de la tienda.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Instagram (Usuario o Enlace)
              </label>
              <div className="relative">
                <Instagram size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={config.instagramUrl}
                  onChange={(e) => setConfig({ ...config, instagramUrl: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="ej: @distribuidorababyworld"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Enlace a tus redes en el pie de página de la tienda.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Costo de Envío Base / Domicilio Local (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={config.costoEnvioBase}
                  onChange={(e) => setConfig({ ...config, costoEnvioBase: Number(e.target.value) })}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
                  placeholder="8000"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Tarifa aplicada para envíos locales urbanos.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Monto Mínimo para Envío Gratis (COP)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={config.montoEnvioGratis}
                  onChange={(e) => setConfig({ ...config, montoEnvioGratis: Number(e.target.value) })}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
                  placeholder="150000"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">A partir de este valor en la bolsa, el flete local es gratuito.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Acciones */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={cargarDatos}
          className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          Descartar Cambios
        </button>

        <button
          type="submit"
          disabled={saving}
          className={`flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 ${
            saving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}</span>
        </button>
      </div>
    </form>
  )
}
