import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, FileText, Receipt, Save, CheckCircle2, ChevronRight,
  Palette, Printer, Sliders, Settings2, Info, LayoutTemplate
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface FormatoConfig {
  id: string
  nombre: string
  tipo: 'CARTA' | 'TIRILLA_80' | 'TIRILLA_58'
  margenSuperior: number
  margenInferior: number
  margenLateral: number
  mostrarLogo: boolean
  mostrarResolucion: boolean
  colorAcento: string
  encabezadoAdicional: string
  piePagina: string
}

export function ConfigFormatosImpresion() {
  const [activeFormat, setActiveFormat] = useState<'CARTA' | 'TIRILLA_80' | 'TIRILLA_58'>('CARTA')
  const [configs, setConfigs] = useState<Record<string, FormatoConfig>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Cargar configuraciones del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('edatia_formatos_impresion_config')
    const defaults: Record<string, FormatoConfig> = {
      CARTA: {
        id: 'carta',
        nombre: 'Formato Carta / A4 (PDF)',
        tipo: 'CARTA',
        margenSuperior: 15,
        margenInferior: 15,
        margenLateral: 20,
        mostrarLogo: true,
        mostrarResolucion: true,
        colorAcento: '#4F46E5',
        encabezadoAdicional: 'DOCUMENTO OFICIAL DE FACTURACIÓN',
        piePagina: 'Gracias por su compra. Conserve esta factura para cualquier reclamo o garantía.'
      },
      TIRILLA_80: {
        id: 'tirilla_80',
        nombre: 'Tirilla POS Térmica 80mm',
        tipo: 'TIRILLA_80',
        margenSuperior: 5,
        margenInferior: 5,
        margenLateral: 3,
        mostrarLogo: false,
        mostrarResolucion: true,
        colorAcento: '#1E293B',
        encabezadoAdicional: 'PUNTO DE VENTA AUTORIZADO',
        piePagina: 'Régimen Simple de Tributación. Régimen Común. ¡Vuelva pronto!'
      },
      TIRILLA_58: {
        id: 'tirilla_58',
        nombre: 'Tirilla POS Térmica 58mm',
        tipo: 'TIRILLA_58',
        margenSuperior: 2,
        margenInferior: 2,
        margenLateral: 2,
        mostrarLogo: false,
        mostrarResolucion: false,
        colorAcento: '#000000',
        encabezadoAdicional: 'TICKET DE VENTA',
        piePagina: 'Gracias por preferirnos.'
      }
    }

    if (saved) {
      try {
        setConfigs(JSON.parse(saved))
      } catch (e) {
        setConfigs(defaults)
      }
    } else {
      setConfigs(defaults)
      localStorage.setItem('edatia_formatos_impresion_config', JSON.stringify(defaults))
    }
  }, [])

  const current = configs[activeFormat]

  const handleChange = (key: keyof FormatoConfig, value: any) => {
    setConfigs(prev => {
      const updated = {
        ...prev,
        [activeFormat]: {
          ...prev[activeFormat],
          [key]: value
        }
      }
      return updated
    })
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      localStorage.setItem('edatia_formatos_impresion_config', JSON.stringify(configs))
      setIsSaving(false)
      toast.success('Formatos de impresión actualizados con éxito')
    }, 800)
  }

  if (!current) return <div className="text-center py-20 text-slate-400">Cargando formatos...</div>

  return (
    <div className="w-full space-y-6">
      <Toaster position="top-right" />

      {/* Header Premium */}
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
            Personaliza el diseño, márgenes, colores y textos para los comprobantes PDF y tirillas físicas POS.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all"
        >
          <Save size={16} />
          {isSaving ? 'Guardando...' : 'Guardar formatos'}
        </button>
      </div>

      {/* Selector de plantilla de impresión */}
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

      {/* Grid de Configuración & Vista Previa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Izquierdo: Formularios */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders size={16} className="text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
              Parámetros de Diseño — {current.nombre}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dimensiones / Márgenes */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Settings2 size={13} /> Márgenes de Impresión (mm)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Superior</label>
                  <input
                    type="number"
                    value={current.margenSuperior}
                    onChange={e => handleChange('margenSuperior', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Inferior</label>
                  <input
                    type="number"
                    value={current.margenInferior}
                    onChange={e => handleChange('margenInferior', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Lateral</label>
                  <input
                    type="number"
                    value={current.margenLateral}
                    onChange={e => handleChange('margenLateral', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Estilos */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Palette size={13} /> Identidad y Colores
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
            </div>
          </div>

          {/* Opciones de Visibilidad */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Info size={13} /> Opciones de Visualización
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer group select-none bg-slate-50/50 border border-slate-100 rounded-xl p-3.5">
                <input
                  type="checkbox"
                  checked={current.mostrarLogo}
                  onChange={e => handleChange('mostrarLogo', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
                <div className="text-xs">
                  <span className="block font-bold text-slate-700 group-hover:text-slate-900">Mostrar Logo Comercial</span>
                  <span className="text-[10px] text-slate-400 leading-tight">Incluye el logo de la empresa en la parte superior izquierda.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group select-none bg-slate-50/50 border border-slate-100 rounded-xl p-3.5">
                <input
                  type="checkbox"
                  checked={current.mostrarResolucion}
                  onChange={e => handleChange('mostrarResolucion', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
                <div className="text-xs">
                  <span className="block font-bold text-slate-700 group-hover:text-slate-900">Mostrar Resolución DIAN</span>
                  <span className="text-[10px] text-slate-400 leading-tight">Imprime los rangos vigentes y resoluciones de numeración.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Textos del Documento */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Textos Personalizados del Formato</h4>
            
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Subtítulo / Encabezado Adicional</label>
              <input
                type="text"
                value={current.encabezadoAdicional}
                onChange={e => handleChange('encabezadoAdicional', e.target.value)}
                placeholder="Ej. DOCUMENTO OFICIAL DE FACTURACIÓN"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Términos, Garantías o Pie de Página</label>
              <textarea
                value={current.piePagina}
                onChange={e => handleChange('piePagina', e.target.value)}
                placeholder="Escribe aquí los términos comerciales, plazos de devolución o agradecimientos..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 h-24 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Panel Derecho: Vista Previa */}
        <div className="lg:col-span-5 bg-slate-800 rounded-2xl p-5 border border-slate-700 text-white space-y-4 sticky top-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Vista Previa Estructural (Simulada)
            </h4>
            <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono uppercase">
              {current.tipo}
            </span>
          </div>

          {/* Formato Carta */}
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

              <div className="border-t border-b border-slate-100 py-2 my-2 text-[8px] text-slate-500">
                <div><strong>Cliente:</strong> CLIENTE DE PRUEBA SAS</div>
                <div><strong>Fecha:</strong> 2026-05-31</div>
                {current.mostrarResolucion && (
                  <div className="mt-1 text-[7px] italic text-slate-400 bg-slate-50 p-1 rounded">Autorización DIAN 18764... Rango 1-10000.</div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold border-b border-slate-100 pb-1">
                  <span>Artículo / Detalle</span>
                  <span>Total</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>1.00 x Producto de Desarrollo Web</span>
                  <span>$1.500.000</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>1.00 x Consultoría en Tecnología</span>
                  <span>$500.000</span>
                </div>
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

          {/* Formatos Tirilla (80mm / 58mm) */}
          {(activeFormat === 'TIRILLA_80' || activeFormat === 'TIRILLA_58') && (
            <div className={`bg-white text-slate-800 rounded-xl p-4 shadow-lg text-[9px] leading-relaxed mx-auto font-mono ${
              activeFormat === 'TIRILLA_80' ? 'max-w-[200px]' : 'max-w-[160px]'
            }`}>
              <div className="text-center space-y-0.5">
                {current.mostrarLogo && (
                  <div className="h-6 w-12 bg-slate-100 rounded flex items-center justify-center text-[7px] text-slate-400 font-bold border border-dashed border-slate-200 mx-auto mb-1">LOGO</div>
                )}
                <div className="font-extrabold text-[10px] text-slate-950">EDATIA S.A.S.</div>
                <div className="text-[7px]">NIT: 900.123.456-7</div>
                <div className="text-[7px]">{current.encabezadoAdicional}</div>
              </div>

              <div className="border-t border-b border-dashed border-slate-200 py-1.5 my-1.5 text-[7px] text-slate-500">
                <div>DOC: POS-103</div>
                <div>FECHA: 2026-05-31 12:00</div>
                {current.mostrarResolucion && (
                  <div className="text-[6px] text-slate-400">Res. DIAN 987654. Rango 1-50000.</div>
                )}
              </div>

              <div className="space-y-1 text-[8px]">
                <div className="flex justify-between border-b border-dashed border-slate-100 pb-0.5">
                  <span>DESCRIPCIÓN</span>
                  <span>TOTAL</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>1.00 x ARTÍCULO POS</span>
                  <span>$25.000</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-1.5 mt-1.5 text-right text-[8px] space-y-0.5">
                <div>SUBTOTAL: $21.008</div>
                <div>IVA 19%: $3.992</div>
                <div className="font-extrabold text-[9px]">TOTAL: $25.000</div>
              </div>

              {current.piePagina && (
                <div className="pt-2 border-t border-dashed border-slate-200 text-[6px] text-slate-400 text-center leading-tight">
                  {current.piePagina}
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-700/40 p-4 border border-slate-700/60 rounded-xl space-y-2 text-xs">
            <h5 className="font-extrabold text-slate-300">Nota técnica:</h5>
            <p className="text-slate-400 leading-normal text-[11px]">
              La plantilla de impresión seleccionada se asocia directamente en la configuración de consecutivos para dirigir de forma inteligente si la facturación imprime como tirilla térmica o documento PDF tamaño carta.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
