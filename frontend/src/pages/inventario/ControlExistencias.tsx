import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getProductos, getBodegas, getOrdenesCompra, getKardex,
  acomodarProducto, postAjusteManualKardex, postTraslado 
} from '../../services/inventario.service'
import { getEmpresaConfig, getDocumentosConfig } from '../../services/configuracion.service'
import { 
  Search, Package, Warehouse, AlertTriangle, ArrowRight, 
  Layers, Hash, SlidersHorizontal, Plus, ArrowRightLeft,
  Lock, Eye, EyeOff, X, Check, History, MapPin, AlertCircle,
  FileSpreadsheet, ArrowDownLeft, ArrowUpRight, Printer, FileText
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { getApiError } from '../../services/api'

export function ControlExistencias() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<string>('todas')
  const [modalPlanilla, setModalPlanilla] = useState(false)
  const [mostrarStockSistema, setMostrarStockSistema] = useState(true)
  const [soloConStock, setSoloConStock] = useState(false)

  // Modals state
  const [modalAcomodar, setModalAcomodar] = useState<{
    abierto: boolean
    producto: any | null
    bodegaOrigenId: string
    bodegaDestinoId: string
    documentoId: string
    cantidad: string
    ubicacion1: string
    ubicacion2: string
    notas: string
  }>({
    abierto: false,
    producto: null,
    bodegaOrigenId: '',
    bodegaDestinoId: '',
    documentoId: '',
    cantidad: '',
    ubicacion1: '',
    ubicacion2: '',
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

  const { data: empresa } = useQuery({
    queryKey: ['empresa-info-conteo'],
    queryFn: getEmpresaConfig
  })

  const { data: documentosConfig = [] } = useQuery({
    queryKey: ['documentos-config-existencias'],
    queryFn: getDocumentosConfig,
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
    mutationFn: async (payload: any) => {
      // 1. Ejecutar traslado oficial
      const resTraslado = await postTraslado({
        productoId: payload.productoId,
        bodegaOrigenId: payload.bodegaOrigenId,
        bodegaDestinoId: payload.bodegaDestinoId,
        cantidad: payload.cantidad,
        documentoId: payload.documentoId,
        notas: payload.notas,
      })

      // 2. Si se asignaron ubicaciones físicas en destino, guardarlas en el producto
      if (payload.ubicacion1 || payload.ubicacion2) {
        await acomodarProducto({
          productoId: payload.productoId,
          bodegaId: payload.bodegaDestinoId,
          ubicacion1: payload.ubicacion1 || undefined,
          ubicacion2: payload.ubicacion2 || undefined,
        })
      }

      return resTraslado
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos-existencias'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['kardex-movimientos'] })
      qc.invalidateQueries({ queryKey: ['inv-kpis'] })
      toast.success('Traslado de inventario y acomodo registrado exitosamente con documento TI')
      setModalAcomodar(prev => ({ ...prev, abierto: false, producto: null }))
    },
    onError: (err: any) => {
      toast.error(getApiError(err, 'Error al procesar el traslado entre bodegas'))
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

  const bodegaSeleccionadaObj = bodegas.find((b: any) => String(b.id) === bodegaSeleccionada)

  const productosPlanilla = existenciasFiltradas.filter((p: any) => {
    if (soloConStock && Number(p.stockCalculado || 0) <= 0) return false
    return true
  })

  const fmtMoneda = (n: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  }

  // Handlers para abrir modales
  const handleOpenAcomodar = (prod: any) => {
    // 1. Identificar bodegas donde este producto tenga stock > 0
    const stockPositivo = prod.stock?.find((s: any) => Number(s.cantidad || 0) > 0)
    
    let defaultOrigen = ''
    if (bodegaSeleccionada !== 'todas') {
      defaultOrigen = bodegaSeleccionada
    } else if (stockPositivo) {
      defaultOrigen = String(stockPositivo.bodegaId)
    } else if (bodegas.length > 0) {
      defaultOrigen = String(bodegas[0].id)
    }

    // 2. Bodega destino distinta a origen
    const defaultDestino = bodegas.find((b: any) => String(b.id) !== String(defaultOrigen))
    const defaultDestinoId = defaultDestino ? String(defaultDestino.id) : ''

    // 3. Documento TI por defecto
    const origenObj = bodegas.find((b: any) => String(b.id) === String(defaultOrigen))
    const docsTI = documentosConfig.filter((d: any) => {
      if (d.tipoOperacion !== 'INVENTARIO' || d.estado !== 'ACTIVO') return false
      if (d.sigla !== 'TI' && d.prefijo !== 'TI' && !d.nombre?.toLowerCase().includes('traslado')) return false
      if (d.sucursalId && origenObj) {
        return Number(d.sucursalId) === Number(origenObj.sucursalId)
      }
      return true
    })
    const defaultDocId = docsTI.length > 0 ? String(docsTI[0].id) : ''

    setModalAcomodar({
      abierto: true,
      producto: prod,
      bodegaOrigenId: defaultOrigen,
      bodegaDestinoId: defaultDestinoId,
      documentoId: defaultDocId,
      cantidad: '',
      ubicacion1: prod.ubicacion1 || '',
      ubicacion2: prod.ubicacion2 || '',
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

  // Submit Acomodo / Traslado
  const handleSubmitAcomodar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalAcomodar.bodegaOrigenId) {
      toast.error('Debe seleccionar la bodega de origen')
      return
    }
    if (!modalAcomodar.bodegaDestinoId) {
      toast.error('Debe seleccionar la bodega de destino')
      return
    }
    if (modalAcomodar.bodegaOrigenId === modalAcomodar.bodegaDestinoId) {
      toast.error('La bodega de origen y destino deben ser diferentes')
      return
    }
    if (!modalAcomodar.documentoId) {
      toast.error('Debe seleccionar obligatoriamente el documento TI para garantizar la trazabilidad')
      return
    }
    const cantNum = parseFloat(modalAcomodar.cantidad)
    if (isNaN(cantNum) || cantNum <= 0) {
      toast.error('Ingrese una cantidad válida a trasladar mayor a 0')
      return
    }

    // Validar existencias en origen
    const stockOrigenActual = modalAcomodar.producto?.stock?.find(
      (s: any) => String(s.bodegaId) === String(modalAcomodar.bodegaOrigenId)
    )
    const cantOrigen = stockOrigenActual ? parseFloat(stockOrigenActual.cantidad?.toString() || '0') : 0
    const cantReservada = stockOrigenActual ? parseFloat(stockOrigenActual.cantidadReservada?.toString() || '0') : 0
    const disponibleOrigen = Math.max(0, cantOrigen - cantReservada)

    if (cantNum > disponibleOrigen) {
      toast.error(`No puedes trasladar ${cantNum} unidades. El saldo disponible en la bodega origen es de ${disponibleOrigen} unidades.`)
      return
    }

    mutAcomodar.mutate({
      productoId: modalAcomodar.producto.id,
      bodegaOrigenId: Number(modalAcomodar.bodegaOrigenId),
      bodegaDestinoId: Number(modalAcomodar.bodegaDestinoId),
      cantidad: cantNum,
      documentoId: Number(modalAcomodar.documentoId),
      ubicacion1: modalAcomodar.ubicacion1.trim() || undefined,
      ubicacion2: modalAcomodar.ubicacion2.trim() || undefined,
      notas: modalAcomodar.notas.trim() || 'Acomodo / Traslado entre bodegas',
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
          <button
            onClick={() => setModalPlanilla(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Generar e imprimir planilla para toma física de inventario"
          >
            <Printer size={15} className="text-indigo-600" /> Planilla Conteo Físico (PDF)
          </button>
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
                          {/* Acomodar / Trasladar en Bodega */}
                          <button
                            onClick={() => handleOpenAcomodar(p)}
                            title="Acomodar / Trasladar producto entre bodegas"
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
      {/* MODAL 1: Acomodar / Trasladar Producto en Bodega                           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {modalAcomodar.abierto && modalAcomodar.producto && (() => {
        // Calcular existencias en bodega origen seleccionada
        const stockOrigenActual = modalAcomodar.producto?.stock?.find(
          (s: any) => String(s.bodegaId) === String(modalAcomodar.bodegaOrigenId)
        )
        const cantOrigen = stockOrigenActual ? parseFloat(stockOrigenActual.cantidad?.toString() || '0') : 0
        const cantReservada = stockOrigenActual ? parseFloat(stockOrigenActual.cantidadReservada?.toString() || '0') : 0
        const disponibleOrigen = Math.max(0, cantOrigen - cantReservada)

        const origenObj = bodegas.find((b: any) => String(b.id) === String(modalAcomodar.bodegaOrigenId))
        const docsTI = documentosConfig.filter((d: any) => {
          if (d.tipoOperacion !== 'INVENTARIO' || d.estado !== 'ACTIVO') return false
          if (d.sigla !== 'TI' && d.prefijo !== 'TI' && !d.nombre?.toLowerCase().includes('traslado')) return false
          if (d.sucursalId && origenObj) {
            return Number(d.sucursalId) === Number(origenObj.sucursalId)
          }
          return true
        })

        const cantExcedida = modalAcomodar.cantidad !== '' && parseFloat(modalAcomodar.cantidad) > disponibleOrigen

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                    <ArrowRightLeft size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Acomodar / Trasladar entre Bodegas</h3>
                    <p className="text-[11px] text-slate-400">Traslado de existencias con documento TI y asignación de ubicación</p>
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

                {/* Bodega de Origen */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Bodega de Origen *
                  </label>
                  <select
                    value={modalAcomodar.bodegaOrigenId}
                    onChange={e => {
                      const newOrigen = e.target.value
                      setModalAcomodar(prev => {
                        let newDestino = prev.bodegaDestinoId
                        if (newDestino === newOrigen) {
                          const altDestino = bodegas.find((b: any) => String(b.id) !== newOrigen)
                          newDestino = altDestino ? String(altDestino.id) : ''
                        }
                        return {
                          ...prev,
                          bodegaOrigenId: newOrigen,
                          bodegaDestinoId: newDestino,
                        }
                      })
                    }}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Seleccione bodega origen...</option>
                    {bodegas.filter((b: any) => b.activo).map((b: any) => {
                      const st = modalAcomodar.producto.stock?.find((s: any) => s.bodegaId === b.id)
                      const stCant = st ? Number(st.cantidad || 0) : 0
                      return (
                        <option key={b.id} value={b.id}>
                          {b.nombre} ({b.codigo}) — Stock: {stCant} un. {b.esPrincipal ? '★' : ''}
                        </option>
                      )
                    })}
                  </select>

                  {/* Feedback de existencias en origen */}
                  <div className="mt-1.5 flex items-center justify-between">
                    {modalAcomodar.bodegaOrigenId ? (
                      disponibleOrigen > 0 ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                          <Check size={11} /> Stock disponible en origen: {disponibleOrigen} unidades
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                          <AlertTriangle size={11} /> Sin stock disponible en origen (0 un.)
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400">Selecciona el origen para validar existencias</span>
                    )}
                  </div>
                </div>

                {/* Bodega de Destino (No muestra la bodega origen seleccionada) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Bodega de Destino *
                  </label>
                  <select
                    value={modalAcomodar.bodegaDestinoId}
                    onChange={e => setModalAcomodar(prev => ({ ...prev, bodegaDestinoId: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Seleccione bodega destino...</option>
                    {bodegas
                      .filter((b: any) => b.activo && String(b.id) !== String(modalAcomodar.bodegaOrigenId))
                      .map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre} ({b.codigo}) {b.esPrincipal ? '★ Principal' : ''}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Documento TI Obligatorio */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Documento de Traslado (TI) *
                  </label>
                  <select
                    value={modalAcomodar.documentoId}
                    onChange={e => setModalAcomodar(prev => ({ ...prev, documentoId: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Seleccione documento TI...</option>
                    {docsTI.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.nombre} ({d.prefijo}) — Consecutivo: #{d.consecutivoSiguiente}
                      </option>
                    ))}
                  </select>
                  {docsTI.length === 0 ? (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">
                      ⚠️ No se encontró documento TI activo. Configura uno en Configuración &gt; Documentos (Tipo: Inventario, Sigla: TI).
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Obligatorio: todo movimiento de bodega a bodega queda respaldado bajo un documento TI.
                    </p>
                  )}
                </div>

                {/* Cantidad a Trasladar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Cantidad a Trasladar *
                    </label>
                    {disponibleOrigen > 0 && (
                      <button
                        type="button"
                        onClick={() => setModalAcomodar(prev => ({ ...prev, cantidad: String(disponibleOrigen) }))}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Trasladar todo el stock ({disponibleOrigen})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    max={disponibleOrigen}
                    value={modalAcomodar.cantidad}
                    onChange={e => setModalAcomodar(prev => ({ ...prev, cantidad: e.target.value }))}
                    placeholder={`Máximo disponible: ${disponibleOrigen}`}
                    required
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                      cantExcedida 
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                        : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  {cantExcedida && (
                    <p className="text-[10px] text-red-600 font-bold mt-1">
                      No puedes trasladar más de {disponibleOrigen} unidades que hay en la bodega origen.
                    </p>
                  )}
                </div>

                {/* Ubicaciones físicas en destino */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Pasillo / Estante en Destino (Opcional)
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
                      Nivel / Gaveta en Destino (Opcional)
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

                {/* Notas */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Notas u Observaciones del Traslado
                  </label>
                  <input
                    type="text"
                    value={modalAcomodar.notas}
                    onChange={e => setModalAcomodar(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Motivo del traslado o acomodo..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalAcomodar(prev => ({ ...prev, abierto: false }))}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={mutAcomodar.isPending || disponibleOrigen <= 0 || cantExcedida || !modalAcomodar.documentoId}
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 disabled:opacity-40 shadow-sm shadow-indigo-600/10 cursor-pointer"
                  >
                    <Check size={14} />
                    {mutAcomodar.isPending ? 'Procesando...' : 'Confirmar Traslado (TI)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

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

      {/* MODAL PLANILLA DE CONTEO FÍSICO */}
      {modalPlanilla && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-start p-4 md:p-6 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible">
          {/* Barra de Controles Superior (Oculta al imprimir) */}
          <div className="sticky top-0 z-10 w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-xl px-6 py-4 mb-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm">
                <FileText size={18} />
                <h3>Planilla de Conteo Físico de Inventario</h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {bodegaSeleccionadaObj 
                  ? `Bodega: ${bodegaSeleccionadaObj.nombre} (${bodegaSeleccionadaObj.codigo}) — ${productosPlanilla.length} referencias a contar`
                  : `Todas las Bodegas (Consolidado) — ${productosPlanilla.length} referencias a contar`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Opciones */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mostrarStockSistema}
                    onChange={e => setMostrarStockSistema(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                  <span>Mostrar Stock Sistema</span>
                </label>
                <span className="text-slate-300">|</span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={soloConStock}
                    onChange={e => setSoloConStock(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                  <span>Ocultar saldo 0</span>
                </label>
              </div>

              {/* Botón Imprimir / PDF */}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
              >
                <Printer size={15} /> Imprimir / Guardar en PDF
              </button>

              {/* Botón Cerrar */}
              <button
                onClick={() => setModalPlanilla(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Cerrar vista previa"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* DOCUMENTO IMPRIMIBLE (Hoja de Conteo) */}
          <div
            id="printable-conteo"
            className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-slate-200 print:border-none print:shadow-none print:p-0 print:w-full print:max-w-none text-slate-900 select-text"
          >
            {/* Encabezado Institucional */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3.5">
                  {empresa?.logo ? (
                    <img src={empresa.logo} alt="Logo" className="max-h-14 max-w-[140px] object-contain" />
                  ) : (
                    <div className="h-12 w-12 bg-slate-900 text-white flex items-center justify-center rounded-xl font-black text-lg">
                      ED
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
                      {empresa?.nombreComercial || empresa?.nombre || 'Edatia ERP'}
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold">
                      NIT: {empresa?.nit ? `${empresa.nit}${empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}` : 'Sin NIT'}
                      {empresa?.telefono ? ` · Tel: ${empresa.telefono}` : ''}
                      {empresa?.ciudad ? ` · ${empresa.ciudad}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white text-[11px] font-black uppercase px-3 py-1 rounded-md tracking-wider">
                    Planilla de Conteo Físico
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    Fecha emisión: <strong className="text-slate-800">{new Date().toLocaleDateString('es-CO')} {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</strong>
                  </p>
                </div>
              </div>

              {/* Ficha técnica del conteo */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-dashed border-slate-300 text-xs bg-slate-50/60 p-2.5 rounded-lg">
                <div>
                  <span className="text-slate-500 font-bold block text-[9px] uppercase tracking-wider">Almacén / Bodega</span>
                  <span className="font-extrabold text-slate-900 text-[11px]">
                    {bodegaSeleccionadaObj 
                      ? `${bodegaSeleccionadaObj.nombre} (${bodegaSeleccionadaObj.codigo})` 
                      : 'Todas las Bodegas (Consolidado)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[9px] uppercase tracking-wider">Sucursal Asociada</span>
                  <span className="font-extrabold text-slate-900 text-[11px]">
                    {bodegaSeleccionadaObj?.sucursal?.nombre || 'General / Todas'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[9px] uppercase tracking-wider">Auditor / Responsable</span>
                  <span className="text-slate-400 font-mono text-[11px]">___________________________</span>
                </div>
              </div>
            </div>

            {/* Tabla de Conteo Físico */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[9px] tracking-wider border-b border-slate-300">
                    <th className="border border-slate-300 px-2 py-2 text-center w-8">#</th>
                    <th className="border border-slate-300 px-2.5 py-2 text-left w-28">Código / SKU</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Descripción del Producto</th>
                    <th className="border border-slate-300 px-2 py-2 text-left w-24">Ubicación</th>
                    {mostrarStockSistema && (
                      <th className="border border-slate-300 px-2 py-2 text-center w-20">Stock Sist.</th>
                    )}
                    <th className="border-2 border-slate-900 bg-amber-50/70 text-slate-900 px-2 py-2 text-center w-28">
                      Conteo Físico
                    </th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-24">Diferencia (+/-)</th>
                    <th className="border border-slate-300 px-2.5 py-2 text-left w-32">Observaciones / Novedad</th>
                  </tr>
                </thead>
                <tbody>
                  {productosPlanilla.length === 0 ? (
                    <tr>
                      <td colSpan={mostrarStockSistema ? 8 : 7} className="border border-slate-300 text-center py-8 text-slate-400 font-semibold">
                        No hay productos que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    productosPlanilla.map((p: any, idx: number) => {
                      const ubicacionStr = [p.ubicacion1, p.ubicacion2].filter(Boolean).join(' - ')
                      return (
                        <tr key={p.id} className="border-b border-slate-200">
                          <td className="border border-slate-300 px-2 py-2 text-center text-slate-500 font-mono text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 px-2.5 py-2 font-mono font-bold text-slate-800 text-[10px]">
                            <span>{p.sku}</span>
                            {p.codigoBarras && (
                              <span className="block text-[8px] text-slate-400 font-normal">CB: {p.codigoBarras}</span>
                            )}
                          </td>
                          <td className="border border-slate-300 px-3 py-2">
                            <span className="font-bold text-slate-900 block leading-tight">{p.nombre}</span>
                            <span className="text-[9px] text-slate-500">{p.categoria?.nombre || 'General'}</span>
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-slate-600 text-[10px]">
                            {ubicacionStr ? (
                              <span className="font-medium text-indigo-700">📍 {ubicacionStr}</span>
                            ) : (
                              <span className="text-slate-300 font-mono">—</span>
                            )}
                          </td>
                          {mostrarStockSistema && (
                            <td className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-800">
                              {p.stockCalculado}
                            </td>
                          )}
                          <td className="border-2 border-slate-900 px-2 py-1.5 text-center bg-white">
                            {/* Cuadro en blanco amplio para escribir a lápiz/esfero */}
                            <div className="h-6 w-full"></div>
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center">
                            <div className="h-6 w-full"></div>
                          </td>
                          <td className="border border-slate-300 px-2.5 py-1.5 text-slate-400 text-[9px]">
                            <div className="h-6 w-full"></div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bloque de Observaciones y Firmas */}
            <div className="mt-6 pt-4 border-t border-slate-300 text-xs space-y-6">
              <div>
                <span className="font-bold text-slate-700 block mb-1 uppercase tracking-wider text-[9px]">
                  Observaciones Generales de la Toma Física:
                </span>
                <div className="border border-slate-300 rounded-lg p-2.5 h-14 w-full text-slate-400 text-[10px]">
                  Espacio para registrar novedades de empaques, productos dañados/averiados, productos sin etiqueta o inconsistencias de acomodo...
                </div>
              </div>

              <div className="grid grid-cols-2 gap-16 pt-8 pb-4">
                <div className="border-t-2 border-slate-900 pt-1.5 text-center">
                  <p className="font-bold text-slate-800 text-[10px] uppercase">Firma Auxiliar de Bodega / Conteo</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">C.C. _________________________________</p>
                </div>
                <div className="border-t-2 border-slate-900 pt-1.5 text-center">
                  <p className="font-bold text-slate-800 text-[10px] uppercase">Firma Administrador / Auditor</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">C.C. _________________________________</p>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 pt-3 border-t border-slate-200 flex justify-between items-center">
                <span>Edatia ERP — Módulo de Control de Existencias</span>
                <span>Documento oficial de auditoría de inventario físico</span>
              </div>
            </div>
          </div>

          {/* CSS de Impresión */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-conteo, #printable-conteo * {
                visibility: visible !important;
              }
              #printable-conteo {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 6mm !important;
                background: white !important;
              }
              thead {
                display: table-header-group !important;
              }
              tr {
                page-break-inside: avoid !important;
              }
              @page {
                size: portrait;
                margin: 8mm;
              }
            }
          `}</style>
        </div>
      )}

    </div>
  )
}
