import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBodegas, buscarProductos, postAjuste, getProducto } from '../../services/inventario.service'
import { getDocumentosConfig } from '../../services/configuracion.service'
import { getApiError } from '../../services/api'
import { ArrowLeft, Save, Plus, Search, HelpCircle, Archive } from 'lucide-react'

export interface AjusteInventario {
  id: string
  tipo: 'AINE' | 'AINS'
  motivo?: 'AVERIA' | 'PERDIDA' | 'DAR_DE_BAJA' | ''
  bodegaId: number
  bodegaNombre: string
  productoId: number
  productoNombre: string
  productoSku: string
  cantidad: number
  observacion: string
  autorizadoPor: string
  fecha: string
}

export function NuevoAjusteForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramBodegaId = searchParams.get('bodegaId') || ''
  const paramProductoId = searchParams.get('productoId') || ''

  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [bodegaId, setBodegaId] = useState('')
  const [tipo, setTipo] = useState<'AINE' | 'AINS'>('AINE')
  const [motivo, setMotivo] = useState<'AVERIA' | 'PERDIDA' | 'DAR_DE_BAJA' | ''>('')
  const [cantidad, setCantidad] = useState('')
  const [observacion, setObservacion] = useState('')
  const [autorizadoPor, setAutorizadoPor] = useState('')
  const [loteNumero, setLoteNumero] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [seriales, setSeriales] = useState('')
  const [documentoId, setDocumentoId] = useState('')

  // Product search states
  const [busqueda, setBusqueda] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState<any | null>(null)

  // Queries
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas-ajustes'], queryFn: getBodegas })

  const { data: documentosConfig = [] } = useQuery({
    queryKey: ['documentos-config-ajustes'],
    queryFn: getDocumentosConfig,
  })

  const { data: queryProducto } = useQuery({
    queryKey: ['producto-ajuste-pre', paramProductoId],
    queryFn: () => getProducto(Number(paramProductoId)),
    enabled: !!paramProductoId,
  })

  const bodegaSeleccionadaObj = bodegas.find((b: any) => String(b.id) === String(bodegaId))

  const filteredDocs = documentosConfig.filter((d: any) => {
    if (d.tipoOperacion !== 'INVENTARIO' || d.estado !== 'ACTIVO') return false
    if (d.sigla !== 'AI') return false
    if (d.sucursalId && bodegaSeleccionadaObj) {
      return Number(d.sucursalId) === Number(bodegaSeleccionadaObj.sucursalId)
    }
    return !d.sucursalId
  })

  useEffect(() => {
    if (queryProducto) {
      setProductoSeleccionado(queryProducto)
    }
  }, [queryProducto])

  useEffect(() => {
    if (paramBodegaId) {
      setBodegaId(paramBodegaId)
    }
  }, [paramBodegaId])
  
  const { data: sugerencias = [], isFetching: buscando } = useQuery({
    queryKey: ['buscar-prod-ajuste', busqueda],
    queryFn: () => buscarProductos(busqueda),
    enabled: busqueda.length >= 2,
  })

  const mutation = useMutation({
    mutationFn: postAjuste,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos-existencias'] })
      qc.invalidateQueries({ queryKey: ['kardex-movimientos'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['inv-kpis'] })
      navigate('/inventario/control-existencias')
    },
    onError: (err: any) => {
      setError(getApiError(err, 'Error al registrar el ajuste de inventario'))
    }
  })

  const handleSelectProducto = (p: any) => {
    setProductoSeleccionado(p)
    setBusqueda('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!bodegaId) return setError('Seleccione una bodega')
    if (!documentoId) return setError('Seleccione un documento/prefijo')
    if (!productoSeleccionado) return setError('Seleccione un producto')
    if (!cantidad || parseFloat(cantidad) <= 0) return setError('Ingrese una cantidad válida mayor a 0')
    if (tipo === 'AINS' && !motivo) return setError('Seleccione un motivo para la nota de salida (AINS)')
    if (tipo === 'AINS' && motivo === 'DAR_DE_BAJA' && !observacion.trim()) {
      return setError('La observación es estrictamente obligatoria para dar de baja un producto')
    }
    // Validate serials if required
    let parsedSeriales: string[] | undefined = undefined
    if (productoSeleccionado.manejaSerial) {
      parsedSeriales = seriales.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      if (parsedSeriales.length !== Math.ceil(parseFloat(cantidad))) {
        return setError(`La cantidad de seriales (${parsedSeriales.length}) no coincide con la cantidad del ajuste (${Math.ceil(parseFloat(cantidad))})`)
      }
    }
    if (productoSeleccionado.manejaLotes && !loteNumero) {
      return setError('El número de lote es obligatorio para este producto.')
    }

    const bodegaObj = bodegas.find(b => b.id === Number(bodegaId))
    const nuevoId = `AI-2026-${String(Date.now()).slice(-5)}`

    const nuevoAjuste: AjusteInventario = {
      id: nuevoId,
      tipo,
      motivo: tipo === 'AINS' ? motivo : '',
      bodegaId: Number(bodegaId),
      bodegaNombre: bodegaObj?.nombre || 'Bodega Desconocida',
      productoId: productoSeleccionado.id,
      productoNombre: productoSeleccionado.nombre,
      productoSku: productoSeleccionado.sku,
      cantidad: parseFloat(cantidad),
      observacion: observacion.trim() + (loteNumero ? ` [Lote: ${loteNumero}]` : ''),
      autorizadoPor: autorizadoPor.trim(),
      fecha: new Date().toISOString()
    }

    // Llamar a la mutación real del backend sin usar simulación local
    mutation.mutate({
      productoId: productoSeleccionado.id,
      bodegaId: Number(bodegaId),
      cantidad: tipo === 'AINE' ? parseFloat(cantidad) : -parseFloat(cantidad),
      notas: observacion.trim(),
      loteNumero: loteNumero || undefined,
      fechaVencimiento: fechaVencimiento || undefined,
      seriales: parsedSeriales,
      motivo: tipo === 'AINS' ? motivo : undefined,
      documentoId: Number(documentoId),
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
          <h1 className="text-xl font-bold text-slate-800">Registrar Ajuste de Inventario (AI)</h1>
          <p className="text-xs text-slate-400">Corrige discrepancias físicas o registra mermas, averías y pérdidas de stock</p>
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
          <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Información del Ajuste</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bodega */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bodega del Ajuste *</label>
              <select
                value={bodegaId}
                onChange={e => {
                  setBodegaId(e.target.value)
                  setDocumentoId('')
                }}
                required
                className={inputCls}
              >
                <option value="">— Seleccionar bodega —</option>
                {bodegas.filter(b => b.activo).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} ({b.codigo})
                  </option>
                ))}
              </select>
            </div>

            {/* Documento Config */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Documento (Prefijo) *</label>
              <select
                value={documentoId}
                onChange={e => setDocumentoId(e.target.value)}
                required
                disabled={!bodegaId}
                className={inputCls}
              >
                <option value="">— Seleccionar documento —</option>
                {filteredDocs.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.prefijo}) — Folio: {d.consecutivoSiguiente}
                  </option>
                ))}
              </select>
              {!bodegaId && <p className="text-[10px] text-slate-400 mt-1">Seleccione primero la bodega para filtrar los prefijos habilitados.</p>}
            </div>

            {/* Tipo de Ajuste */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Ajuste *</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setTipo('AINE'); setMotivo('') }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    tipo === 'AINE' 
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Entrada (AINE)
                </button>
                <button
                  type="button"
                  onClick={() => { setTipo('AINS'); setMotivo('AVERIA') }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    tipo === 'AINS' 
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Salida (AINS)
                </button>
              </div>
            </div>

            {/* Producto */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Producto a Ajustar *</label>
              
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
            <div>
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

            {/* Motivo (Solo para AINS) */}
            {tipo === 'AINS' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Motivo de Salida *</label>
                <select
                  value={motivo}
                  onChange={e => setMotivo(e.target.value as any)}
                  required
                  className={inputCls}
                >
                  <option value="AVERIA">Avería (Mover a Bolsa de Averías)</option>
                  <option value="PERDIDA">Pérdida (Mover a Bolsa de Pérdidas)</option>
                  <option value="DAR_DE_BAJA">Dar de baja definitivamente</option>
                </select>
              </div>
            )}

            {/* Persona que autoriza */}
            <div className={tipo === 'AINS' ? 'md:col-span-2' : ''}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Autorizado Por (Responsable) *</label>
              <input
                value={autorizadoPor}
                onChange={e => setAutorizadoPor(e.target.value)}
                placeholder="Nombre del supervisor o auditor..."
                required
                className={inputCls}
              />
            </div>

            {/* Observaciones */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Observación / Justificación {tipo === 'AINS' && motivo === 'DAR_DE_BAJA' ? '*' : ''}
              </label>
              <textarea
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
                placeholder={
                  tipo === 'AINS' && motivo === 'DAR_DE_BAJA' 
                    ? "Describa detalladamente el motivo de la baja (OBLIGATORIO)..." 
                    : "Notas u observaciones del ajuste..."
                }
                rows={3}
                required={tipo === 'AINS' && motivo === 'DAR_DE_BAJA'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
              />
            </div>

            {/* Lotes inputs if product manejaLotes */}
            {productoSeleccionado?.manejaLotes && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-100 bg-slate-50/30 p-4 rounded-xl">
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
                {tipo === 'AINE' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      value={fechaVencimiento}
                      onChange={e => setFechaVencimiento(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}
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
            <Save size={14} /> Registrar Ajuste
          </button>
        </div>

      </form>
    </div>
  )
}
