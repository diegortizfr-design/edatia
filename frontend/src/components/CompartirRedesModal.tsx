import React, { useState, useEffect } from 'react'
import {
  Share2, MessageCircle, ShoppingBag, Copy, Check, Download,
  ExternalLink, X, Sparkles, Video, Send
} from 'lucide-react'
import api, { getMediaUrl } from '../services/api'
import toast from 'react-hot-toast'

export type RedSocial = 'whatsapp' | 'instagram' | 'tiktok' | 'marketplace'

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
  redInicial?: RedSocial
}

export function CompartirRedesModal({ isOpen, onClose, producto, redInicial = 'whatsapp' }: CompartirRedesModalProps) {
  const [redActiva, setRedActiva] = useState<RedSocial>(redInicial)
  const [copiadoCampo, setCopiadoCampo] = useState<string | null>(null)
  const [formatoVertical, setFormatoVertical] = useState<boolean>(true)
  const [formatoIg, setFormatoIg] = useState<'feed' | 'story'>('feed')
  const [compartiendo, setCompartiendo] = useState<boolean>(false)

  useEffect(() => {
    if (redInicial) {
      setRedActiva(redInicial)
    }
  }, [redInicial, isOpen])

  if (!isOpen || !producto) return null

  const precio = Number(producto.precioWeb || producto.precioBase || 0)
  const precioFmt = `$${precio.toLocaleString('es-CO')}`
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const storeDomain = isLocal ? 'http://localhost:5173' : 'https://distribuidorababyworld.com'
  const productSlug = producto.slug || producto.id
  const productoUrl = `${storeDomain}/producto/${productSlug}`

  // Texto optimizado para WhatsApp (con enlace arriba para vista previa inmediata y máxima conversión)
  const textoWhatsApp = `🛒 *Pídelo aquí:* 👉 ${productoUrl}

🍼 *${producto.nombre}*
💰 *Precio: ${precioFmt}*
✨ ${producto.descripcion || 'Disponible en Distribuidora Baby World'}
📍 *Pañalera Baby World* • Envíos a toda Colombia 🚚`

  // Texto optimizado para Instagram (con enlace visible antes del corte "...más")
  const textoInstagram = `🛒 Link directo: 👉 ${productoUrl} (o en el enlace de nuestra biografía)

✨ ${producto.nombre} ✨
💰 Precio especial: ${precioFmt}

${producto.descripcion || 'Llegó a Distribuidora Baby World lo mejor para el bienestar y confort de tu bebé.'}

📦 Envíos rápidos y seguros a todo el país.
📲 Escríbenos por DM o WhatsApp para asesoría personalizada.

#BabyWorld #Pañalera #BebesColombia #CuidadoDelBebe #Maternidad #MamaPrimeriza #ProductosParaBebes #Colombia #TiendaDeBebes`

  // Guion estructurado para TikTok (con llamado al link prioritario)
  const textoTikTok = `📲 LINK DIRECTO AL PRODUCTO:
👉 ${productoUrl} (o toca el enlace en nuestro perfil)

🎬 GANCHO (0-3 seg):
"¿Buscando lo mejor y más práctico para tu bebé? 👶 Mira lo que acaba de llegar a Baby World..."

📦 PRESENTACIÓN:
"${producto.nombre} - ${producto.descripcion ? producto.descripcion.slice(0, 140) + '...' : 'Calidad comprobada y la mejor comodidad para tu pequeño.'}"

💰 PRECIO:
"Por solo ${precioFmt} en Distribuidora Baby World."

🏷️ HASHTAGS:
#BabyWorld #Pañalera #TikTokMadeMeBuyIt #MamaPrimeriza #Bebes #MaternidadReal #CuidadoDelBebe #Colombia`

  // Texto para Facebook Marketplace (enlace y precio al inicio para evitar que se pierdan en el "ver más")
  const tituloMarketplace = producto.nombre.slice(0, 100)
  const descripcionMarketplace = `🛒 Compra online o cotiza aquí: 👉 ${productoUrl}
💰 Precio: ${precioFmt}

🍼 ${producto.nombre}

${producto.descripcion || 'Producto 100% garantizado para el cuidado y comodidad de tu bebé.'}

📍 Pañalera Baby World
🚚 Envíos seguros a todo el país`

  // URL de la imagen principal
  const imagenOriginal = producto.imagen || (Array.isArray(producto.metadataWeb?.imagenes) ? producto.metadataWeb.imagenes[0] : null)
  
  // URL de imagen vertical 1080x1920 (optimizada al vuelo en Cloudinary con fondo blanco)
  let imagenParaEstado = imagenOriginal ? getMediaUrl(imagenOriginal) : ''
  if (imagenParaEstado.includes('res.cloudinary.com') && imagenParaEstado.includes('/upload/')) {
    imagenParaEstado = imagenParaEstado.replace('/upload/', '/upload/b_white,c_pad,w_1080,h_1920/')
  }

  // URL imagen feed cuadrado 1200x1200
  let imagenCuadrada = imagenOriginal ? getMediaUrl(imagenOriginal) : ''
  if (imagenCuadrada.includes('res.cloudinary.com') && imagenCuadrada.includes('/upload/')) {
    imagenCuadrada = imagenCuadrada.replace('/upload/', '/upload/b_white,c_pad,w_1200,h_1200/')
  }

  const imagenSeleccionadaWhatsApp = formatoVertical ? imagenParaEstado : imagenCuadrada
  const imagenSeleccionadaInstagram = formatoIg === 'story' ? imagenParaEstado : imagenCuadrada

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

  const registrarCompartido = async (red: RedSocial) => {
    try {
      await api.post(`/digital/ia/productos/${producto.id}/compartido`, { red })
    } catch (e) {
      // Silencioso para no bloquear al usuario
    }
  }

  // Descarga una imagen vía blob
  const descargarImagen = async (url: string, nombreArchivo: string) => {
    if (!url) {
      toast.error('No hay imagen disponible para descargar')
      return
    }
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
      toast.error('Abriendo imagen en nueva pestaña...', { id: 'descarga' })
      window.open(url, '_blank')
    }
  }

  // Compartir en Estado de WhatsApp
  const handleCompartirWhatsAppEstado = async () => {
    registrarCompartido('whatsapp')

    if (navigator.share && navigator.canShare && imagenSeleccionadaWhatsApp) {
      try {
        setCompartiendo(true)
        const res = await fetch(imagenSeleccionadaWhatsApp)
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
          console.warn('Web Share no disponible, usando fallback.')
        } else {
          return
        }
      } finally {
        setCompartiendo(false)
      }
    }

    // Fallback Desktop
    copiarTexto(textoWhatsApp, 'whatsapp-todo')
    if (imagenSeleccionadaWhatsApp) {
      descargarImagen(imagenSeleccionadaWhatsApp, `${producto.sku || 'producto'}-estado.jpg`)
    }
    toast.success('Texto copiado e imagen descargada. Abriendo WhatsApp Web...')
    setTimeout(() => {
      window.open('https://web.whatsapp.com', '_blank')
    }, 800)
  }

  // Enviar por Chat de WhatsApp
  const handleEnviarWhatsAppChat = () => {
    registrarCompartido('whatsapp')
    const urlWa = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoWhatsApp)}`
    window.open(urlWa, '_blank')
  }

  // Compartir en Instagram
  const handleAbrirInstagram = () => {
    registrarCompartido('instagram')
    copiarTexto(textoInstagram, 'ig-copy')
    if (imagenSeleccionadaInstagram) {
      descargarImagen(imagenSeleccionadaInstagram, `${producto.sku || 'producto'}-instagram-${formatoIg}.jpg`)
    }
    toast.success('Copy copiado e imagen descargada. Abriendo Instagram...')
    setTimeout(() => {
      window.open('https://www.instagram.com', '_blank')
    }, 800)
  }

  // Compartir en TikTok
  const handleAbrirTikTok = () => {
    registrarCompartido('tiktok')
    copiarTexto(textoTikTok, 'tiktok-copy')
    if (imagenParaEstado) {
      descargarImagen(imagenParaEstado, `${producto.sku || 'producto'}-tiktok-9x16.jpg`)
    }
    toast.success('Guion copiado e imagen 9:16 descargada. Abriendo TikTok...')
    setTimeout(() => {
      window.open('https://www.tiktok.com/upload', '_blank')
    }, 800)
  }

  // Compartir en Facebook Marketplace
  const handleAbrirMarketplace = async () => {
    registrarCompartido('marketplace')
    const imgs: string[] = Array.isArray(producto.metadataWeb?.imagenes) && producto.metadataWeb.imagenes.length > 0
      ? producto.metadataWeb.imagenes
      : (producto.imagen ? [producto.imagen] : [])

    if (imgs.length > 0) {
      descargarImagen(getMediaUrl(imgs[0]), `${producto.sku || 'producto'}-marketplace.jpg`)
    }
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
              <h2 className="text-base font-black text-slate-800">Difusión y Redes Sociales</h2>
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

        {/* Barra de Canales: WhatsApp, Instagram, TikTok, Marketplace */}
        <div className="p-2.5 bg-slate-100/70 grid grid-cols-2 sm:grid-cols-4 gap-1.5 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setRedActiva('whatsapp')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              redActiva === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageCircle size={15} />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setRedActiva('instagram')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              redActiva === 'instagram'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-200'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles size={15} />
            <span>Instagram</span>
          </button>

          <button
            type="button"
            onClick={() => setRedActiva('tiktok')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              redActiva === 'tiktok'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-400'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Video size={15} />
            <span>TikTok</span>
          </button>

          <button
            type="button"
            onClick={() => setRedActiva('marketplace')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              redActiva === 'marketplace'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag size={15} />
            <span>Marketplace</span>
          </button>
        </div>

        {/* Contenido según el canal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* ── 1. VISTA WHATSAPP ── */}
          {redActiva === 'whatsapp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                <div>
                  <p className="font-bold">Formato Vertical para Estados (1080×1920)</p>
                  <p className="text-[11px] text-emerald-700">Añade márgenes blancos automáticos para que no se corte en pantalla móvil.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formatoVertical}
                  onChange={(e) => setFormatoVertical(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Texto sugerido</label>
                  <button
                    type="button"
                    onClick={() => copiarTexto(textoWhatsApp, 'whatsapp-todo')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    {copiadoCampo === 'whatsapp-todo' ? <Check size={13} /> : <Copy size={13} />}
                    Copiar
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-700 whitespace-pre-line leading-relaxed shadow-xs">
                  {textoWhatsApp}
                </div>
              </div>

              {imagenSeleccionadaWhatsApp && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 p-1">
                    <img src={imagenSeleccionadaWhatsApp} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-slate-800">Foto {formatoVertical ? 'Vertical 9:16' : 'Cuadrada 1:1'}</p>
                    <p className="text-slate-400 text-[11px]">Fondo blanco estudio listo para compartir.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => descargarImagen(imagenSeleccionadaWhatsApp, `${producto.sku}-whatsapp.jpg`)}
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                    title="Descargar imagen"
                  >
                    <Download size={16} />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleEnviarWhatsAppChat}
                  className="py-3 px-3 bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={15} />
                  <span>Enviar por Chat de WhatsApp</span>
                </button>

                <button
                  type="button"
                  disabled={compartiendo}
                  onClick={handleCompartirWhatsAppEstado}
                  className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <MessageCircle size={16} />
                  <span>Publicar en Mi Estado</span>
                </button>
              </div>
            </div>
          )}

          {/* ── 2. VISTA INSTAGRAM ── */}
          {redActiva === 'instagram' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-pink-50/70 rounded-2xl border border-pink-200 text-xs text-pink-950">
                <div>
                  <p className="font-bold">Formato de Publicación para Instagram</p>
                  <p className="text-[11px] text-pink-700">Selecciona si vas a publicar en el Feed principal o en Historias/Reels.</p>
                </div>
                <div className="flex gap-1 bg-white p-1 rounded-xl border border-pink-200">
                  <button
                    type="button"
                    onClick={() => setFormatoIg('feed')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      formatoIg === 'feed' ? 'bg-pink-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Feed (1:1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatoIg('story')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      formatoIg === 'story' ? 'bg-pink-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Story (9:16)
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Caption con Hashtags</label>
                  <button
                    type="button"
                    onClick={() => copiarTexto(textoInstagram, 'ig-copy')}
                    className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1"
                  >
                    {copiadoCampo === 'ig-copy' ? <Check size={13} /> : <Copy size={13} />}
                    Copiar Caption
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-44 overflow-y-auto shadow-xs">
                  {textoInstagram}
                </div>
              </div>

              {imagenSeleccionadaInstagram && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 p-1">
                    <img src={imagenSeleccionadaInstagram} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-slate-800">Foto Instagram ({formatoIg === 'story' ? 'Story 9:16' : 'Feed 1:1'})</p>
                    <p className="text-slate-400 text-[11px]">Limpia, fondo blanco estudio profesional.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => descargarImagen(imagenSeleccionadaInstagram, `${producto.sku}-instagram-${formatoIg}.jpg`)}
                    className="p-2 text-slate-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-colors"
                    title="Descargar foto"
                  >
                    <Download size={16} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleAbrirInstagram}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-95 text-white rounded-2xl font-bold text-sm shadow-lg shadow-pink-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Copiar Caption, Descargar Foto y Abrir Instagram</span>
              </button>
            </div>
          )}

          {/* ── 3. VISTA TIKTOK ── */}
          {redActiva === 'tiktok' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900 text-white rounded-2xl text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5"><Video size={14} className="text-cyan-400" /> Guion y Formato Vertical (9:16)</p>
                <p className="text-[11px] text-slate-300">
                  Usa este guion estructurado con gancho para grabar tu video corto o publicar la foto en modo foto carrusel de TikTok.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Guion + Hashtags sugeridos</label>
                  <button
                    type="button"
                    onClick={() => copiarTexto(textoTikTok, 'tiktok-copy')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    {copiadoCampo === 'tiktok-copy' ? <Check size={13} /> : <Copy size={13} />}
                    Copiar Guion
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto shadow-xs">
                  {textoTikTok}
                </div>
              </div>

              {imagenParaEstado && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 p-1">
                    <img src={imagenParaEstado} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-slate-800">Imagen Vertical TikTok (9:16)</p>
                    <p className="text-slate-400 text-[11px]">Optimizada para pantalla completa de celular.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => descargarImagen(imagenParaEstado, `${producto.sku}-tiktok-9x16.jpg`)}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Descargar imagen"
                  >
                    <Download size={16} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleAbrirTikTok}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-300 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Video size={16} />
                <span>Copiar Guion, Descargar Imagen y Abrir TikTok</span>
              </button>
            </div>
          )}

          {/* ── 4. VISTA MARKETPLACE ── */}
          {redActiva === 'marketplace' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 text-xs text-blue-900">
                <p className="font-bold">Publicación semiautomática para Facebook Marketplace</p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Haz clic en cada campo para copiarlo rápidamente en el formulario de publicación de Facebook.
                </p>
              </div>

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
