import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FileText, Printer, Trash2, Search, UploadCloud, HardDrive,
  ExternalLink, ChevronRight, RefreshCw, LayoutTemplate,
  Barcode, Download, FileCode, CheckCircle2, AlertTriangle, Info
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import api from '../../services/api'
import { getProductos } from '../../services/inventario.service'

// Local Service APIs
const getStorageUsage = () => api.get('/configuracion/archivo/storage').then(r => r.data)
const getGeneralFiles = () => api.get('/configuracion/archivo/general').then(r => r.data)
const deleteGeneralFile = (filename: string) => api.delete(`/configuracion/archivo/general/${filename}`).then(r => r.data)

// Helper to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function ConfigArchivo() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'TODOS' | 'FICHAS' | 'BARCODE' | 'GENERAL' | 'PLANTILLAS'>('TODOS')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)

  // Fetch queries
  const { data: storage, refetch: refetchStorage, isLoading: loadingStorage } = useQuery({
    queryKey: ['archivo-storage'],
    queryFn: getStorageUsage,
  })

  const { data: generalFiles = [], refetch: refetchGeneral, isLoading: loadingGeneral } = useQuery({
    queryKey: ['archivo-general-files'],
    queryFn: getGeneralFiles,
  })

  const { data: productos = [], refetch: refetchProductos, isLoading: loadingProductos } = useQuery({
    queryKey: ['archivo-productos-list'],
    queryFn: () => getProductos({ activo: true }),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteGeneralFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archivo-general-files'] })
      queryClient.invalidateQueries({ queryKey: ['archivo-storage'] })
      toast.success('Archivo general eliminado ✓')
    },
    onError: () => toast.error('Error al eliminar archivo'),
  })

  // File Upload handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post('/configuracion/archivo/general', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      queryClient.invalidateQueries({ queryKey: ['archivo-general-files'] })
      queryClient.invalidateQueries({ queryKey: ['archivo-storage'] })
      toast.success('Archivo subido exitosamente ✓')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al subir el archivo'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  // Refresh all data
  const handleRefresh = async () => {
    toast.promise(
      Promise.all([refetchStorage(), refetchGeneral(), refetchProductos()]),
      {
        loading: 'Actualizando archivos...',
        success: 'Archivos actualizados ✓',
        error: 'Error al actualizar',
      }
    )
  }

  // Aggregate files
  const aggregatedFiles = useMemo(() => {
    const list: any[] = []

    // 1. Fichas Técnicas (from product documentos JSON where name contains "Ficha Técnica")
    productos.forEach(prod => {
      if (Array.isArray(prod.documentos)) {
        prod.documentos.forEach((doc: any) => {
          const isFicha = doc.nombre?.toLowerCase().includes('ficha técnica')
          list.push({
            id: doc.id || `ficha-${prod.id}`,
            nombre: doc.nombre || `Ficha Técnica - ${prod.nombre}`,
            tipo: 'Ficha Técnica',
            url: doc.url || `/configuracion/productos/${prod.id}/detalle?print=true`,
            size: doc.size || 150 * 1024, // 150 KB estimation if empty
            fecha: prod.updatedAt || prod.createdAt || new Date().toISOString(),
            descripcion: doc.descripcion || `Ficha técnica oficial de ${prod.nombre}`,
            originName: prod.nombre,
            originId: prod.id,
            originSku: prod.sku,
            originType: 'PRODUCTO',
          })
        })
      }
    })

    // 2. Barcodes (from product codes)
    productos.forEach(prod => {
      const barcodeValue = prod.codigoBarras || prod.sku
      if (barcodeValue) {
        list.push({
          id: `barcode-${prod.id}`,
          nombre: `Código de Barras - ${prod.nombre}`,
          tipo: 'Código de Barras',
          url: `/configuracion/productos/${prod.id}/detalle?tab=codigos`,
          value: barcodeValue,
          size: 2 * 1024, // 2 KB estimation
          fecha: prod.updatedAt || prod.createdAt || new Date().toISOString(),
          descripcion: `Código de barra principal registrado: ${barcodeValue}`,
          originName: prod.nombre,
          originId: prod.id,
          originSku: prod.sku,
          originType: 'BARCODE',
        })
      }
    })

    // 3. General Documents (uploaded in general index)
    generalFiles.forEach((f: any) => {
      list.push({
        id: f.id,
        nombre: f.nombre,
        tipo: 'General',
        fileCategory: f.tipo || 'PDF',
        url: f.url,
        filename: f.filename,
        size: f.size,
        fecha: f.fecha,
        descripcion: 'Archivo de empresa subido directamente al almacén general.',
        originType: 'GENERAL',
      })
    })

    return list
  }, [productos, generalFiles])

  // Filtered files list
  const filteredFiles = useMemo(() => {
    return aggregatedFiles.filter(item => {
      // Filter by Search Query
      const matchesSearch =
        item.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.originSku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.value && item.value.toLowerCase().includes(searchQuery.toLowerCase()))

      if (!matchesSearch) return false

      // Filter by Tab
      if (activeTab === 'FICHAS') return item.originType === 'PRODUCTO'
      if (activeTab === 'BARCODE') return item.originType === 'BARCODE'
      if (activeTab === 'GENERAL') return item.originType === 'GENERAL'
      if (activeTab === 'PLANTILLAS') return false // Handled separately in UI

      return true // TODOS tab
    })
  }, [aggregatedFiles, searchQuery, activeTab])

  // Storage Stats computed
  const usedBytes = storage?.usedBytes || 0
  const limitBytes = storage?.limitBytes || 5 * 1024 * 1024 * 1024
  const storagePercent = storage?.percentage || 0

  // Style class for progress bar gradient
  const progressGradient = useMemo(() => {
    if (storagePercent >= 90) return 'bg-gradient-to-r from-rose-500 to-red-600'
    if (storagePercent >= 75) return 'bg-gradient-to-r from-amber-500 to-orange-500'
    return 'bg-gradient-to-r from-indigo-500 to-blue-600'
  }, [storagePercent])

  return (
    <div className="w-full space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Configuración</span>
            <ChevronRight size={12} />
            <span className="text-slate-500">General</span>
            <ChevronRight size={12} />
            <span className="text-slate-600 font-medium">Archivo</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
            <HardDrive size={24} className="text-indigo-600" />
            Almacén y Archivo General
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Administra fichas técnicas, códigos de barra, formatos de impresión y documentos de empresa. Visualiza y controla la cuota de almacenamiento del tenant.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Storage Quota Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">Almacenamiento del Tenant (SaaS)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Cuota de almacenamiento asignada de forma estándar</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-indigo-600">{formatBytes(usedBytes)}</span>
            <span className="text-xs text-slate-400"> de {formatBytes(limitBytes)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner flex mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressGradient}`}
            style={{ width: `${Math.min(storagePercent, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Porcentaje utilizado: <strong>{storagePercent}%</strong></span>
          {storagePercent >= 85 ? (
            <span className="flex items-center gap-1 text-rose-600 font-bold animate-pulse">
              <AlertTriangle size={14} /> Espacio casi lleno. Por favor, amplíe su plan.
            </span>
          ) : (
            <span className="text-slate-400">Cuota de 5.00 GB libre para PDF, Imágenes y formatos</span>
          )}
        </div>
      </div>

      {/* Grid Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-0.5">
        <div className="flex items-center gap-4 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'TODOS', label: 'Todos los Archivos', icon: FileText },
            { id: 'FICHAS', label: 'Fichas Técnicas', icon: FileText },
            { id: 'BARCODE', label: 'Códigos de Barra', icon: Barcode },
            { id: 'GENERAL', label: 'Documentos Generales', icon: UploadCloud },
            { id: 'PLANTILLAS', label: 'Formatos de Impresión', icon: LayoutTemplate }
          ].map(tab => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-1.5 whitespace-nowrap ${
                  isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
              </button>
            )
          })}
        </div>

        {activeTab !== 'PLANTILLAS' && (
          <div className="relative max-w-md w-full md:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar archivo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Main Section */}
      {activeTab === 'PLANTILLAS' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Formato Carta PDF',
              desc: 'Configuración de márgenes, colores, logo y textos para documentos oficiales tipo Carta.',
              path: '/configuracion/formatos-impresion',
              icon: FileText,
              color: 'text-indigo-600 bg-indigo-50'
            },
            {
              title: 'Tirilla POS 80mm',
              desc: 'Configuración para impresoras térmicas estándar de mostrador (80mm).',
              path: '/configuracion/formatos-impresion',
              icon: LayoutTemplate,
              color: 'text-emerald-600 bg-emerald-50'
            },
            {
              title: 'Tirilla POS 58mm',
              desc: 'Configuración compacta para impresoras térmicas portátiles o de bajo formato (58mm).',
              path: '/configuracion/formatos-impresion',
              icon: Printer,
              color: 'text-blue-600 bg-blue-50'
            }
          ].map((item, idx) => {
            const Icon = item.icon
            return (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className={`p-3 rounded-xl w-fit ${item.color} mb-4`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
                </div>
                <Link
                  to={item.path}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100 rounded-xl text-xs font-bold transition-all text-slate-700"
                >
                  <Printer size={14} /> Configurar Formato
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Uploader Card inside general tab */}
          {activeTab === 'GENERAL' && (
            <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <UploadCloud size={16} className="text-indigo-600" />
                Cargar Archivo Nuevo
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                Sube certificados de retención, RUT de la empresa, manuales o archivos de branding corporativo.
              </p>

              <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all select-none group min-h-[180px]">
                <input
                  type="file"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
                {uploading ? (
                  <div className="space-y-3">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">Subiendo archivo...</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={32} className="text-slate-400 group-hover:text-indigo-600 transition-colors mb-2" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">Click para seleccionar</span>
                    <span className="text-[10px] text-slate-400 mt-1">Límite de tamaño: 50MB</span>
                  </>
                )}
              </label>
            </div>
          )}

          {/* Files grid list */}
          <div className={activeTab === 'GENERAL' ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
            {filteredFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredFiles.map(file => {
                  const isBarcode = file.originType === 'BARCODE'
                  const isFicha = file.originType === 'PRODUCTO'
                  const isGeneral = file.originType === 'GENERAL'

                  return (
                    <div
                      key={file.id}
                      className="bg-white border border-slate-200/80 hover:border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header card info */}
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {file.tipo}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(file.fecha).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Title & Desc */}
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1" title={file.nombre}>
                          {file.nombre}
                        </h4>
                        {file.originName && (
                          <p className="text-[10px] text-slate-500 font-bold mt-1">
                            Vinculado a: <span className="text-indigo-600">{file.originName}</span>
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {file.descripcion}
                        </p>

                        {/* Special visuals (barcodes) */}
                        {isBarcode && file.value && (
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mt-3 flex items-center justify-center flex-col">
                            <div className="h-8 flex items-center tracking-[4px] font-mono text-[10px] bg-white border border-slate-200 px-3 py-1 rounded shadow-sm text-slate-800 font-bold select-all">
                              ||| {file.value} |||
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visualización de Código</span>
                          </div>
                        )}
                      </div>

                      {/* Footer size & actions */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
                        <span className="text-[10px] font-bold text-slate-400">
                          {formatBytes(file.size)}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Print action for PDFs and Barcodes */}
                          {(isFicha || isBarcode) && (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              title="Ver / Imprimir"
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            >
                              <Printer size={13} />
                            </a>
                          )}

                          {/* Link to product details if product associated */}
                          {(isFicha || isBarcode) && file.originId && (
                            <Link
                              to={`/configuracion/productos/${file.originId}/detalle`}
                              title="Ver Ficha de Producto"
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            >
                              <ExternalLink size={13} />
                            </Link>
                          )}

                          {/* Download for general uploaded files */}
                          {isGeneral && (
                            <>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                title="Abrir Archivo"
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              >
                                <ExternalLink size={13} />
                              </a>
                              <button
                                onClick={() => deleteMutation.mutate(file.filename)}
                                title="Eliminar Archivo"
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-16 text-center shadow-sm">
                <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                <h4 className="text-sm font-extrabold text-slate-700">No se encontraron archivos</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? 'No hay archivos que coincidan con la búsqueda de texto.'
                    : 'Carga archivos generales o genera fichas técnicas de tus productos para verlas listadas aquí.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
