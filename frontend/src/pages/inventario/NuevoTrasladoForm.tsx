import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBodegas, buscarProductos, postTraslado, getProducto } from '../../services/inventario.service'
import { ArrowLeft, Save, Search, ArrowRightLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export function NuevoTrasladoForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramOrigenId = searchParams.get('origenId') || ''
  const paramProductoId = searchParams.get('productoId') || ''

  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [bodegaOrigenId, setBodegaOrigenId] = useState('')
  const [bodegaDestinoId, setBodegaDestinoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [observacion, setObservacion] = useState('')
  const [loteNumero, setLoteNumero] = useState('')
  const [seriales, setSeriales] = useState('')

  // Product search states
  const [busqueda, setBusqueda] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState<any | null>(null)

  // Queries
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas-traslados'], queryFn: getBodegas })

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

  useEffect(() => {
    if (paramOrigenId) {
      setBodegaOrigenId(paramOrigenId)
    }
  }, [paramOrigenId])

  const { data: sugerencias = [], isFetching: buscando } = useQuery({
    queryKey: ['buscar-prod-traslado', busqueda],
    queryFn: () => buscarProductos(busqueda),
    enabled: busqueda.length >= 2,
  })

  const mutation = useMutation({
    mutationFn: postTraslado,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos-existencias'] })
      qc.invalidateQueries({ queryKey: ['kardex-movimientos'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['inv-kpis'] })
      toast.success('Traslado en tránsito registrado correctamente')
      navigate('/inventario/movimientos')
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Error al registrar el traslado de inventario')
    }
  })

  const handleSelectProducto = (p: any) => {
    setProductoSeleccionado(p)
    setBusqueda('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!bodegaOrigenId) return setError('Seleccione una bodega de origen')
    if (!bodegaDestinoId) return setError('Seleccione una bodega de destino')
    if (bodegaOrigenId === bodegaDestinoId) {
      return setError('La bodega de origen y destino deben ser diferentes')
    }
    if (!productoSeleccionado) return setError('Seleccione un producto')
    if (!cantidad || parseFloat(cantidad) <= 0) return setError('Ingrese una cantidad válida mayor a 0')

    // Validate serials if required
    let parsedSeriales: string[] | undefined = undefined
    if (productoSeleccionado.manejaSerial) {
      parsedSeriales = seriales.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      if (parsedSeriales.length !== Math.ceil(parseFloat(cantidad))) {
        return setError(`La cantidad de seriales (${parsedSeriales.length}) no coincide con la cantidad a trasladar (${Math.ceil(parseFloat(cantidad))})`)
      }
    }
    if (productoSeleccionado.manejaLotes && !loteNumero) {
      return setError('El número de lote es obligatorio para este producto.')
    }

    mutation.mutate({
      productoId: productoSeleccionado.id,
      bodegaOrigenId: Number(bodegaOrigenId),
      bodegaDestinoId: Number(bodegaDestinoId),
      cantidad: parseFloat(cantidad),
      notas: observacion.trim(),
      loteNumero: loteNumero || undefined,
      seriales: parsedSeriales,
    })
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-indigo-600" />
            Registrar Traslado de Inventario (TI)
          </h1>
          <p className="text-xs text-slate-400">Genera un documento de traslado. Los productos quedarán en tránsito hasta ser verificados en destino.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold animate-pulse">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Detalles del Traslado</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bodega Origen */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bodega Origen *</label>
              <select
                value={bodegaOrigenId}
                onChange={e => setBodegaOrigenId(e.target.value)}
                required
                className={inputCls}
              >
                <option value="">— Seleccionar origen —</option>
                {bodegas.filter(b => b.activo).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} ({b.codigo})
                  </option>
                ))}
              </select>
            </div>

            {/* Bodega Destino */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bodega Destino *</label>
              <select
                value={bodegaDestinoId}
                onChange={e => setBodegaDestinoId(e.target.value)}
                required
                className={inputCls}
              >
                <option value="">— Seleccionar destino —</option>
                {bodegas.filter(b => b.activo).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} ({b.codigo})
                  </option>
                ))}
              </select>
            </div>

            {/* Producto */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Producto a Trasladar *</label>
              
              {productoSeleccionado ? (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{productoSeleccionado.nombre}</p>
                    <p className="text-[10px] font-mono text-slate-400">SKU: {productoSeleccionado.sku}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductoSeleccionado(null)}
                    className="text-xs text-red-600 hover:text-red-800 font-bold"
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
                    placeholder="Buscar producto por nombre o SKU..."
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                  {busqueda.length >= 2 && sugerencias.length > 0 && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {sugerencias.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProducto(p)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{p.nombre}</p>
                            <p className="text-[10px] font-mono text-slate-400">SKU: {p.sku}</p>
                          </div>
                          <span className="text-xs font-bold text-indigo-600">Seleccionar</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cantidad */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Cantidad *</label>
              <input
                type="number"
                min="0.001"
                step="0.001"
                required
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>

            {/* Observaciones */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Observación / Justificación de Traslado
              </label>
              <textarea
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
                placeholder="Notas u observaciones del traslado..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
              />
            </div>

            {/* Lotes inputs if product manejaLotes */}
            {productoSeleccionado?.manejaLotes && (
              <div className="md:col-span-2 grid grid-cols-1 gap-4 border border-slate-100 bg-slate-50/30 p-4 rounded-xl">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Número de Lote *</label>
                  <input
                    value={loteNumero}
                    onChange={e => setLoteNumero(e.target.value)}
                    placeholder="ej: L-9872"
                    required
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Seriales textarea if product manejaSerial */}
            {productoSeleccionado?.manejaSerial && (
              <div className="md:col-span-2 border border-slate-100 bg-slate-50/30 p-4 rounded-xl">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Números de Serie *
                </label>
                <textarea
                  value={seriales}
                  onChange={e => setSeriales(e.target.value)}
                  placeholder="Ingrese un número de serie por línea o separados por comas..."
                  rows={4}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Deben ser exactamente {Math.ceil(parseFloat(cantidad) || 0)} seriales.
                </span>
              </div>
            )}

          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <Save size={14} /> Registrar Traslado
          </button>
        </div>

      </form>
    </div>
  )
}
