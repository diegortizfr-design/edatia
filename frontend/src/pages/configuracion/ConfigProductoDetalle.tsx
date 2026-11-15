import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { getMediaUrl } from '../../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Edit3, Package, Globe, FileText, ShoppingCart,
  Building2, Layers, DollarSign, CheckCircle2,
  AlertTriangle, Plus, Trash2, ExternalLink, TrendingUp,
  Star, X, Search, Save, RefreshCw, Warehouse,
  Link2, Upload, Hash, Calculator,
  BarChart3, Clock, Loader2,
  Tag, Sparkles, ToggleLeft, ToggleRight, Edit2, Info, Check, AlertCircle
} from 'lucide-react'
import {
  getProducto, getStockProducto, getOrdenesCompra, getFacturasCompra, getProveedores, updateProducto,
  getVariantes, createVariante, updateVariante, toggleVariante, deleteVariante,
  ajustarStockVariante, getBodegas
} from '../../services/inventario.service'
import { getImpuestos } from '../../services/erp.service'

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

const PRESETS_TALLAS = [
  { id: 'bebe', label: '👶 Bebé / Pasos (14 a 17)', tallas: ['14', '15', '16', '17'] },
  { id: 'nino', label: '🧒 Infantil / Niños (18 a 26)', tallas: ['18', '19', '20', '21', '22', '23', '24', '25', '26'] },
  { id: 'junior', label: '👟 Junior (27 a 34)', tallas: ['27', '28', '29', '30', '31', '32', '33', '34'] },
  { id: 'adulto', label: '👞 Adulto (35 a 42)', tallas: ['35', '36', '37', '38', '39', '40', '41', '42'] },
  { id: 'ropa-bebe', label: '🍼 Ropa Bebé (Meses)', tallas: ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'] },
  { id: 'ropa', label: '👕 Ropa / Textil (XS a XL)', tallas: ['XS', 'S', 'M', 'L', 'XL'] },
]

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
function TabWeb({ producto, refetch }: { producto: any; refetch: () => void }) {
  const [data, setData] = useState({
    publicadoWeb: producto.publicadoWeb || false,
    esDigital: producto.esDigital || false,
    nombreWeb: producto.nombreWeb || '',
    slug: producto.slug || '',
    descripcionWeb: producto.descripcionWeb || '',
    imagenes: Array.isArray(producto.imagenes) && producto.imagenes.length > 0 
      ? producto.imagenes 
      : producto.imagen ? [producto.imagen] : [],
    etiquetaSeo: producto.etiquetaSeo || '',
    metaDescripcion: producto.metaDescripcion || '',
    ordenMostrar: producto.ordenMostrar || 0,
    esDestacado: producto.esDestacado || false,
    urlDescarga: producto.urlDescarga || '',
  })
  const [saved, setSaved] = useState(false)
  const [newImagen, setNewImagen] = useState('')
  const [uploadingImg, setUploadingImg] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

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
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/configuracion/archivo/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { url } = response.data
      const updatedImgs = [...data.imagenes, url]
      setData(prev => ({ ...prev, imagenes: updatedImgs }))
      const payload = buildPayload(data, updatedImgs)
      await updateProducto(producto.id, payload)
      refetch()
      toast.success('Imagen subida y guardada exitosamente ✓')
    } catch (err: any) {
      console.error('Error al subir imagen:', err)
      const msg = err?.response?.data?.message || 'Error al subir la imagen'
      toast.error(typeof msg === 'string' ? msg : 'Error al subir la imagen')
    } finally {
      setUploadingImg(false)
      if (e.target) e.target.value = ''
    }
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
    
    setUploadingImg(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/configuracion/archivo/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { url } = response.data;
      const updatedImgs = [...data.imagenes, url];
      setData(prev => ({ ...prev, imagenes: updatedImgs }));
      const payload = buildPayload(data, updatedImgs);
      await updateProducto(producto.id, payload);
      refetch();
      toast.success('Imagen subida y guardada exitosamente ✓');
    } catch (err: any) {
      console.error('Error al subir imagen:', err);
      const msg = err?.response?.data?.message || 'Error al subir la imagen';
      toast.error(typeof msg === 'string' ? msg : 'Error al subir la imagen');
    } finally {
      setUploadingImg(false);
    }
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
    const updatedImgs = [...data.imagenes, newImagen.trim()]
    setData(prev => ({ ...prev, imagenes: updatedImgs }))
    setNewImagen('')
    try {
      const payload = buildPayload(data, updatedImgs)
      await updateProducto(producto.id, payload)
      refetch()
      toast.success('Imagen agregada y guardada ✓')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar imagen'
      toast.error(typeof msg === 'string' ? msg : 'Error al guardar imagen')
    }
  }

  const removeImagen = async (i: number) => {
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

      {/* Campos web */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Información de Publicación</h4>
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
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <Upload size={14} /> Imágenes del Producto (URLs)
          </h4>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md hidden sm:inline-block">Puedes arrastrar y soltar fotos aquí</span>
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
                <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                  <img src={getMediaUrl(img)} alt="Preview" className="w-full h-full object-contain" />
                </div>
                <span className="truncate max-w-[150px] font-mono select-none">{img}</span>
                <button type="button" onClick={() => removeImagen(i)}
                  className="text-slate-300 hover:text-rose-500 transition-colors" title="Eliminar imagen"><X size={12} /></button>
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

/* ---- TAB: Códigos de Barra ---- */
function TabCodigosBarra({ producto, refetch }: { producto: any; refetch: () => void }) {
  const [codigos, setCodigos] = useState<any[]>(() => {
    return (producto.codigosBarrasRel || []).map((c: any) => ({
      id: c.id,
      codigo: c.codigo,
      tipo: c.tipo,
      descripcion: c.descripcion || '',
      esPrincipal: c.esPrincipal || false,
    }))
  })
  const [form, setForm] = useState({ codigo: '', tipo: 'EAN-13', descripcion: '', esPrincipal: false })
  const [adding, setAdding] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async (updated: any[]) => {
    try {
      setCodigos(updated)
      await updateProducto(producto.id, { codigos: updated })
      setSaved(true)
      refetch()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert('Error al guardar códigos de barra')
    }
  }

  const addCodigo = () => {
    if (!form.codigo.trim()) return
    const newId = Date.now()
    const updated = [...codigos, { ...form, id: newId, codigo: form.codigo.trim() }]
    if (form.esPrincipal) {
      updated.forEach(c => { if (c.id !== newId) c.esPrincipal = false })
    }
    save(updated)
    setForm({ codigo: '', tipo: 'EAN-13', descripcion: '', esPrincipal: false })
    setAdding(false)
  }

  const marcarPrincipal = (id: number) => {
    const updated = codigos.map(c => ({ ...c, esPrincipal: c.id === id }))
    save(updated)
  }

  const eliminar = (id: number) => {
    const updated = codigos.filter(c => c.id !== id)
    save(updated)
  }

  const TIPO_OPTIONS = ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'Code 128', 'Code 39', 'QR Code', 'Data Matrix', 'ITF-14', 'Interno']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2"><Barcode size={18} className="text-indigo-600" /> Gestión de Códigos de Barra</h3>
          <p className="text-xs text-slate-400 mt-0.5">Registra múltiples códigos de barra del producto. El principal es el usado por defecto en el sistema.</p>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
          <Plus size={14} /> Agregar Código
        </button>
      </div>

      {/* Form */}
      {adding && (
        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest">Nuevo Código de Barra</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Código *</label>
              <input type="text" value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCodigo())}
                placeholder="Escanea o escribe el código" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer">
                {TIPO_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Descripción (Opcional)</label>
              <input type="text" value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Ej. Código de caja master, Código de proveedor..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 w-full cursor-pointer hover:bg-slate-100/50 transition-all h-[34px]">
                <input type="checkbox" checked={form.esPrincipal} onChange={e => setForm(p => ({ ...p, esPrincipal: e.target.checked }))}
                  className="rounded text-indigo-600 h-4 w-4" />
                <span className="text-xs font-bold text-slate-700">Marcar como Principal</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all">Cancelar</button>
            <button type="button" onClick={addCodigo} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"><Save size={13} /> Guardar</button>
          </div>
        </div>
      )}

      {/* Lista de códigos */}
      {codigos.length > 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Principal</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
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
                  <td className="p-4">
                    <button onClick={() => eliminar(c.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !adding ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
          <Barcode size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-400">Sin códigos de barra registrados</p>
          <p className="text-xs text-slate-300 mt-1">Agrega EAN-13, UPC, Code128 u otros formatos para este producto.</p>
        </div>
      ) : null}

      {/* Tip de uso */}
      {codigos.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <Hash size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-700">Tip: Múltiples Códigos</p>
            <p className="text-[11px] text-blue-600 mt-0.5">Puedes registrar el código EAN de la unidad, el código de la caja, el código del proveedor y el código interno. El <strong>Principal</strong> es el que se usa por defecto en POS y documentos.</p>
          </div>
        </div>
      )}
    </div>
  )
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

  const [customTallasInput, setCustomTallasInput] = useState('')
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
    mutationFn: ({ varId, data }: any) => ajustarStockVariante(varId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variantes', productoId] })
      qc.invalidateQueries({ queryKey: ['producto_detalle', productoId] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      setVarianteAjustarStock(null)
      toast.success('Stock ajustado correctamente')
    },
    onError: (err: any) => {
      toast.error(`Error: ${err?.response?.data?.message || err.message}`)
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
          const att = (v.atributos ?? []).find((a: any) => a.nombre?.toLowerCase() === 'talla')
          return att?.valor?.toLowerCase()
        })
      )

      let creadas = 0
      const precioBaseSugerido = Number(producto.precios?.[0] || producto.precioBase || 0)
      const baseSku = producto.sku || `PROD-${productoId}`

      for (const talla of tallasList) {
        const tClean = talla.trim()
        if (!tClean) continue
        if (existingTallas.has(tClean.toLowerCase())) continue

        const variantSku = `${baseSku}-${tClean}`.toUpperCase()
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
      toast.success(`Se generaron ${creadas} variantes`)
      setTimeout(() => setGeneratorMsg(null), 4000)
    } catch (err: any) {
      setGeneratorMsg(`Error generando variantes: ${err?.response?.data?.message || err.message}`)
      toast.error(`Error generando variantes`)
    } finally {
      setIsGenerating(false)
    }
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
            <p className="text-xs text-slate-500">Configura tallas (ej. calzado, ropa) para vender individualmente en la tienda virtual y POS.</p>
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

      {/* Generador Rápido de Tallas */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/50 border border-indigo-100 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Generador Rápido de Tallas</h3>
              <p className="text-xs text-slate-500">Crea múltiples tallas automáticamente con un solo clic</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setVarianteAEditar(null)
              setShowVarianteModal(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus size={14} />
            <span>+ Variante manual</span>
          </button>
        </div>

        {/* Preajustes rápidos */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preajustes de Calzado y Ropa:</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS_TALLAS.map(p => (
              <button
                key={p.id}
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerarTallas(p.tallas)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
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

        {/* O escribir tallas libres */}
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
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap shadow-xs"
          >
            {isGenerating ? 'Generando...' : 'Crear tallas'}
          </button>
        </div>
      </div>

      {/* Listado de Variantes */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">Tallas y Variantes registradas</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600">
              {variantes.length}
            </span>
          </div>
        </div>

        {loadingVariantes ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
            <span>Cargando variantes...</span>
          </div>
        ) : variantes.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Layers size={40} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Este producto aún no tiene tallas o variantes</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Usa el generador rápido de arriba para crear las tallas de calzado en 1 clic, o agrega una variante manual.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Talla / Atributo</th>
                  <th className="p-4">SKU Variante</th>
                  <th className="p-4">Código Barras</th>
                  <th className="p-4 text-right">Precio Base</th>
                  <th className="p-4 text-center">Stock Físico</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center w-36">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variantes.map((v: any) => {
                  const stockTotal = totalStockVariante(v)
                  const tallaAttr = (v.atributos ?? []).find((a: any) => a.nombre?.toLowerCase() === 'talla')
                  return (
                    <tr key={v.id} className={`hover:bg-slate-50/50 transition-colors ${!v.activo ? 'opacity-60 bg-slate-50/30' : ''}`}>
                      {/* Talla / Atributo */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs font-mono">
                            {tallaAttr ? `Talla ${tallaAttr.valor}` : v.nombre}
                          </span>
                          {v.atributos?.length > 1 && (
                            <span className="text-[11px] text-slate-400">
                              ({v.atributos.filter((a: any) => a.nombre?.toLowerCase() !== 'talla').map((a: any) => `${a.nombre}: ${a.valor}`).join(', ')})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SKU */}
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
                          className="text-slate-400 hover:text-slate-700 p-1 transition-transform active:scale-95"
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
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-lg border border-indigo-100 transition-colors"
                            title="Ajustar stock en bodega"
                          >
                            + Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => setVarianteAEditar(v)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
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
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          baseSku={producto.sku}
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
          variante={varianteAjustarStock}
          bodegas={bodegas}
          onClose={() => setVarianteAjustarStock(null)}
          onSubmit={(data: any) => {
            mutStockVariante.mutate({ varId: varianteAjustarStock.id, data })
          }}
          isLoading={mutStockVariante.isPending}
        />
      )}
    </div>
  )
}

function ModalVarianteFormDetalle({ producto, baseSku, precioSugerido, variante, onClose, onSubmit, isLoading }: any) {
  const isEditing = !!variante
  const [sku, setSku] = useState(variante?.sku ?? (baseSku ? `${baseSku}-` : ''))
  const [talla, setTalla] = useState(() => {
    const attr = (variante?.atributos ?? []).find((a: any) => a.nombre?.toLowerCase() === 'talla')
    return attr?.valor ?? ''
  })
  const [precio, setPrecio] = useState(variante?.precioBase ? String(variante.precioBase) : String(precioSugerido || '0'))
  const [codigoBarras, setCodigoBarras] = useState(variante?.codigoBarras ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sku.trim()) return alert('El SKU es obligatorio')
    if (!talla.trim()) return alert('La talla es obligatoria')

    onSubmit({
      sku: sku.trim().toUpperCase(),
      nombre: `Talla ${talla.trim()}`,
      atributos: [{ nombre: 'Talla', valor: talla.trim() }],
      precioBase: parseFloat(precio || '0'),
      codigoBarras: codigoBarras.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Tag size={18} />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">
              {isEditing ? 'Editar Variante' : 'Nueva Variante / Talla'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Talla o Identificador *</label>
            <input
              type="text"
              required
              value={talla}
              onChange={e => {
                const val = e.target.value
                setTalla(val)
                if (!isEditing && baseSku) {
                  setSku(`${baseSku}-${val}`.toUpperCase())
                }
              }}
              placeholder="Ej: 18, 22, 37, XL..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SKU Variante *</label>
            <input
              type="text"
              required
              value={sku}
              onChange={e => setSku(e.target.value)}
              placeholder="Ej: CALZ-001-18"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Precio Base de Venta (COP)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código de Barras (Opcional)</label>
            <input
              type="text"
              value={codigoBarras}
              onChange={e => setCodigoBarras(e.target.value)}
              placeholder="Ej: 770123456789"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Variante' : 'Guardar Variante')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalAjustarStockVarianteDetalle({ variante, bodegas, onClose, onSubmit, isLoading }: any) {
  const [bodegaId, setBodegaId] = useState<string>(bodegas[0]?.id ? String(bodegas[0].id) : '')
  const [cantidad, setCantidad] = useState<string>('')
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA' | 'AJUSTE'>('ENTRADA')
  const [motivo, setMotivo] = useState<string>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bodegaId) return alert('Selecciona una bodega')
    const cantNum = parseFloat(cantidad)
    if (isNaN(cantNum) || cantNum <= 0) return alert('Ingresa una cantidad válida')

    onSubmit({
      bodegaId: parseInt(bodegaId, 10),
      cantidad: cantNum,
      tipo,
      motivo: motivo.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Warehouse size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Ajustar Stock Físico</h3>
              <p className="text-[11px] text-slate-400 font-mono">{variante.sku} · {variante.nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bodega de destino</label>
            <select
              value={bodegaId}
              onChange={e => setBodegaId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
            >
              {bodegas.map((b: any) => (
                <option key={b.id} value={b.id}>{b.nombre} {b.esPrincipal ? '(Principal)' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Movimiento</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipo('ENTRADA')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  tipo === 'ENTRADA'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                + Entrada
              </button>
              <button
                type="button"
                onClick={() => setTipo('SALIDA')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  tipo === 'SALIDA'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                - Salida
              </button>
              <button
                type="button"
                onClick={() => setTipo('AJUSTE')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  tipo === 'AJUSTE'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                = Fijar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {tipo === 'AJUSTE' ? 'Nuevo Stock Total *' : 'Cantidad a mover *'}
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              placeholder="Ej: 10"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Motivo / Observación</label>
            <input
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Conteo físico inicial, ingreso de mercancía..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isLoading ? 'Registrando...' : 'Confirmar Stock'}
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
          <div className="flex items-center gap-2 shrink-0">
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
          {activeTab === 'web'         && <TabWeb producto={producto} refetch={refetch} />}
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
    </div>
  )
}
