import React, { useState } from 'react'
import {
  Share2, MessageCircle, ShoppingBag, Copy, Check, Download,
  ExternalLink, X, Smartphone, Monitor, Image as ImageIcon, Sparkles
} from 'lucide-react'
import api, { getMediaUrl } from '../services/api'
import toast from 'react-hot-toast'

interface CompartirRedesModalProps {
  isOpen: boolean
  onClose: () => void
  producto: {
    id: number
    nombre: string
    sku: string
    precioBase: number
    precioWeb?: number | null
    slug?: string | null
    imagen?: string | null
    descripcion?: string | null
    metadataWeb?: any
  }
}

export function CompartirRedesModal({ isOpen, onClose, producto }: CompartirRedesModalProps) {
  const [redActiva, setRedActiva] = useState<'whatsapp' | 'marketplace'>('whatsapp')
  const [copiadoCampo, setCopiadoCampo] = useState<string | null>(null)
  const [formatoVertical, setFormatoVertical] = useState<boolean>(true)
  const [compartiendo, setCompartiendo] = useState<boolean>(false)

  if (!isOpen || !producto) return null

  const precio = Number(producto.precioWeb || producto.precioBase || 0)
  const precioFmt = `$${precio.toLocaleString('es-CO')}`
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const storeDomain = isLocal ? 'http://localhost:5173' : 'https://distribuidorababyworld.com'
  const productSlug = producto.slug || producto.id
  const productoUrl = `${storeDomain}/producto/${productSlug}`

  // Texto optimizado para Estados de WhatsApp
  const textoWhatsApp = `🍼 ${producto.nombre}
💰 ${precioFmt}
🛒 Pídelo aquí 👉 ${productoUrl}
📍 Pañalera Baby World`

  // Texto para Marketplace
  const tituloMarketplace = producto.nombre.slice(0, 100)
  const descripcionMarketplace = `${producto.descripcion || producto.nombre}

💰 Precio: ${precioFmt}
📍 Pañalera Baby World
🛒 Compra online o cotiza en nuestra tienda oficial:
👉 ${productoUrl}`

  // URL de la imagen principal
  const imagenOriginal = producto.imagen || (Array.isArray(producto.metadataWeb?.imagenes) ? producto.metadataWeb.imagenes[0] : null)
  
  // URL de imagen vertical 1080x1920 (optimizada al vuelo en Cloudinary con fondo blanco)
  let imagenParaEstado = imagenOriginal ? getMediaUrl(imagenOriginal) : ''
  if (formatoVertical && imagenParaEstado.includes('res.cloudinary.com') && imagenParaEstado.includes('/upload/')) {
    imagenParaEstado = imagenParaEstado.replace('/upload/', '/upload/b_white,c_pad,w_1080,h_1920/')
  }

  const copiarTexto = async (texto: string, campo: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiadoCampo(campo)
      toast.success('¡Copiado al portapapeles! 📋')
      setTimeout(() => setCopiadoCampo(null), 2500)
    } catch {
      toast.error('No se pudo copiar automáticamente')
    }
  }

  const registrarCompartido = async (red: 'whatsapp' | 'marketplace') => {
    try {
      await api.post(`/digital/ia/productos/${producto.id}/compartido`, { red })
    } catch (e) {
      // Silencioso para no bloquear la experiencia de usuario
    }
  }

  // Descarga una imagen vía blob para evitar que el navegador la abra en pestaña nueva
  const descargarImagen = async (url: string, nombreArchivo: string) => {
    try {
      toast.loading('Descargando imagen...', { id: 'descarga' })
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = nombreArchivo
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
      toast.success('Imagen descargada con éxito ✓', { id: 'descarga' })
    } catch (err) {
      toast.error('No se pudo descargar directamente, abriendo imagen...', { id: 'descarga' })
      window.open(url, '_blank')
    }
  }

  // Compartir en Estado de WhatsApp
  const handleCompartirWhatsApp = async () => {
    registrarCompartido('whatsapp')

    // 1. Intentar Web Share API en dispositivos móviles
    if (navigator.share && navigator.canShare && imagenParaEstado) {
      try {
        setCompartiendo(true)
        const res = await fetch(imagenParaEstado)
        const blob = await res.blob()
        const file = new File([blob], `${producto.sku || 'producto'}-estado.jpg`, { type: 'image/jpeg' })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: producto.nombre,
            text: textoWhatsApp,
            files: [file],
          })
          toast.success('¡Listo! Selecciona WhatsApp > Mi Estado')
          return
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Web Share no disponible o cancelado, usando fallback.')
        } else {
          return // Usuario canceló la hoja de compartir
        }
      } finally {
        setCompartiendo(false)
      }
    }

    // 2. Fallback de Escritorio (Desktop):
    // Descarga la imagen, copia el texto y abre WhatsApp Web
    copiarTexto(textoWhatsApp, 'whatsapp-todo')
    if (imagenParaEstado) {
      descargarImagen(imagenParaEstado, `${producto.sku || 'producto'}-estado.jpg`)
    }
    toast.success('Texto copiado e imagen descargada. Abriendo WhatsApp Web...')
    setTimeout(() => {
      window.open('https://web.whatsapp.com', '_blank')
    }, 800)
  }

  // Compartir en Marketplace
  const handleAbrirMarketplace = async () => {
    registrarCompartido('marketplace')

    // Descargar todas las imágenes disponibles para que el usuario las suba
    const imgs: string[] = Array.isArray(producto.metadataWeb?.imagenes) && producto.metadataWeb.imagenes.length > 0
      ? producto.metadataWeb.imagenes
      : (producto.imagen ? [producto.imagen] : [])

    if (imgs.length > 0) {
      descargarImagen(getMediaUrl(imgs[0]), `${producto.sku || 'producto'}-marketplace-1.jpg`)
    }

    // Copiar la descripción por defecto
    copiarTexto(descripcionMarketplace, 'desc-mk')
    toast.success('Imagen descargada y descripción copiada. Abriendo Facebook...')

    setTimeout(() => {
      window.open('https://www.facebook.com/marketplace/create/item', '_blank')
    }, 700)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">Compartir Producto</h2>
              <p className="text-xs text-slate-400 truncate max-w-xs">{producto.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selector de Canal: WhatsApp o Marketplace */}
        <div className="p-3 bg-slate-100/70 flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setRedActiva('whatsapp')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              redActiva === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageCircle size={16} />
            Estado de WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setRedActiva('marketplace')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              redActiva === 'marketplace'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag size={16} />
            Facebook Marketplace
          </button>
        </div>

        {/* Contenido según el canal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* VISTA WHATSAPP */}
          {redActiva === 'whatsapp' && (
            <div className="space-y-4">
              {/* Formato de imagen */}
              <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                <div>
                  <p className="font-bold">Formato Vertical para Historias (1080×1920)</p>
                  <p className="text-[11px] text-emerald-700">Añade márgenes blancos automáticos para que no se corte en el móvil.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formatoVertical}
                  onChange={(e) => setFormatoVertical(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Vista previa del mensaje */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Texto del Estado</label>
                  <button
                    type="button"
                    onClick={() => copiarTexto(textoWhatsApp, 'whatsapp-todo')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    {copiadoCampo === 'whatsapp-todo' ? <Check size={13} /> : <Copy size={13} />}
                    Copiar Texto
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-700 whitespace-pre-line leading-relaxed shadow-xs">
                  {textoWhatsApp}
                </div>
              </div>

              {/* Miniatura de la foto */}
              {imagenParaEstado && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 p-1">
                    <img src={imagenParaEstado} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-slate-800">Imagen lista con logo Baby World</p>
                    <p className="text-slate-400 text-[11px]">Se adjunta automáticamente al compartir desde el celular.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => descargarImagen(imagenParaEstado, `${producto.sku}-estado.jpg`)}
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                    title="Descargar imagen manualmente"
                  >
                    <Download size={16} />
                  </button>
                </div>
              )}

              {/* Botón principal */}
              <button
                type="button"
                disabled={compartiendo}
                onClick={handleCompartirWhatsApp}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <MessageCircle size={18} />
                <span>Publicar en Estado de WhatsApp</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                En el celular abre la hoja de compartir; en el PC descarga la imagen y abre WhatsApp Web.
              </p>
            </div>
          )}

          {/* VISTA MARKETPLACE */}
          {redActiva === 'marketplace' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 text-xs text-blue-900">
                <p className="font-bold">Publicación semiautomática para perfil personal</p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Facebook no permite publicar directamente por API a Marketplace personal. Haz clic en cada campo para copiarlo y pégalo en el formulario de Facebook.
                </p>
              </div>

              {/* Campo 1: Título */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">1. Título</label>
                  <button
                    type="button"
                    onClick={() => copiarTexto(tituloMarketplace, 'titulo')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {copiadoCampo === 'titulo' ? <Check size={12} /> : <Copy size={12} />}
                    Copiar
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  {tituloMarketplace}
                </div>
              </div>

              {/* Campo 2: Precio */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">2. Precio (COP)</label>
                  <button
                    type="button"
                    onClick={() => copiarTexto(String(precio), 'precio')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {copiadoCampo === 'precio' ? <Check size={12} /> : <Copy size={12} />}
                    Copiar
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  {precioFmt} ({precio})
                </div>
              </div>

              {/* Campo 3: Descripción con Link */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">3. Descripción + Enlace Web</label>
                  <button
                    type="button"
                    onClick={() => copiarTexto(descripcionMarketplace, 'desc')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {copiadoCampo === 'desc' ? <Check size={12} /> : <Copy size={12} />}
                    Copiar
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                  {descripcionMarketplace}
                </div>
              </div>

              {/* Botón Marketplace */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAbrirMarketplace}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink size={18} />
                  <span>Descargar Fotos y Abrir Facebook Marketplace</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

