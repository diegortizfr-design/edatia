import React, { useMemo } from 'react'
import { ArrowRight, ChevronRight, Sparkles, Layers, Tag } from 'lucide-react'
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

interface CategoriesSectionProps {
  categories: readonly string[]
  erpCategories?: ErpCategory[]
  products?: Product[]
  onSelectCategory: (category: string, subcategory?: string) => void
}

interface CategoryCardMeta {
  icon: string
  bgLight: string
  textColor: string
  borderColor: string
  ringColor: string
  gradient?: string
  badgeText?: string
}

function getCategoryMeta(catName: string): CategoryCardMeta {
  const c = catName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (c.includes('black') || c.includes('oferta')) {
    return {
      icon: '🔥',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-300',
      ringColor: 'hover:ring-amber-400',
      gradient: 'from-amber-500 via-rose-500 to-slate-900',
      badgeText: 'Black Days',
    }
  }
  if (c.includes('panal') || c.includes('toalla')) {
    return {
      icon: '🍼',
      bgLight: 'bg-sky-50',
      textColor: 'text-sky-600',
      borderColor: 'border-sky-200',
      ringColor: 'hover:ring-sky-400',
    }
  }
  if (c.includes('juguet') || c.includes('estimul') || c.includes('didact')) {
    return {
      icon: '🧸',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      ringColor: 'hover:ring-amber-400',
    }
  }
  if (c.includes('cuidado') || c.includes('aseo') || c.includes('bano') || c.includes('higiene')) {
    return {
      icon: '🧴',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      ringColor: 'hover:ring-emerald-400',
    }
  }
  if (c.includes('calzado') || c.includes('zapato') || c.includes('tenis')) {
    return {
      icon: '👟',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      ringColor: 'hover:ring-purple-400',
    }
  }
  if (c.includes('ropa') || c.includes('vest') || c.includes('ajuar') || c.includes('moda')) {
    return {
      icon: '👕',
      bgLight: 'bg-rose-50',
      textColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      ringColor: 'hover:ring-rose-400',
    }
  }
  if (c.includes('aliment') || c.includes('leche') || c.includes('lactanc') || c.includes('tetero')) {
    return {
      icon: '🥣',
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      ringColor: 'hover:ring-indigo-400',
    }
  }
  if (c.includes('coche') || c.includes('paseo') || c.includes('silla') || c.includes('cuna') || c.includes('corral')) {
    return {
      icon: '🛒',
      bgLight: 'bg-teal-50',
      textColor: 'text-teal-600',
      borderColor: 'border-teal-200',
      ringColor: 'hover:ring-teal-400',
    }
  }
  if (c.includes('variedad') || c.includes('accesori')) {
    return {
      icon: '🎀',
      bgLight: 'bg-pink-50',
      textColor: 'text-pink-600',
      borderColor: 'border-pink-200',
      ringColor: 'hover:ring-pink-400',
    }
  }

  return {
    icon: '🏷️',
    bgLight: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    ringColor: 'hover:ring-slate-400',
  }
}

export function CategoriesSection({
  categories,
  erpCategories = [],
  products = [],
  onSelectCategory,
}: CategoriesSectionProps) {
  // Excluir 'Todos' porque esta sección es la vitrina para que el usuario escoja a dónde entrar
  const displayCategories = useMemo(() => {
    return categories.filter(c => c.toLowerCase() !== 'todos')
  }, [categories])

  // Contar productos reales por categoría
  const countByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) {
      const cat = p.categoria || 'Otros'
      map.set(cat, (map.get(cat) || 0) + 1)
      if ((p.precioAnterior && p.precioAnterior > p.precio) || p.categoria.toLowerCase().includes('juguet')) {
        map.set('🔥 Black Days', (map.get('🔥 Black Days') || 0) + 1)
      }
    }
    return map
  }, [products])

  // Obtener subcategorías asociadas
  const getSubcategories = (catName: string): string[] => {
    if (catName.includes('Black')) return []
    const subs = new Set<string>()

    // Desde el ERP
    const parent = erpCategories.find(c =>
      !c.parentId && matchesCategoryName(toCategoryTitleCase(c.nombre), catName)
    )
    if (parent && Array.isArray(parent.hijos)) {
      parent.hijos.forEach(h => subs.add(toCategoryTitleCase(h.nombre)))
    }

    // Desde productos
    for (const p of products) {
      if (matchesCategoryName(p.categoria, catName) && p.subcategoria && p.subcategoria.trim()) {
        subs.add(toCategoryTitleCase(p.subcategoria.trim()))
      }
    }

    return Array.from(subs).filter(Boolean)
  }

  return (
    <section id="categorias-section" className="bg-gradient-to-b from-white via-slate-50/60 to-white py-12 sm:py-16 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado de la sección */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-100 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <Layers size={13} className="text-sky-500" />
            <span>Nuestras Categorías</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ¿Qué estás buscando para tu bebé?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Explora por departamentos y encuentra las mejores marcas, ofertas y productos seleccionados especialmente para ti.
          </p>
        </div>

        {/* Rejilla de Tarjetas de Categoría */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {displayCategories.map((cat) => {
            const meta = getCategoryMeta(cat)
            const count = countByCategory.get(cat) || 0
            const subcategories = getSubcategories(cat)
            const isBlackDays = cat.toLowerCase().includes('black')

            if (isBlackDays) {
              return (
                <div
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className="col-span-2 sm:col-span-2 md:col-span-1 lg:col-span-1 group relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white p-5 sm:p-6 rounded-3xl border border-amber-400/30 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-amber-400 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[170px]"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl sm:text-4xl filter drop-shadow">🔥</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                      <Sparkles size={10} />
                      Ofertas
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-base sm:text-lg font-black text-amber-300 group-hover:text-amber-200 transition-colors">
                      {cat}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 font-medium">
                      Hasta 60% OFF en referencias seleccionadas
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-bold text-amber-400 border-t border-white/10 pt-3">
                    <span>Ver ofertas</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            }

            return (
              <div
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className="group bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-sky-300 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[170px] relative overflow-hidden"
              >
                <div>
                  {/* Icono + Conteo */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${meta.bgLight} ${meta.borderColor} border flex items-center justify-center text-2xl sm:text-3xl shadow-2xs group-hover:scale-105 transition-transform duration-300`}>
                      {meta.icon}
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                        {count} prod.
                      </span>
                    )}
                  </div>

                  {/* Título de la Categoría */}
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 group-hover:text-sky-600 transition-colors leading-snug">
                    {cat}
                  </h3>

                  {/* Previsualización de subcategorías (hasta 2 o 3) */}
                  {subcategories.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {subcategories.slice(0, 3).map((sub) => (
                        <span
                          key={sub}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectCategory(cat, sub)
                          }}
                          className="text-[10px] font-medium text-slate-500 bg-slate-100/80 hover:bg-sky-50 hover:text-sky-600 px-2 py-0.5 rounded-md transition-colors"
                        >
                          {sub}
                        </span>
                      ))}
                      {subcategories.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-400 self-center">
                          +{subcategories.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      Ver catálogo completo
                    </p>
                  )}
                </div>

                {/* Footer de la tarjeta con acción rápida */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:text-sky-700">
                  <span className="text-[11px] sm:text-xs">Explorar</span>
                  <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
