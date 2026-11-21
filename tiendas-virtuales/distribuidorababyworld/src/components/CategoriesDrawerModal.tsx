import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Search,
  ChevronRight,
  Layers
} from 'lucide-react'
import { Product } from '../data/productos'
import { matchesCategoryName, toCategoryTitleCase } from '../lib/categoriaFormat'

interface ErpCategory {
  id: number
  nombre: string
  slug: string
  parentId: number | null
  parent?: { id: number; nombre: string; slug: string } | null
  hijos?: { id: number; nombre: string; slug: string }[]
  _count?: { productos: number }
}

interface CategoriesDrawerModalProps {
  isOpen: boolean
  onClose: () => void
  categories: readonly string[]
  erpCategories?: ErpCategory[]
  products?: Product[]
  activeCategory: string
  activeSubcategory: string
  onSelectCategory: (category: string, subcategory?: string) => void
}

export function CategoriesDrawerModal({
  isOpen,
  onClose,
  categories,
  erpCategories = [],
  products = [],
  activeCategory,
  activeSubcategory,
  onSelectCategory,
}: CategoriesDrawerModalProps) {
  const [searchFilter, setSearchFilter] = useState('')

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Resetear filtro al abrir
  useEffect(() => {
    if (isOpen) {
      setSearchFilter('')
    }
  }, [isOpen])

  // Mapeo de iconos dinámicos para categorías
  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (c === 'todos') return '✨'
    if (c.includes('black') || c.includes('oferta')) return '🔥'
    if (c.includes('panal') || c.includes('cuidado') || c.includes('aseo') || c.includes('bano') || c.includes('higiene')) return '🍼'
    if (c.includes('calzado') || c.includes('zapato') || c.includes('tenis')) return '👟'
    if (c.includes('juguet') || c.includes('estimul') || c.includes('didact')) return '🧸'
    if (c.includes('ropa') || c.includes('vest') || c.includes('ajuar') || c.includes('moda')) return '👕'
    if (c.includes('aliment') || c.includes('leche') || c.includes('lactanc') || c.includes('tetero')) return '🥣'
    if (c.includes('coche') || c.includes('paseo') || c.includes('silla') || c.includes('cuna') || c.includes('corral')) return '🛒'
    if (c.includes('variedad') || c.includes('accesori')) return '🎀'
    return '🏷️'
  }

  // Conteo de productos por categoría
  const productCountMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) {
      const catKey = p.categoria || 'Otros'
      map.set(catKey, (map.get(catKey) || 0) + 1)
    }
    return map
  }, [products])

  // Obtener subcategorías asociadas a una categoría
  const getSubcategoriesFor = (catName: string): string[] => {
    if (catName === 'Todos' || catName.includes('Black')) return []
    const subs = new Set<string>()

    // Desde el ERP
    const parent = erpCategories.find(c =>
      !c.parentId && matchesCategoryName(toCategoryTitleCase(c.nombre), catName)
    )
    if (parent && Array.isArray(parent.hijos)) {
      parent.hijos.forEach(h => subs.add(toCategoryTitleCase(h.nombre)))
    }

    // Desde los productos reales cargados
    for (const p of products) {
      if (matchesCategoryName(p.categoria, catName) && p.subcategoria && p.subcategoria.trim()) {
        subs.add(toCategoryTitleCase(p.subcategoria.trim()))
      }
    }

    return Array.from(subs).sort((a, b) => a.localeCompare(b, 'es'))
  }

  // Categorías filtradas por la búsqueda interna
  const filteredCategories = useMemo(() => {
    const q = searchFilter.toLowerCase().trim()
    if (!q) return categories

    return categories.filter(cat => {
      if (cat.toLowerCase().includes(q)) return true
      const subs = getSubcategoriesFor(cat)
      return subs.some(s => s.toLowerCase().includes(q))
    })
  }, [categories, searchFilter, erpCategories, products])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-3xl bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] sm:max-h-[82vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con degradado suave y botón de cierre */}
        <div className="relative bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 text-white px-5 py-4 sm:px-7 sm:py-5 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all active:scale-95"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md shrink-0">
              <Layers size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight">
                  Departamentos & Categorías
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-sky-100">
                  {categories.length - 1} secciones
                </span>
              </div>
              <p className="text-xs text-sky-100 leading-tight mt-0.5">
                Explora todo el catálogo de Baby World organizado por sección
              </p>
            </div>
          </div>

          {/* Buscador interno rápido */}
          <div className="mt-3.5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-200" size={16} />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar sección (ej: pañales, juguetes, aseo, ropa...)"
              className="w-full pl-10 pr-9 py-2 bg-white/15 hover:bg-white/20 focus:bg-white text-white focus:text-slate-900 placeholder-sky-100 focus:placeholder-slate-400 rounded-xl text-xs sm:text-sm font-medium border border-white/25 focus:border-white focus:outline-none transition-all"
              autoFocus
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white focus:text-slate-600 p-0.5 rounded-full"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Lista scrolleable de categorías */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 divide-y divide-slate-100">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-2xl">🔍</p>
              <p className="text-sm font-bold text-slate-700">No encontramos esa categoría</p>
              <p className="text-xs text-slate-400">Prueba con palabras como "pañales", "juguetes", "leches" o "ropa".</p>
              <button
                onClick={() => setSearchFilter('')}
                className="mt-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
              {filteredCategories.map((cat) => {
                const isSelected = matchesCategoryName(activeCategory, cat)
                const isBlackDays = cat.toLowerCase().includes('black')
                const isTodos = cat === 'Todos'
                const count = isTodos
                  ? products.length
                  : isBlackDays
                    ? products.filter(p => (p.precioAnterior && p.precioAnterior > p.precio) || p.categoria.toLowerCase().includes('juguet')).length
                    : (productCountMap.get(cat) || 0)
                const subcategories = getSubcategoriesFor(cat)

                return (
                  <div
                    key={cat}
                    className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between group ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 shadow-sm'
                        : isBlackDays
                          ? 'border-amber-300 bg-gradient-to-br from-amber-500/10 via-amber-50 to-yellow-50 hover:border-amber-400'
                          : 'border-slate-200/80 bg-white hover:border-sky-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Botón principal de la categoría */}
                    <button
                      onClick={() => {
                        onSelectCategory(cat)
                        onClose()
                      }}
                      className="w-full flex items-center justify-between gap-2.5 text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl sm:text-2xl shrink-0 p-1 rounded-xl bg-slate-50 group-hover:scale-110 transition-transform">
                          {getCategoryIcon(cat)}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-extrabold truncate ${
                            isSelected ? 'text-sky-700' : isBlackDays ? 'text-amber-900' : 'text-slate-800'
                          }`}>
                            {cat}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {count > 0 ? `${count} productos` : 'Ver sección'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected && (
                          <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        )}
                        <ChevronRight size={16} className={`transition-transform group-hover:translate-x-0.5 ${
                          isSelected ? 'text-sky-600' : 'text-slate-300'
                        }`} />
                      </div>
                    </button>

                    {/* Subcategorías asociadas si existen */}
                    {subcategories.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100/80">
                        <div className="flex flex-wrap gap-1.5">
                          {subcategories.slice(0, 4).map((sub) => {
                            const isSubActive = isSelected && matchesCategoryName(activeSubcategory, sub)
                            return (
                              <button
                                key={sub}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectCategory(cat, sub)
                                  onClose()
                                }}
                                className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg font-semibold transition-all ${
                                  isSubActive
                                    ? 'bg-sky-600 text-white font-bold'
                                    : 'bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-600'
                                }`}
                              >
                                {sub}
                              </button>
                            )
                          })}
                          {subcategories.length > 4 && (
                            <button
                              onClick={() => {
                                onSelectCategory(cat)
                                onClose()
                              }}
                              className="text-[10px] text-sky-600 hover:underline font-bold self-center px-1"
                            >
                              +{subcategories.length - 4} más
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="hidden sm:inline">
            💡 Puedes filtrar cualquier sección o dar clic para ver todo su catálogo.
          </span>
          <button
            onClick={() => {
              onSelectCategory('Todos')
              onClose()
            }}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-sky-600 text-white rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all text-center"
          >
            Ver Todo el Catálogo
          </button>
        </div>
      </div>
    </div>
  )
}

