import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { getMediaUrl } from '../../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Edit3, Package, Globe, FileText, ShoppingCart, ShoppingBag,
  Building2, Layers, DollarSign, CheckCircle2,
  AlertTriangle, Plus, Trash2, ExternalLink, TrendingUp,
  Star, X, Search, Save, RefreshCw, Warehouse,
  Link2, Upload, Hash, Calculator,
  BarChart3, Clock, Loader2, Share2, Sparkles, MessageCircle, Video, Wand2,
  Eye, ChevronLeft, ChevronRight, Download,
  Tag, ToggleLeft, ToggleRight, Edit2, Info, Check, AlertCircle,
  Lock, EyeOff, Palette, Printer, Copy, FileSpreadsheet, Camera
} from 'lucide-react'
import { CameraCaptureModal } from '../../components/CameraCaptureModal'
import {
  getProducto, getStockProducto, getOrdenesCompra, getFacturasCompra, getProveedores, updateProducto,
  getVariantes, createVariante, updateVariante, toggleVariante, deleteVariante,
  ajustarStockVariante, getBodegas, postAjusteManualKardex
} from '../../services/inventario.service'
import { getImpuestos } from '../../services/erp.service'
import { CompartirRedesModal, RedSocial } from '../../components/CompartirRedesModal'
import {
  PALETA_COLORES, PRESETS_COLORES, PRESETS_TALLAS,
  buscarHexColor, slugifyAttr, extraerAtributosVisuales
} from '../../utils/variantesColores'
import {
  Barcode128, descargarCSVBarTender, BarcodeItemParaImprimir
} from '../../utils/barcode128'

const Barcode = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 5v14M6 5v14M11 5v14M14 5v14M18 5v14M21 5v14M8 5v14M16 5v14" />
  </svg>
)


// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtCOP(val: number) {
  return `$${(val || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'web',        label: 'Web / Digital',       icon: Globe },
  { id: 'variantes',  label: 'Variantes y Tallas',  icon: Tag },
  { id: 'documentos', label: 'Documentos',          icon: FileText },
  { id: 'compras',    label: 'Compras',             icon: ShoppingCart },
  { id: 'proveedores',label: 'Proveedores',         icon: Building2 },
  { id: 'stock',      label: 'Stock',               icon: Warehouse },
  { id: 'costeo',     label: 'Costeo',              icon: DollarSign },
  { id: 'codigos',    label: 'Códigos de Barra',    icon: Barcode },
  { id: 'facturas',   label: 'Facturas Venta',      icon: FileText },
]

// ── Sub-components ───────────────────────────────────────────────────────────

/* ---- TAB: Web / Digital ---- */
function TabWeb({ producto, refetch, onCompartir }: { producto: any; refetch: () => void; onCompartir?: (red: RedSocial) => void }) {
  const [data, setData] = useState({
    publicadoWeb: producto.publicadoWeb || false,
    esDigital: producto.esDigital || false,
    nombreWeb: producto.nombreWeb || '',
    slug: producto.slug || '',
    descripcionWeb: producto.descripcionWeb || '',
    imagenes: Array.isArray(producto.imagenes) && producto.imagenes.length > 0 
      ? producto.imagenes 
      : producto.imagen ? [producto.imagen] : [],
    videos: Array.isArray(producto.videos) ? producto.videos : [],
    etiquetaSeo: producto.etiquetaSeo || '',
    metaDescripcion: producto.metaDescripcion || '',
    ordenMostrar: producto.ordenMostrar || 0,
    esDestacado: producto.esDestacado || false,
    urlDescarga: producto.urlDescarga || '',
  })
  const [saved, setSaved] = useState(false)
  const [newImagen, setNewImagen] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoTitulo, setNewVideoTitulo] = useState('')
  const [uploadingImg, setUploadingImg] = useState(false)
  const [mostrarCamara, setMostrarCamara] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [generandoInfo, setGenerandoInfo] = useState(false)
  const [fondoEstudioIa, setFondoEstudioIa] = useState(true)
  const [procesandoThumb, setProcesandoThumb] = useState<string | null>(null)
  const [previewImgIndex, setPreviewImgIndex] = useState<number | null>(null)

  useEffect(() => {
    if (previewImgIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImgIndex(null)
      if (e.key === 'ArrowLeft' && data.imagenes.length > 1) {
        setPreviewImgIndex(prev => (prev !== null && prev > 0 ? prev - 1 : data.imagenes.length - 1))
      }
      if (e.key === 'ArrowRight' && data.imagenes.length > 1) {
        setPreviewImgIndex(prev => (prev !== null && prev < data.imagenes.length - 1 ? prev + 1 : 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewImgIndex, data.imagenes.length])

  const marcarImagenPrincipal = async (index: number) => {
    if (index === 0 || !data.imagenes[index]) return
    const updatedImgs = [...data.imagenes]
    const [selected] = updatedImgs.splice(index, 1)
    updatedImgs.unshift(selected)
    setData(prev => ({ ...prev, imagenes: updatedImgs }))
    setPreviewImgIndex(0)
    try {
      const payload = buildPayload(data, updatedImgs)
      await updateProducto(producto.id, payload)
      refetch()
      toast.success('Foto marcada como principal ✓')
    } catch (err: any) {
      toast.error('Error al actualizar imagen principal')
    }
  }

  useEffect(() => {
    setData({
      publicadoWeb: producto.publicadoWeb || false,
      esDigital: producto.esDigital || false,
      nombreWeb: producto.nombreWeb || '',
      slug: producto.slug || '',
      descripcionWeb: producto.descripcionWeb || '',
      imagenes: Array.isArray(producto.imagenes) && producto.imagenes.length > 0 
        ? producto.imagenes 
        : producto.imagen ? [producto.imagen] : [],
      videos: Array.isArray(producto.videos) ? producto.videos : [],
      etiquetaSeo: producto.etiquetaSeo || '',
      metaDescripcion: producto.metaDescripcion || '',
      ordenMostrar: producto.ordenMostrar || 0,
      esDestacado: producto.esDestacado || false,
      urlDescarga: producto.urlDescarga || '',
    })
  }, [producto])

  const buildPayload = (currentData: typeof data, newImages?: string[]) => {
    const imgs = newImages !== undefined ? newImages : currentData.imagenes
    return {
      ...currentData,
      slug: currentData.slug?.trim() ? currentData.slug.trim() : null,
      imagenes: imgs,
      imagen: imgs.length > 0 ? imgs[0] : null,
      videos: currentData.videos || [],
    }
  }

  const addVideo = () => {
    if (!newVideoUrl.trim()) return
    const url = newVideoUrl.trim()
    const titulo = newVideoTitulo.trim()
    const item = titulo ? { url, titulo } : { url }
    const updated = [...(data.videos || []), item]
    setData(prev => ({ ...prev, videos: updated }))
    setNewVideoUrl('')
    setNewVideoTitulo('')
    toast.success('Video agregado a la lista. Haz clic en Guardar para confirmar ✓')
  }

  const removeVideo = (index: number) => {
    const updated = (data.videos || []).filter((_, i) => i !== index)
    setData(prev => ({ ...prev, videos: updated }))
  }

  const handleGenerarInfoPublicacion = async () => {
    try {
      setGenerandoInfo(true)
      const imagenPrincipal = (data.imagenes && data.imagenes.length > 0) ? data.imagenes[0] : (producto.imagen || null)
      if (imagenPrincipal) {
        toast.loading('Analizando imagen y redactando información con IA...', { id: 'info-ia' })
      } else {
        toast.loading('Generando información web con IA...', { id: 'info-ia' })
      }
      const res = await api.post(`/digital/ia/productos/${producto.id}/generar-info-publicacion`, {
        imageUrl: imagenPrincipal,
      })
      const info = res.data
      setData(prev => ({
        ...prev,
        nombreWeb: info.nombreWeb || prev.nombreWeb,
        slug: info.slug || prev.slug,
        etiquetaSeo: info.etiquetaSeo || prev.etiquetaSeo,
        metaDescripcion: info.metaDescripcion || prev.metaDescripcion,
        descripcionWeb: info.descripcionWeb || prev.descripcionWeb,
      }))
      toast.success('¡Información web generada con IA! Revisa y haz clic en Guardar.', { id: 'info-ia' })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al generar información web con IA'
      toast.error(typeof msg === 'string' ? msg : 'Error al generar información con IA', { id: 'info-ia' })
    } finally {
      setGenerandoInfo(false)
    }
  }

  const subirArchivo = async (file: File) => {
    setUploadingImg(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      if (fondoEstudioIa) {
        toast.loading('Generando fondo de estudio blanco con IA...', { id: 'estudio-ia' })
        const res = await api.post(`/digital/ia/productos/${producto.id}/procesar-imagen-estudio`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const { url, imagenes } = res.data
        const nuevasImgs = imagenes || [...data.imagenes, url]
        setData(prev => ({ ...prev, imagenes: nuevasImgs }))
        refetch()
        toast.success('¡Imagen procesada con fondo blanco estudio y guardada! ✨', { id: 'estudio-ia' })
      } else {
        // Sin IA: el backend centra la foto en un lienzo cuadrado 1:1 para que la tienda no la recorte
        const response = await api.post(`/digital/ia/productos/${producto.id}/estandarizar-imagen`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const { url, imagenes } = response.data
        const updatedImgs = imagenes || [...data.imagenes, url]
        setData(prev => ({ ...prev, imagenes: updatedImgs }))
        refetch()
        toast.success('Imagen subida, cuadrada y guardada ✓')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al procesar la imagen'
      toast.error(typeof msg === 'string' ? msg : 'Error al procesar la imagen', { id: 'estudio-ia' })
    } finally {
      setUploadingImg(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await subirArchivo(file)
    if (e.target) e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, suelta un archivo de imagen válido');
      return;
    }
    await subirArchivo(file);
  }

  const save = async () => {
    try {
      const payload = buildPayload(data)
      await updateProducto(producto.id, payload)
      setSaved(true)
      refetch()
      toast.success('Configuración web guardada ✓')
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar configuración web'
      toast.error(typeof msg === 'string' ? msg : 'Error al guardar configuración web')
    }
  }

  const autoSlug = (nombre: string) =>
    nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const addImagen = async () => {
    if (!newImagen.trim()) return
    const url = newImagen.trim()
    setNewImagen('')

    if (fondoEstudioIa) {
      try {
        setUploadingImg(true)
        toast.loading('Procesando imagen con fondo de estudio blanco...', { id: 'url-estudio-ia' })
        const res = await api.post(`/digital/ia/productos/${producto.id}/procesar-imagen-estudio`, { imageUrl: url })
        const { url: urlSubida, imagenes } = res.data
        const nuevasImgs = imagenes || [...data.imagenes, urlSubida]
        setData(prev => ({ ...prev, imagenes: nuevasImgs }))
        refetch()
        toast.success('¡Imagen procesada con fondo blanco estudio! ✨', { id: 'url-estudio-ia' })
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al procesar la imagen'
        toast.error(typeof msg === 'string' ? msg : 'Error al procesar la imagen', { id: 'url-estudio-ia' })
      } finally {
        setUploadingImg(false)
      }
    } else {
      try {
        setUploadingImg(true)
        // Sin IA: se descarga la URL y se centra en lienzo cuadrado 1:1 (sin recortes en la tienda)
        const res = await api.post(`/digital/ia/productos/${producto.id}/estandarizar-imagen`, { imageUrl: url })
        const { url: urlSubida, imagenes } = res.data
        const updatedImgs = imagenes || [...data.imagenes, urlSubida]
        setData(prev => ({ ...prev, imagenes: updatedImgs }))
        refetch()
        toast.success('Imagen agregada, cuadrada y guardada ✓')
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al guardar imagen'
        toast.error(typeof msg === 'string' ? msg : 'Error al guardar imagen')
      } finally {
        setUploadingImg(false)
      }
    }
  }

  const handleConvertirFondoEstudio = async (imgUrl: string) => {
    try {
      setProcesandoThumb(imgUrl)
      toast.loading('Convirtiendo a fondo de estudio blanco con IA...', { id: 'thumb-ia' })
      const res = await api.post(`/digital/ia/productos/${producto.id}/procesar-imagen-estudio`, { imageUrl: imgUrl })
      const { imagenes } = res.data
      if (imagenes) {
        setData(prev => ({ ...prev, imagenes }))
      }
      refetch()
      toast.success('¡Foto convertida a estudio blanco puro! ✨', { id: 'thumb-ia' })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al convertir imagen a estudio'
      toast.error(typeof msg === 'string' ? msg : 'Error al convertir imagen a estudio', { id: 'thumb-ia' })
    } finally {
      setProcesandoThumb(null)
    }
  }

  const removeImagen = async (i: number) => {
    if (previewImgIndex === i) {
      setPreviewImgIndex(null)
    } else if (previewImgIndex !== null && previewImgIndex > i) {
      setPreviewImgIndex(previewImgIndex - 1)
    }
    const imageToDelete = data.imagenes[i];
    const updatedImgs = data.imagenes.filter((_, j) => j !== i)
    setData(prev => ({ ...prev, imagenes: updatedImgs }))
    try {
      const payload = buildPayload(data, updatedImgs)
      await updateProducto(producto.id, payload)
      
      // Eliminar físicamente de Cloudinary
      if (imageToDelete && imageToDelete.includes('res.cloudinary.com')) {
        try {
          await api.delete('/configuracion/archivo/cloudinary', { data: { url: imageToDelete } });
        } catch (e) {
          console.error("No se pudo eliminar la imagen físicamente de Cloudinary", e);
        }
      }

      refetch()
      toast.success('Imagen eliminada ✓')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al eliminar imagen'
      toast.error(typeof msg === 'string' ? msg : 'Error al eliminar imagen')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Globe size={18} className="text-indigo-600" /> Configuración Web / Canal Digital
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Configura la presencia del producto en la tienda virtual y canal digital del cliente.</p>
        </div>
        <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
          <Save size={14} /> {saved ? '¡Guardado!' : 'Guardar'}
        </button>
      </div>

      {/* Switches principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { key: 'publicadoWeb', label: 'Publicar en Tienda Virtual', desc: 'El producto aparecerá en la vitrina web del cliente', color: 'indigo' },
          { key: 'esDigital', label: 'Producto Digital', desc: 'Entrega electrónica (software, descarga, servicio)', color: 'purple' },
          { key: 'esDestacado', label: 'Destacado / Featured', desc: 'Aparece en secciones destacadas de la tienda', color: 'amber' },
        ].map(item => (
          <label key={item.key} className={`flex flex-col gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all ${(data as any)[item.key] ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">{item.label}</span>
              <div className={`relative w-10 h-5 rounded-full transition-colors ${(data as any)[item.key] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${(data as any)[item.key] ? 'left-5' : 'left-0.5'}`} />
                <input type="checkbox" checked={(data as any)[item.key]} onChange={e => setData(p => ({ ...p, [item.key]: e.target.checked }))} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
            <span className="text-[10px] text-slate-400">{item.desc}</span>
          </label>
        ))}
      </div>

      {/* Banner Difusión en Redes Sociales */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/10">
            <Share2 size={20} className="text-pink-300" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
              Difusión en Redes Sociales
              <span className="text-[10px] bg-pink-500/30 text-pink-200 border border-pink-400/30 px-2 py-0.5 rounded-full font-bold">Omnicanal</span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">Publica este producto en segundos con fotos de estudio, ganchos y hashtags optimizados.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
          <button
            type="button"
            onClick={() => onCompartir?.('whatsapp')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Compartir en WhatsApp (Estados o Chat)"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => onCompartir?.('instagram')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Compartir en Instagram (Feed o Historias)"
          >
            <Sparkles size={14} />
            <span>Instagram</span>
          </button>
          <button
            type="button"
            onClick={() => onCompartir?.('tiktok')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Compartir en TikTok (Video vertical 9:16)"
          >
            <Video size={14} />
            <span>TikTok</span>
          </button>
          <button
            type="button"
            onClick={() => onCompartir?.('marketplace')}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Compartir en Facebook Marketplace"
          >
            <ShoppingBag size={14} />
            <span>Marketplace</span>
          </button>
        </div>
      </div>

      {/* Campos web */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Información de Publicación</h4>
            <p className="text-[11px] text-slate-400">Datos visibles para catálogo web, buscadores y redes sociales.</p>
          </div>
          <button
            type="button"
            onClick={handleGenerarInfoPublicacion}
            disabled={generandoInfo}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            title="Generar automáticamente con IA los textos y SEO"
          >
            {generandoInfo ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generando con IA...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>✨ Autogenerar con IA</span>
              </>
            )}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nombre en Tienda Web</label>
            <input type="text" value={data.nombreWeb} onChange={e => setData(p => ({ ...p, nombreWeb: e.target.value }))}
              placeholder="Nombre visible al cliente" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">URL Amigable (Slug)</label>
            <div className="flex gap-2">
              <input type="text" value={data.slug} onChange={e => setData(p => ({ ...p, slug: e.target.value }))}
                placeholder="mi-producto-nombre" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
              <button type="button" onClick={() => setData(p => ({ ...p, slug: autoSlug(p.nombreWeb || '') }))}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all" title="Generar desde nombre web">
                <RefreshCw size={12} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Etiqueta SEO (Title)</label>
            <input type="text" value={data.etiquetaSeo} onChange={e => setData(p => ({ ...p, etiquetaSeo: e.target.value }))}
              placeholder="Título para motores de búsqueda" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Orden de Visualización</label>
            <input type="number" min="0" value={data.ordenMostrar} onChange={e => setData(p => ({ ...p, ordenMostrar: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Meta Descripción (SEO)</label>
          <input type="text" value={data.metaDescripcion} onChange={e => setData(p => ({ ...p, metaDescripcion: e.target.value }))}
             placeholder="Descripción breve para buscadores (160 caracteres)" maxLength={160}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
          <span className="text-[10px] text-slate-400">{(data.metaDescripcion || '').length}/160 caracteres</span>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Descripción Larga / Detalle del Producto</label>
          <textarea value={data.descripcionWeb} onChange={e => setData(p => ({ ...p, descripcionWeb: e.target.value }))}
            rows={5} placeholder="Descripción completa del producto visible al cliente en la tienda..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
        </div>
        {data.esDigital && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">URL de Descarga / Acceso Digital</label>
            <input type="url" value={data.urlDescarga} onChange={e => setData(p => ({ ...p, urlDescarga: e.target.value }))}
              placeholder="https://..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
          </div>
        )}
      </div>

      {/* Imágenes */}
      <div 
        className={`bg-white border-2 rounded-2xl p-5 space-y-4 transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01] border-dashed' : 'border-slate-200/80'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Upload size={14} /> Imágenes del Producto (URLs)
            </h4>
            <p className="text-[11px] text-slate-400">Puedes arrastrar fotos aquí o pegar enlaces web.</p>
          </div>
          <label className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 cursor-pointer select-none transition-colors hover:bg-indigo-100">
            <input
              type="checkbox"
              checked={fondoEstudioIa}
              onChange={(e) => setFondoEstudioIa(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <Sparkles size={13} className="text-indigo-600" />
            <span>Fondo de estudio IA (Blanco puro 1:1)</span>
          </label>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 relative">
          {/* Si está arrastrando, muestra una capa superpuesta */}
          {isDragging && (
            <div className="absolute inset-0 bg-indigo-500/10 rounded-xl border-2 border-indigo-400 border-dashed z-10 flex items-center justify-center backdrop-blur-[1px]">
              <span className="font-extrabold text-indigo-600 text-sm flex items-center gap-2"><Upload size={18} /> Suelta tu imagen aquí</span>
            </div>
          )}
          
          <input type="text" value={newImagen} onChange={e => setNewImagen(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImagen())}
            placeholder="Pegar URL de imagen o arrastra un archivo..." className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
          <button type="button" onClick={addImagen} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all" title="Agregar URL manual"><Plus size={14} /></button>
          
          <label className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-200 shrink-0">
            {uploadingImg ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            <span className="ml-1.5">{uploadingImg ? 'Subiendo...' : 'Subir Imagen'}</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImg} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => setMostrarCamara(true)}
            disabled={uploadingImg}
            className="flex items-center justify-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold cursor-pointer transition-all border border-emerald-200 shrink-0 shadow-xs"
            title="Tomar foto con la cámara del dispositivo"
          >
            <Camera size={14} className="text-emerald-600" />
            <span className="ml-1.5">Tomar Foto</span>
          </button>
        </div>
        
        {data.imagenes.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {data.imagenes.map((img, i) => (
              <div key={i} 
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', i.toString())}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  const toIndex = i;
                  if (fromIndex === toIndex || isNaN(fromIndex)) return;
                  const updatedImgs = [...data.imagenes];
                  const [moved] = updatedImgs.splice(fromIndex, 1);
                  updatedImgs.splice(toIndex, 0, moved);
                  setData(prev => ({ ...prev, imagenes: updatedImgs }));
                  try {
                    const payload = buildPayload(data, updatedImgs);
                    await updateProducto(producto.id, payload);
                    refetch();
                    toast.success('Orden de imágenes actualizado ✓');
                  } catch (err: any) {
                    const msg = err?.response?.data?.message || 'Error al actualizar el orden';
                    toast.error(typeof msg === 'string' ? msg : 'Error al actualizar el orden');
                  }
                }}
                className="group flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:shadow-md cursor-grab active:cursor-grabbing rounded-xl text-xs text-slate-600 relative overflow-hidden transition-all"
                title="Arrastra para reordenar"
              >
                {i === 0 && (
                  <div className="absolute top-0 left-0 bg-indigo-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-br-md z-10 uppercase tracking-wider">
                    Principal
                  </div>
                )}
                <div 
                  onClick={() => setPreviewImgIndex(i)}
                  className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative cursor-pointer group/thumb hover:ring-2 hover:ring-indigo-400 transition-all shadow-xs"
                  title="Clic para previsualizar en grande"
                >
                  <img src={getMediaUrl(img)} alt={`Foto ${i + 1}`} className="w-full h-full object-contain p-0.5" />
                  <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Eye size={16} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate max-w-[140px] font-mono select-none text-[11px] font-semibold text-slate-700">{img.split('/').pop()}</span>
                  <span className="text-[10px] text-slate-400">Foto {i + 1}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewImgIndex(i)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Previsualizar imagen en grande"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={procesandoThumb === img}
                    onClick={() => handleConvertirFondoEstudio(img)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Transformar esta foto a fondo blanco estudio con IA"
                  >
                    {procesandoThumb === img ? <Loader2 size={13} className="animate-spin text-indigo-600" /> : <Wand2 size={13} />}
                  </button>
                  <button type="button" onClick={() => removeImagen(i)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                    title="Eliminar imagen"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <Upload size={24} className="text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-400">Sin imágenes</p>
            <p className="text-[10px] text-slate-400 mt-1">Sube, pega una URL o arrastra un archivo aquí</p>
          </div>
        )}
      </div>

      {/* Videos del Producto (TikTok, YouTube, Shorts, Instagram, Reels, MP4) */}
      <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 space-y-4">
        <div>
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <Video size={14} className="text-rose-500" /> Videos del Producto (TikTok, YouTube, Reels, MP4)
          </h4>
          <p className="text-[11px] text-slate-400">
            Pega enlaces de <b>TikTok</b> (incluye enlaces cortos vt.tiktok.com), <b>YouTube Shorts</b>, <b>Instagram Reels</b> o archivos directos. El cliente los verá directamente en la tienda sin salir.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-7">
            <input
              type="url"
              value={newVideoUrl}
              onChange={e => setNewVideoUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVideo())}
              placeholder="https://vt.tiktok.com/... o https://www.tiktok.com/@usuario/video/..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-mono"
            />
          </div>
          <div className="sm:col-span-4">
            <input
              type="text"
              value={newVideoTitulo}
              onChange={e => setNewVideoTitulo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVideo())}
              placeholder="Título opcional (ej: Demostración)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="sm:col-span-1">
            <button
              type="button"
              onClick={addVideo}
              disabled={!newVideoUrl.trim()}
              className="w-full h-full min-h-[36px] bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center shadow-sm cursor-pointer"
              title="Agregar video"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {data.videos && data.videos.length > 0 ? (
          <div className="space-y-2 pt-1">
            {data.videos.map((vid: any, idx: number) => {
              const urlStr = typeof vid === 'string' ? vid : vid?.url || ''
              const titStr = typeof vid === 'object' ? vid?.titulo : ''
              const esTikTok = urlStr.includes('tiktok.com')
              const esYouTube = urlStr.includes('youtube.com') || urlStr.includes('youtu.be')
              const esInstagram = urlStr.includes('instagram.com')

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      esTikTok
                        ? 'bg-black text-white'
                        : esYouTube
                          ? 'bg-red-600 text-white'
                          : esInstagram
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                            : 'bg-indigo-600 text-white'
                    }`}>
                      {esTikTok ? 'TikTok' : esYouTube ? 'YouTube' : esInstagram ? 'Instagram' : 'Video'}
                    </span>
                    <div className="min-w-0">
                      {titStr && (
                        <p className="font-bold text-slate-800 truncate">{titStr}</p>
                      )}
                      <p className="font-mono text-[11px] text-slate-500 truncate max-w-md sm:max-w-xl">
                        {urlStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={urlStr}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                      title="Probar enlace original"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => removeVideo(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Quitar video"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 italic">No hay videos vinculados a este producto todavía.</p>
        )}
      </div>

      {/* ── MODAL LIGHTBOX DE PREVISUALIZACIÓN DE IMÁGENES ── */}
      {previewImgIndex !== null && data.imagenes[previewImgIndex] && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewImgIndex(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Lightbox */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <Eye size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Previsualización de Imagen
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                      {previewImgIndex + 1} de {data.imagenes.length}
                    </span>
                    {previewImgIndex === 0 && (
                      <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full uppercase">
                        Principal
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={getMediaUrl(data.imagenes[previewImgIndex])}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="Abrir imagen original en nueva pestaña"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImgIndex(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="Cerrar vista previa (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Contenedor central de la imagen con controles de navegación */}
            <div className="relative flex-1 bg-slate-100/80 flex items-center justify-center p-4 min-h-[350px] max-h-[58vh] overflow-hidden select-none">
              {/* Botón Anterior */}
              {data.imagenes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPreviewImgIndex(prev => (prev !== null && prev > 0 ? prev - 1 : data.imagenes.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-lg flex items-center justify-center transition-all z-10 cursor-pointer hover:scale-105"
                  title="Imagen anterior (Flecha izquierda)"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              {/* Imagen en alta resolución con fondo de estudio */}
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={getMediaUrl(data.imagenes[previewImgIndex])}
                  alt={`Previsualización ${previewImgIndex + 1}`}
                  className="max-h-[54vh] max-w-full object-contain rounded-2xl drop-shadow-md bg-white p-2"
                />
              </div>

              {/* Botón Siguiente */}
              {data.imagenes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPreviewImgIndex(prev => (prev !== null && prev < data.imagenes.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-lg flex items-center justify-center transition-all z-10 cursor-pointer hover:scale-105"
                  title="Imagen siguiente (Flecha derecha)"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>

            {/* Footer con URL y acciones rápidas */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Enlace del archivo</p>
                <p className="font-mono text-[11px] text-slate-600 truncate bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg select-all">
                  {data.imagenes[previewImgIndex]}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                {previewImgIndex !== 0 && (
                  <button
                    type="button"
                    onClick={() => marcarImagenPrincipal(previewImgIndex)}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Star size={13} />
                    <span>Hacer Principal</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={procesandoThumb === data.imagenes[previewImgIndex]}
                  onClick={() => handleConvertirFondoEstudio(data.imagenes[previewImgIndex])}
                  className="px-3 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Mejorar foto con IA a fondo blanco estudio"
                >
                  {procesandoThumb === data.imagenes[previewImgIndex] ? (
                    <Loader2 size={13} className="animate-spin text-indigo-600" />
                  ) : (
                    <Wand2 size={13} />
                  )}
                  <span>Fondo Blanco IA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewImgIndex(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CAPTURA DE CÁMARA EN VIVO ── */}
      <CameraCaptureModal
        isOpen={mostrarCamara}
        onClose={() => setMostrarCamara(false)}
        onCapture={(file) => subirArchivo(file)}
        conFondoIa={fondoEstudioIa}
        titulo={`Tomar Foto - ${producto?.nombre || 'Producto'}`}
      />
    </div>
  )
}

/* ---- TAB: Documentos ---- */
// Helper to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/* ---- TAB: Documentos ---- */
function TabDocumentos({ producto, refetch }: { producto: any; refetch: () => void }) {
  const [docs, setDocs] = useState<any[]>(() => Array.isArray(producto.documentos) ? producto.documentos : [])
  const [form, setForm] = useState<any>({ nombre: '', tipo: 'PDF', url: '', descripcion: '', size: 0 })
  const [adding, setAdding] = useState(false)
  const [uploading, setUploading] = useState(false)

  const save = async (updated: any[]) => {
    try {
      setDocs(updated)
      await updateProducto(producto.id, { documentos: updated })
      refetch()
    } catch (err) {
      alert('Error al guardar documentos')
    }
  }

  const addDoc = () => {
    if (!form.nombre || !form.url) return
    save([...docs, { ...form, id: Date.now() }])
    setForm({ nombre: '', tipo: 'PDF', url: '', descripcion: '', size: 0 })
    setAdding(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/configuracion/archivo/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { url, nombre, size, tipo } = response.data
      setForm((p: any) => ({
        ...p,
        nombre: p.nombre || nombre,
        url,
        tipo,
        size,
      }))
      toast.success('Archivo cargado exitosamente ✓')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al subir el archivo'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const TIPO_ICONS: Record<string, string> = { PDF: '📄', Excel: '📊', Word: '📝', Imagen: '🖼️', Video: '🎬', Otro: '📎' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-indigo-600" /> Documentos del Producto</h3>
          <p className="text-xs text-slate-400 mt-0.5">Fichas técnicas, manuales, catálogos y otros archivos vinculados al producto.</p>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
          <Plus size={14} /> Agregar Documento
        </button>
      </div>

      {/* Formulario de agregar */}
      {adding && (
        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest">Nuevo Documento</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nombre del Documento *</label>
              <input type="text" value={form.nombre} onChange={e => setForm((p: any) => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej. Ficha Técnica v2" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={e => setForm((p: any) => ({ ...p, tipo: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer">
                {['PDF', 'Excel', 'Word', 'Imagen', 'Video', 'Otro'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Cargar Archivo Local</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer select-none">
                  <Upload size={14} />
                  {uploading ? 'Subiendo...' : 'Seleccionar Archivo'}
                  <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                </label>
                {form.url && (
                  <span className="text-[10px] font-mono text-emerald-600 truncate max-w-xs">
                    ✓ Cargado: {form.nombre} ({formatBytes(form.size || 0)})
                  </span>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">O pega la URL / Ruta del Archivo *</label>
              <input type="text" value={form.url} onChange={e => setForm((p: any) => ({ ...p, url: e.target.value }))}
                placeholder="https://drive.google.com/... o ruta interna" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Descripción (Opcional)</label>
              <input type="text" value={form.descripcion} onChange={e => setForm((p: any) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Breve descripción del contenido" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all">Cancelar</button>
            <button type="button" onClick={addDoc} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"><Save size={13} /> Guardar</button>
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      {docs.length > 0 ? (
        <div className="space-y-3">
          {docs.map((doc, i) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:border-indigo-100 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{TIPO_ICONS[doc.tipo] || '📎'}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{doc.nombre}</p>
                  {doc.descripcion && <p className="text-[10px] text-slate-400">{doc.descripcion}</p>}
                  {doc.size > 0 && <p className="text-[9px] font-bold text-slate-400">Tamaño: {formatBytes(doc.size)}</p>}
                  <p className="text-[10px] font-mono text-slate-400 truncate max-w-sm">{doc.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">{doc.tipo}</span>
                <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><ExternalLink size={14} /></a>
                <button onClick={() => save(docs.filter((_, j) => j !== i))} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : !adding ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
          <FileText size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-400">Sin documentos vinculados</p>
          <p className="text-xs text-slate-300 mt-1">Agrega fichas técnicas, manuales o catálogos del producto.</p>
        </div>
      ) : null}
    </div>
  )
}

/* ---- TAB: Compras ---- */
function TabCompras({ productoId, sku }: { productoId: number; sku: string }) {
  const { data: ocAll = [], isLoading: loadingOc } = useQuery({
    queryKey: ['oc_all'],
    queryFn: () => getOrdenesCompra(),
  })

  const { data: fcAll = [], isLoading: loadingFc } = useQuery({
    queryKey: ['fc_all'],
    queryFn: () => getFacturasCompra(),
  })

  const [seccionCompras, setSeccionCompras] = useState<'FC' | 'OC'>('FC')

  const ocProducto = (Array.isArray(ocAll) ? ocAll : []).filter(oc =>
    oc.items?.some((item: any) => item.productoId === productoId)
  )

  const fcProducto = (Array.isArray(fcAll) ? fcAll : []).filter((fc: any) =>
    fc.items?.some((item: any) => item.productoId === productoId)
  )

  const ESTADO_COLOR: Record<string, string> = {
    BORRADOR: 'bg-slate-100 text-slate-600',
    PENDIENTE: 'bg-amber-50 text-amber-700',
    APROBADA: 'bg-blue-50 text-blue-700',
    RECIBIDA: 'bg-emerald-50 text-emerald-700',
    PAGADA: 'bg-emerald-50 text-emerald-700',
    ANULADA: 'bg-rose-50 text-rose-700',
  }

  const isLoading = loadingOc || loadingFc
  if (isLoading) return <div className="py-16 text-center text-slate-400 text-sm">Cargando historial de compras...</div>

  const totalCompradoFC = fcProducto.reduce((acc: number, fc: any) => {
    const item = fc.items?.find((i: any) => i.productoId === productoId)
    return acc + (item ? Number(item.subtotal || (Number(item.cantidad) * Number(item.costoUnitario)) || 0) : 0)
  }, 0)

  const totalCantFC = fcProducto.reduce((acc: number, fc: any) => {
    const item = fc.items?.find((i: any) => i.productoId === productoId)
    return acc + (item ? Number(item.cantidad || 0) : 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <ShoppingCart size={18} className="text-indigo-600" /> Trazabilidad de Compras
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Historial de facturas de compra (proveedores) y órdenes de compra que incluyen este producto.
          </p>
        </div>

        {/* Selector de sub-sección: Facturas de Compra vs Órdenes de Compra */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSeccionCompras('FC')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              seccionCompras === 'FC'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Facturas de Compra</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              seccionCompras === 'FC' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-600'
            }`}>
              {fcProducto.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSeccionCompras('OC')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              seccionCompras === 'OC'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Órdenes de Compra</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              seccionCompras === 'OC' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-600'
            }`}>
              {ocProducto.length}
            </span>
          </button>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturas de Compra</p>
          <p className="text-xl font-extrabold text-slate-800 mt-1">{fcProducto.length}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unidades Compradas (FC)</p>
          <p className="text-xl font-extrabold text-indigo-600 mt-1">{totalCantFC.toLocaleString()} und</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Comprado (FC)</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{fmtCOP(totalCompradoFC)}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Órdenes de Compra</p>
          <p className="text-xl font-extrabold text-purple-600 mt-1">{ocProducto.length}</p>
        </div>
      </div>

      {/* Tabla según subsección seleccionada */}
      {seccionCompras === 'FC' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Factura Compra</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">N° Proveedor</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cantidad</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Costo Unit.</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fcProducto.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <ShoppingCart size={32} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-400">Sin facturas de compra registradas</p>
                      <p className="text-xs text-slate-300 mt-1">Las facturas de compra que incluyan este producto aparecerán aquí.</p>
                    </td>
                  </tr>
                ) : (
                  fcProducto.map((fc: any) => {
                    const item = fc.items?.find((i: any) => i.productoId === productoId)
                    const sub = Number(item?.subtotal || (Number(item?.cantidad || 0) * Number(item?.costoUnitario || 0)))
                    return (
                      <tr key={fc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-600 text-xs">
                          {fc.numero || `FC-${fc.id}`}
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600">
                          {fc.consecutivoProveedor || '—'}
                        </td>
                        <td className="p-4 text-sm text-slate-700">
                          <p className="font-bold">{fc.proveedor?.nombre || '—'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{fc.proveedor?.numeroDocumento || ''}</p>
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {fc.fechaFactura ? new Date(fc.fechaFactura).toLocaleDateString('es-CO') : (fc.createdAt ? new Date(fc.createdAt).toLocaleDateString('es-CO') : '—')}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-700">
                          {item?.cantidad ?? '—'}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-600 text-xs">
                          {fmtCOP(Number(item?.costoUnitario ?? 0))}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-800">
                          {fmtCOP(sub)}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${ESTADO_COLOR[fc.estado] || 'bg-slate-100 text-slate-600'}`}>
                            {fc.estado || 'REGISTRADA'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">OC #</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cantidad</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Costo Unit.</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ocProducto.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <ShoppingCart size={32} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-400">Sin órdenes de compra registradas</p>
                      <p className="text-xs text-slate-300 mt-1">Las OC que incluyan este producto aparecerán aquí.</p>
                    </td>
                  </tr>
                ) : (
                  ocProducto.map(oc => {
                    const item = oc.items?.find((i: any) => i.productoId === productoId)
                    return (
                      <tr key={oc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-700 text-xs">{oc.numero}</td>
                        <td className="p-4 text-sm text-slate-700">{oc.proveedor?.nombre}</td>
                        <td className="p-4 text-xs text-slate-500">{new Date(oc.fechaEmision).toLocaleDateString('es-CO')}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-700">{item?.cantidad ?? '—'}</td>
                        <td className="p-4 text-right font-mono text-slate-600 text-xs">{fmtCOP(Number(item?.costoUnitario ?? 0))}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-800">{fmtCOP(Number(item?.total ?? 0))}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${ESTADO_COLOR[oc.estado] || 'bg-slate-100 text-slate-600'}`}>
                            {oc.estado}
                          </span>
                        </td>
                        <td className="p-4">
                          <Link to={`/inventario/ordenes-compra/${oc.id}`} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center justify-center" title="Ver OC completa">
                            <ExternalLink size={14} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- TAB: Proveedores ---- */
function TabProveedores({ producto, refetch }: { producto: any; refetch: () => void }) {
  // Impuestos desde Configuración - Contable (/impuestos)
  const { data: rawImpuestos = [] } = useQuery({ queryKey: ['impuestos'], queryFn: getImpuestos })
  const impuestosDisponibles = Array.isArray(rawImpuestos)
    ? rawImpuestos.filter((t: any) => t.activo !== false && t.estado !== 'INACTIVO' && t.retencionCompra !== true)
    : []

  const [vinculados, setVinculados] = useState<any[]>(() => {
    return (producto.proveedoresRel || []).map((rel: any) => ({
      id: rel.proveedor?.id || rel.proveedorId,
      nombre: rel.proveedor?.nombre || '',
      nombreComercial: rel.proveedor?.nombreComercial || '',
      email: rel.proveedor?.email || '',
      telefono: rel.proveedor?.telefono || '',
      esPrincipal: rel.prioridad === 1 || rel.esPrincipal || false,
      precioAcordado: Number(rel.precioCompra || 0),
      impuestoId: rel.impuestoId ? String(rel.impuestoId) : (rel.impuesto?.id ? String(rel.impuesto.id) : ''),
      plazoEntrega: Number(rel.tiempoEntregaDias || 0),
      notas: rel.notas || ''
    }))
  })
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [saved, setSaved] = useState(false)

  const { data: todosProveedores = [] } = useQuery({ queryKey: ['proveedores'], queryFn: () => getProveedores() })

  const disponibles = todosProveedores.filter(p =>
    !vinculados.some(v => v.id === p.id) &&
    (p.nombre.toLowerCase().includes(search.toLowerCase()) || (p.numeroDocumento || '').includes(search))
  )

  const save = async (listToSave: any[] = vinculados) => {
    try {
      await updateProducto(producto.id, { proveedores: listToSave })
      setSaved(true)
      toast.success('Proveedores y condiciones guardados correctamente')
      refetch()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toast.error('Error al guardar los proveedores')
    }
  }

  const vincular = (prov: any) => {
    const defaultTax = impuestosDisponibles.find((t: any) => t.esDefecto) || impuestosDisponibles[0]
    const updated = [...vinculados, {
      id: prov.id,
      nombre: prov.nombre,
      nombreComercial: prov.nombreComercial,
      email: prov.email,
      telefono: prov.telefono,
      esPrincipal: vinculados.length === 0,
      precioAcordado: 0,
      impuestoId: defaultTax ? String(defaultTax.id) : '',
      plazoEntrega: prov.plazoEntregaDias || 0,
      notas: ''
    }]
    setVinculados(updated)
    save(updated)
    setShowSearch(false)
    setSearch('')
  }

  const marcarPrincipal = (id: number) => {
    const updated = vinculados.map(v => ({ ...v, esPrincipal: v.id === id }))
    setVinculados(updated)
    save(updated)
  }

  const desvincular = (id: number) => {
    const updated = vinculados.filter(v => v.id !== id)
    setVinculados(updated)
    save(updated)
  }

  const updateVinculado = (id: number, field: string, value: any) => {
    const updated = vinculados.map(v => v.id === id ? { ...v, [field]: value } : v)
    setVinculados(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2"><Building2 size={18} className="text-indigo-600" /> Proveedores del Producto</h3>
          <p className="text-xs text-slate-400 mt-0.5">Vincula los proveedores habituales, su precio acordado con impuesto contable y marca el principal.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSearch(!showSearch)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all">
            <Plus size={14} /> Vincular Proveedor
          </button>
          <button onClick={() => save()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
            <Save size={14} /> {saved ? '¡Guardado!' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Buscador */}
      {showSearch && (
        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 space-y-3 shadow-sm">
          <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest">Buscar y Vincular Proveedor</h4>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o NIT..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {disponibles.slice(0, 8).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer" onClick={() => vincular(p)}>
                <div>
                  <p className="text-xs font-bold text-slate-800">{p.nombre}</p>
                  {p.nombreComercial && <p className="text-[10px] text-slate-400">{p.nombreComercial}</p>}
                </div>
                <button className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"><Link2 size={12} /></button>
              </div>
            ))}
            {disponibles.length === 0 && <p className="text-xs text-slate-400 italic py-4 text-center">No hay proveedores disponibles para vincular.</p>}
          </div>
          <button onClick={() => setShowSearch(false)} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
        </div>
      )}

      {/* Lista vinculados */}
      {vinculados.length > 0 ? (
        <div className="space-y-4">
          {vinculados.map(v => {
            const taxObj = impuestosDisponibles.find((t: any) => String(t.id) === String(v.impuestoId))
            const taxRate = taxObj ? Number(taxObj.tarifa || 0) : 0
            const precioBase = Number(v.precioAcordado || 0)
            const totalConImpuesto = Math.round(precioBase * (1 + taxRate / 100))

            return (
              <div key={v.id} className={`bg-white border-2 rounded-2xl p-5 shadow-sm transition-colors ${v.esPrincipal ? 'border-indigo-200' : 'border-slate-200/80'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm ${v.esPrincipal ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {v.nombre.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-slate-800">{v.nombre}</p>
                        {v.esPrincipal && <span className="flex items-center gap-1 text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase"><Star size={9} /> Principal</span>}
                      </div>
                      {v.nombreComercial && <p className="text-[10px] text-slate-400">{v.nombreComercial}</p>}
                      {v.email && <p className="text-[10px] text-slate-400">{v.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!v.esPrincipal && (
                      <button onClick={() => marcarPrincipal(v.id)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-lg text-[10px] font-bold transition-all">
                        <Star size={11} /> Marcar Principal
                      </button>
                    )}
                    <button onClick={() => desvincular(v.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Precio Acordado ($)</label>
                    <input type="number" min="0" step="any" value={v.precioAcordado} onChange={e => updateVinculado(v.id, 'precioAcordado', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Impuesto (Contable)</label>
                      {taxRate > 0 && (
                        <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded">
                          +{taxRate}%
                        </span>
                      )}
                    </div>
                    <select
                      value={v.impuestoId || ''}
                      onChange={e => updateVinculado(v.id, 'impuestoId', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="">Sin impuesto (0%)</option>
                      {impuestosDisponibles.map((imp: any) => (
                        <option key={imp.id} value={imp.id}>
                          {imp.nombre} ({Number(imp.tarifa)}%)
                        </option>
                      ))}
                    </select>
                    {precioBase > 0 && taxRate > 0 && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">
                        Total c/Impuesto: ${totalConImpuesto.toLocaleString('es-CO')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Plazo de Entrega (días)</label>
                    <input type="number" min="0" value={v.plazoEntrega} onChange={e => updateVinculado(v.id, 'plazoEntrega', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Notas de Negociación</label>
                    <input type="text" value={v.notas || ''} onChange={e => updateVinculado(v.id, 'notas', e.target.value)} placeholder="Condiciones, descuentos..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : !showSearch ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
          <Building2 size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-400">Sin proveedores vinculados</p>
          <p className="text-xs text-slate-300 mt-1">Vincula los proveedores habituales de este producto.</p>
        </div>
      ) : null}
    </div>
  )
}

/* ---- TAB: Stock ---- */
function TabStock({ producto, refetch }: { producto: any; refetch: () => void }) {
  const [config, setConfig] = useState({
    stockMinimo: Number(producto.stockMinimo || 0),
    stockMaximo: Number(producto.stockMaximo || 0),
    puntoReorden: Number(producto.puntoReorden || 0),
  })
  const [saved, setSaved] = useState(false)

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ['stock_producto', producto.id],
    queryFn: () => getStockProducto(producto.id),
  })

  const totalDisponible = stock.reduce((a: number, s: any) => a + (s.cantidad - s.cantidadReservada), 0)
  const totalCantidad = stock.reduce((a: number, s: any) => a + s.cantidad, 0)
  const totalReservado = stock.reduce((a: number, s: any) => a + s.cantidadReservada, 0)

  const save = async () => {
    try {
      await updateProducto(producto.id, config)
      setSaved(true)
      refetch()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert('Error al guardar niveles de stock')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2"><Layers size={18} className="text-indigo-600" /> Stock por Bodega</h3>
        <p className="text-xs text-slate-400 mt-0.5">Inventario en tiempo real consultado desde el sistema.</p>
      </div>

      {/* KPIs de stock */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Stock Total', value: totalCantidad, unit: 'und', color: 'indigo' },
          { label: 'Disponible', value: totalDisponible, unit: 'und', color: 'emerald' },
          { label: 'Reservado', value: totalReservado, unit: 'und', color: 'amber' },
          { label: 'Bodegas', value: stock.length, unit: '', color: 'purple' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{kpi.value}<span className="text-xs font-bold text-slate-400 ml-1">{kpi.unit}</span></p>
          </div>
        ))}
      </div>

      {/* Tabla de stock por bodega */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2"><Warehouse size={14} /> Distribución por Bodega</h4>
          <Link to={`/inventario/movimientos`} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
            Ver Movimientos <ExternalLink size={11} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-10 text-center text-slate-400 text-sm">Cargando stock...</div>
          ) : stock.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bodega</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cantidad</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Reservada</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Disponible</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stock.map((s: any) => {
                  const libre = s.cantidad - s.cantidadReservada
                  const pct = s.cantidad > 0 ? (libre / s.cantidad) * 100 : 0
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Warehouse size={14} className="text-slate-400" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{s.bodega.nombre}</p>
                            <p className="text-[10px] font-mono text-slate-400">{s.bodega.codigo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-700">{s.cantidad}</td>
                      <td className="p-4 text-right font-mono text-amber-600">{s.cantidadReservada}</td>
                      <td className="p-4 text-right font-mono font-extrabold text-emerald-700">{libre}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-20">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400">{Math.round(pct)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-14 text-center">
              <Layers size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-400">Sin stock registrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Configuración de niveles */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Configuración de Niveles de Stock</h4>
          <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
            <Save size={13} /> {saved ? '¡Guardado!' : 'Guardar'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: 'stockMinimo', label: 'Stock Mínimo', desc: 'Nivel mínimo antes de alerta', color: 'rose' },
            { key: 'stockMaximo', label: 'Stock Mínimo/Máximo', desc: 'Capacidad máxima de almacenaje', color: 'blue' },
            { key: 'puntoReorden', label: 'Punto de Reorden', desc: 'Nivel para generar OC automáticamente', color: 'amber' },
          ].map(f => (
            <div key={f.key} className="p-4 bg-slate-50/75 border border-slate-200/60 rounded-2xl space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">{f.label === 'Stock Mínimo/Máximo' ? (f.key === 'stockMaximo' ? 'Stock Máximo' : 'Stock Mínimo') : f.label}</label>
              <input type="number" min="0" value={(config as any)[f.key]} onChange={e => setConfig((p: any) => ({ ...p, [f.key]: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
              <p className="text-[10px] text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---- TAB: Costeo ---- */
function TabCosteo({ producto, refetch }: { producto: any; refetch: () => void }) {
  const [data, setData] = useState(() => {
    const costeo = producto.costeo || {}
    return {
      metodoCosteo: costeo.metodoCosteo || 'CPP',
      costoMO: Number(costeo.costoMO || 0),
      costoGIF: Number(costeo.costoGIF || 0),
      costoTransporte: Number(costeo.costoTransporte || 0),
      costoEmbalaje: Number(costeo.costoEmbalaje || 0),
      costoOtros: Number(costeo.costoOtros || 0),
      margenObjetivo: Number(costeo.margenObjetivo || 30),
      monedaCompra: costeo.monedaCompra || 'COP',
      tasaCambio: Number(costeo.tasaCambio || 1),
      notas: costeo.notas || '',
    }
  })
  const [saved, setSaved] = useState(false)

  const save = async () => {
    try {
      await updateProducto(producto.id, { costeo: data })
      setSaved(true)
      refetch()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert('Error al guardar configuración de costeo')
    }
  }

  const costoBase = Number(producto.costo || producto.costoPromedio || 0)
  const costoUltimo = Number(producto.costoUltimo || 0)
  const precio1 = Number(producto.precios?.[0] || producto.precioBase || 0)

  const costoTotal = costoBase + Number(data.costoMO) + Number(data.costoGIF) + Number(data.costoTransporte) + Number(data.costoEmbalaje) + Number(data.costoOtros)
  const margenReal = precio1 > 0 ? ((precio1 - costoTotal) / precio1) * 100 : 0
  const utilidad = precio1 - costoTotal
  const precioSugerido = costoTotal > 0 ? costoTotal / (1 - Number(data.margenObjetivo) / 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2"><DollarSign size={18} className="text-indigo-600" /> Estructura de Costeo</h3>
          <p className="text-xs text-slate-400 mt-0.5">Análisis de costos, márgenes de contribución y precio sugerido.</p>
        </div>
        <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
          <Save size={13} /> {saved ? '¡Guardado!' : 'Guardar'}
        </button>
      </div>

      {/* KPIs de análisis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Costo Unitario Total', value: fmtCOP(costoTotal), desc: 'Con todos los componentes', highlight: false },
          { label: 'Precio de Venta (P1)', value: fmtCOP(precio1), desc: 'Precio base actual', highlight: false },
          { label: 'Utilidad Bruta', value: fmtCOP(utilidad), desc: 'P1 − Costo total', highlight: utilidad > 0 },
          { label: 'Margen Real', value: `${margenReal.toFixed(1)}%`, desc: 'Sobre precio de venta', highlight: margenReal >= Number(data.margenObjetivo) },
        ].map(kpi => (
          <div key={kpi.label} className={`border rounded-2xl p-4 shadow-sm ${kpi.highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200/80'}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-xl font-extrabold mt-1 ${kpi.highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{kpi.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* Precio sugerido */}
      {precioSugerido > 0 && (
        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${margenReal >= Number(data.margenObjetivo) ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <Calculator size={24} className={margenReal >= Number(data.margenObjetivo) ? 'text-emerald-600' : 'text-amber-600'} />
          <div>
            <p className="text-xs font-extrabold text-slate-700">Precio Sugerido para Margen Objetivo ({data.margenObjetivo}%)</p>
            <p className="text-2xl font-extrabold text-slate-800">{fmtCOP(precioSugerido)}</p>
            <p className="text-[10px] text-slate-500">Precio actual: {fmtCOP(precio1)} — {margenReal >= Number(data.margenObjetivo) ? '✅ Margen objetivo cumplido' : `⚠️ Faltan ${(Number(data.margenObjetivo) - margenReal).toFixed(1)}% de margen`}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estructura de costos */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={14} /> Componentes del Costo</h4>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Costo Base (Ficha Técnica)</p>
              <p className="text-xs text-slate-400 mt-0.5">Cargado desde la ficha del producto</p>
            </div>
            <span className="font-mono font-extrabold text-slate-800">{fmtCOP(costoBase)}</span>
          </div>

          {[
            { key: 'costoMO', label: 'Mano de Obra (MO)', placeholder: '0' },
            { key: 'costoGIF', label: 'Gastos Indirectos de Fabricación (GIF)', placeholder: '0' },
            { key: 'costoTransporte', label: 'Flete / Transporte', placeholder: '0' },
            { key: 'costoEmbalaje', label: 'Embalaje / Packaging', placeholder: '0' },
            { key: 'costoOtros', label: 'Otros Costos', placeholder: '0' },
          ].map(f => (
            <div key={f.key} className="flex items-center gap-3">
              <label className="flex-1 text-xs font-medium text-slate-600">{f.label}</label>
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                <input type="number" min="0" value={(data as any)[f.key] || ''} onChange={e => setData((p: any) => ({ ...p, [f.key]: Number(e.target.value) }))}
                  placeholder={f.placeholder} className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-right text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-3">
            <span className="text-xs font-extrabold text-slate-700 uppercase">COSTO TOTAL</span>
            <span className="font-mono font-extrabold text-indigo-700 text-base">{fmtCOP(costoTotal)}</span>
          </div>
        </div>

        {/* Configuración y referencia */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Parámetros de Costeo</h4>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Método de Costeo</label>
              <select value={data.metodoCosteo} onChange={e => setData((p: any) => ({ ...p, metodoCosteo: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer">
                <option value="CPP">CPP — Costo Promedio Ponderado</option>
                <option value="FIFO">FIFO — Primero en Entrar, Primero en Salir</option>
                <option value="LIFO">LIFO — Último en Entrar, Primero en Salir</option>
                <option value="ESTANDAR">Costo Estándar</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Margen Objetivo (%)</label>
              <div className="relative">
                <input type="number" min="0" max="100" value={data.margenObjetivo} onChange={e => setData((p: any) => ({ ...p, margenObjetivo: Number(e.target.value) }))}
                  className="w-full px-3 py-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Moneda Compra</label>
                <select value={data.monedaCompra} onChange={e => setData((p: any) => ({ ...p, monedaCompra: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs cursor-pointer outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all">
                  {['COP', 'USD', 'EUR', 'CNY', 'BRL'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tasa de Cambio</label>
                <input type="number" min="1" value={data.tasaCambio} onChange={e => setData((p: any) => ({ ...p, tasaCambio: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-mono" />
              </div>
            </div>
          </div>

          {/* Histórico referencia */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Referencia de Costos (Ficha Técnica)</h4>
            {[
              { label: 'Costo Unitario Base', value: fmtCOP(Number(producto.costo || 0)) },
              { label: 'Costo Promedio (CPP)', value: fmtCOP(Number(producto.costoPromedio || 0)) },
              { label: 'Costo Última Compra', value: fmtCOP(Number(producto.costoUltimo || 0)) },
              { label: 'Precio Base (P1)', value: fmtCOP(precio1) },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-500">{r.label}</span>
                <span className="font-mono text-xs font-bold text-slate-800">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Notas de Costeo</label>
        <textarea value={data.notas} onChange={e => setData((p: any) => ({ ...p, notas: e.target.value }))}
          rows={3} placeholder="Observaciones sobre estructura de costos, acuerdos con proveedor, etc."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
      </div>
    </div>
  )
}

/* ---- MODAL: Impresión de Etiquetas para Impresora Térmica y BarTender ---- */
function ModalImprimirEtiquetasProducto({
  producto,
  items,
  onClose,
}: {
  producto: any;
  items: BarcodeItemParaImprimir[];
  onClose: () => void;
}) {
  const [lista, setLista] = useState<BarcodeItemParaImprimir[]>(items);
  const [selectedPreviewIdx, setSelectedPreviewIdx] = useState<number>(0);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [rotacion, setRotacion] = useState<0 | 90 | 180 | 270>(0);

  const fmtCOP = (val: number) => `$${Number(val || 0).toLocaleString('es-CO')}`;

  const toggleItem = (idx: number) => {
    setLista(prev => prev.map((it, i) => i === idx ? { ...it, incluir: !it.incluir } : it));
  };

  const setCantidad = (idx: number, cant: number) => {
    const val = Math.max(0, cant);
    setLista(prev => prev.map((it, i) => i === idx ? { ...it, cantidadCopias: val } : it));
  };

  const aplicarStockFisico = () => {
    setLista(prev =>
      prev.map(it => ({
        ...it,
        cantidadCopias: Math.max(0, it.stockActual),
        incluir: it.stockActual > 0 || it.incluir,
      }))
    );
    toast.success('Cantidades ajustadas según stock en bodega');
  };

  const setUnaCopiaATodos = () => {
    setLista(prev => prev.map(it => ({ ...it, cantidadCopias: 1, incluir: true })));
    toast.success('1 copia configurada para todos');
  };

  const itemsSeleccionados = lista.filter(it => it.incluir && it.cantidadCopias > 0);
  const totalEtiquetas = itemsSeleccionados.reduce((s, it) => s + it.cantidadCopias, 0);
  const filasEstimadas = Math.ceil(totalEtiquetas / 3);

  const previewItem = itemsSeleccionados[selectedPreviewIdx] || itemsSeleccionados[0] || lista[0];

  // Generar array plano de etiquetas individuales para la cuadrícula continua de 3 columnas
  const etiquetasPlanas: BarcodeItemParaImprimir[] = [];
  itemsSeleccionados.forEach(it => {
    for (let c = 0; c < it.cantidadCopias; c++) {
      etiquetasPlanas.push(it);
    }
  });

  // Agrupar en filas de a 3 (3 al paso)
  const filasDeTres: BarcodeItemParaImprimir[][] = [];
  for (let i = 0; i < etiquetasPlanas.length; i += 3) {
    filasDeTres.push(etiquetasPlanas.slice(i, i + 3));
  }

  const handleDescargarBarTender = () => {
    if (itemsSeleccionados.length === 0) {
      toast.error('Selecciona al menos un ítem con cantidad mayor a 0');
      return;
    }
    const filasCsv = itemsSeleccionados.map(it => ({
      producto: it.nombreProducto,
      variante: it.nombreVariante || '',
      codigoBarras: it.codigoBarras,
      referencia: it.sku,
      precio: it.precio,
      cantidad: it.cantidadCopias,
    }));
    const skuLimpio = (producto.sku || producto.referencia || `prod-${producto.id}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    descargarCSVBarTender(`etiquetas_${skuLimpio}`, filasCsv);
    toast.success('Archivo CSV descargado. Conéctalo desde Archivo > Conexión a Base de Datos en BarTender ✓');
  };

  const limpiarImpresion = () => {
    document.body.classList.remove('imprimiendo-etiquetas-termicas');
    setImprimiendo(false);
  };

  const handleImprimirDirecto = () => {
    if (etiquetasPlanas.length === 0) {
      toast.error('No hay etiquetas seleccionadas para imprimir');
      return;
    }
    setImprimiendo(true);
    document.body.classList.add('imprimiendo-etiquetas-termicas');

    window.onafterprint = limpiarImpresion;

    setTimeout(() => {
      window.print();
      // Garantizar que se desbloquee incluso si onafterprint no dispara
      setTimeout(limpiarImpresion, 1000);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-inner">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                Imprimir Códigos de Barra
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                  Rollo 3 al Paso (104 × 20 mm)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {producto.nombre} · SKU: <span className="font-mono font-bold text-slate-600">{producto.sku}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Tabla y Configuración de Cantidades (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Barra de atajos rápidos */}
            <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <span className="text-xs font-bold text-slate-600">Atajos de cantidad:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={aplicarStockFisico}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles size={13} /> Usar Stock en Bodega
                </button>
                <button
                  type="button"
                  onClick={setUnaCopiaATodos}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  1 Copia c/u
                </button>
              </div>
            </div>

            {/* Lista de productos y variantes */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
              {lista.map((it, idx) => (
                <div
                  key={it.id}
                  onClick={() => setSelectedPreviewIdx(idx)}
                  className={`p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    selectedPreviewIdx === idx ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={it.incluir}
                      onChange={e => {
                        e.stopPropagation();
                        toggleItem(idx);
                      }}
                      className="rounded text-indigo-600 h-4 w-4 shrink-0 cursor-pointer"
                    />
                    {it.colorHex && (
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                        style={{ backgroundColor: it.colorHex }}
                        title={it.nombreVariante}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {it.nombreVariante ? `${it.nombreVariante}` : it.nombreProducto}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>Cód: <strong className="text-slate-600">{it.codigoBarras}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold">Stock: {it.stockActual}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selector de copias */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setCantidad(idx, it.cantidadCopias - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-all text-xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={it.cantidadCopias}
                      onChange={e => setCantidad(idx, parseInt(e.target.value, 10) || 0)}
                      className="w-12 text-center text-xs font-extrabold font-mono py-1 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCantidad(idx, it.cantidadCopias + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-all text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen de conteo */}
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
              <span className="font-medium">Total de etiquetas seleccionadas:</span>
              <span className="font-extrabold text-sm text-indigo-700 font-mono">
                {totalEtiquetas} unds · {filasEstimadas} filas (3 al paso)
              </span>
            </div>
          </div>

          {/* Columna Derecha: Vista Previa Fiel a la Etiqueta Física (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Vista Previa
                </span>
                {/* Selector de Giro cada 90 grados */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 px-1 flex items-center gap-1">
                    <RefreshCw size={11} /> Giro:
                  </span>
                  {([0, 90, 180, 270] as const).map(deg => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setRotacion(deg)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                        rotacion === deg
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenedor de la etiqueta simulada física */}
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-center overflow-hidden min-h-[175px]">
                {previewItem ? (
                  <div
                    className="bg-white rounded-xl shadow-lg border border-slate-300 p-2 flex flex-col items-center justify-between text-center select-none transition-all duration-200"
                    style={{
                      width: rotacion === 90 || rotacion === 270 ? '135px' : '220px',
                      height: rotacion === 90 || rotacion === 270 ? '220px' : '135px',
                      transform: `rotate(${rotacion}deg)`,
                    }}
                  >
                    {/* Header marca */}
                    <div className="w-full text-center border-b border-slate-100 pb-1">
                      <span className="text-[10px] font-black tracking-widest text-slate-800 uppercase block truncate">
                        DISTRIBUIDORA BABY WORLD
                      </span>
                    </div>

                    {/* Nombre producto / variante */}
                    <div className="my-0.5 px-1">
                      <p className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-1">
                        {previewItem.nombreProducto}
                      </p>
                      {previewItem.nombreVariante && (
                        <p className="text-[10px] font-semibold text-indigo-600 truncate mt-0.5">
                          {previewItem.nombreVariante}
                        </p>
                      )}
                    </div>

                    {/* Código de barras vectorial SVG */}
                    <div className="my-0.5">
                      <Barcode128
                        value={previewItem.codigoBarras}
                        height={rotacion === 90 || rotacion === 270 ? 26 : 32}
                        barWidth={1.1}
                        showText={true}
                      />
                    </div>

                    {/* Precio y SKU */}
                    <div className="w-full flex items-center justify-between border-t border-slate-100 pt-1 px-1">
                      <span className="text-[9px] font-mono font-bold text-slate-400">
                        {previewItem.sku}
                      </span>
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {fmtCOP(previewItem.precio)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Sin ítem seleccionado</p>
                )}
              </div>
            </div>

            {/* Opciones de salida */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleImprimirDirecto}
                disabled={etiquetasPlanas.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-200 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <Printer size={16} />
                {imprimiendo ? 'Abriendo Diálogo de Impresión...' : `Imprimir en DigitalPos (${totalEtiquetas} etiquetas)`}
              </button>

              <button
                type="button"
                onClick={handleDescargarBarTender}
                disabled={itemsSeleccionados.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Download size={14} className="text-slate-500" />
                Descargar para BarTender (.csv)
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Configurado para impresora térmica de 4 pulgadas con papel de 3 columnas continuas.</span>
          <span className="font-mono">Edatia Barcode Suite</span>
        </div>
      </div>

      {/* ÁREA OCULTA DE IMPRESIÓN DIRECTA NATIVA (Visible solo en @media print) */}
      <div id="area-impresion-etiquetas" className="hidden">
        {filasDeTres.map((fila, fIdx) => (
          <div
            key={fIdx}
            style={{
              width: '104mm',
              height: '20mm',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              pageBreakInside: 'avoid',
              pageBreakAfter: 'always',
              boxSizing: 'border-box',
              padding: '0 1mm',
            }}
          >
            {fila.map((et, eIdx) => {
              const isRotatedVertical = rotacion === 90 || rotacion === 270;
              return (
                <div
                  key={eIdx}
                  style={{
                    width: '33.8mm',
                    height: '20mm',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      width: isRotatedVertical ? '20mm' : '33.8mm',
                      height: isRotatedVertical ? '33.8mm' : '20mm',
                      transform: `rotate(${rotacion}deg)`,
                      transformOrigin: 'center center',
                      boxSizing: 'border-box',
                      padding: '1mm 1.2mm',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'center',
                      overflow: 'hidden',
                      background: '#ffffff',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '6px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: '#000000',
                        lineHeight: 1,
                        maxWidth: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      DISTRIBUIDORA BABY WORLD
                    </span>

                    <span
                      style={{
                        fontSize: '6.5px',
                        fontWeight: 700,
                        color: '#000000',
                        lineHeight: 1.1,
                        maxWidth: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {et.nombreVariante ? `${et.nombreProducto} · ${et.nombreVariante}` : et.nombreProducto}
                    </span>

                    <div style={{ margin: '0.2mm 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <Barcode128
                        value={et.codigoBarras}
                        height={isRotatedVertical ? 16 : 20}
                        maxWidth={isRotatedVertical ? '28mm' : '30mm'}
                        barWidth={isRotatedVertical ? 0.95 : 1.05}
                        showText={false}
                      />
                    </div>

                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '6.5px',
                        lineHeight: 1,
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{et.codigoBarras}</span>
                      <span style={{ fontWeight: 900, fontSize: '7.5px' }}>{fmtCOP(et.precio)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Rellenar espacios vacíos en la última fila si tiene menos de 3 */}
            {Array.from({ length: 3 - fila.length }).map((_, emptyIdx) => (
              <div key={`empty-${emptyIdx}`} style={{ width: '33.8mm', height: '20mm' }} />
            ))}
          </div>
        ))}
      </div>

      {/* ESTILOS DE IMPRESIÓN INYECTADOS */}
      <style>{`
        @media print {
          body.imprimiendo-etiquetas-termicas * {
            visibility: hidden !important;
          }
          body.imprimiendo-etiquetas-termicas #area-impresion-etiquetas,
          body.imprimiendo-etiquetas-termicas #area-impresion-etiquetas * {
            visibility: visible !important;
          }
          body.imprimiendo-etiquetas-termicas #area-impresion-etiquetas {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 104mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          @page {
            size: 104mm 20mm;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ---- TAB: Códigos de Barra ---- */
function TabCodigosBarra({ producto, refetch }: { producto: any; refetch: () => void }) {
  const [codigos, setCodigos] = useState<any[]>(() => {
    return (producto.codigosBarrasRel || []).map((c: any) => ({
      id: c.id,
      codigo: c.codigo,
      tipo: c.tipo,
      descripcion: c.descripcion || '',
      esPrincipal: c.esPrincipal || false,
    }));
  });
  const [form, setForm] = useState({ codigo: '', tipo: 'EAN-13', descripcion: '', esPrincipal: false });
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);

  // Estado del modal de impresión de etiquetas
  const [modalImprimir, setModalImprimir] = useState(false);
  const [itemsParaImprimir, setItemsParaImprimir] = useState<BarcodeItemParaImprimir[]>([]);

  const fmtCOP = (val: number) => `$${Number(val || 0).toLocaleString('es-CO')}`;

  const save = async (updated: any[]) => {
    try {
      setCodigos(updated);
      await updateProducto(producto.id, { codigos: updated });
      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Error al guardar códigos de barra');
    }
  };

  const addCodigo = () => {
    if (!form.codigo.trim()) return;
    const newId = Date.now();
    const updated = [...codigos, { ...form, id: newId, codigo: form.codigo.trim() }];
    if (form.esPrincipal) {
      updated.forEach(c => { if (c.id !== newId) c.esPrincipal = false; });
    }
    save(updated);
    setForm({ codigo: '', tipo: 'EAN-13', descripcion: '', esPrincipal: false });
    setAdding(false);
  };

  const marcarPrincipal = (id: number) => {
    const updated = codigos.map(c => ({ ...c, esPrincipal: c.id === id }));
    save(updated);
  };

  const eliminar = (id: number) => {
    const updated = codigos.filter(c => c.id !== id);
    save(updated);
  };

  // Stock consolidado del producto padre
  const stockPadreTotal = (producto.stock || []).reduce(
    (acc: number, s: any) => acc + (Number(s.cantidad) || 0),
    0
  );

  const variantes = Array.isArray(producto.variantes) ? producto.variantes : [];

  // Función para abrir el modal con todos los ítems del producto (padre + variantes)
  const abrirModalImpresionCompleta = () => {
    const lista: BarcodeItemParaImprimir[] = [];

    // Si tiene variantes, agregamos cada variante
    if (variantes.length > 0) {
      variantes.forEach((v: any) => {
        const vStock = (v.stock || []).reduce((acc: number, s: any) => acc + (Number(s.cantidad) || 0), 0);
        const code = v.codigoBarras || v.sku || producto.codigoBarras || producto.sku;
        lista.push({
          id: `var-${v.id}`,
          productoId: producto.id,
          varianteId: v.id,
          nombreProducto: producto.nombre,
          nombreVariante: v.nombre,
          sku: v.sku || producto.sku,
          codigoBarras: code,
          precio: Number(v.precioBase || producto.precioBase || 0),
          stockActual: vStock,
          cantidadCopias: Math.max(1, vStock || 1),
          colorHex: v.colorHex || buscarHexColor(v.nombre),
          incluir: true,
        });
      });
    } else {
      // Producto simple
      const code = producto.codigoBarras || producto.sku;
      lista.push({
        id: `prod-${producto.id}`,
        productoId: producto.id,
        varianteId: null,
        nombreProducto: producto.nombre,
        sku: producto.sku,
        codigoBarras: code,
        precio: Number(producto.precioBase || producto.precioWeb || 0),
        stockActual: stockPadreTotal,
        cantidadCopias: Math.max(1, stockPadreTotal || 1),
        incluir: true,
      });
    }

    setItemsParaImprimir(lista);
    setModalImprimir(true);
  };

  // Función para imprimir solo una variante o el padre individual
  const abrirModalImpresionIndividual = (item: BarcodeItemParaImprimir) => {
    setItemsParaImprimir([item]);
    setModalImprimir(true);
  };

  const TIPO_OPTIONS = ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'Code 128', 'Code 39', 'QR Code', 'Data Matrix', 'ITF-14', 'Interno'];

  return (
    <div className="space-y-6">
      {/* Encabezado con Botón Destacado de Impresión */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white/10 text-indigo-300">
              <Printer size={20} />
            </span>
            <h3 className="text-lg font-black tracking-tight">Impresión de Códigos de Barra</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Genera e imprime etiquetas adhesivas térmicas (rollo continuo 3 al paso · 104×20 mm) para este producto y todas sus variantes, o descárgalas en lote para BarTender.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={abrirModalImpresionCompleta}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-900/50 transition-all active:scale-95"
          >
            <Printer size={16} /> Imprimir Etiquetas ({variantes.length > 0 ? `${variantes.length} Variantes` : 'Producto'})
          </button>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all"
          >
            <Plus size={14} /> Agregar Código
          </button>
        </div>
      </div>

      {/* TARJETA 1: Código Principal del Producto */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
              <Barcode128
                value={producto.codigoBarras || producto.sku}
                height={34}
                barWidth={1.2}
                showText={false}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Código Principal
                </span>
                <span className="text-xs font-mono font-extrabold text-slate-800">
                  {producto.codigoBarras || producto.sku}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-800 mt-1">{producto.nombre}</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                SKU: {producto.sku} {producto.referencia ? `· Ref: ${producto.referencia}` : ''} · Precio: <strong className="text-slate-700">{fmtCOP(producto.precioBase)}</strong> · Stock: <strong className="text-emerald-600">{stockPadreTotal} und</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              abrirModalImpresionIndividual({
                id: `prod-${producto.id}`,
                productoId: producto.id,
                varianteId: null,
                nombreProducto: producto.nombre,
                sku: producto.sku,
                codigoBarras: producto.codigoBarras || producto.sku,
                precio: Number(producto.precioBase || producto.precioWeb || 0),
                stockActual: stockPadreTotal,
                cantidadCopias: Math.max(1, stockPadreTotal || 1),
                incluir: true,
              })
            }
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-indigo-200"
          >
            <Printer size={14} /> Imprimir Etiqueta Padre
          </button>
        </div>
      </div>

      {/* TARJETA 2: Variantes del Producto (Colores / Tallas) con Códigos Individuales */}
      {variantes.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Layers size={14} className="text-indigo-600" />
                Códigos de Barra por Variante ({variantes.length} Variantes Registradas)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cada color o talla tiene su propio código y stock físico en bodega.
              </p>
            </div>
            <button
              type="button"
              onClick={abrirModalImpresionCompleta}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Printer size={13} /> Imprimir Variantes en Lote
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {variantes.map((v: any) => {
              const vStock = (v.stock || []).reduce((acc: number, s: any) => acc + (Number(s.cantidad) || 0), 0);
              const code = v.codigoBarras || v.sku || producto.codigoBarras || producto.sku;
              const colorHex = v.colorHex || buscarHexColor(v.nombre);

              return (
                <div key={v.id} className="p-4 flex items-center justify-between flex-wrap gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {colorHex && (
                      <span
                        className="w-5 h-5 rounded-full border border-slate-300 shadow-sm shrink-0"
                        style={{ backgroundColor: colorHex }}
                        title={v.nombre}
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-800">{v.nombre}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          Ref: {v.sku}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                        <span>Código: <strong className="text-slate-700">{code}</strong></span>
                        <span>•</span>
                        <span>Precio: <strong className="text-slate-800">{fmtCOP(v.precioBase || producto.precioBase)}</strong></span>
                        <span>•</span>
                        <span className={vStock > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          Stock: {vStock} und
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block">
                      <Barcode128 value={code} height={26} barWidth={1.05} showText={false} />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        abrirModalImpresionIndividual({
                          id: `var-${v.id}`,
                          productoId: producto.id,
                          varianteId: v.id,
                          nombreProducto: producto.nombre,
                          nombreVariante: v.nombre,
                          sku: v.sku || producto.sku,
                          codigoBarras: code,
                          precio: Number(v.precioBase || producto.precioBase || 0),
                          stockActual: vStock,
                          cantidadCopias: Math.max(1, vStock || 1),
                          colorHex,
                          incluir: true,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-indigo-200"
                    >
                      <Printer size={13} /> Imprimir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TARJETA 3: Formulario para Agregar Nuevo Código Alternativo */}
      {adding && (
        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-150">
          <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest">Nuevo Código de Barra</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Código *</label>
              <input
                type="text"
                value={form.codigo}
                onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCodigo())}
                placeholder="Escanea o escribe el código"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tipo</label>
              <select
                value={form.tipo}
                onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
              >
                {TIPO_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Descripción (Opcional)</label>
              <input
                type="text"
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Ej. Código de caja master, Código de proveedor..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer hover:bg-slate-100/50 transition-all h-[34px]">
                <input
                  type="checkbox"
                  checked={form.esPrincipal}
                  onChange={e => setForm(p => ({ ...p, esPrincipal: e.target.checked }))}
                  className="rounded text-indigo-600 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">Marcar como Principal</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={addCodigo}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              <Save size={13} /> Guardar
            </button>
          </div>
        </div>
      )}

      {/* TARJETA 4: Lista de Códigos Secundarios Registrados */}
      {codigos.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Códigos Secundarios y Relacionados
            </h4>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Principal</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codigos.map(c => (
                <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${c.esPrincipal ? 'bg-indigo-50/20' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Barcode size={16} className="text-slate-400" />
                      <span className="font-mono font-extrabold text-slate-800 text-sm tracking-wider">{c.codigo}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">{c.tipo}</span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">{c.descripcion || '—'}</td>
                  <td className="p-4 text-center">
                    {c.esPrincipal
                      ? <span className="flex items-center justify-center gap-1 text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full mx-auto w-fit"><Star size={10} /> Principal</span>
                      : <button onClick={() => marcarPrincipal(c.id)} className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold underline transition-colors">Marcar</button>
                    }
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          abrirModalImpresionIndividual({
                            id: `sec-${c.id}`,
                            productoId: producto.id,
                            varianteId: null,
                            nombreProducto: producto.nombre,
                            sku: producto.sku,
                            codigoBarras: c.codigo,
                            precio: Number(producto.precioBase || 0),
                            stockActual: stockPadreTotal,
                            cantidadCopias: 1,
                            incluir: true,
                          })
                        }
                        title="Imprimir este código"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => eliminar(c.id)}
                        title="Eliminar"
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Impresión */}
      {modalImprimir && (
        <ModalImprimirEtiquetasProducto
          producto={producto}
          items={itemsParaImprimir}
          onClose={() => setModalImprimir(false)}
        />
      )}
    </div>
  );
}

/* ---- TAB: Facturas Venta ---- */
function TabFacturas({ productoId }: { productoId: number }) {
  const [facturas, setFacturas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/inventario/productos/${productoId}/facturas`)
        setFacturas(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error('Error al cargar facturas de venta:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productoId])

  const fmtCOP = (val: number) => `$${Number(val).toLocaleString('es-CO')}`

  const totalVendido = facturas.reduce((acc, it) => acc + (Number(it.total) || 0), 0)
  const totalUnidades = facturas.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0)
  const countFV = facturas.filter(it => it.tipoDocumento === 'FACTURA_VENTA').length
  const countPOS = facturas.filter(it => it.tipoDocumento === 'VENTA_POS').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-indigo-600 mr-2" />
        <span className="text-xs text-slate-500 font-semibold">Cargando trazabilidad de ventas y facturas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" /> Trazabilidad de Ventas y Facturas
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Historial de todas las ventas emitidas (Facturas electrónicas, facturas de venta y ventas POS de mostrador).
          </p>
        </div>

        {facturas.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Ventas</span>
              <span className="text-xs font-extrabold text-slate-700 font-mono">{facturas.length} docs</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unidades Vendidas</span>
              <span className="text-xs font-extrabold text-indigo-600 font-mono">{totalUnidades.toLocaleString()} und</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Facturado</span>
              <span className="text-xs font-extrabold text-emerald-600 font-mono">{fmtCOP(totalVendido)}</span>
            </div>
          </div>
        )}
      </div>

      {facturas.length > 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Documento</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cantidad</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">P. Unitario</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Descuento</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Item</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facturas.map((item) => {
                  const f = item.factura || item
                  const docNumero = item.numero || f.consecutivo || f.numero || `FAC-${f.id}`
                  const docFecha = item.fecha || f.fecha
                  const clienteNombre = item.clienteNombre || f.cliente?.nombre || 'Consumidor Final'
                  const clienteDoc = item.clienteDoc || f.cliente?.numeroDocumento || '—'
                  const esPos = item.tipoDocumento === 'VENTA_POS' || item.id?.toString().startsWith('POS-')

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        {item.url && item.tipoDocumento === 'FACTURA_VENTA' ? (
                          <Link 
                            to={item.url}
                            className="font-mono font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline text-sm"
                          >
                            {docNumero}
                          </Link>
                        ) : (
                          <span className="font-mono font-extrabold text-indigo-600 text-sm">
                            {docNumero}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          esPos
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {item.tipoLabel || (esPos ? 'Venta POS' : 'Factura Venta')}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {docFecha ? new Date(docFecha).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td className="p-4">
                        <p className="text-xs font-bold text-slate-800">{clienteNombre}</p>
                        <p className="text-[10px] font-mono text-slate-400">{clienteDoc}</p>
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-slate-600">
                        {Number(item.cantidad).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-slate-600">
                        {fmtCOP(Number(item.precioUnitario))}
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-rose-600">
                        {Number(item.descuentoPct) > 0 ? `${Number(item.descuentoPct)}%` : '—'}
                      </td>
                      <td className="p-4 text-right font-mono text-xs font-extrabold text-slate-800">
                        {fmtCOP(Number(item.total))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
          <FileText size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-400">Sin ventas registradas</p>
          <p className="text-xs text-slate-300 mt-1">Este producto aún no se ha incluido en ninguna factura de venta ni venta POS.</p>
        </div>
      )}
    </div>
  )
}

/* ---- TAB: Variantes y Tallas ---- */
function TabVariantes({ producto, refetch }: { producto: any; refetch: () => void }) {
  const qc = useQueryClient()
  const productoId = producto.id

  const { data: variantes = [], isLoading: loadingVariantes } = useQuery({
    queryKey: ['variantes', productoId],
    queryFn: () => getVariantes(productoId),
    enabled: !!productoId,
  })

  const { data: bodegas = [] } = useQuery({
    queryKey: ['bodegas'],
    queryFn: getBodegas,
  })

  const [modoGenerador, setModoGenerador] = useState<'tallas' | 'colores'>('tallas')
  const [customTallasInput, setCustomTallasInput] = useState('')
  const [customColoresInput, setCustomColoresInput] = useState('')
  const [coloresSeleccionadosChips, setColoresSeleccionadosChips] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatorMsg, setGeneratorMsg] = useState<string | null>(null)

  // Modales
  const [showVarianteModal, setShowVarianteModal] = useState(false)
  const [varianteAEditar, setVarianteAEditar] = useState<any>(null)
  const [varianteAjustarStock, setVarianteAjustarStock] = useState<any>(null)

  const mutCreateVariante = useMutation({
    mutationFn: createVariante,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variantes', productoId] })
      qc.invalidateQueries({ queryKey: ['producto_detalle', productoId] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      setShowVarianteModal(false)
      toast.success('Variante creada exitosamente')
    },
    onError: (err: any) => {
      toast.error(`Error: ${err?.response?.data?.message || err.message}`)
    }
  })

  const mutUpdateVariante = useMutation({
    mutationFn: ({ varId, data }: any) => updateVariante(varId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variantes', productoId] })
      qc.invalidateQueries({ queryKey: ['producto_detalle', productoId] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      setVarianteAEditar(null)
      toast.success('Variante actualizada')
    },
    onError: (err: any) => {
      toast.error(`Error: ${err?.response?.data?.message || err.message}`)
    }
  })

  const mutToggleVariante = useMutation({
    mutationFn: toggleVariante,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variantes', productoId] })
      qc.invalidateQueries({ queryKey: ['producto_detalle', productoId] })
      toast.success('Estado actualizado')
    },
    onError: (err: any) => {
      toast.error(`Error: ${err?.response?.data?.message || err.message}`)
    }
  })

  const mutDeleteVariante = useMutation({
    mutationFn: deleteVariante,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variantes', productoId] })
      qc.invalidateQueries({ queryKey: ['producto_detalle', productoId] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Variante eliminada')
    },
    onError: (err: any) => {
      toast.error(`Error: ${err?.response?.data?.message || err.message}`)
    }
  })

  const mutStockVariante = useMutation({
    mutationFn: (data: any) => postAjusteManualKardex(data),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['variantes', productoId] })
      qc.invalidateQueries({ queryKey: ['producto_detalle', productoId] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['productos-existencias'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['kardex-movimientos'] })
      setVarianteAjustarStock(null)
      toast.success(res?.mensaje || 'Stock y Kardex ajustados con éxito')
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) {
        toast.error('Código de autorización incorrecto. Verifique con el administrador en Configuración > Empresa.')
      } else {
        toast.error(err?.response?.data?.message || err.message || 'Error al modificar kardex de la variante')
      }
    }
  })

  const handleGenerarTallas = async (tallasList: string[]) => {
    if (!productoId || tallasList.length === 0) return
    setIsGenerating(true)
    setGeneratorMsg(null)

    try {
      const existingSkus = new Set((variantes as any[]).map((v: any) => v.sku?.toLowerCase()))
      const existingTallas = new Set(
        (variantes as any[]).map((v: any) => {
          const vis = extraerAtributosVisuales(v)
          return vis.talla?.toLowerCase()
        })
      )

      let creadas = 0
      const precioBaseSugerido = Number(producto.precios?.[0] || producto.precioBase || 0)
      const baseSku = producto.referencia || producto.sku || `PROD-${productoId}`

      for (const talla of tallasList) {
        const tClean = talla.trim()
        if (!tClean) continue
        if (existingTallas.has(tClean.toLowerCase())) continue

        const variantSku = `${baseSku}-${slugifyAttr(tClean)}`.toUpperCase()
        if (existingSkus.has(variantSku.toLowerCase())) continue

        await createVariante({
          productoId,
          sku: variantSku,
          nombre: `Talla ${tClean}`,
          atributos: [{ nombre: 'Talla', valor: tClean }],
          precioBase: precioBaseSugerido,
          costoPromedio: Number(producto.costoPromedio || producto.costo || 0),
        })
        creadas++
      }

      qc.invalidateQueries({ queryKey: ['variantes', productoId] })
      qc.invalidateQueries({ queryKey: ['producto_detalle', productoId] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      setGeneratorMsg(`✓ Se generaron ${creadas} variantes de talla exitosamente.`)
      setCustomTallasInput('')
      toast.success(`Se generaron ${creadas} variantes de talla`)
      setTimeout(() => setGeneratorMsg(null), 4000)
    } catch (err: any) {
      setGeneratorMsg(`Error generando variantes: ${err?.response?.data?.message || err.message}`)
      toast.error(`Error generando variantes de talla`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerarColores = async (coloresList: string[]) => {
    if (!productoId || coloresList.length === 0) return
    setIsGenerating(true)
    setGeneratorMsg(null)

    try {
      const existingSkus = new Set((variantes as any[]).map((v: any) => v.sku?.toLowerCase()))
      const existingColores = new Set(
        (variantes as any[]).map((v: any) => {
          const vis = extraerAtributosVisuales(v)
          return vis.color?.toLowerCase()
        })
      )

      let creadas = 0
      const precioBaseSugerido = Number(producto.precios?.[0] || producto.precioBase || 0)
      const baseSku = producto.referencia || producto.sku || `PROD-${productoId}`

      for (const color of coloresList) {
        const cClean = color.trim()
        if (!cClean) continue
        if (existingColores.has(cClean.toLowerCase())) continue

        const slugColor = slugifyAttr(cClean)
        const variantSku = `${baseSku}-${slugColor}`.toUpperCase()
        if (existingSkus.has(variantSku.toLowerCase())) continue

        const hex = buscarHexColor(cClean)

        await createVariante({
          productoId,
          sku: variantSku,
          nombre: `Color ${cClean}`,
          atributos: [{ nombre: 'Color', valor: cClean, hex }],
          precioBase: precioBaseSugerido,
          costoPromedio: Number(producto.costoPromedio || producto.costo || 0),
        })
        creadas++
      }

      qc.invalidateQueries({ queryKey: ['variantes', productoId] })
      qc.invalidateQueries({ queryKey: ['producto_detalle', productoId] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      setGeneratorMsg(`✓ Se generaron ${creadas} variantes de color exitosamente.`)
      setCustomColoresInput('')
      setColoresSeleccionadosChips([])
      toast.success(`Se generaron ${creadas} variantes de color`)
      setTimeout(() => setGeneratorMsg(null), 4000)
    } catch (err: any) {
      setGeneratorMsg(`Error generando variantes: ${err?.response?.data?.message || err.message}`)
      toast.error(`Error generando variantes de color`)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleChipColor = (nombreColor: string) => {
    setColoresSeleccionadosChips(prev =>
      prev.includes(nombreColor) ? prev.filter(c => c !== nombreColor) : [...prev, nombreColor]
    )
  }

  const totalStockVariante = (v: any) =>
    (v.stock ?? []).reduce((acc: number, s: any) => acc + parseFloat(s.cantidad || 0), 0)

  const totalStockGlobal = (variantes as any[]).reduce((acc, v) => acc + totalStockVariante(v), 0)
  const activasCount = (variantes as any[]).filter(v => v.activo).length

  return (
    <div className="space-y-6">
      {/* Barra de cabecera con métricas rápidas */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Tag size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Variantes y Tallas del Producto</h2>
            <p className="text-xs text-slate-500">
              Configura variantes por <strong>Talla</strong> (ropa, calzado), por <strong>Color</strong> (tonos, accesorios) o combinadas para la tienda virtual y POS.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Variantes</span>
            <span className="text-sm font-extrabold text-slate-800 font-mono">{variantes.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Activas</span>
            <span className="text-sm font-extrabold text-emerald-600 font-mono">{activasCount}</span>
          </div>
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-center shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock Total</span>
            <span className="text-sm font-extrabold text-indigo-600 font-mono">{totalStockGlobal} und</span>
          </div>
        </div>
      </div>

      {generatorMsg && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          generatorMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {generatorMsg.startsWith('✓') ? <Check size={14} /> : <AlertTriangle size={14} />}
          <span>{generatorMsg}</span>
        </div>
      )}

      {/* Generador Rápido de Tallas y Colores */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/50 border border-indigo-100 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Generador Rápido de Variantes</h3>
              <p className="text-xs text-slate-500">Crea múltiples tallas o colores automáticamente con un solo clic</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Selector de modo generador */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setModoGenerador('tallas')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  modoGenerador === 'tallas'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Tag size={13} />
                <span>Por Tallas</span>
              </button>
              <button
                type="button"
                onClick={() => setModoGenerador('colores')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  modoGenerador === 'colores'
                    ? 'bg-white text-pink-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Palette size={13} />
                <span>Por Colores</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setVarianteAEditar(null)
                setShowVarianteModal(true)
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Variante manual</span>
            </button>
          </div>
        </div>

        {/* MODO 1: TALLAS */}
        {modoGenerador === 'tallas' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preajustes de Calzado y Ropa:</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS_TALLAS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => handleGenerarTallas(p.tallas)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    title={`Generar: ${p.tallas.join(', ')}`}
                  >
                    <span>{p.label}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                      +{p.tallas.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                value={customTallasInput}
                onChange={e => setCustomTallasInput(e.target.value)}
                placeholder="O ingresa tallas separadas por comas (ejemplo: 18, 19, 20, 21)..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-medium"
              />
              <button
                type="button"
                disabled={isGenerating || !customTallasInput.trim()}
                onClick={() => handleGenerarTallas(customTallasInput.split(','))}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap shadow-xs cursor-pointer"
              >
                {isGenerating ? 'Generando...' : 'Crear tallas'}
              </button>
            </div>
          </div>
        )}

        {/* MODO 2: COLORES */}
        {modoGenerador === 'colores' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preajustes Rápidos de Color:</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS_COLORES.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => handleGenerarColores(p.colores)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 text-slate-700 hover:text-pink-700 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    title={`Generar: ${p.colores.join(', ')}`}
                  >
                    <span>{p.label}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                      +{p.colores.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Paleta visual de selección múltiple */}
            <div className="pt-2 border-t border-slate-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  O toca los colores que deseas para este producto:
                </p>
                {coloresSeleccionadosChips.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setColoresSeleccionadosChips([])}
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                  >
                    Limpiar selección ({coloresSeleccionadosChips.length})
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {PALETA_COLORES.map(col => {
                  const isSelected = coloresSeleccionadosChips.includes(col.nombre)
                  return (
                    <button
                      key={col.nombre}
                      type="button"
                      onClick={() => toggleChipColor(col.nombre)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-pink-50 border-pink-500 text-pink-900 ring-2 ring-pink-200 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs flex-shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.nombre}</span>
                      {isSelected && <Check size={12} className="text-pink-600" />}
                    </button>
                  )
                })}
              </div>

              {coloresSeleccionadosChips.length > 0 && (
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => handleGenerarColores(coloresSeleccionadosChips)}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>Generar {coloresSeleccionadosChips.length} variantes de color seleccionadas</span>
                  </button>
                </div>
              )}
            </div>

            {/* O escribir colores libres */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                value={customColoresInput}
                onChange={e => setCustomColoresInput(e.target.value)}
                placeholder="O escribe colores separados por comas (ejemplo: Rosado, Azul Celeste, Beige)..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 font-medium"
              />
              <button
                type="button"
                disabled={isGenerating || !customColoresInput.trim()}
                onClick={() => handleGenerarColores(customColoresInput.split(','))}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap shadow-xs cursor-pointer"
              >
                {isGenerating ? 'Generando...' : 'Crear colores'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Listado de Variantes */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">Variantes Registradas</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600">
              {variantes.length}
            </span>
          </div>
          <Link
            to="/inventario/control-existencias"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 text-slate-600 text-xs font-bold rounded-xl transition-all shadow-2xs"
          >
            <Warehouse size={13} className="text-indigo-600" />
            <span>Gestionar en Control de Existencias</span>
          </Link>
        </div>

        {loadingVariantes ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
            <span>Cargando variantes...</span>
          </div>
        ) : variantes.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Layers size={40} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Este producto aún no tiene variantes registradas</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Usa el generador rápido de arriba para crear variantes por talla o por color en 1 clic, o agrega una variante manual.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Variante / Atributo</th>
                  <th className="p-4">Ref. Fábrica (SKU)</th>
                  <th className="p-4">Código de Barras</th>
                  <th className="p-4 text-right">Precio Base</th>
                  <th className="p-4 text-center">Stock Físico</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center w-36">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variantes.map((v: any) => {
                  const stockTotal = totalStockVariante(v)
                  const vis = extraerAtributosVisuales(v)

                  return (
                    <tr key={v.id} className={`hover:bg-slate-50/50 transition-colors ${!v.activo ? 'opacity-60 bg-slate-50/30' : ''}`}>
                      {/* Variante / Atributos visuales */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {vis.esColor && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-50/60 border border-pink-200 text-pink-900 font-bold text-xs shadow-2xs">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs flex-shrink-0"
                                style={{ backgroundColor: vis.colorHex || '#94A3B8' }}
                              />
                              <span>Color {vis.color}</span>
                            </span>
                          )}

                          {vis.esTalla && (
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs font-mono shadow-2xs">
                              Talla {vis.talla}
                            </span>
                          )}

                          {!vis.esColor && !vis.esTalla && (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs">
                              {v.nombre}
                            </span>
                          )}

                          {/* Otros atributos adicionales si existen */}
                          {v.atributos?.filter((a: any) => a.nombre?.toLowerCase() !== 'talla' && a.nombre?.toLowerCase() !== 'color').map((a: any, i: number) => (
                            <span key={i} className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                              {a.nombre}: {a.valor}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* SKU / Ref fábrica */}
                      <td className="p-4 font-mono text-xs font-bold text-slate-700">
                        {v.sku}
                      </td>

                      {/* Código de barras */}
                      <td className="p-4 font-mono text-xs text-slate-500">
                        {v.codigoBarras || '—'}
                      </td>

                      {/* Precio Base */}
                      <td className="p-4 text-right font-extrabold text-slate-800 font-mono">
                        {fmtCOP(parseFloat(v.precioBase || producto.precios?.[0] || producto.precioBase || 0))}
                      </td>

                      {/* Stock Físico */}
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            stockTotal > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            {stockTotal > 0 ? `${stockTotal} pares/und` : 'Agotado (0)'}
                          </span>
                          {v.stock?.length > 0 && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Warehouse size={10} />
                              {v.stock.map((s: any) => `${s.bodega?.nombre ?? 'Bodega'}: ${parseFloat(s.cantidad)}`).join(' | ')}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => mutToggleVariante.mutate(v.id)}
                          className="text-slate-400 hover:text-slate-700 p-1 transition-transform active:scale-95 cursor-pointer"
                          title={v.activo ? 'Desactivar variante' : 'Activar variante'}
                        >
                          {v.activo ? (
                            <ToggleRight size={24} className="text-emerald-600 inline" />
                          ) : (
                            <ToggleLeft size={24} className="text-slate-300 inline" />
                          )}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setVarianteAjustarStock(v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs rounded-lg border border-amber-200 transition-colors shadow-2xs cursor-pointer"
                            title="Ajustar Kardex protegido con contraseña empresarial"
                          >
                            <Lock size={11} />
                            <span>Kardex</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setVarianteAEditar(v)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar variante"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Eliminar la variante "${v.nombre}" (${v.sku})?`)) {
                                mutDeleteVariante.mutate(v.id)
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar variante"
                          >
                            <Trash2 size={14} />
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

      {/* MODAL 1: NUEVA / EDITAR VARIANTE MANUAL */}
      {(showVarianteModal || varianteAEditar) && (
        <ModalVarianteFormDetalle
          producto={producto}
          baseSku={producto.referencia || producto.sku}
          precioSugerido={producto.precios?.[0] || producto.precioBase || 0}
          variante={varianteAEditar}
          onClose={() => {
            setShowVarianteModal(false)
            setVarianteAEditar(null)
          }}
          onSubmit={(data: any) => {
            if (varianteAEditar) {
              mutUpdateVariante.mutate({ varId: varianteAEditar.id, data })
            } else {
              mutCreateVariante.mutate({ ...data, productoId })
            }
          }}
          isLoading={mutCreateVariante.isPending || mutUpdateVariante.isPending}
        />
      )}

      {/* MODAL 2: AJUSTAR STOCK DE VARIANTE */}
      {varianteAjustarStock && (
        <ModalAjustarStockVarianteDetalle
          productoId={productoId}
          variante={varianteAjustarStock}
          bodegas={bodegas}
          onClose={() => setVarianteAjustarStock(null)}
          onSubmit={(data: any) => {
            mutStockVariante.mutate(data)
          }}
          isLoading={mutStockVariante.isPending}
        />
      )}
    </div>
  )
}

function ModalVarianteFormDetalle({ producto, baseSku, precioSugerido, variante, onClose, onSubmit, isLoading }: any) {
  const isEditing = !!variante

  // Detección inicial de atributos si se está editando
  const visInicial = variante ? extraerAtributosVisuales(variante) : null
  const initialTipo: 'talla' | 'color' | 'ambos' = (() => {
    if (!variante) return 'talla'
    if (visInicial?.esTalla && visInicial?.esColor) return 'ambos'
    if (visInicial?.esColor) return 'color'
    return 'talla'
  })()

  const [tipoVariante, setTipoVariante] = useState<'talla' | 'color' | 'ambos'>(initialTipo)
  const [talla, setTalla] = useState(visInicial?.talla || '')
  const [color, setColor] = useState(visInicial?.color || '')
  const [hexColor, setHexColor] = useState(visInicial?.colorHex || '#F472B6')
  const [sku, setSku] = useState(variante?.sku ?? (baseSku ? `${baseSku}-` : ''))
  const [precio, setPrecio] = useState(variante?.precioBase ? String(variante.precioBase) : String(precioSugerido || '0'))
  const [codigoBarras, setCodigoBarras] = useState(variante?.codigoBarras ?? '')

  // Generación automática del SKU según tipo de variante
  const actualizarSkuSugerido = (tipo: 'talla' | 'color' | 'ambos', tVal: string, cVal: string) => {
    if (isEditing || !baseSku) return
    const tSlug = slugifyAttr(tVal)
    const cSlug = slugifyAttr(cVal)

    if (tipo === 'talla' && tSlug) {
      setSku(`${baseSku}-${tSlug}`)
    } else if (tipo === 'color' && cSlug) {
      setSku(`${baseSku}-${cSlug}`)
    } else if (tipo === 'ambos') {
      const partes = [tSlug, cSlug].filter(Boolean)
      setSku(partes.length > 0 ? `${baseSku}-${partes.join('-')}` : `${baseSku}-`)
    }
  }

  const handleTipoChange = (nuevoTipo: 'talla' | 'color' | 'ambos') => {
    setTipoVariante(nuevoTipo)
    actualizarSkuSugerido(nuevoTipo, talla, color)
  }

  const handleTallaChange = (val: string) => {
    setTalla(val)
    actualizarSkuSugerido(tipoVariante, val, color)
  }

  const handleSelectColor = (colItem: typeof PALETA_COLORES[0]) => {
    setColor(colItem.nombre)
    setHexColor(colItem.hex)
    actualizarSkuSugerido(tipoVariante, talla, colItem.nombre)
  }

  const handleColorCustomChange = (val: string) => {
    setColor(val)
    const autotHex = buscarHexColor(val)
    setHexColor(autotHex)
    actualizarSkuSugerido(tipoVariante, talla, val)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sku.trim()) return alert('El SKU / Ref. de Fábrica es obligatorio')

    let atributos: Array<{ nombre: string; valor: string; hex?: string }> = []
    let nombreVariante = ''

    if (tipoVariante === 'talla') {
      if (!talla.trim()) return alert('La talla es obligatoria')
      atributos = [{ nombre: 'Talla', valor: talla.trim() }]
      nombreVariante = `Talla ${talla.trim()}`
    } else if (tipoVariante === 'color') {
      if (!color.trim()) return alert('El color es obligatorio. Elige un color de la paleta o escribe su nombre.')
      atributos = [{ nombre: 'Color', valor: color.trim(), hex: hexColor }]
      nombreVariante = `Color ${color.trim()}`
    } else {
      if (!talla.trim()) return alert('La talla es obligatoria')
      if (!color.trim()) return alert('El color es obligatorio')
      atributos = [
        { nombre: 'Talla', valor: talla.trim() },
        { nombre: 'Color', valor: color.trim(), hex: hexColor }
      ]
      nombreVariante = `Talla ${talla.trim()} / Color ${color.trim()}`
    }

    onSubmit({
      sku: sku.trim().toUpperCase(),
      nombre: nombreVariante,
      atributos,
      precioBase: parseFloat(precio || '0'),
      codigoBarras: codigoBarras.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 my-auto animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              {tipoVariante === 'color' ? <Palette size={18} /> : <Tag size={18} />}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                {isEditing ? 'Editar Variante' : 'Nueva Variante del Producto'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Define si este artículo varía por talla, por color o por ambos.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* SELECTOR DE TIPO DE VARIANTE (TALLA, COLOR, AMBOS) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Tipo de Variante *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleTipoChange('talla')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                tipoVariante === 'talla'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs ring-1 ring-indigo-300'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Tag size={16} />
              <span>Por Talla</span>
              <span className="text-[9px] font-normal opacity-80 text-slate-500">Ropa / Calzado</span>
            </button>

            <button
              type="button"
              onClick={() => handleTipoChange('color')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                tipoVariante === 'color'
                  ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-2xs ring-1 ring-pink-300'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Palette size={16} />
              <span>Por Color</span>
              <span className="text-[9px] font-normal opacity-80 text-slate-500">Tonos / Estilos</span>
            </button>

            <button
              type="button"
              onClick={() => handleTipoChange('ambos')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                tipoVariante === 'ambos'
                  ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-2xs ring-1 ring-purple-300'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Sparkles size={16} />
              <span>Talla + Color</span>
              <span className="text-[9px] font-normal opacity-80 text-slate-500">Combinados</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CAMPO DE TALLA (si tipo es 'talla' o 'ambos') */}
          {(tipoVariante === 'talla' || tipoVariante === 'ambos') && (
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Talla o Medida *
              </label>
              <input
                type="text"
                required
                value={talla}
                onChange={e => handleTallaChange(e.target.value)}
                placeholder="Ej: 18, 22, 37, XS, S, M, L, 0-3M..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
              />
              {/* Sugerencias rápidas de tallas */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Tallas comunes:</span>
                {['18', '20', '22', '24', '26', 'XS', 'S', 'M', 'L', '0-3M', '6-9M'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleTallaChange(s)}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded text-[11px] font-mono text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CAMPO DE COLOR (si tipo es 'color' o 'ambos') */}
          {(tipoVariante === 'color' || tipoVariante === 'ambos') && (
            <div className="bg-pink-50/30 p-3.5 rounded-xl border border-pink-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Selecciona el Color *
                </label>
                {color && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-pink-200 text-pink-900 text-xs font-bold">
                    <span
                      className="w-3 h-3 rounded-full border border-black/15 shadow-2xs"
                      style={{ backgroundColor: hexColor }}
                    />
                    <span>{color}</span>
                  </span>
                )}
              </div>

              {/* Swatches visuales interactivos */}
              <div>
                <p className="text-[10px] text-slate-400 font-medium mb-1.5">Toca un color para seleccionarlo:</p>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                  {PALETA_COLORES.map(col => {
                    const isSelected = color?.toLowerCase() === col.nombre.toLowerCase()
                    return (
                      <button
                        key={col.nombre}
                        type="button"
                        onClick={() => handleSelectColor(col)}
                        title={`${col.nombre} (${col.hex})`}
                        className={`group relative p-1 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-pink-500 bg-white ring-2 ring-pink-300 shadow-xs'
                            : 'border-slate-200/80 bg-white hover:border-pink-300'
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs flex items-center justify-center transition-transform group-hover:scale-105"
                          style={{ backgroundColor: col.hex }}
                        >
                          {isSelected && (
                            <Check size={13} className={col.hex === '#FFFFFF' || col.hex === '#E2E8F0' ? 'text-slate-900' : 'text-white'} />
                          )}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-600 truncate max-w-[50px] text-center leading-tight">
                          {col.nombre.split(' ')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Nombre de color personalizado y picker */}
              <div className="pt-2 border-t border-pink-100/80 flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    Nombre del color (puedes personalizarlo)
                  </label>
                  <input
                    type="text"
                    required
                    value={color}
                    onChange={e => handleColorCustomChange(e.target.value)}
                    placeholder="Ej: Rosado, Palo de Rosa, Azul Celeste..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                    Tono (Hex)
                  </label>
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1">
                    <input
                      type="color"
                      value={hexColor}
                      onChange={e => setHexColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer p-0 bg-transparent"
                      title="Seleccionar tono exacto"
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-500">{hexColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REF. DE FÁBRICA / SKU */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ref. de Fábrica (SKU) *
            </label>
            <input
              type="text"
              required
              value={sku}
              onChange={e => setSku(e.target.value)}
              placeholder="Ej: TG26-211-18 o REF-ROSA"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none uppercase"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Código identificador único de esta variante. Se sugiere automáticamente al elegir talla o color.
            </p>
          </div>

          {/* PRECIO BASE DE VENTA */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Precio Base de Venta (COP)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* CÓDIGO DE BARRAS OPCIONAL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              SKU / Código de Barras (Opcional)
            </label>
            <input
              type="text"
              value={codigoBarras}
              onChange={e => setCodigoBarras(e.target.value)}
              placeholder="Ej: 7701234567890"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Código de barras impreso en la caja o etiqueta para la pistola lectora (opcional).
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Variante' : 'Guardar Variante')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalAjustarStockVarianteDetalle({ productoId, variante, bodegas, onClose, onSubmit, isLoading }: any) {
  const [bodegaId, setBodegaId] = useState<string>(bodegas[0]?.id ? String(bodegas[0].id) : '')
  const stBodega = (variante.stock || []).find((s: any) => String(s.bodegaId) === bodegaId)
  const stockActual = stBodega ? Number(stBodega.cantidad || 0) : 0
  const [nuevoStock, setNuevoStock] = useState<string>(String(stockActual))
  const [motivo, setMotivo] = useState<string>('')
  const [codigoAutorizacion, setCodigoAutorizacion] = useState<string>('')
  const [mostrarPass, setMostrarPass] = useState(false)

  // Actualizar nuevoStock cuando cambie de bodega
  const handleBodegaChange = (bId: string) => {
    setBodegaId(bId)
    const st = (variante.stock || []).find((s: any) => String(s.bodegaId) === bId)
    setNuevoStock(String(st ? Number(st.cantidad || 0) : 0))
  }

  const dif = (Number(nuevoStock) || 0) - stockActual
  const vis = extraerAtributosVisuales(variante)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bodegaId) return alert('Selecciona una bodega')
    const stockNum = parseFloat(nuevoStock)
    if (isNaN(stockNum) || stockNum < 0) return alert('Ingresa un saldo físico válido mayor o igual a 0')
    if (!motivo.trim()) return alert('Debe ingresar el motivo o justificación del ajuste')
    if (!codigoAutorizacion.trim()) return alert('Debe ingresar la contraseña de autorización empresarial')

    onSubmit({
      productoId,
      bodegaId: parseInt(bodegaId, 10),
      varianteId: variante.id,
      nuevoStock: stockNum,
      motivo: motivo.trim(),
      codigoAutorizacion: codigoAutorizacion.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 my-auto animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-amber-100 pb-3 bg-amber-50/50 -mx-6 -mt-6 p-5 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-950 text-sm">
                Ajuste de Kardex Protegido · {[vis.esColor ? `Color ${vis.color}` : '', vis.esTalla ? `Talla ${vis.talla}` : ''].filter(Boolean).join(' · ') || variante.nombre}
              </h3>
              <p className="text-[11px] text-amber-700/80 font-mono">Ref: {variante.sku} {variante.codigoBarras ? `· SKU: ${variante.codigoBarras}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bodega a Ajustar *</label>
            <select
              value={bodegaId}
              onChange={e => handleBodegaChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            >
              {bodegas.map((b: any) => (
                <option key={b.id} value={b.id}>{b.nombre} ({b.codigo}) {b.esPrincipal ? '· Principal' : ''}</option>
              ))}
            </select>
          </div>

          {/* Comparador de Stock */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Stock Actual Talla</p>
              <p className="text-base font-extrabold text-slate-700 mt-0.5">{stockActual}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Nuevo Saldo</p>
              <p className="text-base font-extrabold text-indigo-600 mt-0.5">{Number(nuevoStock) || 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Diferencia</p>
              <p className={`text-base font-extrabold mt-0.5 ${dif > 0 ? 'text-emerald-600' : dif < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                {dif > 0 ? `+${dif}` : dif}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nuevo Saldo Físico Real en Bodega *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={nuevoStock}
              onChange={e => setNuevoStock(e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Motivo o Justificación del Ajuste *
            </label>
            <textarea
              rows={2}
              required
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Conteo físico inicial, corrección por auditoría..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Contraseña de Autorización Empresarial *
              </label>
              <span className="text-[10px] text-slate-400">Configurada en Configuración &gt; Empresa</span>
            </div>
            <div className="relative">
              <input
                type={mostrarPass ? 'text' : 'password'}
                required
                value={codigoAutorizacion}
                onChange={e => setCodigoAutorizacion(e.target.value)}
                placeholder="Clave de seguridad para modificar kardex..."
                className="w-full pl-3.5 pr-10 py-2.5 bg-amber-50/40 border border-amber-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setMostrarPass(!mostrarPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-xl text-[11px] flex gap-2 items-start">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              Este ajuste quedará registrado en el historial del Kardex y sumará al inventario consolidado del producto padre.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 active:scale-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              <Lock size={14} />
              {isLoading ? 'Autorizando...' : 'Autorizar y Ajustar Kardex'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export function ConfigProductoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const productoId = parseInt(id || '0', 10)
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tab') || 'web'
  })
  const [compartirModalOpen, setCompartirModalOpen] = useState(false)
  const [redCompartir, setRedCompartir] = useState<RedSocial>('whatsapp')

  const abrirCompartir = (red: RedSocial) => {
    setRedCompartir(red)
    setCompartirModalOpen(true)
  }

  const { data: producto, isLoading, isError, refetch } = useQuery({
    queryKey: ['producto_detalle', productoId],
    queryFn: () => getProducto(productoId),
    enabled: !!productoId,
  })

  const isPrintMode = window.location.search.includes('print=true')

  useEffect(() => {
    if (isPrintMode && producto) {
      const timer = setTimeout(() => {
        window.print()
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [isPrintMode, producto])

  if (isPrintMode && producto) {
    const fmtCOP = (val: number) => `$${Number(val).toLocaleString('es-CO')}`
    return (
      <div className="bg-white p-8 max-w-4xl mx-auto space-y-8 font-sans text-slate-800 printable-ficha">
        <style>{`
          @media print {
            body {
              background-color: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
        
        {/* Ficha técnica layout */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">{producto.nombre}</h1>
            <p className="text-sm text-slate-500 font-mono mt-1">SKU: {producto.sku}</p>
            {producto.referencia && <p className="text-xs text-slate-400 font-mono">Ref: {producto.referencia}</p>}
          </div>
          <div className="flex flex-col items-end">
            <div className="bg-indigo-600 text-white font-extrabold px-3 py-1 rounded text-xs uppercase">
              Ficha Técnica ERP
            </div>
            {producto.sku && (
              <div className="mt-4">
                <div className="flex flex-col items-center">
                  <div className="font-mono text-[9px] tracking-wider text-slate-500 mb-1">CÓDIGO DE BARRAS</div>
                  <div className="bg-slate-50 p-2 border border-slate-200 rounded">
                    <svg className="w-40 h-8" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <g fill="black">
                        <rect x="0" y="0" width="2" height="35" /><rect x="3" y="0" width="1" height="35" />
                        <rect x="6" y="0" width="2" height="32" /><rect x="10" y="0" width="3" height="32" />
                        <rect x="15" y="0" width="1" height="32" /><rect x="18" y="0" width="2" height="32" />
                        <rect x="22" y="0" width="4" height="32" /><rect x="28" y="0" width="1" height="32" />
                        <rect x="31" y="0" width="2" height="32" /><rect x="35" y="0" width="1" height="35" />
                        <rect x="37" y="0" width="1" height="35" /><rect x="40" y="0" width="3" height="32" />
                        <rect x="45" y="0" width="1" height="32" /><rect x="48" y="0" width="2" height="32" />
                        <rect x="52" y="0" width="4" height="32" /><rect x="58" y="0" width="1" height="32" />
                        <rect x="61" y="0" width="2" height="32" /><rect x="65" y="0" width="3" height="32" />
                        <rect x="70" y="0" width="1" height="32" /><rect x="73" y="0" width="2" height="32" />
                        <rect x="77" y="0" width="4" height="32" /><rect x="83" y="0" width="1" height="32" />
                        <rect x="86" y="0" width="2" height="32" /><rect x="90" y="0" width="3" height="32" />
                        <rect x="95" y="0" width="2" height="35" /><rect x="98" y="0" width="1" height="35" />
                      </g>
                    </svg>
                    <div className="font-mono text-[9px] font-bold text-center mt-1">{producto.sku}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informacion General & Precios */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-indigo-700 uppercase tracking-widest border-b border-slate-100 pb-2">Información de Producto</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="font-bold text-slate-500">Categoría:</span>
              <span>{producto.categoria?.nombre || '—'}</span>
              <span className="font-bold text-slate-500">Marca:</span>
              <span>{producto.marca?.nombre || '—'}</span>
              <span className="font-bold text-slate-500">Unidad de Medida:</span>
              <span>{producto.unidadMedida?.nombre || '—'}</span>
              <span className="font-bold text-slate-500">Ubicación Bodega 1:</span>
              <span>{producto.ubicacion1 || '—'}</span>
              <span className="font-bold text-slate-500">Ubicación Bodega 2:</span>
              <span>{producto.ubicacion2 || '—'}</span>
              <span className="font-bold text-slate-500">Presentación:</span>
              <span>{producto.presentacion || '—'}</span>
              <span className="font-bold text-slate-500">Peso Unidad:</span>
              <span>{producto.pesoUnidad ? `${producto.pesoUnidad} kg` : '—'}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-indigo-700 uppercase tracking-widest border-b border-slate-100 pb-2">Estructura de Precios</h2>
            <div className="space-y-1.5 text-xs">
              {Array.isArray(producto.precios) && producto.precios.slice(0, 4).map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-500">Precio {idx + 1}:</span>
                  <span className="font-mono font-bold">{fmtCOP(Number(p || 0))}</span>
                </div>
              ))}
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="font-bold text-slate-500">Costo Unitario Base:</span>
                <span className="font-mono font-bold">{fmtCOP(Number(producto.costo || 0))}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="font-bold text-slate-500">Costo IVA Integrado:</span>
                <span className="font-mono font-bold">{fmtCOP(Number(producto.costoI || 0))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <h2 className="text-sm font-extrabold text-indigo-700 uppercase tracking-widest border-b border-slate-100 pb-2">Descripción del Producto</h2>
          <p className="text-xs leading-relaxed text-slate-600">
            {producto.descripcion || producto.descripcionAlterna || 'Sin descripción detallada registrada.'}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-12 text-center text-[10px] text-slate-400 border-t border-slate-200">
          Edatia ERP SaaS • Hoja de especificaciones oficial generada el {new Date().toLocaleDateString('es-CO')}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-semibold">Cargando ficha del producto...</p>
        </div>
      </div>
    )
  }

  if (isError || !producto) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <AlertTriangle size={36} className="mx-auto text-rose-400" />
          <p className="text-sm font-bold text-slate-500">No se encontró el producto</p>
          <button onClick={() => navigate('/configuracion/productos')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold mx-auto">
            <ArrowLeft size={14} /> Volver al Catálogo
          </button>
        </div>
      </div>
    )
  }

  const precio1 = Number(producto.precios?.[0] || producto.precioBase || 0)
  const catName = producto.categoria?.nombre || '—'

  const ActiveIcon = TABS.find(t => t.id === activeTab)?.icon || Package

  return (
    <div className="w-full space-y-6">

      {/* ── HEADER DEL PRODUCTO ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Back */}
            <button onClick={() => navigate('/configuracion/productos')} className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all">
              <ArrowLeft size={16} />
            </button>
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-100">
              <Package size={24} className="text-white" />
            </div>
            {/* Info */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">{producto.sku}</span>
                {producto.referencia && <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-lg">Ref: {producto.referencia}</span>}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${producto.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                  {producto.activo ? 'Activo' : 'Inactivo'}
                </span>
                {producto.tipoProducto && <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg uppercase">{producto.tipoProducto}</span>}
              </div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">{producto.nombre}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {catName !== '—' && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Layers size={10} /> {catName}</span>}
                <span className="text-[10px] text-slate-400 flex items-center gap-1"><TrendingUp size={10} /> P1: <strong className="text-slate-600 font-mono">{fmtCOP(precio1)}</strong></span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1"><DollarSign size={10} /> CPP: <strong className="text-slate-600 font-mono">{fmtCOP(Number(producto.costoPromedio || 0))}</strong></span>
              </div>
            </div>
          </div>

          {/* Acciones del header */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button onClick={() => navigate(`/configuracion/productos`)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all">
              Catálogo
            </button>
            <button onClick={() => navigate(`/configuracion/productos?edit=${producto.id}`)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all">
              <Edit3 size={13} /> Editar Ficha Técnica
            </button>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs nav */}
        <div className="flex overflow-x-auto border-b border-slate-100 scrollbar-hide">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const varCount = tab.id === 'variantes' && Array.isArray(producto.variantes) ? producto.variantes.length : null
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all shrink-0 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {varCount !== null && varCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-100 text-indigo-700 font-bold">
                    {varCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'web'         && <TabWeb producto={producto} refetch={refetch} onCompartir={abrirCompartir} />}
          {activeTab === 'variantes'   && <TabVariantes producto={producto} refetch={refetch} />}
          {activeTab === 'documentos'  && <TabDocumentos producto={producto} refetch={refetch} />}
          {activeTab === 'compras'     && <TabCompras productoId={productoId} sku={producto.sku} />}
          {activeTab === 'proveedores' && <TabProveedores producto={producto} refetch={refetch} />}
          {activeTab === 'stock'       && <TabStock producto={producto} refetch={refetch} />}
          {activeTab === 'costeo'      && <TabCosteo producto={producto} refetch={refetch} />}
          {activeTab === 'codigos'     && <TabCodigosBarra producto={producto} refetch={refetch} />}
          {activeTab === 'facturas'    && <TabFacturas productoId={productoId} />}
        </div>
      </div>

      {/* Modal Compartir en Redes (WhatsApp, Instagram, TikTok y Marketplace) */}
      {producto && (
        <CompartirRedesModal
          isOpen={compartirModalOpen}
          onClose={() => setCompartirModalOpen(false)}
          producto={producto}
          redInicial={redCompartir}
        />
      )}
    </div>
  )
}
