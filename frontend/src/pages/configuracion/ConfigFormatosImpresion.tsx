import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, FileText, Receipt, Save, CheckCircle2, ChevronRight,
  Palette, Printer, Sliders, Settings2, Info, LayoutTemplate
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { getFormatosImpresion, updateFormatoImpresion } from '../../services/erp.service'

interface FormatoConfig {
  id?: number
  tipo: 'CARTA' | 'TIRILLA_80' | 'TIRILLA_58'
  margenSup: number
  margenInf: number
  margenIzq: number
  margenDer: number
  mostrarLogo: boolean
  colorAcento: string
  encabezado: string
  piePagina: string
}

const DEFAULTS: Record<string, FormatoConfig> = {
  CARTA: {
    tipo: 'CARTA',
    margenSup: 15,
    margenInf: 15,
    margenIzq: 20,
    margenDer: 20,
    mostrarLogo: true,
    colorAcento: '#4F46E5',
    encabezado: 'DOCUMENTO OFICIAL DE FACTURACIÓN',
    piePagina: 'Gracias por su compra. Conserve esta factura para cualquier reclamo o garantía.',
  },
  TIRILLA_80: {
    tipo: 'TIRILLA_80',
    margenSup: 5,
    margenInf: 5,
    margenIzq: 3,
    margenDer: 3,
    mostrarLogo: false,
    colorAcento: '#1E293B',
    encabezado: 'PUNTO DE VENTA AUTORIZADO',
    piePagina: 'Régimen Simple de Tributación. ¡Vuelva pronto!',
  },
  TIRILLA_58: {
    tipo: 'TIRILLA_58',
    margenSup: 2,
    margenInf: 2,
    margenIzq: 2,
    margenDer: 2,
    mostrarLogo: false,
    colorAcento: '#000000',
    encabezado: 'TICKET DE VENTA',
    piePagina: 'Gracias por preferirnos.',
  },
}

export function ConfigFormatosImpresion() {
  const queryClient = useQueryClient()
  const [activeFormat, setActiveFormat] = useState<'CARTA' | 'TIRILLA_80' | 'TIRILLA_58'>('CARTA')
  const [localConfigs, setLocalConfigs] = useState<Record<string, FormatoConfig>>(DEFAULTS)

  const { data: formatosFromDB } = useQuery({
    queryKey: ['formatos-impresion'],
    queryFn: getFormatosImpresion,
  })

  // Sync BD data into local state
  useEffect(() => {
    if (!formatosFromDB) return
    const merged = { ...DEFAULTS }
    for (const f of formatosFromDB) {
      merged[f.tipo] = {
        id: f.id,
        tipo: f.tipo,
        margenSup: f.margenSup ?? DEFAULTS[f.tipo]?.margenSup,
        margenInf: f.margenInf ?? DEFAULTS[f.tipo]?.margenInf,
        margenIzq: f.margenIzq ?? DEFAULTS[f.tipo]?.margenIzq,
        margenDer: f.margenDer ?? DEFAULTS[f.tipo]?.margenDer,
        mostrarLogo: f.mostrarLogo ?? DEFAULTS[f.tipo]?.mostrarLogo,
        colorAcento: f.colorAcento ?? DEFAULTS[f.tipo]?.colorAcento,
        encabezado: f.encabezado ?? DEFAULTS[f.tipo]?.encabezado ?? '',
        piePagina: f.piePagina ?? DEFAULTS[f.tipo]?.piePagina ?? '',
      }
    }
    setLocalConfigs(merged)
  }, [formatosFromDB])

  const saveMutation = useMutation({
    mutationFn: () => {
      const current = localConfigs[activeFormat]
      return updateFormatoImpresion(activeFormat, {
        margenSup: current.margenSup,
        margenInf: current.margenInf,
        margenIzq: current.margenIzq,
        margenDer: current.margenDer,
        mostrarLogo: current.mostrarLogo,
        colorAcento: current.colorAcento,
        encabezado: current.encabezado,
        piePagina: current.piePagina,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formatos-impresion'] })
      toast.success('Formato guardado en la base de datos ✓')
    },
    onError: () => toast.error('Error al guardar el formato'),
  })

  const current = localConfigs[activeFormat]

  const handleChange = (key: keyof FormatoConfig, value: any) => {
    setLocalConfigs(prev => ({
      ...prev,
      [activeFormat]: { ...prev[activeFormat], [key]: value },
    }))
  }

  if (!current) return <div className="text-center py-20 text-slate-400">Cargando formatos...</div>

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
            <span className="text-slate-600 font-medium">Formatos de Impresión</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
            <LayoutTemplate size={24} className="text-indigo-600" />
            Formatos de Impresión
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Personaliza márgenes, colores y textos para comprobantes PDF y tirillas POS. Los cambios persisten en la base de datos.
          </p>
        </div>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all"
        >
          {saveMutation.isPending ? (
            <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Guardando...</>
          ) : (
            <><Save size={16} />Guardar formato</>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-0.5">
        {[
          { id: 'CARTA', label: 'Formato Carta PDF', icon: FileText },
          { id: 'TIRILLA_80', label: 'Tirilla POS 80mm', icon: Receipt },
          { id: 'TIRILLA_58', label: 'Tirilla POS 58mm', icon: Printer }
        ].map(item => {
          const isActive = activeFormat === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveFormat(item.id as any)}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-1.5 ${
                isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={14} />
              {item.label}
              {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left panel */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders size={16} className="text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
              Parámetros — {current.tipo}
            </h3>
            {current.id && (
              <span className="ml-auto text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full">
                ✓ En BD
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Márgenes */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Settings2 size={13} /> Márgenes (mm)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {(['margenSup', 'margenInf', 'margenIzq', 'margenDer'] as const).map(key => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      {key === 'margenSup' ? 'Superior' : key === 'margenInf' ? 'Inferior' : key === 'margenIzq' ? 'Izquierdo' : 'Derecho'}
                    </label>
                    <input
                      type="number"
                      value={(current as any)[key]}
                      onChange={e => handleChange(key, Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Palette size={13} /> Identidad
              </h4>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Color de Acento</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={current.colorAcento}
                    onChange={e => handleChange('colorAcento', e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={current.colorAcento}
                    onChange={e => handleChange('colorAcento', e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer group select-none bg-slate-50/50 border border-slate-100 rounded-xl p-3.5">
                <input
                  type="checkbox"
                  checked={current.mostrarLogo}
                  onChange={e => handleChange('mostrarLogo', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
                <div className="text-xs">
                  <span className="block font-bold text-slate-700">Mostrar Logo</span>
                  <span className="text-[10px] text-slate-400">Incluye el logo de la empresa.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Textos */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Textos Personalizados</h4>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Encabezado Adicional</label>
              <input
                type="text"
                value={current.encabezado}
                onChange={e => handleChange('encabezado', e.target.value)}
                placeholder="Ej. DOCUMENTO OFICIAL DE FACTURACIÓN"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Pie de Página</label>
              <textarea
                value={current.piePagina}
                onChange={e => handleChange('piePagina', e.target.value)}
                placeholder="Términos comerciales o agradecimiento..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 h-24 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right panel: preview */}
        <div className="lg:col-span-5 bg-slate-800 rounded-2xl p-5 border border-slate-700 text-white space-y-4 sticky top-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Vista Previa
            </h4>
            <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono uppercase">
              {current.tipo}
            </span>
          </div>

          {activeFormat === 'CARTA' && (
            <div className="bg-white text-slate-800 rounded-xl p-6 space-y-4 shadow-lg text-[10px] leading-relaxed max-w-sm mx-auto">
              <div className="flex justify-between items-start">
                <div>
                  {current.mostrarLogo && (
                    <div className="h-6 w-16 bg-slate-100 rounded flex items-center justify-center text-[7px] text-slate-400 font-bold border border-dashed border-slate-200 mb-1">LOGO</div>
                  )}
                  <div className="font-extrabold text-xs text-slate-900 leading-tight">MI EMPRESA S.A.S.</div>
                  <div className="text-[8px] text-slate-400 leading-tight">NIT: 900.123.456-7</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[9px]" style={{ color: current.colorAcento }}>FACTURA ELECTRÓNICA</div>
                  <div className="font-bold text-slate-900 text-xs">FE-1204</div>
                </div>
              </div>
              <div className="border-t border-b border-slate-100 py-2 text-[8px] text-slate-500">
                <div><strong>Cliente:</strong> CLIENTE DE PRUEBA SAS</div>
                <div><strong>Fecha:</strong> 2026-05-31</div>
              </div>
              <div className="border-t border-slate-100 pt-2 text-right text-[8px] space-y-0.5">
                <div>Subtotal: $2.000.000</div>
                <div>IVA (19%): $380.000</div>
                <div className="font-extrabold text-slate-900 text-[10px]">Total: $2.380.000</div>
              </div>
              {current.piePagina && (
                <div className="pt-3 border-t border-dashed border-slate-200 text-[7px] text-slate-400 text-center leading-tight italic">
                  {current.piePagina}
                </div>
              )}
            </div>
          )}

          {(activeFormat === 'TIRILLA_80' || activeFormat === 'TIRILLA_58') && (
            <div className={`bg-white text-slate-800 rounded-xl p-4 shadow-lg text-[9px] leading-relaxed mx-auto font-mono ${
              activeFormat === 'TIRILLA_80' ? 'max-w-[200px]' : 'max-w-[160px]'
            }`}>
              <div className="text-center space-y-0.5">
                {current.mostrarLogo && (
                  <div className="h-6 w-12 bg-slate-100 rounded flex items-center justify-center text-[7px] text-slate-400 font-bold border border-dashed border-slate-200 mx-auto mb-1">LOGO</div>
                )}
                <div className="font-extrabold text-[10px] text-slate-950">EDATIA S.A.S.</div>
                <div className="text-[7px]">{current.encabezado}</div>
              </div>
              <div className="border-t border-b border-dashed border-slate-200 py-1.5 my-1.5 text-[7px] text-slate-500">
                <div>DOC: POS-103</div>
                <div>FECHA: 2026-05-31 12:00</div>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-1.5 mt-1.5 text-right text-[8px]">
                <div className="font-extrabold text-[9px]">TOTAL: $25.000</div>
              </div>
              {current.piePagina && (
                <div className="pt-2 border-t border-dashed border-slate-200 text-[6px] text-slate-400 text-center leading-tight">
                  {current.piePagina}
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-700/40 p-4 border border-slate-700/60 rounded-xl text-xs">
            <h5 className="font-extrabold text-slate-300">Nota técnica:</h5>
            <p className="text-slate-400 leading-normal text-[11px] mt-1">
              La plantilla se asocia directamente a los consecutivos de documentos. Los cambios se guardan en PostgreSQL — no dependen de caché del navegador.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
