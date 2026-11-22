import React, { useMemo } from 'react'
import { ArrowRight, ChevronRight, Sparkles, Layers } from 'lucide-react'
import { Product } from '../data/productos'
import { matchesCategoryName, toCategoryTitleCase } from '../lib/categoriaFormat'
import { getCategoryMeta } from '../lib/categoryMeta'
import { ACTIVE_CAMPAIGN } from '../constants/seasonalCampaign'

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
  onSelectAllCatalog?: () => void
}

export function CategoriesSection({
  categories,
  erpCategories = [],
  products = [],
  onSelectCategory,
  onSelectAllCatalog,
}: CategoriesSectionProps) {
  // Excluir 'Todos' de las tarjetas cuadradas
  const displayCategories = useMemo(() => {
    return categories.filter(c => c.toLowerCase() !== 'todos')
  }, [categories])

  // Contar productos reales por categoría
  const countByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) {
      const cat = p.categoria || 'Otros'
      map.set(cat, (map.get(cat) || 0) + 1)
      if (ACTIVE_CAMPAIGN.active && ACTIVE_CAMPAIGN.isCampaignProduct(p)) {
        map.set(ACTIVE_CAMPAIGN.categoryName, (map.get(ACTIVE_CAMPAIGN.categoryName) || 0) + 1)
      }
    }
    return map
  }, [products])

  // Obtener subcategorías asociadas
  const getSubcategories = (catName: string): string[] => {
    if (catName.includes('Black') || catName.includes('Oferta') || catName.includes('Navidad')) return []
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

  const handleAllCatalogClick = () => {
    if (onSelectAllCatalog) {
      onSelectAllCatalog()
    } else {
      onSelectCategory('Todos')
    }
  }

  return (
    <section id="categorias-section" className="bg-gradient-to-b from-white via-slate-50/50 to-white py-6 sm:py-8 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* ============================================================== */}
        {/* ENCABEZADO COMPACTO DE SECCIÓN                                 */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 sm:mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 text-[10px] font-bold uppercase tracking-wider mb-1 shadow-2xs">
              <Layers size={11} className="text-sky-500" />
              <span>Nuestras Secciones</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              ¿Qué estás buscando para tu bebé?
            </h2>
          </div>

          <p className="text-xs text-slate-500 max-w-sm sm:text-right font-medium">
            Selecciona un departamento o consulta el inventario completo.
          </p>
        </div>

        {/* ============================================================== */}
        {/* 1. BARRA SUPERIOR DESTACADA: "VER TODO EL CATÁLOGO" (ARRIBA)    */}
        {/* ============================================================== */}
        <div
          onClick={handleAllCatalogClick}
          className="mb-4 sm:mb-5 group relative overflow-hidden bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white rounded-2xl p-2.5 sm:p-3 border border-sky-400/30 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 z-10">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-base sm:text-lg shrink-0 group-hover:scale-105 transition-transform">
              ✨
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                  Explorar Todo el Catálogo
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 text-[10px] font-bold border border-sky-400/30 shrink-0">
                  <Sparkles size={9} />
                  <span>{products.length} productos</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate hidden xs:block sm:block font-normal">
                Ver todos los pañales, juguetes, aseo, ropa y accesorios sin filtro de categoría
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 group-hover:bg-sky-400 text-white font-extrabold text-[11px] sm:text-xs shadow-xs transition-all z-10">
            <span>Ver todo</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. REJILLA DE TARJETAS COMPACTAS (AJUSTADAS A LA PANTALLA)     */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {displayCategories.map((cat) => {
            const meta = getCategoryMeta(cat)
            const count = countByCategory.get(cat) || 0
            const subcategories = getSubcategories(cat)
            const isSpecial = meta.isSpecialCampaign

            if (isSpecial) {
              return (
                <div
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`col-span-2 sm:col-span-2 md:col-span-1 lg:col-span-1 group relative overflow-hidden bg-gradient-to-br ${meta.gradient || 'from-slate-950 via-slate-900 to-amber-950'} text-white p-3.5 sm:p-4 rounded-2xl border ${meta.borderColor} shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[110px] sm:min-h-[118px]`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-2xl filter drop-shadow">{meta.icon}</span>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-amber-300 group-hover:text-amber-200 transition-colors leading-tight">
                          {cat}
                        </h3>
                        <p className="text-[10px] text-slate-300 font-medium line-clamp-1 mt-0.5">
                          {ACTIVE_CAMPAIGN.subtitle}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black uppercase tracking-wider shrink-0">
                      <Sparkles size={9} />
                      {meta.badgeText || 'Ofertas'}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 flex items-center justify-between text-[11px] font-bold text-amber-400 border-t border-white/10">
                    <span>{ACTIVE_CAMPAIGN.actionText}</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            }

            return (
              <div
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className="group bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-sky-300 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[110px] sm:min-h-[118px] relative"
              >
                <div>
                  {/* Fila superior: Icono + Conteo + Flecha */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${meta.bgLight} ${meta.borderColor} border flex items-center justify-center text-lg sm:text-xl shadow-2xs group-hover:scale-105 transition-transform duration-200`}>
                      {meta.icon}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {count > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                          {count} prod.
                        </span>
                      )}
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Título de la Categoría */}
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 group-hover:text-sky-600 transition-colors leading-tight truncate">
                    {cat}
                  </h3>

                  {/* Previsualización compacta de subcategorías */}
                  {subcategories.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {subcategories.slice(0, 2).map((sub) => (
                        <span
                          key={sub}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectCategory(cat, sub)
                          }}
                          className="text-[9px] font-medium text-slate-500 bg-slate-100/90 hover:bg-sky-50 hover:text-sky-600 px-1.5 py-0.5 rounded transition-colors truncate max-w-[120px]"
                        >
                          {sub}
                        </span>
                      ))}
                      {subcategories.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400 self-center">
                          +{subcategories.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      Ver sección
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
