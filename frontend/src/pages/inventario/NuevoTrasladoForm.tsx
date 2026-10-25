import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBodegas, buscarProductos, postTraslado, getProducto } from '../../services/inventario.service'
import { getDocumentosConfig, getSucursales } from '../../services/configuracion.service'
import { getApiError } from '../../services/api'
import { 
  ArrowLeft, Save, Search, ArrowRightLeft, Building2, Truck, 
  Check, AlertTriangle, Trash2, Plus, PackageOpen, Layers,
  Lock, AlertCircle, Warehouse, X
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ItemTraslado {
  producto: any
  cantidad: string
  disponibleOrigen: number
  loteNumero?: string
  seriales?: string
}

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
  const [observacion, setObservacion] = useState('')

  // Lista multi-producto de la remisión de traslado
  const [items, setItems] = useState<ItemTraslado[]>([])

  // Product search state
  const [busqueda, setBusqueda] = useState('')

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

  // En la base de datos, el modelo Sucursal maneja estado: 'ACTIVO' | 'INACTIVO'
  const isSucursalActiva = (s: any) => s.estado === 'ACTIVO' || s.activo === true || (!s.estado && s.activo !== false)
  const sucursalesActivas = sucursales.filter(isSucursalActiva)

  // Auto-seleccionar sucursal si hay al menos una activa y no hay seleccionada aún
  useEffect(() => {
    if (sucursalesActivas.length > 0) {
      if (!sucursalMismaId) {
        setSucursalMismaId(String(sucursalesActivas[0].id))
      }
      if (!sucursalOrigenId) {
        setSucursalOrigenId(String(sucursalesActivas[0].id))
      }
      if (sucursalesActivas.length >= 2 && !sucursalDestinoId) {
        const alt = sucursalesActivas.find((s: any) => String(s.id) !== String(sucursalesActivas[0].id))
        if (alt) setSucursalDestinoId(String(alt.id))
      }
    }
  }, [sucursalesActivas, sucursalMismaId, sucursalOrigenId, sucursalDestinoId])

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

  // Cargar producto inicial si vino por query params (ej. desde el kardex o catálogo)
  useEffect(() => {
    if (queryProducto && bodegaOrigenId && items.length === 0) {
      const stockItem = queryProducto.stock?.find((s: any) => String(s.bodegaId) === String(bodegaOrigenId))
      const disp = stockItem ? Number(stockItem.cantidad || 0) : 0
      if (disp > 0) {
        setItems([{
          producto: queryProducto,
          cantidad: '1',
          disponibleOrigen: disp,
          loteNumero: '',
          seriales: '',
        }])
      }
    }
  }, [queryProducto, bodegaOrigenId])

  // Bodegas de origen disponibles según la modalidad
  const bodegasOrigenDisponibles = bodegas.filter((b: any) => {
    if (!b.activo) return false
    if (sucursalesActivas.length === 0) return true
    if (tipoTraslado === 'MISMA_SUCURSAL') {
      return !sucursalMismaId || Number(b.sucursalId) === Number(sucursalMismaId) || !b.sucursalId
    } else {
      return !sucursalOrigenId || Number(b.sucursalId) === Number(sucursalOrigenId) || !b.sucursalId
    }
  })

  // Bodegas de destino disponibles según la modalidad
  const bodegasDestinoDisponibles = bodegas.filter((b: any) => {
    if (!b.activo) return false
    if (String(b.id) === String(bodegaOrigenId)) return false
    if (sucursalesActivas.length === 0) return true
    if (tipoTraslado === 'MISMA_SUCURSAL') {
      return !sucursalMismaId || Number(b.sucursalId) === Number(sucursalMismaId) || !b.sucursalId
    } else {
      return !sucursalDestinoId || Number(b.sucursalId) === Number(sucursalDestinoId) || !b.sucursalId
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

  const fmtMoneda = (n: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  }

  // Agregar producto a la lista del traslado
  const handleAgregarProducto = (p: any) => {
    const stockItem = p.stock?.find((s: any) => String(s.bodegaId) === String(bodegaOrigenId))
    const disponible = stockItem ? Number(stockItem.cantidad || 0) : 0

    if (disponible <= 0) {
      toast.error(`"${p.nombre}" no tiene existencias en la bodega origen.`)
      return
    }

    const idx = items.findIndex(it => it.producto.id === p.id)
    if (idx >= 0) {
      // Incrementar cantidad si hay stock disponible
      const cantActual = parseFloat(items[idx].cantidad || '0')
      if (cantActual + 1 > disponible) {
        toast.error(`No puedes agregar más de ${disponible} unidades de "${p.nombre}".`)
        return
      }
      setItems(prev => {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], cantidad: String(cantActual + 1) }
        return copy
      })
      toast.success(`Se incrementó la cantidad de "${p.nombre}"`)
    } else {
      setItems(prev => [
        ...prev,
        {
          producto: p,
          cantidad: '1',
          disponibleOrigen: disponible,
          loteNumero: '',
          seriales: '',
        }
      ])
      toast.success(`"${p.nombre}" agregado al traslado`)
    }
  }

  // Modificar cantidad de un item
  const handleUpdateCantidad = (index: number, newCant: string) => {
    setItems(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], cantidad: newCant }
      return copy
    })
  }

  // Modificar lote o notas de un item
  const handleUpdateItemField = (index: number, field: keyof ItemTraslado, value: any) => {
    setItems(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  // Eliminar un item de la lista
  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  // Si cambia la bodega origen, recalcular existencias para todos los items
  const handleCambioBodegaOrigen = (newBodegaId: string) => {
    setBodegaOrigenId(newBodegaId)
    setDocumentoId('')
    setBusqueda('')
    
    if (items.length > 0) {
      setItems(prevItems => {
        return prevItems.map(item => {
          const st = item.producto.stock?.find((s: any) => String(s.bodegaId) === String(newBodegaId))
          const disp = st ? Number(st.cantidad || 0) : 0
          return {
            ...item,
            disponibleOrigen: disp,
            cantidad: item.cantidad && parseFloat(item.cantidad) > disp ? String(disp) : item.cantidad
          }
        })
      })
      toast('Se actualizaron las existencias de los productos para la nueva bodega origen.', { icon: 'ℹ️' })
    }
  }

  // Totales de la remisión
  const totalItemsCount = items.length
  const totalUnidades = items.reduce((acc, it) => acc + (parseFloat(it.cantidad) || 0), 0)
  const totalValor = items.reduce((acc, it) => {
    const c = parseFloat(it.cantidad) || 0
    const cpp = Number(it.producto.costoPromedio || 0)
    return acc + (c * cpp)
  }, 0)

  // Validar si algún item excede el disponible
  const hayExcesoStock = items.some(it => {
    const c = parseFloat(it.cantidad)
    return isNaN(c) || c <= 0 || c > it.disponibleOrigen || it.disponibleOrigen <= 0
  })

  const mutation = useMutation({
    mutationFn: postTraslado,
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['productos-existencias'] })
      qc.invalidateQueries({ queryKey: ['kardex-movimientos'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['inv-kpis'] })
      
      const numeroDoc = res?.numero || 'TI'
      toast.success(
        sameSucursal 
          ? `Traslado interno ${numeroDoc} completado (${totalItemsCount} productos)` 
          : `Traslado ${numeroDoc} registrado en tránsito (${totalItemsCount} productos)`
      )
      navigate('/inventario/movimientos')
    },
    onError: (err: any) => {
      setError(getApiError(err, 'Error al registrar el traslado de inventario'))
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (tipoTraslado === 'MISMA_SUCURSAL' && sucursalesActivas.length > 0 && !sucursalMismaId) {
      return setError('Seleccione la sucursal del traslado interno.')
    }
    if (tipoTraslado === 'INTER_SUCURSAL') {
      if (sucursalesActivas.length < 2) {
        return setError('Se requieren al menos 2 sucursales registradas para traslados entre sucursales.')
      }
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
    if (items.length === 0) {
      return setError('Agregue al menos un producto a la lista de traslado.')
    }

    // Validar cantidades de cada producto
    for (const it of items) {
      const c = parseFloat(it.cantidad)
      if (isNaN(c) || c <= 0) {
        return setError(`Ingrese una cantidad válida mayor a 0 para "${it.producto.nombre}".`)
      }
      if (c > it.disponibleOrigen) {
        return setError(`La cantidad de "${it.producto.nombre}" (${c}) supera el stock disponible en origen (${it.disponibleOrigen}).`)
      }
      if (it.producto.manejaLotes && !it.loteNumero) {
        return setError(`El número de lote es obligatorio para "${it.producto.nombre}".`)
      }
      if (it.producto.manejaSerial && it.seriales) {
        const serialsList = it.seriales.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
        if (serialsList.length !== Math.ceil(c)) {
          return setError(`La cantidad de seriales (${serialsList.length}) no coincide con la cantidad a trasladar (${Math.ceil(c)}) para "${it.producto.nombre}".`)
        }
      }
    }

    mutation.mutate({
      bodegaOrigenId: Number(bodegaOrigenId),
      bodegaDestinoId: Number(bodegaDestinoId),
      documentoId: Number(documentoId),
      notas: observacion.trim(),
      items: items.map(it => ({
        productoId: it.producto.id,
        cantidad: parseFloat(it.cantidad),
        loteNumero: it.loteNumero || undefined,
        seriales: it.producto.manejaSerial && it.seriales
          ? it.seriales.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
          : undefined,
      })),
    })
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
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
            Genera un documento de traslado TI para mover uno o varios productos en una sola remisión.
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
        
        {/* Contenedor 1: Cabecera del Traslado */}
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
                {sucursalesActivas.length > 0 ? (
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
                        setItems([])
                        setDocumentoId('')
                      }}
                      required
                      className={inputCls}
                    >
                      <option value="">— Seleccionar sucursal —</option>
                      {sucursalesActivas.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} ({s.codigo})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Sede Principal (Empresa)</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                      Sin sucursales múltiples
                    </span>
                  </div>
                )}

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
                      className={inputCls}
                    >
                      <option value="">— Seleccionar bodega origen —</option>
                      {bodegasOrigenDisponibles.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.nombre} ({b.codigo}) {b.esPrincipal ? '★ Principal' : ''}
                        </option>
                      ))}
                    </select>
                    {bodegasOrigenDisponibles.length === 0 && (
                      <p className="text-[10px] text-amber-600 mt-1">
                        No hay bodegas registradas para esta sucursal.
                      </p>
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
                          {b.nombre} ({b.codigo}) {b.esPrincipal ? '★ Principal' : ''}
                        </option>
                      ))}
                    </select>
                    {!bodegaOrigenId ? (
                      <p className="text-[10px] text-slate-400 mt-1">Seleccione primero la bodega origen.</p>
                    ) : bodegasDestinoDisponibles.length === 0 ? (
                      <p className="text-[10px] text-amber-600 mt-1">
                        Se requieren al menos 2 bodegas en esta sucursal para realizar traslados internos.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* CASO B: TRASLADO ENTRE DIFERENTES SUCURSALES */}
            {tipoTraslado === 'INTER_SUCURSAL' && (
              <div className="space-y-4">
                {sucursalesActivas.length < 2 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                    <span>
                      Tienes <strong>{sucursalesActivas.length}</strong> sucursal(es) registrada(s). Para realizar traslados inter-sucursales requieres al menos 2 sucursales registradas en Configuración &gt; Sucursales.
                    </span>
                  </div>
                )}

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
                          setItems([])
                          setDocumentoId('')
                          if (sucursalDestinoId === newSuc) {
                            const altDest = sucursalesActivas.find((s: any) => String(s.id) !== newSuc)
                            setSucursalDestinoId(altDest ? String(altDest.id) : '')
                            setBodegaDestinoId('')
                          }
                        }}
                        required
                        className={inputCls}
                      >
                        <option value="">— Seleccionar sucursal origen —</option>
                        {sucursalesActivas.map((s: any) => (
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
                        {sucursalesActivas
                          .filter((s: any) => String(s.id) !== String(sucursalOrigenId))
                          .map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre} ({s.codigo})
                            </option>
                          ))}
                      </select>
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
                  Obligatorio: todos los productos de esta remisión quedarán respaldados bajo este documento TI con un único consecutivo.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contenedor 2: Estructura de 2 Columnas (Catálogo a la izquierda, Remisión a la derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA (lg:col-span-5): Catálogo con buscador y explorador deslizable */}
          <div className="lg:col-span-5 space-y-3 sticky top-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              
              {/* Cabecera del Catálogo */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <Warehouse size={15} className="text-indigo-600" />
                    Productos en Bodega Origen
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
                    {bodegaOrigenObj ? `${bodegaOrigenObj.nombre} (${bodegaOrigenObj.codigo})` : 'Selecciona bodega origen'}
                  </p>
                </div>
                {bodegaOrigenId && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full shrink-0">
                    {sugerenciasConStock.length} disponibles
                  </span>
                )}
              </div>

              {/* Contenido del Catálogo */}
              {!bodegaOrigenId ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 font-medium">
                  <Lock size={20} className="mx-auto mb-1.5 text-slate-300" />
                  Selecciona primero la bodega de origen arriba para cargar sus existencias.
                </div>
              ) : (
                <>
                  {/* Buscador Integrado */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      placeholder="Buscar por nombre o SKU..."
                      className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                    {busqueda && (
                      <button
                        type="button"
                        onClick={() => setBusqueda('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                        title="Limpiar búsqueda"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {buscando && (
                    <p className="text-[10px] text-slate-400 font-semibold px-1">
                      Buscando en bodega origen...
                    </p>
                  )}

                  {/* Lista con Desplazador / Scroll Vertical */}
                  <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                    {sugerenciasConStock.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        {busqueda 
                          ? `No se encontraron productos con stock mayor a 0 para "${busqueda}".` 
                          : 'No hay productos con existencias disponibles en esta bodega origen.'}
                      </div>
                    ) : (
                      sugerenciasConStock.map((p: any) => {
                        const st = p.stock?.find((s: any) => String(s.bodegaId) === String(bodegaOrigenId))
                        const cantBod = st ? Number(st.cantidad || 0) : 0
                        const itemEnLista = items.find(it => it.producto.id === p.id)
                        const cantEnLista = itemEnLista ? parseFloat(itemEnLista.cantidad || '0') : 0
                        const yaAlcanzoMaximo = cantEnLista >= cantBod

                        return (
                          <div
                            key={p.id}
                            className={`pt-2.5 pb-2 px-2.5 rounded-xl transition-all flex flex-col gap-1.5 ${
                              itemEnLista 
                                ? 'bg-indigo-50/50 border border-indigo-100' 
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                                  {p.nombre}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                  SKU: {p.sku}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md inline-block">
                                  Stock: {cantBod} {p.unidadMedida?.abreviatura || 'un.'}
                                </span>
                                <span className="block text-[10px] text-slate-400 mt-0.5">
                                  {fmtMoneda(Number(p.costoPromedio || 0))}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <div>
                                {itemEnLista && (
                                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                                    {cantEnLista} en remisión
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAgregarProducto(p)}
                                disabled={yaAlcanzoMaximo}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  yaAlcanzoMaximo
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : itemEnLista
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                    : 'bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-100'
                                }`}
                                title={yaAlcanzoMaximo ? 'Todo el stock disponible ya fue agregado' : 'Agregar al traslado'}
                              >
                                <Plus size={12} />
                                <span>{itemEnLista ? '+1 más' : 'Agregar'}</span>
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA (lg:col-span-7): Productos Agregados a la Remisión TI */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Layers size={18} className="text-indigo-600" />
                    Productos a Trasladar en este Documento
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Ajusta las cantidades que se van a despachar en esta remisión TI.
                  </p>
                </div>
                {items.length > 0 && (
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
                    {items.length} {items.length === 1 ? 'producto en remisión' : 'productos en remisión'}
                  </span>
                )}
              </div>

              {/* Tabla de Productos Agregados */}
              {items.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                  <PackageOpen size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">Ningún producto agregado todavía</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
                    Utiliza el panel izquierdo para explorar los productos de la bodega o buscarlos por nombre/SKU y haz clic en <strong>Agregar</strong>.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2.5 w-7 text-center">#</th>
                          <th className="px-3 py-2.5 min-w-[170px]">Producto</th>
                          <th className="px-2 py-2.5 text-center w-24">Stock Origen</th>
                          <th className="px-3 py-2.5 w-36">Cantidad *</th>
                          <th className="px-3 py-2.5 text-right w-24">Costo</th>
                          <th className="px-3 py-2.5 text-right w-24">Subtotal</th>
                          <th className="px-2 py-2.5 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {items.map((it, idx) => {
                          const cantNum = parseFloat(it.cantidad) || 0
                          const cpp = Number(it.producto.costoPromedio || 0)
                          const subtotal = cantNum * cpp
                          const excede = cantNum > it.disponibleOrigen || it.disponibleOrigen <= 0 || cantNum <= 0

                          return (
                            <tr key={it.producto.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-3 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2.5">
                                <p className="font-bold text-slate-800 text-xs leading-snug line-clamp-2">{it.producto.nombre}</p>
                                <p className="text-[10px] font-mono text-slate-400">SKU: {it.producto.sku}</p>
                                
                                {/* Manejo de Lotes si aplica */}
                                {it.producto.manejaLotes && (
                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Lote:</span>
                                    <input
                                      type="text"
                                      value={it.loteNumero || ''}
                                      onChange={e => handleUpdateItemField(idx, 'loteNumero', e.target.value)}
                                      placeholder="Ej. L-892"
                                      className="px-2 py-0.5 border border-slate-200 rounded text-[10px] font-mono w-28 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      required
                                    />
                                  </div>
                                )}

                                {/* Manejo de Seriales si aplica */}
                                {it.producto.manejaSerial && (
                                  <div className="mt-1.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Seriales (separados por coma):</span>
                                    <input
                                      type="text"
                                      value={it.seriales || ''}
                                      onChange={e => handleUpdateItemField(idx, 'seriales', e.target.value)}
                                      placeholder="Serial1, Serial2..."
                                      className="px-2 py-0.5 border border-slate-200 rounded text-[10px] font-mono w-full mt-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      required
                                    />
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded inline-block">
                                  {it.disponibleOrigen} {it.producto.unidadMedida?.abreviatura || 'un.'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0.0001"
                                    max={it.disponibleOrigen}
                                    value={it.cantidad}
                                    onChange={e => handleUpdateCantidad(idx, e.target.value)}
                                    className={`w-20 px-2 py-1 bg-slate-50 border rounded-lg text-xs font-bold text-slate-800 text-center focus:outline-none focus:ring-2 transition-all ${
                                      excede 
                                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' 
                                        : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                    }`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCantidad(idx, String(it.disponibleOrigen))}
                                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-1 rounded cursor-pointer shrink-0"
                                    title="Trasladar todo el stock disponible"
                                  >
                                    Todo
                                  </button>
                                </div>
                                {cantNum > it.disponibleOrigen && (
                                  <p className="text-[9px] text-red-600 font-bold mt-0.5">
                                    Máx: {it.disponibleOrigen}
                                  </p>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right text-slate-500 font-medium text-[11px]">
                                {fmtMoneda(cpp)}
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-slate-800 text-[11px]">
                                {fmtMoneda(subtotal)}
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Quitar de este traslado"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Barra de Resumen / Totales */}
                  <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Referencias</span>
                        <strong className="text-slate-800 text-xs font-extrabold">{totalItemsCount} productos</strong>
                      </div>
                      <div className="border-l border-slate-200 pl-4">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Unidades</span>
                        <strong className="text-indigo-600 text-xs font-extrabold">{totalUnidades} unidades</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Valoración Estimada</span>
                      <strong className="text-slate-900 text-sm font-extrabold">{fmtMoneda(totalValor)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Observaciones generales */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Observación / Justificación General del Traslado
                </label>
                <textarea
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  placeholder="Motivo del traslado, instrucciones de entrega o despacho..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                />
              </div>
            </div>
          </div>

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
            disabled={mutation.isPending || items.length === 0 || hayExcesoStock || !documentoId}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 disabled:opacity-40 transition-all shadow-sm shadow-indigo-600/10 cursor-pointer"
          >
            <Save size={14} /> 
            {mutation.isPending 
              ? 'Procesando...' 
              : `Registrar Traslado TI (${totalItemsCount} ${totalItemsCount === 1 ? 'producto' : 'productos'})`}
          </button>
        </div>

      </form>
    </div>
  )
}
