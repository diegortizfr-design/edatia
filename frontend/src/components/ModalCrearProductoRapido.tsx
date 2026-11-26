import { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Package, X, Loader2, DollarSign, Tag, Hash, FileText, Percent, Layers, Sparkles, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { createProducto, createVariante } from '../services/inventario.service'
import { getImpuestos } from '../services/erp.service'
import { getApiError } from '../services/api'
import { formatMiles, parseMiles } from '../lib/utils'
import { PRESETS_TALLAS, PALETA_COLORES, slugifyAttr } from '../utils/variantesColores'

interface ModalCrearProductoRapidoProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (productoCreado: any) => void
  initialSearch?: string
}

export function ModalCrearProductoRapido({
  isOpen,
  onClose,
  onSuccess,
  initialSearch = '',
}: ModalCrearProductoRapidoProps) {
  const qc = useQueryClient()

  const [referencia, setReferencia] = useState('')
  const [nombre, setNombre] = useState('')
  const [costo, setCosto] = useState<string>('')
  const [precioVenta, setPrecioVenta] = useState<string>('')
  const [selectedTaxId, setSelectedTaxId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Variantes
  const [tieneVariantes, setTieneVariantes] = useState(false)
  const [tipoVariante, setTipoVariante] = useState<'tallas' | 'colores' | 'ambos'>('tallas')
  const [customTallas, setCustomTallas] = useState('')
  const [selectedColores, setSelectedColores] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar impuestos del sistema
  const { data: impuestos = [] } = useQuery({
    queryKey: ['impuestos'],
    queryFn: getImpuestos,
    enabled: isOpen,
  })

  const impuestosIva = impuestos.filter(
    (imp: any) =>
      (imp.tipo === 'IVA' || imp.tipo === 'CONSUMO') &&
      imp.activo !== false &&
      imp.estado !== 'INACTIVO' &&
      imp.retencionCompra !== true
  )

  // Prellenar cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setNombre(initialSearch.trim())
      setReferencia('')
      setCosto('')
      setPrecioVenta('')
      setTieneVariantes(false)
      setTipoVariante('tallas')
      setCustomTallas('')
      setSelectedColores([])
      setIsSubmitting(false)

      // Seleccionar impuesto por defecto
      const def = impuestosIva.find((t: any) => t.esDefecto) || impuestosIva[0]
      if (def) {
        setSelectedTaxId(String(def.id))
      } else {
        setSelectedTaxId('0')
      }
    }
  }, [isOpen, initialSearch, impuestosIva.length])

  // Cálculo de variantes a generar
  const variantesPreview = useMemo(() => {
    if (!tieneVariantes) return []

    const ref = referencia.trim().toUpperCase()
    const skuBase = ref || `PROD-${Date.now().toString().slice(-6)}`

    // Tallas
    const tallasArray = customTallas
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    // Colores
    const coloresArray = selectedColores.filter(Boolean)

    const list: Array<{
      sku: string
      nombre: string
      atributos: Array<{ nombre: string; valor: string }>
    }> = []

    if (tipoVariante === 'tallas') {
      tallasArray.forEach(t => {
        const slug = slugifyAttr(t)
        list.push({
          sku: `${skuBase}-${slug}`,
          nombre: `Talla ${t}`,
          atributos: [{ nombre: 'Talla', valor: t }],
        })
      })
    } else if (tipoVariante === 'colores') {
      coloresArray.forEach(c => {
        const slug = slugifyAttr(c)
        list.push({
          sku: `${skuBase}-${slug}`,
          nombre: `Color ${c}`,
          atributos: [{ nombre: 'Color', valor: c }],
        })
      })
    } else if (tipoVariante === 'ambos') {
      if (tallasArray.length === 0 && coloresArray.length > 0) {
        coloresArray.forEach(c => {
          const slug = slugifyAttr(c)
          list.push({
            sku: `${skuBase}-${slug}`,
            nombre: `Color ${c}`,
            atributos: [{ nombre: 'Color', valor: c }],
          })
        })
      } else if (coloresArray.length === 0 && tallasArray.length > 0) {
        tallasArray.forEach(t => {
          const slug = slugifyAttr(t)
          list.push({
            sku: `${skuBase}-${slug}`,
            nombre: `Talla ${t}`,
            atributos: [{ nombre: 'Talla', valor: t }],
          })
        })
      } else {
        tallasArray.forEach(t => {
          coloresArray.forEach(c => {
            const slugT = slugifyAttr(t)
            const slugC = slugifyAttr(c)
            list.push({
              sku: `${skuBase}-${slugT}-${slugC}`,
              nombre: `Talla ${t} / Color ${c}`,
              atributos: [
                { nombre: 'Talla', valor: t },
                { nombre: 'Color', valor: c },
              ],
            })
          })
        })
      }
    }

    return list
  }, [tieneVariantes, tipoVariante, customTallas, selectedColores, referencia])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const nom = nombre.trim()
    if (!nom) {
      setError('El nombre del producto es obligatorio')
      return
    }

    if (tieneVariantes && variantesPreview.length === 0) {
      setError('Debes especificar al menos una talla o color para crear las variantes')
      return
    }

    const ref = referencia.trim().toUpperCase()
    // Si no ingresó referencia, generamos un SKU único corto
    const skuFinal = ref || `PROD-${Date.now().toString().slice(-6)}`

    const costoNum = parseFloat(costo) || 0
    const precioNum = parseFloat(precioVenta) || 0

    // Determinar impuesto seleccionado
    const selectedTax = impuestosIva.find((t: any) => String(t.id) === String(selectedTaxId))
    const ivaTarifa = selectedTax ? Number(selectedTax.tarifa) : 0
    const esExento = selectedTaxId === '0' || !selectedTax || ivaTarifa === 0

    let tipoIva = 'EXCLUIDO'
    if (!esExento) {
      if (ivaTarifa === 19) tipoIva = 'GRAVADO_19'
      else if (ivaTarifa === 5) tipoIva = 'GRAVADO_5'
      else tipoIva = `GRAVADO_${ivaTarifa}`
    }

    const payload: any = {
      sku: skuFinal,
      referencia: ref || skuFinal,
      nombre: nom,
      costo: costoNum,
      costoUltimo: costoNum,
      precioBase: precioNum,
      precioWeb: precioNum,
      precios: [precioNum, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tipoIva: tipoIva,
      appliedTaxIds: !esExento && selectedTax ? [String(selectedTax.id)] : [],
      liquidarIva: !esExento,
      productoExentoIva: esExento,
      manejaBodega: true,
    }

    setIsSubmitting(true)
    try {
      const nuevoProd = await createProducto(payload)

      const variantesCreadas: any[] = []
      if (tieneVariantes && variantesPreview.length > 0) {
        for (const vp of variantesPreview) {
          try {
            const vCreada = await createVariante({
              productoId: nuevoProd.id,
              sku: vp.sku,
              nombre: vp.nombre,
              atributos: vp.atributos,
              costoPromedio: costoNum,
              precioBase: precioNum,
            })
            variantesCreadas.push(vCreada)
          } catch (errVar: any) {
            console.error('Error creando variante:', errVar)
          }
        }
      }

      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['config_productos'] })
      qc.invalidateQueries({ queryKey: ['buscar-prod-oc'] })
      qc.invalidateQueries({ queryKey: ['buscar-prod-fc'] })
      qc.invalidateQueries({ queryKey: ['variantes'] })

      const prodConVariantes = {
        ...nuevoProd,
        variantes: variantesCreadas,
      }

      if (variantesCreadas.length > 0) {
        toast.success(`Producto "${nuevoProd.nombre}" creado con ${variantesCreadas.length} variantes`)
      } else {
        toast.success(`Producto "${nuevoProd.nombre}" creado y agregado`)
      }

      onSuccess(prodConVariantes)
      onClose()
    } catch (err: any) {
      setError(getApiError(err, 'No se pudo crear el producto'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Creación Rápida de Producto</h3>
              <p className="text-xs text-slate-400">Se guardará en catálogo y se agregará a tu documento actual</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario con scroll vertical */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre del Producto *
            </label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Zapatilla Deportiva Smash..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Referencia / SKU */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Referencia / Código Padre</span>
              <span className="text-[10px] text-slate-400 font-normal">Opcional (se auto-genera si queda vacío)</span>
            </label>
            <div className="relative">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={referencia}
                onChange={e => setReferencia(e.target.value.toUpperCase())}
                placeholder="Ej. ZAP-SMASH-01..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Costo y Valor de Venta en 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Costo Unitario ($) *
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatMiles(costo)}
                  onChange={e => setCosto(parseMiles(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Valor Venta Base ($) *
              </label>
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatMiles(precioVenta)}
                  onChange={e => setPrecioVenta(parseMiles(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right"
                />
              </div>
            </div>
          </div>

          {/* Impuesto (IVA) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Impuesto Aplicable (IVA)
            </label>
            <div className="relative">
              <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedTaxId}
                onChange={e => setSelectedTaxId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="0">0% (Sin IVA / Exento)</option>
                {impuestosIva.map((imp: any) => (
                  <option key={imp.id} value={String(imp.id)}>
                    {imp.tarifa}% — {imp.nombre} {imp.esDefecto ? '(Por Defecto)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sección de Variantes (Tallas y Colores) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    tieneVariantes ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Layers size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">¿Este producto maneja variantes?</h4>
                    <p className="text-[11px] text-slate-400">Activa si compras o vendes por tallas o colores</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTieneVariantes(!tieneVariantes)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                    tieneVariantes ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      tieneVariantes ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {tieneVariantes && (
                <div className="space-y-3 pt-3 border-t border-slate-200/60 animate-in fade-in duration-200">
                  {/* Selector de modo */}
                  <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTipoVariante('tallas')}
                      className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        tipoVariante === 'tallas' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>👕 Por Tallas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoVariante('colores')}
                      className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        tipoVariante === 'colores' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🎨 Por Colores</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoVariante('ambos')}
                      className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        tipoVariante === 'ambos' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>✨ Tallas + Colores</span>
                    </button>
                  </div>

                  {/* MODO TALLAS */}
                  {(tipoVariante === 'tallas' || tipoVariante === 'ambos') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Tallas o Medidas
                        </label>
                        <span className="text-[10px] text-slate-400">Haz clic en un preset o digita abajo</span>
                      </div>

                      {/* Presets rápidos */}
                      <div className="flex flex-wrap gap-1.5">
                        {PRESETS_TALLAS.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              const current = customTallas ? customTallas.split(',').map(s => s.trim()).filter(Boolean) : []
                              const merged = Array.from(new Set([...current, ...p.tallas]))
                              setCustomTallas(merged.join(', '))
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={customTallas}
                        onChange={e => setCustomTallas(e.target.value)}
                        placeholder="Ej: S, M, L, XL  o  37, 38, 39, 40 (separadas por coma)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* MODO COLORES */}
                  {(tipoVariante === 'colores' || tipoVariante === 'ambos') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Colores
                        </label>
                        <span className="text-[10px] text-slate-400">Haz clic para seleccionar colores</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200">
                        {PALETA_COLORES.slice(0, 16).map(c => {
                          const isSelected = selectedColores.includes(c.nombre)
                          return (
                            <button
                              key={c.nombre}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedColores(selectedColores.filter(x => x !== c.nombre))
                                } else {
                                  setSelectedColores([...selectedColores, c.nombre])
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span>{c.nombre}</span>
                              {isSelected && <Check size={11} />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Vista previa de variantes a generar */}
                  {variantesPreview.length > 0 && (
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                          <Sparkles size={12} className="text-indigo-600" />
                          Se generarán {variantesPreview.length} variantes:
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold">Listas para agregar</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {variantesPreview.map((vp, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white border border-indigo-200 text-indigo-800 rounded-md text-[10px] font-medium font-mono"
                          >
                            {vp.nombre} ({vp.sku})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Creando producto y variantes...
                </>
              ) : (
                <>
                  <Package size={14} /> Crear y Agregar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
