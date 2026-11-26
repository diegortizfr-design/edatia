import { useState, useEffect, useMemo } from 'react'
import { X, Layers, Plus, Minus, Check, ShoppingBag, Sparkles } from 'lucide-react'
import { formatMiles, parseMiles } from '../lib/utils'
import { extraerAtributosVisuales } from '../utils/variantesColores'

export interface SelectedVarianteItem {
  varianteId: number
  varianteNombre: string
  varianteSku: string
  cantidad: number
  costoUnitario: number
  producto: any
}

interface ModalSeleccionarVariantesCompraProps {
  isOpen: boolean
  onClose: () => void
  producto: any | null
  bodegaId?: number | string
  onAddVariantes: (items: SelectedVarianteItem[]) => void
}

export function ModalSeleccionarVariantesCompra({
  isOpen,
  onClose,
  producto,
  bodegaId,
  onAddVariantes,
}: ModalSeleccionarVariantesCompraProps) {
  // Cantidades por varianteId: { [varianteId]: string }
  const [cantidades, setCantidades] = useState<Record<number, string>>({})
  // Costos por varianteId: { [varianteId]: string }
  const [costos, setCostos] = useState<Record<number, string>>({})

  const variantes = useMemo(() => {
    if (!producto || !Array.isArray(producto.variantes)) return []
    return producto.variantes.filter((v: any) => v.activo !== false)
  }, [producto])

  // Inicializar cantidades y costos al abrir
  useEffect(() => {
    if (isOpen && producto) {
      const cInit: Record<number, string> = {}
      const costInit: Record<number, string> = {}
      const baseCost = Number(producto.costo) || Number(producto.costoPromedio) || Number(producto.costoUltimo) || 0

      variantes.forEach((v: any) => {
        cInit[v.id] = ''
        const vCost = Number(v.costoPromedio) || baseCost
        costInit[v.id] = String(vCost)
      })

      setCantidades(cInit)
      setCostos(costInit)
    }
  }, [isOpen, producto, variantes])

  if (!isOpen || !producto) return null

  const handleCantidadChange = (varId: number, val: string) => {
    const clean = val.replace(/[^0-9.]/g, '')
    setCantidades(prev => ({ ...prev, [varId]: clean }))
  }

  const handleIncrement = (varId: number, delta: number) => {
    const cur = parseFloat(cantidades[varId] || '0') || 0
    const next = Math.max(0, cur + delta)
    setCantidades(prev => ({ ...prev, [varId]: next > 0 ? String(next) : '' }))
  }

  const handleCostoChange = (varId: number, val: string) => {
    const clean = parseMiles(val)
    setCostos(prev => ({ ...prev, [varId]: clean }))
  }

  // Total de unidades seleccionadas
  const totalUnidades = Object.values(cantidades).reduce((acc, c) => acc + (parseFloat(c) || 0), 0)

  // Variantes con cantidad > 0
  const totalVariantesConCantidad = Object.entries(cantidades).filter(([_, c]) => (parseFloat(c) || 0) > 0).length

  const handleConfirmar = () => {
    const seleccionadas: SelectedVarianteItem[] = []

    variantes.forEach((v: any) => {
      const cantNum = parseFloat(cantidades[v.id] || '0') || 0
      if (cantNum > 0) {
        const costoNum = parseFloat(costos[v.id] || '0') || Number(producto.costo) || 0
        seleccionadas.push({
          varianteId: v.id,
          varianteNombre: v.nombre,
          varianteSku: v.sku,
          cantidad: cantNum,
          costoUnitario: costoNum,
          producto,
        })
      }
    })

    if (seleccionadas.length === 0) return

    onAddVariantes(seleccionadas)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">{producto.nombre}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {variantes.length} variantes
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">SKU Padre: {producto.sku || producto.referencia}</p>
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

        {/* Instrucción rápida */}
        <div className="px-6 py-2.5 bg-indigo-50/50 border-b border-indigo-100/60 flex items-center justify-between shrink-0">
          <p className="text-xs text-indigo-900 font-medium">
            Ingresa las cantidades que deseas comprar u ordenar por cada talla/variante:
          </p>
          <span className="text-[11px] font-bold text-indigo-600">
            {totalUnidades} und. seleccionadas
          </span>
        </div>

        {/* Lista de variantes con scroll */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2">
          {variantes.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Este producto no tiene variantes configuradas.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100">
              {variantes.map((v: any) => {
                const vis = extraerAtributosVisuales(v)
                const cantActual = parseFloat(cantidades[v.id] || '0') || 0
                const isSelected = cantActual > 0

                // Stock actual en la bodega seleccionada si aplica
                let stockEnBodega = 0
                if (Array.isArray(v.stock)) {
                  if (bodegaId) {
                    const sb = v.stock.find((s: any) => String(s.bodegaId) === String(bodegaId))
                    stockEnBodega = sb ? parseFloat(sb.cantidad) : 0
                  } else {
                    stockEnBodega = v.stock.reduce((acc: number, s: any) => acc + (parseFloat(s.cantidad) || 0), 0)
                  }
                }

                return (
                  <div
                    key={v.id}
                    className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                      isSelected ? 'bg-indigo-50/40' : 'bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Info de la variante */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {vis.esColor ? (
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: vis.colorHex }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-slate-600 font-mono">
                            {vis.talla || 'VAR'}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800 truncate">{v.nombre}</p>
                          {vis.esTalla && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                              Talla {vis.talla}
                            </span>
                          )}
                          {vis.esColor && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                              {vis.color}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="font-mono text-[11px]">{v.sku}</span>
                          <span>·</span>
                          <span className="text-slate-500">Stock actual: {stockEnBodega}</span>
                        </div>
                      </div>
                    </div>

                    {/* Costo Unitario y Cantidad a Comprar */}
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Costo Unitario */}
                      <div className="w-28">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          Costo ($)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatMiles(costos[v.id] || '')}
                          onChange={e => handleCostoChange(v.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                        />
                      </div>

                      {/* Contador de Cantidad */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          Cantidad
                        </label>
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleIncrement(v.id, -1)}
                            className="w-7 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Minus size={13} />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cantidades[v.id] || ''}
                            onChange={e => handleCantidadChange(v.id, e.target.value)}
                            placeholder="0"
                            className="w-12 h-8 text-center text-xs font-bold text-slate-800 focus:outline-none bg-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrement(v.id, 1)}
                            className="w-7 h-8 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs text-slate-500">
              <strong className="text-slate-800">{totalVariantesConCantidad}</strong> variantes seleccionadas
            </p>
            <p className="text-xs font-bold text-indigo-700">
              Total: {totalUnidades} unidades a ingresar
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={totalUnidades === 0}
              onClick={handleConfirmar}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} /> Agregar {totalUnidades > 0 ? `(${totalUnidades} und)` : ''} a la Compra
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
