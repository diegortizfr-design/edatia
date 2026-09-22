import React from 'react'

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-3xl sm:rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm flex flex-col h-full animate-pulse">
      {/* Caja de imagen gris */}
      <div className="aspect-square bg-slate-200"></div>

      {/* Contenido (textos falsos) */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Badge y estrellas */}
          <div className="flex justify-between items-center">
            <div className="h-4 bg-slate-200 rounded-md w-16"></div>
            <div className="h-3 bg-slate-200 rounded-md w-10"></div>
          </div>
          
          {/* Título largo */}
          <div className="h-4 bg-slate-200 rounded-md w-full mt-1"></div>
          <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>

          {/* Descripción */}
          <div className="h-3 bg-slate-100 rounded-md w-full mt-2 hidden sm:block"></div>
        </div>

        {/* Precio y Botón */}
        <div className="pt-2 border-t border-slate-50 flex items-end justify-between">
          <div className="space-y-1">
            <div className="h-2 bg-slate-200 rounded w-10"></div>
            <div className="h-5 bg-slate-200 rounded-md w-16"></div>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-16 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  )
}
