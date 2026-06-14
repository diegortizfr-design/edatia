import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProductos, getBodegas, getOrdenesCompra } from '../../services/inventario.service'
import { 
  Search, Package, Warehouse, AlertTriangle, ArrowRight, 
  Layers, Hash, SlidersHorizontal, Plus, ShieldAlert, BadgeInfo, ArrowRightLeft
} from 'lucide-react'

export function ControlExistencias() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<string>('todas')

  // Queries
  const { data: productos = [], isLoading: cargandoProd } = useQuery({
    queryKey: ['productos-existencias'],
    queryFn: () => getProductos({ activo: true })
  })

  const { data: bodegas = [], isLoading: cargandoBodegas } = useQuery({
    queryKey: ['bodegas-existencias'],
    queryFn: getBodegas
  })

  const { data: ocs = [] } = useQuery({
    queryKey: ['ocs-existencias'],
    queryFn: () => getOrdenesCompra()
  })

  // 1. Filtrar órdenes de compra pendientes (estado APROBADA o ENVIADA)
  const ocsPendientes = ocs.filter(oc => oc.estado === 'APROBADA' || oc.estado === 'ENVIADA')

  // 2. Procesar productos con stock filtrado por bodega
  const existenciasProcesadas = productos.map(p => {
    let stockTotal = 0
    let stockReservado = 0
    
    if (p.stock) {
      if (bodegaSeleccionada === 'todas') {
        stockTotal = p.stock.reduce((sum, s) => sum + Number(s.cantidad || 0), 0)
        stockReservado = p.stock.reduce((sum, s) => sum + Number(s.cantidadReservada || 0), 0)
      } else {
        const stockBodega = p.stock.find(s => String(s.bodegaId) === bodegaSeleccionada)
        if (stockBodega) {
          stockTotal = Number(stockBodega.cantidad || 0)
          stockReservado = Number(stockBodega.cantidadReservada || 0)
        }
      }
    }

    return {
      ...p,
      stockCalculado: stockTotal,
      reservadoCalculado: stockReservado,
      disponibleCalculado: stockTotal - stockReservado
    }
  })

  // 3. Filtrar por buscador
  const existenciasFiltradas = existenciasProcesadas.filter(p => 
    !q || 
    p.nombre.toLowerCase().includes(q.toLowerCase()) || 
    p.sku.toLowerCase().includes(q.toLowerCase()) ||
    (p.codigoBarras && p.codigoBarras.includes(q))
  )

  const fmtMoneda = (n: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  }

  return (
    <div className="space-y-6 relative">
      
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Package className="text-indigo-600" />
            Control de Existencias
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Monitoreo en tiempo real de inventarios, niveles de stock mínimo, trazabilidad y control de existencias
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/inventario/control-existencias/nuevo-traslado"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all shadow-sm active:scale-95 animate-fade-in"
          >
            <ArrowRightLeft size={14} /> Registrar Traslado (TI)
          </Link>
          <Link
            to="/inventario/control-existencias/nuevo-ajuste"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
          >
            <Plus size={14} /> Registrar Ajuste de Inventario (AI)
          </Link>
        </div>
      </div>

      {/* Accesos Rápidos Submódulos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/inventario/lotes" className="bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md rounded-2xl p-4 transition-all flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-colors">
            <SlidersHorizontal size={18} className="text-slate-500 group-hover:text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Lotes de Producto</p>
            <p className="text-[10px] text-slate-400">Vencimientos y FEFO</p>
          </div>
        </Link>

        <Link to="/inventario/seriales" className="bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md rounded-2xl p-4 transition-all flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-colors">
            <Hash size={18} className="text-slate-500 group-hover:text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Seriales / Únicos</p>
            <p className="text-[10px] text-slate-400">Garantías y tracking</p>
          </div>
        </Link>

        <Link to="/inventario/variantes" className="bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md rounded-2xl p-4 transition-all flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-colors">
            <Layers size={18} className="text-slate-500 group-hover:text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Variantes y Tallas</p>
            <p className="text-[10px] text-slate-400">Atributos y combinaciones</p>
          </div>
        </Link>

        <Link to="/inventario/maestros" className="bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md rounded-2xl p-4 transition-all flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-colors">
            <SlidersHorizontal size={18} className="text-slate-500 group-hover:text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Datos Maestros</p>
            <p className="text-[10px] text-slate-400">Marcas y Categorías</p>
          </div>
        </Link>
      </div>

      {/* Alertas de Órdenes de Compra Pendientes */}
      {ocsPendientes.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex gap-3.5 items-start">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5 animate-bounce" size={18} />
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-800">Se detectaron Órdenes de Compra (OC) pendientes por recibir</p>
            <p className="text-[11px] text-amber-700/90">
              Hay {ocsPendientes.length} órdenes aprobadas o enviadas que representan mercancía en camino. 
              Puedes validar y registrar su entrada física como Recepción de Producto (RP) desde el panel de compras.
            </p>
            <div className="pt-1.5 flex gap-2">
              <Link 
                to="/inventario/compras" 
                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-900 bg-amber-200/50 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-all"
              >
                Ir a Compras <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filtros e inventario */}
      <div className="flex gap-4 flex-wrap items-center justify-between">
        
        {/* Buscador */}
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Filtrar por nombre, SKU o código de barras..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
          />
        </div>

        {/* Selector de Bodega */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 min-w-[220px]">
          <Warehouse size={16} className="text-slate-400 shrink-0" />
          <select
            value={bodegaSeleccionada}
            onChange={e => setBodegaSeleccionada(e.target.value)}
            className="w-full text-xs font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer outline-none"
          >
            <option value="todas">Todas las Bodegas (Consolidado)</option>
            {bodegas.map(b => (
              <option key={b.id} value={String(b.id)}>
                {b.nombre} ({b.codigo})
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Tabla de existencias */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {cargandoProd || cargandoBodegas ? (
          <div className="text-center py-16 text-slate-400 text-sm font-semibold">Cargando existencias...</div>
        ) : existenciasFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400 text-sm">No se encontraron productos en el inventario.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="text-left px-6 py-4">Producto</th>
                  <th className="text-left px-6 py-4 hidden md:table-cell">Categoría</th>
                  <th className="text-right px-6 py-4">Costo CPP</th>
                  <th className="text-right px-6 py-4">Precio Venta</th>
                  <th className="text-center px-6 py-4">Stock Físico</th>
                  <th className="text-center px-6 py-4">Reservado</th>
                  <th className="text-center px-6 py-4">Disponible</th>
                  <th className="text-center px-6 py-4">Estado Stock</th>
                  <th className="text-center px-6 py-4">Características</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {existenciasFiltradas.map(p => {
                  const esBajoStock = p.stockCalculado <= (p.stockMinimo || 0)
                  const esPuntoReorden = p.stockCalculado <= (p.puntoReorden || 0) && p.stockCalculado > (p.stockMinimo || 0)
                  
                  let stockColor = "text-green-700 bg-green-50 border-green-200"
                  let stockLabel = "Óptimo"
                  
                  if (p.stockCalculado <= 0) {
                    stockColor = "text-red-700 bg-red-50 border-red-200"
                    stockLabel = "Sin Stock"
                  } else if (esBajoStock) {
                    stockColor = "text-red-700 bg-red-50 border-red-200"
                    stockLabel = "Crítico"
                  } else if (esPuntoReorden) {
                    stockColor = "text-amber-700 bg-amber-50 border-amber-200"
                    stockLabel = "Reordenar"
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            <Package size={14} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{p.nombre}</p>
                            <p className="text-[10px] font-mono text-slate-400">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-slate-500 font-medium">{p.categoria?.nombre ?? '—'}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-700">{fmtMoneda(Number(p.costoPromedio))}</td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-800">{fmtMoneda(Number(p.precioBase))}</td>
                      <td className="px-6 py-4 text-center font-extrabold text-slate-800">{p.stockCalculado}</td>
                      <td className="px-6 py-4 text-center font-medium text-slate-500">{p.reservadoCalculado}</td>
                      <td className="px-6 py-4 text-center font-black text-indigo-600">{p.disponibleCalculado}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center font-bold px-2.5 py-0.5 rounded-full border text-[10px] ${stockColor}`}>
                          {stockLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {p.manejaLotes && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 font-semibold px-2 py-0.5 rounded text-[9px] uppercase">
                              Lotes
                            </span>
                          )}
                          {p.manejaSerial && (
                            <span className="bg-purple-50 text-purple-700 border border-purple-100 font-semibold px-2 py-0.5 rounded text-[9px] uppercase">
                              Seriales
                            </span>
                          )}
                          {!p.manejaLotes && !p.manejaSerial && (
                            <span className="text-slate-300 font-medium">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
