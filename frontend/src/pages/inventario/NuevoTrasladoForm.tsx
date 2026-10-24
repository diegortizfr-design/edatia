import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBodegas, buscarProductos, postTraslado, getProducto } from '../../services/inventario.service'
import { getDocumentosConfig, getSucursales } from '../../services/configuracion.service'
import { getApiError } from '../../services/api'
import { 
  ArrowLeft, Save, Search, ArrowRightLeft, Building2, Truck, 
  Check, AlertTriangle, X, CheckCircle2, Lock
} from 'lucide-react'
import toast from 'react-hot-toast'

export function NuevoTrasladoForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramOrigenId = searchParams.get('origenId') || ''
  const paramProductoId = searchParams.get('productoId') || ''

  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  // Modalidad de traslado: Entre bodegas de una misma sucursal vs Entre diferentes sucursales
  const [tipoTraslado, setTipoTraslado] = useState<'MISMA_SUCURSAL' | 'INTER_SUCURSAL'>('MISMA_SUCURSAL')

  // Sucursales
  const [sucursalMismaId, setSucursalMismaId] = useState('')
  const [sucursalOrigenId, setSucursalOrigenId] = useState('')
  const [sucursalDestinoId, setSucursalDestinoId] = useState('')

  // Form states
  const [bodegaOrigenId, setBodegaOrigenId] = useState('')
  const [bodegaDestinoId, setBodegaDestinoId] = useState('')
  const [documentoId, setDocumentoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [observacion, setObservacion] = useState('')
  const [loteNumero, setLoteNumero] = useState('')
  const [seriales, setSeriales] = useState('')

  // Product search states
  const [busqueda, setBusqueda] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState<any | null>(null)

  // Queries
  const { data: sucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: getSucursales,
  })

  const { data: bodegas = [] } = useQuery({
    queryKey: ['bodegas-traslados'],
    queryFn: getBodegas,
  })

  const { data: documentosConfig = [] } = useQuery({
    queryKey: ['documentos-config-traslados'],
    queryFn: getDocumentosConfig,
  })

  const { data: queryProducto } = useQuery({
    queryKey: ['producto-traslado-pre', paramProductoId],
    queryFn: () => getProducto(Number(paramProductoId)),
    enabled: !!paramProductoId,
  })

  useEffect(() => {
    if (queryProducto) {
      setProductoSeleccionado(queryProducto)
    }
  }, [queryProducto])

  // Auto-seleccionar sucursales si solo hay una activa
  useEffect(() => {
    const activas = sucursales.filter((s: any) => s.activo)
    if (activas.length === 1 && !sucursalMismaId) {
      setSucursalMismaId(String(activas[0].id))
    }
    if (activas.length >= 2 && !sucursalOrigenId && !sucursalDestinoId) {
      setSucursalOrigenId(String(activas[0].id))
      setSucursalDestinoId(String(activas[1].id))
    }
  }, [sucursales, sucursalMismaId, sucursalOrigenId, sucursalDestinoId])

  // Soporte para query params (origenId)
  useEffect(() => {
    if (paramOrigenId && bodegas.length > 0) {
      const b = bodegas.find((item: any) => String(item.id) === String(paramOrigenId))
      if (b) {
        setBodegaOrigenId(String(b.id))
        if (b.sucursalId) {
          setSucursalMismaId(String(b.sucursalId))
          setSucursalOrigenId(String(b.sucursalId))
        }
      }
    }
  }, [paramOrigenId, bodegas])

  // Bodegas de origen disponibles según la modalidad
  const bodegasOrigenDisponibles = bodegas.filter((b: any) => {
    if (!b.activo) return false
    if (tipoTraslado === 'MISMA_SUCURSAL') {
      return !sucursalMismaId || Number(b.sucursalId) === Number(sucursalMismaId)
    } else {
      return !sucursalOrigenId || Number(b.sucursalId) === Number(sucursalOrigenId)
    }
  })

  // Bodegas de destino disponibles según la modalidad
  const bodegasDestinoDisponibles = bodegas.filter((b: any) => {
    if (!b.activo) return false
    if (String(b.id) === String(bodegaOrigenId)) return false
    if (tipoTraslado === 'MISMA_SUCURSAL') {
      return !sucursalMismaId || Number(b.sucursalId) === Number(sucursalMismaId)
    } else {
      return !sucursalDestinoId || Number(b.sucursalId) === Number(sucursalDestinoId)
    }
  })

  // Búsqueda de productos en la bodega origen
  const { data: sugerencias = [], isFetching: buscando } = useQuery({
    queryKey: ['buscar-prod-traslado', busqueda, bodegaOrigenId],
    queryFn: () => buscarProductos(busqueda, Number(bodegaOrigenId)),
    enabled: !!bodegaOrigenId,
  })

  // Filtrar sugerencias para asegurar stock positivo en la bodega seleccionada
  const sugerenciasConStock = sugerencias.filter((p: any) => {
    const st = p.stock?.find((s: any) => String(s.bodegaId) === String(bodegaOrigenId))
    return st && Number(st.cantidad || 0) > 0
  })

  const bodegaOrigenObj = bodegas.find((b: any) => String(b.id) === String(bodegaOrigenId))
  const bodegaDestinoObj = bodegas.find((b: any) => String(b.id) === String(bodegaDestinoId))
  const sameSucursal = !!(bodegaOrigenObj && bodegaDestinoObj && bodegaOrigenObj.sucursalId === bodegaDestinoObj.sucursalId)

  // Documentos TI válidos
  const sucursalOrigenActualId = bodegaOrigenObj?.sucursalId || (tipoTraslado === 'MISMA_SUCURSAL' ? sucursalMismaId : sucursalOrigenId)

  const filteredDocs = documentosConfig.filter((d: any) => {
    if (d.tipoOperacion !== 'INVENTARIO' || d.estado !== 'ACTIVO') return false
    if (d.sigla !== 'TI' && d.prefijo !== 'TI' && !d.nombre?.toLowerCase().includes('traslado')) return false
    if (d.sucursalId && sucursalOrigenActualId) {
      return Number(d.sucursalId) === Number(sucursalOrigenActualId)
    }
    return true
  })

  // Auto-seleccionar primer documento TI si no hay uno seleccionado
  useEffect(() => {
    if (!documentoId && filteredDocs.length > 0) {
      setDocumentoId(String(filteredDocs[0].id))
    }
  }, [filteredDocs, documentoId])

  // Calcular stock disponible en origen del producto seleccionado
  const stockOrigenItem = productoSeleccionado?.stock?.find(
    (s: any) => String(s.bodegaId) === String(bodegaOrigenId)
  )
  const disponibleOrigen = stockOrigenItem ? Number(stockOrigenItem.cantidad || 0) : 0
  const cantExcedida = cantidad !== '' && parseFloat(cantidad) > disponibleOrigen

  const fmtMoneda = (n: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  }

  const mutation = useMutation({
    mutationFn: postTraslado,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos-existencias'] })
      qc.invalidateQueries({ queryKey: ['kardex-movimientos'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['inv-kpis'] })
      toast.success(
        sameSucursal 
          ? 'Traslado interno completado y verificado inmediatamente' 
          : 'Traslado en tránsito registrado correctamente bajo documento TI'
      )
      navigate('/inventario/movimientos')
    },
    onError: (err: any) => {
      setError(getApiError(err, 'Error al registrar el traslado de inventario'))
    }
  })

  const handleSelectProducto = (p: any) => {
    setProductoSeleccionado(p)
    setBusqueda('')
  }

  // Si cambia la bodega origen, verificar si el producto aún tiene stock
  const handleCambioBodegaOrigen = (newBodegaId: string) => {
    setBodegaOrigenId(newBodegaId)
    setDocumentoId('')
    if (productoSeleccionado) {
      const st = productoSeleccionado.stock?.find((s: any) => String(s.bodegaId) === String(newBodegaId))
      const cant = st ? Number(st.cantidad || 0) : 0
      if (cant <= 0) {
        setProductoSeleccionado(null)
        setCantidad('')
        toast('El producto previamente seleccionado no tiene stock en la nueva bodega origen elegida.', { icon: 'ℹ️' })
      } else if (cantidad !== '' && parseFloat(cantidad) > cant) {
        setCantidad(String(cant))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (tipoTraslado === 'MISMA_SUCURSAL' && !sucursalMismaId) {
      return setError('Seleccione la sucursal del traslado interno.')
    }
    if (tipoTraslado === 'INTER_SUCURSAL') {
      if (!sucursalOrigenId) return setError('Seleccione la sucursal de origen.')
      if (!sucursalDestinoId) return setError('Seleccione la sucursal de destino.')
      if (sucursalOrigenId === sucursalDestinoId) {
        return setError('Para traslados entre sucursales, la sucursal de origen y destino deben ser diferentes.')
      }
    }

    if (!bodegaOrigenId) return setError('Seleccione una bodega de origen.')
    if (!bodegaDestinoId) return setError('Seleccione una bodega de destino.')
    if (bodegaOrigenId === bodegaDestinoId) {
      return setError('La bodega de origen y destino deben ser diferentes.')
    }
    if (!documentoId) {
      return setError('Seleccione un documento TI obligatorio para el traslado.')
    }
    if (!productoSeleccionado) {
      return setError('Seleccione un producto a trasladar.')
    }
    const cantNum = parseFloat(cantidad)
    if (!cantidad || isNaN(cantNum) || cantNum <= 0) {
      return setError('Ingrese una cantidad válida mayor a 0.')
    }
    if (cantNum > disponibleOrigen) {
      return setError(`No puedes trasladar más de ${disponibleOrigen} unidades que hay en la bodega origen.`)
    }

    // Validate serials if required
    let parsedSeriales: string[] | undefined = undefined
    if (productoSeleccionado.manejaSerial) {
      parsedSeriales = seriales.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      if (parsedSeriales.length !== Math.ceil(cantNum)) {
        return setError(`La cantidad de seriales (${parsedSeriales.length}) no coincide con la cantidad a trasladar (${Math.ceil(cantNum)})`)
      }
    }
    if (productoSeleccionado.manejaLotes && !loteNumero) {
      return setError('El número de lote es obligatorio para este producto.')
    }

    mutation.mutate({
      productoId: productoSeleccionado.id,
      bodegaOrigenId: Number(bodegaOrigenId),
      bodegaDestinoId: Number(bodegaDestinoId),
      cantidad: cantNum,
      notas: observacion.trim(),
      loteNumero: loteNumero || undefined,
      seriales: parsedSeriales,
      documentoId: Number(documentoId),
    })
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-indigo-600" />
            Registrar Traslado de Inventario (TI)
          </h1>
          <p className="text-xs text-slate-400">
            Genera un documento de traslado TI para mover existencias con trazabilidad y control de existencias.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Contenedor Principal */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          
          {/* 1. Selector de Modalidad (Check / Radio Cards) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Tipo de Traslado *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTipoTraslado('MISMA_SUCURSAL')
                  setBodegaDestinoId('')
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  tipoTraslado === 'MISMA_SUCURSAL'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${tipoTraslado === 'MISMA_SUCURSAL' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' : 'bg-slate-200 text-slate-600'}`}>
                  <Building2 size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-800">Entre bodegas de una sucursal</span>
                    {tipoTraslado === 'MISMA_SUCURSAL' && (
                      <span className="bg-indigo-100 text-indigo-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Seleccionado</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Movimiento interno entre bodegas o áreas de la misma sede/sucursal.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoTraslado('INTER_SUCURSAL')
                  setBodegaDestinoId('')
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  tipoTraslado === 'INTER_SUCURSAL'
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${tipoTraslado === 'INTER_SUCURSAL' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' : 'bg-slate-200 text-slate-600'}`}>
                  <Truck size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-800">Entre sucursales diferentes</span>
                    {tipoTraslado === 'INTER_SUCURSAL' && (
                      <span className="bg-indigo-100 text-indigo-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Seleccionado</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Envío de mercancía en tránsito entre diferentes sedes o ciudades.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">
              {tipoTraslado === 'MISMA_SUCURSAL' ? 'Configuración de Origen y Destino (Misma Sucursal)' : 'Configuración de Origen y Destino (Inter-Sucursales)'}
            </h2>

            {/* CASO A: MISMA SUCURSAL */}
            {tipoTraslado === 'MISMA_SUCURSAL' && (
              <div className="space-y-4">
                {/* Selector de la Sucursal */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Sucursal donde se realizará el traslado *
                  </label>
                  <select
                    value={sucursalMismaId}
                    onChange={e => {
                      setSucursalMismaId(e.target.value)
                      setBodegaOrigenId('')
                      setBodegaDestinoId('')
                      setProductoSeleccionado(null)
                      setCantidad('')
                      setDocumentoId('')
                    }}
                    required
                    className={inputCls}
                  >
                    <option value="">— Seleccionar sucursal —</option>
                    {sucursales.filter((s: any) => s.activo).map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({s.codigo}) {s.esCasaMatriz ? '★ Sede Principal' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bodega Origen */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Bodega Origen *
                    </label>
                    <select
                      value={bodegaOrigenId}
                      onChange={e => handleCambioBodegaOrigen(e.target.value)}
                      required
                      disabled={!sucursalMismaId}
                      className={inputCls}
                    >
                      <option value="">— Seleccionar bodega origen —</option>
                      {bodegasOrigenDisponibles.map(b => {
                        const cnt = b._count?.stock ?? ''
                        return (
                          <option key={b.id} value={b.id}>
                            {b.nombre} ({b.codigo}) {b.esPrincipal ? '★' : ''}
                          </option>
                        )
                      })}
                    </select>
                    {!sucursalMismaId && (
                      <p className="text-[10px] text-slate-400 mt-1">Seleccione primero la sucursal.</p>
                    )}
                  </div>

                  {/* Bodega Destino */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Bodega Destino *
                    </label>
                    <select
                      value={bodegaDestinoId}
                      onChange={e => setBodegaDestinoId(e.target.value)}
                      required
                      disabled={!bodegaOrigenId}
                      className={inputCls}
                    >
                      <option value="">— Seleccionar bodega destino —</option>
                      {bodegasDestinoDisponibles.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.nombre} ({b.codigo}) {b.esPrincipal ? '★' : ''}
                        </option>
                      ))}
                    </select>
                    {!bodegaOrigenId && (
                      <p className="text-[10px] text-slate-400 mt-1">Seleccione primero la bodega origen.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CASO B: TRASLADO ENTRE DIFERENTES SUCURSALES */}
            {tipoTraslado === 'INTER_SUCURSAL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                {/* LADO ORIGEN */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs border-b border-indigo-100 pb-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span>1. Punto de Salida (Origen)</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Sucursal de Origen *
                    </label>
                    <select
                      value={sucursalOrigenId}
                      onChange={e => {
                        const newSuc = e.target.value
                        setSucursalOrigenId(newSuc)
                        setBodegaOrigenId('')
                        setProductoSeleccionado(null)
                        setCantidad('')
                        setDocumentoId('')
                        if (sucursalDestinoId === newSuc) {
                          const altDest = sucursales.find((s: any) => s.activo && String(s.id) !== newSuc)
                          setSucursalDestinoId(altDest ? String(altDest.id) : '')
                          setBodegaDestinoId('')
                        }
                      }}
                      required
                      className={inputCls}
                    >
                      <option value="">— Seleccionar sucursal origen —</option>
                      {sucursales.filter((s: any) => s.activo).map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} ({s.codigo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Bodega de Origen *
                    </label>
                    <select
                      value={bodegaOrigenId}
                      onChange={e => handleCambioBodegaOrigen(e.target.value)}
                      required
                      disabled={!sucursalOrigenId}
                      className={inputCls}
                    >
                      <option value="">— Seleccionar bodega origen —</option>
                      {bodegasOrigenDisponibles.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.nombre} ({b.codigo}) {b.esPrincipal ? '★' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* LADO DESTINO */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs border-b border-emerald-100 pb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>2. Punto de Llegada (Destino)</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Sucursal de Destino *
                    </label>
                    <select
                      value={sucursalDestinoId}
                      onChange={e => {
                        setSucursalDestinoId(e.target.value)
                        setBodegaDestinoId('')
                      }}
                      required
                      className={inputCls}
                    >
                      <option value="">— Seleccionar sucursal destino —</option>
                      {sucursales
                        .filter((s: any) => s.activo && String(s.id) !== String(sucursalOrigenId))
                        .map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} ({s.codigo})
                          </option>
                        ))}
                    </select>
                    {sucursales.length <= 1 && (
                      <p className="text-[10px] text-amber-600 mt-1">
                        ⚠️ Solo tienes una sucursal registrada. Para traslados inter-sucursales requieres al menos 2 sucursales.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Bodega de Destino *
                    </label>
                    <select
                      value={bodegaDestinoId}
                      onChange={e => setBodegaDestinoId(e.target.value)}
                      required
                      disabled={!sucursalDestinoId}
                      className={inputCls}
                    >
                      <option value="">— Seleccionar bodega destino —</option>
                      {bodegasDestinoDisponibles.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.nombre} ({b.codigo}) {b.esPrincipal ? '★' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Documento TI Obligatorio */}
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Documento de Traslado (TI) *
              </label>
              <select
                value={documentoId}
                onChange={e => setDocumentoId(e.target.value)}
                required
                disabled={!bodegaOrigenId}
                className={inputCls}
              >
                <option value="">— Seleccionar documento TI —</option>
                {filteredDocs.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.prefijo}) — Consecutivo Siguiente: #{d.consecutivoSiguiente}
                  </option>
                ))}
              </select>
              {filteredDocs.length === 0 ? (
                <p className="text-[10px] text-amber-600 font-semibold mt-1">
                  ⚠️ No se encontró documento TI activo. Configura uno en Configuración &gt; Documentos (Tipo: Inventario, Sigla: TI).
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Obligatorio: todo movimiento de inventario queda respaldado bajo un documento TI para trazabilidad.
                </p>
              )}
            </div>
          </div>

          {/* 2. Selector y Búsqueda de Producto Filtrado por Bodega Origen */}
          <div className="border-t border-slate-100 pt-5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Producto a Trasladar (Existencias de la Bodega Origen) *
            </label>
            
            {!bodegaOrigenId ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 font-medium">
                <Lock size={18} className="mx-auto mb-1.5 text-slate-300" />
                Selecciona primero la bodega de origen para buscar y listar los productos con existencias disponibles.
              </div>
            ) : productoSeleccionado ? (
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800 truncate">{productoSeleccionado.nombre}</p>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 shrink-0">
                      SKU: {productoSeleccionado.sku}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                      <Check size={12} /> Stock disponible en origen: {disponibleOrigen} {productoSeleccionado.unidadMedida?.abreviatura || 'un.'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Costo: <strong className="text-slate-700">{fmtMoneda(Number(productoSeleccionado.costoPromedio))}</strong>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProductoSeleccionado(null)
                    setCantidad('')
                  }}
                  className="px-3 py-1.5 text-xs text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 rounded-lg font-bold transition-colors cursor-pointer shrink-0"
                >
                  Cambiar Producto
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar producto por nombre o SKU en esta bodega origen..."
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
                
                {buscando && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                    Buscando en bodega...
                  </div>
                )}

                {/* Dropdown de productos disponibles */}
                {sugerenciasConStock.length > 0 ? (
                  <div className="absolute z-20 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {sugerenciasConStock.map((p: any) => {
                      const st = p.stock?.find((s: any) => String(s.bodegaId) === String(bodegaOrigenId))
                      const cantBod = st ? Number(st.cantidad || 0) : 0

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProducto(p)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50/50 transition-colors flex items-center justify-between cursor-pointer gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{p.nombre}</p>
                            <p className="text-[10px] font-mono text-slate-400">SKU: {p.sku}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <Check size={11} /> Stock: {cantBod} {p.unidadMedida?.abreviatura || 'un.'}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {fmtMoneda(Number(p.costoPromedio))}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : busqueda.length >= 2 && !buscando ? (
                  <div className="absolute z-20 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-center text-xs text-slate-400">
                    No se encontraron productos con stock mayor a 0 en esta bodega origen para "{busqueda}".
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* 3. Cantidad a Trasladar con Validación de Stock */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Cantidad a Trasladar *
              </label>
              {disponibleOrigen > 0 && (
                <button
                  type="button"
                  onClick={() => setCantidad(String(disponibleOrigen))}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
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
              required
              disabled={!productoSeleccionado}
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              placeholder={productoSeleccionado ? `Máximo disponible: ${disponibleOrigen}` : "Seleccione producto primero"}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                cantExcedida 
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                  : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
            {cantExcedida && (
              <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                No puedes trasladar más de {disponibleOrigen} unidades que hay en la bodega origen.
              </p>
            )}
          </div>

          {/* 4. Observaciones / Justificación */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Observación / Justificación de Traslado
            </label>
            <textarea
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              placeholder="Notas u observaciones del traslado..."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
            />
          </div>

          {/* Lotes inputs if product manejaLotes */}
          {productoSeleccionado?.manejaLotes && (
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Número de Lote *</label>
              <input
                value={loteNumero}
                onChange={e => setLoteNumero(e.target.value)}
                placeholder="ej: L-9872"
                required
                className={inputCls}
              />
            </div>
          )}

          {/* Seriales textarea if product manejaSerial */}
          {productoSeleccionado?.manejaSerial && (
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Números de Serie *
              </label>
              <textarea
                value={seriales}
                onChange={e => setSeriales(e.target.value)}
                placeholder="Ingrese un número de serie por línea o separados por comas..."
                rows={3}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Deben ser exactamente {Math.ceil(parseFloat(cantidad) || 0)} seriales.
              </span>
            </div>
          )}

        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !productoSeleccionado || disponibleOrigen <= 0 || cantExcedida || !documentoId}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 disabled:opacity-40 transition-all shadow-sm shadow-indigo-600/10 cursor-pointer"
          >
            <Save size={14} /> 
            {mutation.isPending ? 'Procesando...' : 'Registrar Traslado (TI)'}
          </button>
        </div>

      </form>
    </div>
  )
}
