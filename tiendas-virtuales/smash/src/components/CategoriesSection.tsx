import React from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, BRANDS } from '../data/products';
import { FilterState } from '../types';

interface CategoriesSectionProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  totalProducts: number;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  filters,
  onFilterChange,
  totalProducts,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Category Pills (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const isActive = filters.category === cat;
            return (
              <button
                key={cat}
                onClick={() => onFilterChange({ category: cat })}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-lime-400 shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-2">
          {/* Brand & Count */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              Mostrando <strong className="text-slate-900">{totalProducts}</strong> productos
            </span>

            {/* Brand Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="brand-select" className="font-medium text-slate-500">Marca:</label>
              <select
                id="brand-select"
                value={filters.brand}
                onChange={(e) => onFilterChange({ brand: e.target.value })}
                className="bg-transparent font-semibold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="sort-select" className="font-medium text-slate-500">Ordenar por:</label>
              <select
                id="sort-select"
                value={filters.sortBy}
                onChange={(e) =>
                  onFilterChange({
                    sortBy: e.target.value as FilterState['sortBy'],
                  })
                }
                className="bg-transparent font-semibold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                <option value="recommended">Recomendados Smash</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name-asc">Nombre (A - Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
