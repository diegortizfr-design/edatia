import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Edit3, Package, Globe, FileText, ShoppingCart,
  Building2, Layers, DollarSign, CheckCircle2,
  AlertTriangle, Plus, Trash2, ExternalLink, TrendingUp,
  Star, X, Search, Save, RefreshCw, Warehouse,
  Link2, Upload, Hash, Calculator,
  BarChart3, Clock, Loader2
} from 'lucide-react'
import {
  getProducto, getStockProducto, getOrdenesCompra, getProveedores, updateProducto
} from '../../services/inventario.service'

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

// Local storage helpers removed. Using direct database bindings.

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'web',        label: 'Web / Digital',    icon: Globe },
  { id: 'documentos', label: 'Documentos',        icon: FileText },
  { id: 'compras',    label: 'Compras',           icon: ShoppingCart },
  { id: 'proveedores',label: 'Proveedores',       icon: Building2 },
  { id: 'stock',      label: 'Stock',             icon: Layers },
  { id: 'costeo',     label: 'Costeo',            icon: DollarSign },
  { id: 'codigos',    label: 'Códigos de Barra',  icon: Barcode },
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
    imagenes: Array.isArray(producto.imagenes) ? producto.imagenes : [],
    etiquetaSeo: producto.etiquetaSeo || '',
    metaDescripcion: producto.metaDescripcion || '',
    ordenMostrar: producto.ordenMostrar || 0,
    esDestacado: producto.esDestacado || false,
    urlDescarga: producto.urlDescarga || '',
  })
  const [saved, setSaved] = useState(false)
  const [newImagen, setNewImagen] = useState('')
  const [uploadingImg, setUploadingImg] = useState(false)

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
      setData(p => ({ ...p, imagenes: [...p.imagenes, url] }))
      toast.success('Imagen subida exitosamente ✓')
    } catch (err: any) {
      toast.error('Error al subir la imagen')
    } finally {
      setUploadingImg(false)
    }
  }

  const save = async () => {
    try {
      await updateProducto(producto.id, data)
      setSaved(true)
      refetch()
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      alert('Error al guardar configuración web')
    }
  }

  const autoSlug = (nombre: string) =>
    nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const addImagen = () => {
    if (!newImagen.trim()) return
    setData(p => ({ ...p, imagenes: [...p.imagenes, newImagen.trim()] }))
    setNewImagen('')
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
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2"><Upload size={14} /> Imágenes del Producto (URLs)</h4>
        <div className="flex gap-2">
          <input type="text" value={newImagen} onChange={e => setNewImagen(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImagen())}
            placeholder="Pegar URL de imagen o usa el botón de subir" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
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
              <div key={i} className="group flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono">
                <span className="truncate max-w-[200px]">{img}</span>
                <button type="button" onClick={() => setData(p => ({ ...p, imagenes: p.imagenes.filter((_, j) => j !== i) }))}
                  className="text-slate-300 hover:text-rose-500 transition-colors"><X size={12} /></button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Sin imágenes. Agrega URLs de imágenes del producto.</p>
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
  const { data: ocAll = [], isLoading } = useQuery({
    queryKey: ['oc_all'],
    queryFn: () => getOrdenesCompra(),
  })

  const ocProducto = ocAll.filter(oc =>
    oc.items?.some((item: any) => item.productoId === productoId)
  )

  const ESTADO_COLOR: Record<string, string> = {
    BORRADOR: 'bg-slate-100 text-slate-600',
    PENDIENTE: 'bg-amber-50 text-amber-700',
    APROBADA: 'bg-blue-50 text-blue-700',
    RECIBIDA: 'bg-emerald-50 text-emerald-700',
    ANULADA: 'bg-rose-50 text-rose-700',
  }

  if (isLoading) return <div className="py-16 text-center text-slate-400 text-sm">Cargando historial de compras...</div>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2"><ShoppingCart size={18} className="text-indigo-600" /> Trazabilidad de Compras</h3>
        <p className="text-xs text-slate-400 mt-0.5">Historial de órdenes de compra que incluyen este producto. Vista de solo lectura.</p>
      </div>

      {/* KPIs rápidos */}
      {ocProducto.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Órdenes Totales', value: ocProducto.length, icon: ShoppingCart, color: 'indigo' },
            { label: 'Recibidas', value: ocProducto.filter(o => o.estado === 'RECIBIDA').length, icon: CheckCircle2, color: 'emerald' },
            { label: 'Pendientes', value: ocProducto.filter(o => ['PENDIENTE', 'APROBADA'].includes(o.estado)).length, icon: Clock, color: 'amber' },
            {
              label: 'Total Comprado',
              value: fmtCOP(ocProducto.reduce((acc, oc) => {
                const item = oc.items?.find((i: any) => i.productoId === productoId)
                return acc + (item ? Number(item.total) : 0)
              }, 0)),
              icon: DollarSign, color: 'purple'
            },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
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
    </div>
  )
}

/* ---- TAB: Proveedores ---- */
function TabProveedores({ producto, refetch }: { producto: any; refetch: () => void }) {
  const [vinculados, setVinculados] = useState<any[]>(() => {
    return (producto.proveedoresRel || []).map((rel: any) => ({
      id: rel.proveedor?.id || rel.proveedorId,
      nombre: rel.proveedor?.nombre || '',
      nombreComercial: rel.proveedor?.nombreComercial || '',
      email: rel.proveedor?.email || '',
      telefono: rel.proveedor?.telefono || '',
      esPrincipal: rel.prioridad === 1 || rel.esPrincipal || false,
      precioAcordado: Number(rel.precioCompra || 0),
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
      refetch()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert('Error al guardar proveedores')
    }
  }

  const vincular = (prov: any) => {
    const updated = [...vinculados, {
      id: prov.id,
      nombre: prov.nombre,
      nombreComercial: prov.nombreComercial,
      email: prov.email,
      telefono: prov.telefono,
      esPrincipal: vinculados.length === 0,
      precioAcordado: 0,
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
          <p className="text-xs text-slate-400 mt-0.5">Vincula los proveedores habituales y marca el principal.</p>
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
          {vinculados.map(v => (
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Precio Acordado ($)</label>
                  <input type="number" min="0" value={v.precioAcordado} onChange={e => updateVinculado(v.id, 'precioAcordado', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Plazo de Entrega (días)</label>
                  <input type="number" min="0" value={v.plazoEntrega} onChange={e => updateVinculado(v.id, 'plazoEntrega', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Notas de Negociación</label>
                  <input type="text" value={v.notas} onChange={e => updateVinculado(v.id, 'notas', e.target.value)} placeholder="Condiciones, descuentos..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" />
                </div>
              </div>
            </div>
          ))}
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

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export function ConfigProductoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const productoId = parseInt(id || '0', 10)
  const [activeTab, setActiveTab] = useState('web')

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
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'web'         && <TabWeb producto={producto} refetch={refetch} />}
          {activeTab === 'documentos'  && <TabDocumentos producto={producto} refetch={refetch} />}
          {activeTab === 'compras'     && <TabCompras productoId={productoId} sku={producto.sku} />}
          {activeTab === 'proveedores' && <TabProveedores producto={producto} refetch={refetch} />}
          {activeTab === 'stock'       && <TabStock producto={producto} refetch={refetch} />}
          {activeTab === 'costeo'      && <TabCosteo producto={producto} refetch={refetch} />}
          {activeTab === 'codigos'     && <TabCodigosBarra producto={producto} refetch={refetch} />}
        </div>
      </div>
    </div>
  )
}
