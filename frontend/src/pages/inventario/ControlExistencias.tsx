import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getProductos, getBodegas, getOrdenesCompra, getKardex,
  acomodarProducto, postAjusteManualKardex 
} from '../../services/inventario.service'
import { 
  Search, Package, Warehouse, AlertTriangle, ArrowRight, 
  Layers, Hash, SlidersHorizontal, Plus, ArrowRightLeft,
  Lock, Eye, EyeOff, X, Check, History, MapPin, AlertCircle,
  FileSpreadsheet, ArrowDownLeft, ArrowUpRight
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { getApiError } from '../../services/api'

export function ControlExistencias() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<string>('todas')

  // Modals state
  const [modalAcomodar, setModalAcomodar] = useState<{
    abierto: boolean
    producto: any | null
    bodegaId: string
    ubicacion1: string
    ubicacion2: string
    cantidadInicial: string
    notas: string
  }>({
    abierto: false,
    producto: null,
    bodegaId: '',
    ubicacion1: '',
    ubicacion2: '',
    cantidadInicial: '',
    notas: '',
  })

  const [modalKardex, setModalKardex] = useState<{
    abierto: boolean
    producto: any | null
    bodegaId: string
    nuevoStock: string
    motivo: string
    codigoAutorizacion: string
    mostrarPass: boolean
  }>({
    abierto: false,
    producto: null,
    bodegaId: '',
    nuevoStock: '',
    motivo: '',
    codigoAutorizacion: '',
    mostrarPass: false,
  })

  const [modalHistorial, setModalHistorial] = useState<{
    abierto: boolean
    producto: any | null
    bodegaId: string
  }>({
    abierto: false,
    producto: null,
    bodegaId: 'todas',
  })

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

  // Query for historical kardex when viewer modal is open
  const { data: kardexHistorial = [], isLoading: cargandoKardex } = useQuery({
    queryKey: ['kardex-historial-modal', modalHistorial.producto?.id, modalHistorial.bodegaId],
    queryFn: () => getKardex(
      modalHistorial.producto.id,
      modalHistorial.bodegaId !== 'todas' ? Number(modalHistorial.bodegaId) : undefined
    ),
    enabled: modalHistorial.abierto && !!modalHistorial.producto,
  })

  // Mutations
  const mutAcomodar = useMutation({
    mutationFn: (dto: any) => acomodarProducto(dto),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['productos-existencias'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['kardex-movimientos'] })
      toast.success(res?.mensaje || 'Producto acomodado exitosamente en bodega')
      setModalAcomodar(prev => ({ ...prev, abierto: false, producto: null }))
    },
    onError: (err: any) => {
      toast.error(getApiError(err, 'Error al acomodar producto en la bodega'))
    }
  })

  const mutModificarKardex = useMutation({
    mutationFn: (dto: any) => postAjusteManualKardex(dto),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['productos-existencias'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['kardex-movimientos'] })
      toast.success(res?.mensaje || 'Kardex y saldo físico actualizados correctamente')
      setModalKardex(prev => ({ ...prev, abierto: false, producto: null }))
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) {
        toast.error('Código de autorización incorrecto. Verifique con el administrador en Configuración > Empresa.')
      } else {
        toast.error(getApiError(err, 'Error al modificar el kardex manual'))
      }
    }
  })

  // 1. Filtrar órdenes de compra pendientes
  const ocsPendientes = ocs.filter(oc => oc.estado === 'APROBADA' || oc.estado === 'ENVIADA')

  // 2. Procesar productos con stock filtrado por bodega
  const existenciasProcesadas = productos.map(p => {
    let stockTotal = 0
    let stockReservado = 0
    
    if (p.stock) {
      if (bodegaSeleccionada === 'todas') {
        stockTotal = p.stock.reduce((sum: number, s: any) => sum + Number(s.cantidad || 0), 0)
        stockReservado = p.stock.reduce((sum: number, s: any) => sum + Number(s.cantidadReservada || 0), 0)
      } else {
        const stockBodega = p.stock.find((s: any) => String(s.bodegaId) === bodegaSeleccionada)
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

  // Handlers para abrir modales
  const handleOpenAcomodar = (prod: any) => {
    const defaultBodega = bodegaSeleccionada !== 'todas' 
      ? bodegaSeleccionada 
      : (bodegas[0] ? String(bodegas[0].id) : '')
    setModalAcomodar({
      abierto: true,
      producto: prod,
      bodegaId: defaultBodega,
      ubicacion1: prod.ubicacion1 || '',
      ubicacion2: prod.ubicacion2 || '',
      cantidadInicial: '',
      notas: '',
    })
  }

  const handleOpenModificarKardex = (prod: any) => {
    const defaultBodega = bodegaSeleccionada !== 'todas' 
      ? bodegaSeleccionada 
      : (bodegas[0] ? String(bodegas[0].id) : '')
    
    // Obtener saldo actual en esa bodega
    const stBodega = prod.stock?.find((s: any) => String(s.bodegaId) === defaultBodega)
    const saldoActual = stBodega ? Number(stBodega.cantidad || 0) : 0

    setModalKardex({
      abierto: true,
      producto: prod,
      bodegaId: defaultBodega,
      nuevoStock: String(saldoActual),
      motivo: '',
      codigoAutorizacion: '',
      mostrarPass: false,
    })
  }

  const handleOpenHistorial = (prod: any) => {
    setModalHistorial({
      abierto: true,
      producto: prod,
      bodegaId: bodegaSeleccionada,
    })
  }

  // Submit Acomodo
  const handleSubmitAcomodar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalAcomodar.bodegaId) {
      toast.error('Debe seleccionar una bodega')
      return
    }
    mutAcomodar.mutate({
      productoId: modalAcomodar.producto.id,
      bodegaId: Number(modalAcomodar.bodegaId),
      ubicacion1: modalAcomodar.ubicacion1.trim() || undefined,
      ubicacion2: modalAcomodar.ubicacion2.trim() || undefined,
      cantidadInicial: modalAcomodar.cantidadInicial ? Number(modalAcomodar.cantidadInicial) : undefined,
      notas: modalAcomodar.notas.trim() || undefined,
    })
  }

  // Submit Modificar Kardex
  const handleSubmitKardex = (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalKardex.bodegaId) {
      toast.error('Seleccione la bodega para el ajuste')
      return
    }
    if (modalKardex.nuevoStock === '' || isNaN(Number(modalKardex.nuevoStock)) || Number(modalKardex.nuevoStock) < 0) {
      toast.error('Ingrese un saldo físico válido (mayor o igual a cero)')
      return
    }
    if (!modalKardex.motivo.trim()) {
      toast.error('Ingrese la justificación del ajuste manual')
      return
    }
    if (!modalKardex.codigoAutorizacion.trim()) {
      toast.error('Debe ingresar la contraseña de autorización empresarial')
      return
    }

    mutModificarKardex.mutate({
      productoId: modalKardex.producto.id,
      bodegaId: Number(modalKardex.bodegaId),
      nuevoStock: Number(modalKardex.nuevoStock),
      motivo: modalKardex.motivo.trim(),
      codigoAutorizacion: modalKardex.codigoAutorizacion.trim(),
    })
  }

  return (
    <div className="space-y-6 relative">
      <Toaster position="top-right" />
      
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Inventario</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">Control de Existencia</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Package className="text-indigo-600" />
            Control de Existencias
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Monitoreo en tiempo real de inventarios, niveles de stock, acomodo en bodegas y ajuste protegido de Kardex.
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
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 min-w-[240px]">
          <Warehouse size={16} className="text-indigo-600 shrink-0" />
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
                  <th className="text-left px-5 py-4">Producto</th>
                  <th className="text-left px-4 py-4 hidden md:table-cell">Categoría</th>
                  <th className="text-right px-4 py-4">Costo CPP</th>
                  <th className="text-right px-4 py-4">Precio Venta</th>
                  <th className="text-center px-4 py-4">Stock Físico</th>
                  <th className="text-center px-4 py-4">Reservado</th>
                  <th className="text-center px-4 py-4">Disponible</th>
                  <th className="text-center px-4 py-4">Estado Stock</th>
                  <th className="text-center px-4 py-4 hidden lg:table-cell">Ubicación</th>
                  <th className="text-center px-5 py-4">Acciones de Existencia</th>
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

                  const ubicacionTexto = [p.ubicacion1, p.ubicacion2].filter(Boolean).join(' • ') || '—'

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            <Package size={14} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">{p.nombre}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-slate-500 font-medium">{p.categoria?.nombre ?? '—'}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-700">{fmtMoneda(Number(p.costoPromedio))}</td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-slate-800">{fmtMoneda(Number(p.precioBase))}</td>
                      <td className="px-4 py-3.5 text-center font-extrabold text-slate-800">{p.stockCalculado}</td>
                      <td className="px-4 py-3.5 text-center font-medium text-slate-500">{p.reservadoCalculado}</td>
                      <td className="px-4 py-3.5 text-center font-black text-indigo-600">{p.disponibleCalculado}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded-full border text-[10px] ${stockColor}`}>
                          {stockLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell text-slate-500 font-medium text-[11px]">
                        <span className="truncate max-w-[120px] inline-block" title={ubicacionTexto}>
                          {ubicacionTexto}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Acomodar en Bodega */}
                          <button
                            onClick={() => handleOpenAcomodar(p)}
                            title="Acomodar / Ubicar en bodega"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-all active:scale-95 border border-indigo-100"
                          >
                            <Warehouse size={12} />
                            <span>Acomodar</span>
                          </button>

                          {/* Modificar Kardex */}
                          <button
                            onClick={() => handleOpenModificarKardex(p)}
                            title="Modificar Kardex con contraseña empresarial"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold transition-all active:scale-95 border border-amber-200/60"
                          >
                            <Lock size={12} />
                            <span>Kardex</span>
                          </button>

                          {/* Ver Historial */}
                          <button
                            onClick={() => handleOpenHistorial(p)}
                            title="Ver trazabilidad y movimientos de kardex"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <History size={14} />
                          </button>
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

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Acomodar Producto en Bodega                                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {modalAcomodar.abierto && modalAcomodar.producto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Warehouse size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Acomodar Producto en Bodega</h3>
                  <p className="text-[11px] text-slate-400">Asigna ubicación física y existencias iniciales por almacén</p>
                </div>
              </div>
              <button 
                onClick={() => setModalAcomodar(prev => ({ ...prev, abierto: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAcomodar} className="p-6 space-y-4">
              {/* Info producto */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{modalAcomodar.producto.nombre}</p>
                  <p className="text-[10px] font-mono text-slate-500">SKU: {modalAcomodar.producto.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Costo Promedio</span>
                  <span className="font-bold text-indigo-700">{fmtMoneda(Number(modalAcomodar.producto.costoPromedio))}</span>
                </div>
              </div>

              {/* Selector de Bodega */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Bodega de Destino *
                </label>
                <select
                  value={modalAcomodar.bodegaId}
                  onChange={e => setModalAcomodar(prev => ({ ...prev, bodegaId: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Seleccione una bodega...</option>
                  {bodegas.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} ({b.codigo}) {b.esPrincipal ? '★ Principal' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ubicaciones físicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Pasillo / Estante (Ubicación 1)
                  </label>
                  <input
                    type="text"
                    value={modalAcomodar.ubicacion1}
                    onChange={e => setModalAcomodar(prev => ({ ...prev, ubicacion1: e.target.value }))}
                    placeholder="Ej. Pasillo 3, Estante B"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nivel / Gaveta (Ubicación 2)
                  </label>
                  <input
                    type="text"
                    value={modalAcomodar.ubicacion2}
                    onChange={e => setModalAcomodar(prev => ({ ...prev, ubicacion2: e.target.value }))}
                    placeholder="Ej. Nivel 2, Gaveta 4"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Cantidad Inicial a Ingresar */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cantidad a ingresar / acomodar (Opcional)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={modalAcomodar.cantidadInicial}
                  onChange={e => setModalAcomodar(prev => ({ ...prev, cantidadInicial: e.target.value }))}
                  placeholder="0 (dejar en blanco para solo asignar ubicación)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Si especificas una cantidad mayor a 0, se registrará el ingreso como apertura en esta bodega con el costo promedio actual.
                </p>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Notas u Observaciones
                </label>
                <input
                  type="text"
                  value={modalAcomodar.notas}
                  onChange={e => setModalAcomodar(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Detalles sobre el almacenamiento..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAcomodar(prev => ({ ...prev, abierto: false }))}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutAcomodar.isPending}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 disabled:opacity-50 shadow-sm shadow-indigo-600/10"
                >
                  <Check size={14} />
                  {mutAcomodar.isPending ? 'Guardando...' : 'Guardar Acomodo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Modificar Kardex Manual con Contraseña                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {modalKardex.abierto && modalKardex.producto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">Modificación Manual de Kardex</h3>
                  <p className="text-[11px] text-amber-700/80">Acción protegida mediante código de autorización empresarial</p>
                </div>
              </div>
              <button 
                onClick={() => setModalKardex(prev => ({ ...prev, abierto: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitKardex} className="p-6 space-y-4">
              
              {/* Info producto */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{modalKardex.producto.nombre}</p>
                  <p className="text-[10px] font-mono text-slate-500">SKU: {modalKardex.producto.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Costo Promedio</span>
                  <span className="font-bold text-slate-700">{fmtMoneda(Number(modalKardex.producto.costoPromedio))}</span>
                </div>
              </div>

              {/* Selector de Bodega */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Bodega a Ajustar *
                </label>
                <select
                  value={modalKardex.bodegaId}
                  onChange={e => {
                    const bId = e.target.value
                    const stBodega = modalKardex.producto.stock?.find((s: any) => String(s.bodegaId) === bId)
                    const saldo = stBodega ? Number(stBodega.cantidad || 0) : 0
                    setModalKardex(prev => ({ ...prev, bodegaId: bId, nuevoStock: String(saldo) }))
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Seleccione una bodega...</option>
                  {bodegas.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} ({b.codigo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Comparador de Stock Actual vs Nuevo */}
              {modalKardex.bodegaId && (() => {
                const stBodega = modalKardex.producto.stock?.find((s: any) => String(s.bodegaId) === modalKardex.bodegaId)
                const stockActual = stBodega ? Number(stBodega.cantidad || 0) : 0
                const nuevo = Number(modalKardex.nuevoStock) || 0
                const dif = nuevo - stockActual

                return (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Stock Actual</p>
                      <p className="text-base font-extrabold text-slate-700 mt-0.5">{stockActual}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Nuevo Saldo</p>
                      <p className="text-base font-extrabold text-indigo-600 mt-0.5">{nuevo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Diferencia</p>
                      <p className={`text-base font-extrabold mt-0.5 ${dif > 0 ? 'text-green-600' : dif < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {dif > 0 ? `+${dif}` : dif}
                      </p>
                    </div>
                  </div>
                )
              })()}

              {/* Nuevo Stock Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nuevo Saldo Físico Real en Bodega *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={modalKardex.nuevoStock}
                  onChange={e => setModalKardex(prev => ({ ...prev, nuevoStock: e.target.value }))}
                  placeholder="Ingrese el stock real resultante"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Justificación obligatoria */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Motivo o Justificación del Ajuste *
                </label>
                <textarea
                  rows={2}
                  required
                  value={modalKardex.motivo}
                  onChange={e => setModalKardex(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Ej. Conteo físico anual / Corrección de inventario por auditoría..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
              </div>

              {/* Contraseña empresarial */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                    Contraseña de Autorización Empresarial *
                  </label>
                  <span className="text-[10px] text-slate-400">Configurada a nivel de empresa</span>
                </div>
                <div className="relative">
                  <input
                    type={modalKardex.mostrarPass ? 'text' : 'password'}
                    required
                    value={modalKardex.codigoAutorizacion}
                    onChange={e => setModalKardex(prev => ({ ...prev, codigoAutorizacion: e.target.value }))}
                    placeholder="Clave de seguridad para modificar kardex..."
                    className="w-full pl-3.5 pr-10 py-2.5 bg-amber-50/40 border border-amber-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setModalKardex(prev => ({ ...prev, mostrarPass: !prev.mostrarPass }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {modalKardex.mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Warning note */}
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-[11px] flex gap-2 items-start">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Esta acción quedará registrada en el historial del Kardex y en la auditoría del ERP con tu usuario, fecha y justificación.
                </span>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalKardex(prev => ({ ...prev, abierto: false }))}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutModificarKardex.isPending}
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 active:scale-95 disabled:opacity-50 shadow-sm shadow-amber-600/10"
                >
                  <Lock size={14} />
                  {mutModificarKardex.isPending ? 'Validando...' : 'Autorizar y Ajustar Kardex'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: Visor Rápido de Kardex del Producto                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {modalHistorial.abierto && modalHistorial.producto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Kardex de {modalHistorial.producto.nombre}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    SKU: {modalHistorial.producto.sku} • Costo Promedio: {fmtMoneda(Number(modalHistorial.producto.costoPromedio))}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalHistorial(prev => ({ ...prev, abierto: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {cargandoKardex ? (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">Cargando movimientos de kardex...</div>
              ) : kardexHistorial.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  No hay movimientos registrados para este producto en la bodega seleccionada.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">Fecha</th>
                        <th className="text-left px-4 py-3">N° Doc</th>
                        <th className="text-center px-4 py-3">Tipo</th>
                        <th className="text-left px-4 py-3">Bodega</th>
                        <th className="text-right px-4 py-3">Cantidad</th>
                        <th className="text-right px-4 py-3">Saldo</th>
                        <th className="text-right px-4 py-3">CPP</th>
                        <th className="text-left px-4 py-3">Concepto / Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {kardexHistorial.map((m: any) => {
                        const esEntrada = Number(m.cantidad) > 0
                        const tipoColor = esEntrada ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'

                        return (
                          <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                              {new Date(m.fechaMovimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-700 text-[11px]">{m.numero}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${tipoColor}`}>
                                {m.tipo}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 text-[11px]">
                              {m.bodegaDestino?.nombre || m.bodegaOrigen?.nombre || 'General'}
                            </td>
                            <td className={`px-4 py-2.5 text-right font-extrabold ${esEntrada ? 'text-emerald-600' : 'text-red-600'}`}>
                              {esEntrada ? `+${m.cantidad}` : m.cantidad}
                            </td>
                            <td className="px-4 py-2.5 text-right font-black text-slate-800">{m.saldoCantidad}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600 font-medium">
                              {m.saldoCpp ? fmtMoneda(Number(m.saldoCpp)) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-400 text-[10px] truncate max-w-xs" title={m.notas || m.concepto}>
                              {m.notas || m.concepto || '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setModalHistorial(prev => ({ ...prev, abierto: false }))}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
