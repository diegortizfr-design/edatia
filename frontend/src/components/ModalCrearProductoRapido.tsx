import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, X, Loader2, DollarSign, Tag, Hash, FileText, Percent } from 'lucide-react'
import toast from 'react-hot-toast'
import { createProducto } from '../services/inventario.service'
import { getImpuestos } from '../services/erp.service'
import { getApiError } from '../services/api'

interface ModalCrearProductoRapidoProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (productoCreado: any) => void
  initialSearch?: string
}

export function ModalCrearProductoRapido({
  isOpen,
  onClose,
  onSuccess,
  initialSearch = '',
}: ModalCrearProductoRapidoProps) {
  const qc = useQueryClient()

  const [referencia, setReferencia] = useState('')
  const [nombre, setNombre] = useState('')
  const [costo, setCosto] = useState<string>('')
  const [precioVenta, setPrecioVenta] = useState<string>('')
  const [selectedTaxId, setSelectedTaxId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Cargar impuestos del sistema
  const { data: impuestos = [] } = useQuery({
    queryKey: ['impuestos'],
    queryFn: getImpuestos,
    enabled: isOpen,
  })

  const impuestosIva = impuestos.filter(
    (imp: any) =>
      (imp.tipo === 'IVA' || imp.tipo === 'CONSUMO') &&
      imp.activo !== false &&
      imp.estado !== 'INACTIVO' &&
      imp.retencionCompra !== true
  )

  // Prellenar cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setNombre(initialSearch.trim())
      setReferencia('')
      setCosto('')
      setPrecioVenta('')

      // Seleccionar impuesto por defecto
      const def = impuestosIva.find((t: any) => t.esDefecto) || impuestosIva[0]
      if (def) {
        setSelectedTaxId(String(def.id))
      } else {
        setSelectedTaxId('0')
      }
    }
  }, [isOpen, initialSearch, impuestosIva.length])

  const mutation = useMutation({
    mutationFn: createProducto,
    onSuccess: (nuevoProd) => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['config_productos'] })
      qc.invalidateQueries({ queryKey: ['buscar-prod-oc'] })
      toast.success(`Producto "${nuevoProd.nombre}" creado y agregado`)
      onSuccess(nuevoProd)
      onClose()
    },
    onError: (err: any) => {
      setError(getApiError(err, 'No se pudo crear el producto'))
    },
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const nom = nombre.trim()
    if (!nom) {
      setError('El nombre del producto es obligatorio')
      return
    }

    const ref = referencia.trim().toUpperCase()
    // Si no ingresó referencia, generamos un SKU único corto
    const skuFinal = ref || `PROD-${Date.now().toString().slice(-6)}`

    const costoNum = parseFloat(costo) || 0
    const precioNum = parseFloat(precioVenta) || 0

    // Determinar impuesto seleccionado
    const selectedTax = impuestosIva.find((t: any) => String(t.id) === String(selectedTaxId))
    const ivaTarifa = selectedTax ? Number(selectedTax.tarifa) : 0
    const esExento = selectedTaxId === '0' || !selectedTax || ivaTarifa === 0

    let tipoIva = 'EXCLUIDO'
    if (!esExento) {
      if (ivaTarifa === 19) tipoIva = 'GRAVADO_19'
      else if (ivaTarifa === 5) tipoIva = 'GRAVADO_5'
      else tipoIva = `GRAVADO_${ivaTarifa}`
    }

    const payload: any = {
      sku: skuFinal,
      referencia: ref || skuFinal,
      nombre: nom,
      costo: costoNum,
      costoUltimo: costoNum,
      precioBase: precioNum,
      precioWeb: precioNum,
      precios: [precioNum, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tipoIva: tipoIva,
      appliedTaxIds: !esExento && selectedTax ? [String(selectedTax.id)] : [],
      liquidarIva: !esExento,
      productoExentoIva: esExento,
      manejaBodega: true,
    }

    mutation.mutate(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Creación Rápida de Producto</h3>
              <p className="text-xs text-slate-400">Se guardará en catálogo y se agregará a tu documento actual</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre del Producto *
            </label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Biberón Infantil 250ml..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Referencia / SKU */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Referencia / Código</span>
              <span className="text-[10px] text-slate-400 font-normal">Opcional (se auto-genera si queda vacío)</span>
            </label>
            <div className="relative">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={referencia}
                onChange={e => setReferencia(e.target.value.toUpperCase())}
                placeholder="Ej. REF-001 o VAR-123..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Costo y Valor de Venta en 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Costo Unitario ($) *
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={costo}
                  onChange={e => setCosto(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Valor Venta Base ($) *
              </label>
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={precioVenta}
                  onChange={e => setPrecioVenta(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Impuesto (IVA) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Impuesto Aplicable (IVA)
            </label>
            <div className="relative">
              <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedTaxId}
                onChange={e => setSelectedTaxId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="0">0% (Sin IVA / Exento)</option>
                {impuestosIva.map((imp: any) => (
                  <option key={imp.id} value={String(imp.id)}>
                    {imp.tarifa}% — {imp.nombre} {imp.esDefecto ? '(Por Defecto)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Creando producto...
                </>
              ) : (
                <>
                  <Package size={14} /> Crear y Agregar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
