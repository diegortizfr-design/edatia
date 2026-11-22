import React from 'react'

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl sm:rounded-2xl border border-slate-100 overflow-hidden shadow-2xs flex flex-col h-full animate-pulse">
      {/* Caja de imagen gris */}
      <div className="aspect-square bg-slate-100"></div>

      {/* Contenido (textos falsos) */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1.5">
          {/* Badge y estrellas */}
          <div className="flex justify-between items-center">
            <div className="h-3.5 bg-slate-200 rounded-md w-14"></div>
            <div className="h-3 bg-slate-200 rounded-md w-8"></div>
          </div>
          
          {/* Título largo */}
          <div className="h-3.5 bg-slate-200 rounded-md w-full mt-1"></div>
          <div className="h-3.5 bg-slate-200 rounded-md w-3/4"></div>
        </div>

        {/* Precio y Botón */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
          <div className="space-y-1 flex-1">
            <div className="h-4 bg-slate-200 rounded-md w-16"></div>
            <div className="h-2 bg-slate-100 rounded w-10"></div>
          </div>
          <div className="h-8 w-16 bg-slate-200 rounded-xl shrink-0"></div>
        </div>
      </div>
    </div>
  )
}
