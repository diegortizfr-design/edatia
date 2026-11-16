import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Upload, Camera, X, Image as ImageIcon, Loader2,
  Check, RefreshCw, AlertTriangle, ArrowRight, DollarSign, Layers,
  ExternalLink, Edit2, RotateCcw
} from 'lucide-react'
import api, { getMediaUrl } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface ModalProductoIaProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (producto: any) => void
}

interface ImagePreview {
  file: File
  previewUrl: string
}

export function ModalProductoIa({ isOpen, onClose, onSuccess }: ModalProductoIaProps) {
  const navigate = useNavigate()
  const [paso, setPaso] = useState<'formulario' | 'procesando' | 'revision'>('formulario')

  // Formulario
  const [imagenes, setImagenes] = useState<ImagePreview[]>([])
  const [precio, setPrecio] = useState<string>('')
  const [notas, setNotas] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)

  // Estado del proceso
  const [progresoMensaje, setProgresoMensaje] = useState<string>('Iniciando...')

  // Resultado de revisión
  const [productoGenerado, setProductoGenerado] = useState<any>(null)
  const [advertenciaIa, setAdvertenciaIa] = useState<string | null>(null)
  const [indiceFotoActiva, setIndiceFotoActiva] = useState<number>(0)
  const [viendoOriginal, setViendoOriginal] = useState<boolean>(false)
  const [regenerando, setRegenerando] = useState<boolean>(false)
  const [instruccionRegen, setInstruccionRegen] = useState<string>('')
  const [mostrarPromptRegen, setMostrarPromptRegen] = useState<boolean>(false)

  // Edición rápida en revisión
  const [editando, setEditando] = useState(false)
  const [nombreEdit, setNombreEdit] = useState('')
  const [precioEdit, setPrecioEdit] = useState('')
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)

  // Manejo de Paste (Ctrl+V) de imágenes desde el portapapeles
  useEffect(() => {
    if (!isOpen || paso !== 'formulario') return

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const archivosNuevos: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile()
          if (blob) archivosNuevos.push(blob)
        }
      }

      if (archivosNuevos.length > 0) {
        agregarArchivos(archivosNuevos)
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isOpen, paso, imagenes])

  if (!isOpen) return null

  const agregarArchivos = (nuevos: File[]) => {
    const permitidos = nuevos.filter(f => f.type.startsWith('image/'))
    if (permitidos.length === 0) {
      toast.error('Solo se permiten archivos de imagen (JPG, PNG, WEBP)')
      return
    }

    setImagenes(prev => {
      const combinados = [...prev]
      for (const f of permitidos) {
        if (combinados.length >= 3) {
          toast.error('Máximo 3 imágenes por producto')
          break
        }
        combinados.push({
          file: f,
          previewUrl: URL.createObjectURL(f),
        })
      }
      return combinados
    })
  }

  const quitarImagen = (index: number) => {
    setImagenes(prev => {
      const item = prev[index]
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      agregarArchivos(Array.from(e.dataTransfer.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (imagenes.length === 0) {
      toast.error('Sube al menos una foto del producto')
      return
    }

    const valorPrecio = parseFloat(precio.replace(/[^0-9]/g, ''))
    if (!valorPrecio || valorPrecio <= 0) {
      toast.error('Ingresa un precio de venta válido')
      return
    }

    try {
      setPaso('procesando')
      setProgresoMensaje('Analizando empaque con Gemini y catalogando...')

      const formData = new FormData()
      formData.append('precio', valorPrecio.toString())
      if (notas.trim()) formData.append('notas', notas.trim())
      imagenes.forEach(img => {
        formData.append('archivos', img.file)
      })

      // Mensajes de avance amigables
      const t1 = setTimeout(() => setProgresoMensaje('Generando fondo de estudio y posicionando logo Baby World...'), 4000)
      const t2 = setTimeout(() => setProgresoMensaje('Subiendo imágenes optimizadas a la nube...'), 9000)

      const res = await api.post('/digital/ia/productos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000,
      })

      clearTimeout(t1)
      clearTimeout(t2)

      const { producto, advertencia } = res.data
      setProductoGenerado(producto)
      setAdvertenciaIa(advertencia)
      setNombreEdit(producto.nombre)
      setPrecioEdit(producto.precioWeb || producto.precioBase)
      setIndiceFotoActiva(0)
      setPaso('revision')
      toast.success('¡Borrador generado con éxito!')
      if (onSuccess) onSuccess(producto)
    } catch (err: any) {
      console.error('Error al generar producto con IA:', err)
      setPaso('formulario')
      const msg = err?.response?.data?.message || err.message || 'Error al procesar el producto con IA'
      toast.error(typeof msg === 'string' ? msg : 'Error al procesar con IA')
    }
  }

  const handleRegenerar = async (modo: 'ia' | 'original') => {
    if (!productoGenerado) return
    try {
      setRegenerando(true)
      const payload: any = {
        indice: indiceFotoActiva,
        modo,
      }
      if (modo === 'ia' && instruccionRegen.trim()) {
        payload.instruccion = instruccionRegen.trim()
      }

      const res = await api.post(`/digital/ia/productos/${productoGenerado.id}/regenerar-imagen`, payload)
      setProductoGenerado(res.data.producto)
      setMostrarPromptRegen(false)
      setInstruccionRegen('')
      setViendoOriginal(false)
      toast.success(modo === 'ia' ? 'Imagen regenerada con IA ✓' : 'Se aplicó la foto original con logo ✓')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'No se pudo regenerar la imagen'
      toast.error(msg)
    } finally {
      setRegenerando(false)
    }
  }

  const handleGuardarEdicion = async () => {
    if (!productoGenerado) return
    try {
      setGuardandoEdicion(true)
      const res = await api.patch(`/digital/ia/productos/${productoGenerado.id}`, {
        nombre: nombreEdit,
        precio: parseFloat(String(precioEdit).replace(/[^0-9]/g, '')) || undefined,
      })
      setProductoGenerado(res.data)
      setEditando(false)
      toast.success('Cambios guardados en el borrador ✓')
    } catch (err) {
      toast.error('Error al actualizar borrador')
    } finally {
      setGuardandoEdicion(false)
    }
  }

  const limpiarYSalir = () => {
    imagenes.forEach(img => URL.revokeObjectURL(img.previewUrl))
    setImagenes([])
    setPrecio('')
    setNotas('')
    setProductoGenerado(null)
    setPaso('formulario')
    onClose()
  }

  const irAFichaCompleta = () => {
    if (productoGenerado?.id) {
      navigate(`/configuracion/productos/${productoGenerado.id}/detalle?tab=web`)
      limpiarYSalir()
    }
  }

  const formatearCOP = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9]/g, '')) : val
    if (isNaN(num)) return '$0'
    return `$${num.toLocaleString('es-CO')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                Nuevo Producto con IA
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full tracking-wider">
                  Baby World
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {paso === 'formulario' && 'Sube 1 a 3 fotos y escribe el precio; la IA hace el resto.'}
                {paso === 'procesando' && 'Creando catálogo inteligente...'}
                {paso === 'revision' && 'Revisa el borrador generado antes de publicar.'}
              </p>
            </div>
          </div>
          {paso !== 'procesando' && (
            <button
              onClick={limpiarYSalir}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Contenido según el paso */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* PASO 1: FORMULARIO */}
          {paso === 'formulario' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Dropzone de fotos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Fotos del producto (1 a 3)
                </label>
                <div
                  ref={dropAreaRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
                    ${isDragging ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) agregarArchivos(Array.from(e.target.files))
                    }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <Upload size={22} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    Toca para subir fotos o arrástralas aquí
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    También puedes pegar una imagen de internet con <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-slate-600 shadow-xs">Ctrl + V</kbd>
                  </p>
                </div>

                {/* Miniaturas de imágenes seleccionadas */}
                {imagenes.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {imagenes.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-xs flex items-center justify-center">
                        <img
                          src={img.previewUrl}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            // Si el navegador de escritorio no soporta renderizar HEIC nativo, mostramos tarjeta amigable
                            (e.target as HTMLElement).style.display = 'none';
                            const fallback = (e.target as HTMLElement).nextElementSibling;
                            if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                          }}
                        />
                        <div className="hidden flex flex-col items-center justify-center text-center p-2 text-slate-500">
                          <ImageIcon size={24} className="text-indigo-500 mb-1" />
                          <span className="text-[11px] font-bold text-slate-700">Foto #{idx + 1}</span>
                          <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5">iPhone / HEIC</span>
                        </div>
                        <span className="absolute bottom-1 left-1 bg-slate-900/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            quitarImagen(idx)
                          }}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Precio y Notas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Precio de venta (COP) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: 65.000"
                      value={precio ? formatearCOP(precio) : ''}
                      onChange={(e) => setPrecio(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Es el mismo precio para el ERP y para la tienda virtual.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Instrucción / Nota extra <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Es etapa 4 para bebés de 9 a 12 kg"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Ayuda a la IA a precisar tallas o detalles específicos.</p>
                </div>
              </div>

              {/* Botón de acción */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={imagenes.length === 0 || !precio}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Sparkles size={18} />
                  Generar Producto Borrador con IA
                </button>
              </div>
            </form>
          )}

          {/* PASO 2: PROCESANDO */}
          {paso === 'procesando' && (
            <div className="py-16 text-center space-y-5">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-ping opacity-60" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                  <Sparkles size={32} className="animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800">Procesando con Gemini y Baby World</h3>
                <p className="text-sm text-indigo-600 font-semibold animate-pulse">{progresoMensaje}</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Este proceso toma entre 10 y 25 segundos dependiendo del número de fotos. Por favor no cierres la ventana.
                </p>
              </div>
            </div>
          )}

          {/* PASO 3: REVISIÓN DEL BORRADOR */}
          {paso === 'revision' && productoGenerado && (
            <div className="space-y-5">
              {/* Alerta de borrador */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-amber-900 text-xs">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Producto guardado en modo Borrador (Solo Inventario ERP).</span>
                  <p className="text-amber-800/90 mt-0.5">
                    No está publicado en la tienda virtual todavía. Revísalo aquí y cuando te guste cómo quedó, activa la casilla de publicación.
                  </p>
                  {advertenciaIa && (
                    <p className="text-amber-700 font-medium mt-1">⚠️ Nota de la IA: {advertenciaIa}</p>
                  )}
                </div>
              </div>

              {/* Visor de Imágenes con selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Imagen del producto ({indiceFotoActiva + 1} de {productoGenerado.metadataWeb?.imagenes?.length || 1})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViendoOriginal(!viendoOriginal)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {viendoOriginal ? 'Ver Foto Estándar' : 'Ver Foto Original'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarPromptRegen(!mostrarPromptRegen)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <RefreshCw size={12} className={regenerando ? 'animate-spin' : ''} />
                      Regenerar Foto
                    </button>
                  </div>
                </div>

                {/* Prompt opcional para regenerar */}
                {mostrarPromptRegen && (
                  <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-2">
                    <p className="text-xs font-bold text-indigo-900">¿Cómo quieres regenerar esta foto?</p>
                    <input
                      type="text"
                      placeholder="Instrucción extra (ej: centrar más el paquete, fondo más iluminado)"
                      value={instruccionRegen}
                      onChange={(e) => setInstruccionRegen(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={regenerando}
                        onClick={() => handleRegenerar('ia')}
                        className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        {regenerando ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Regenerar con IA
                      </button>
                      <button
                        type="button"
                        disabled={regenerando}
                        onClick={() => handleRegenerar('original')}
                        className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
                        title="Ajusta la foto al formato cuadrado 1200x1200 con fondo limpio y centrado"
                      >
                        <RotateCcw size={12} />
                        Estandarizar Original
                      </button>
                    </div>
                  </div>
                )}

                {/* Contenedor de la foto principal */}
                <div className="relative aspect-square max-h-72 w-full mx-auto bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center p-2">
                  {regenerando && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 gap-2">
                      <Loader2 size={24} className="animate-spin text-indigo-600" />
                      <span className="text-xs font-bold text-slate-600">Regenerando imagen...</span>
                    </div>
                  )}
                  <img
                    src={
                      viendoOriginal
                        ? getMediaUrl(productoGenerado.metadataWeb?.imagenesOriginales?.[indiceFotoActiva])
                        : getMediaUrl(productoGenerado.metadataWeb?.imagenes?.[indiceFotoActiva] || productoGenerado.imagen)
                    }
                    alt={productoGenerado.nombre}
                    className="w-full h-full object-contain"
                  />
                  {viendoOriginal && (
                    <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Foto Original
                    </span>
                  )}
                </div>

                {/* Thumbnails si hay más de 1 imagen */}
                {Array.isArray(productoGenerado.metadataWeb?.imagenes) && productoGenerado.metadataWeb.imagenes.length > 1 && (
                  <div className="flex gap-2 justify-center pt-1">
                    {productoGenerado.metadataWeb.imagenes.map((url: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setIndiceFotoActiva(i)
                          setViendoOriginal(false)
                        }}
                        className={`w-14 h-14 rounded-xl border-2 p-0.5 overflow-hidden bg-white transition-all ${
                          indiceFotoActiva === i ? 'border-indigo-600 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={getMediaUrl(url)} alt={`Foto ${i + 1}`} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ficha editable básica */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalles Generados</span>
                  {!editando ? (
                    <button
                      type="button"
                      onClick={() => setEditando(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={guardandoEdicion}
                      onClick={handleGuardarEdicion}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Check size={12} /> Guardar
                    </button>
                  )}
                </div>

                {!editando ? (
                  <div className="space-y-1.5">
                    <p className="text-base font-black text-slate-800">{productoGenerado.nombre}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-indigo-700">
                        {productoGenerado.sku}
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-700">
                        {formatearCOP(productoGenerado.precioWeb || productoGenerado.precioBase)}
                      </span>
                      {productoGenerado.categoria?.nombre && (
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                          📁 {productoGenerado.categoria.nombre}
                        </span>
                      )}
                      {productoGenerado.metadataWeb?.etapaTalla && (
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                          🏷️ {productoGenerado.metadataWeb.etapaTalla}
                        </span>
                      )}
                    </div>
                    {productoGenerado.descripcion && (
                      <p className="text-xs text-slate-500 pt-1 line-clamp-2">{productoGenerado.descripcion}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre</label>
                      <input
                        type="text"
                        value={nombreEdit}
                        onChange={(e) => setNombreEdit(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Precio</label>
                      <input
                        type="text"
                        value={precioEdit ? formatearCOP(precioEdit) : ''}
                        onChange={(e) => setPrecioEdit(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botones finales */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={limpiarYSalir}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={irAFichaCompleta}
                  className="flex-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Abrir Ficha Técnica y Publicar</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

