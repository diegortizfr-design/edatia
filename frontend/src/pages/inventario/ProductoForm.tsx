import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProducto, createProducto, updateProducto,
  getCategorias, getMarcas, getUnidades,
  getVariantes, createVariante, updateVariante, toggleVariante,
  ajustarStockVariante, deleteVariante, getBodegas,
} from '../../services/inventario.service'
import {
  ArrowLeft, Save, Plus, Tag, Layers, Trash2, Edit2,
  Warehouse, ToggleLeft, ToggleRight, Sparkles, X, Info,
  Package, Check, AlertCircle, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react'
import { CurrencyInput } from '../../components/CurrencyInput'

const TIPOS_IVA = [
  { value: 'GRAVADO_19', label: 'Gravado 19%' },
  { value: 'GRAVADO_5', label: 'Gravado 5%' },
  { value: 'EXENTO', label: 'Exento (0%)' },
  { value: 'EXCLUIDO', label: 'Excluido' },
]

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

const PRESETS_TALLAS = [
  { id: 'bebe', label: '👶 Bebé / Pasos (14 a 17)', tallas: ['14', '15', '16', '17'] },
  { id: 'nino', label: '🧒 Infantil / Niños (18 a 26)', tallas: ['18', '19', '20', '21', '22', '23', '24', '25', '26'] },
  { id: 'junior', label: '👟 Junior (27 a 34)', tallas: ['27', '28', '29', '30', '31', '32', '33', '34'] },
  { id: 'adulto', label: '👞 Adulto (35 a 42)', tallas: ['35', '36', '37', '38', '39', '40', '41', '42'] },
  { id: 'ropa-bebe', label: '🍼 Ropa Bebé (Meses)', tallas: ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'] },
  { id: 'ropa', label: '👕 Ropa / Textil (XS a XL)', tallas: ['XS', 'S', 'M', 'L', 'XL'] },
]

export function ProductoForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  // Pestañas
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<'general' | 'variantes'>(
    tabParam === 'variantes' ? 'variantes' : 'general'
  )

  useEffect(() => {
    if (tabParam === 'variantes' && isEdit) {
      setActiveTab('variantes')
    }
  }, [tabParam, isEdit])

  const [form, setForm] = useState({
    sku: '', nombre: '', codigoBarras: '', descripcion: '', referencia: '',
    categoriaId: '', marcaId: '', unidadMedidaId: '',
    precioBase: '0', tipoIva: 'GRAVADO_19',
    manejaBodega: true, manejaLotes: false, manejaSerial: false,
    stockMinimo: '0', stockMaximo: '', puntoReorden: '0',
    activo: true,
  })

  // Modales de variantes
  const [showVarianteModal, setShowVarianteModal] = useState(false)
  const [varianteAEditar, setVarianteAEditar] = useState<any>(null)
  const [varianteAjustarStock, setVarianteAjustarStock] = useState<any>(null)

  // Generador rápido de tallas
  const [customTallasInput, setCustomTallasInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatorMsg, setGeneratorMsg] = useState<string | null>(null)

  const { data: producto } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => getProducto(Number(id)),
    enabled: isEdit,
  })

  const { data: categorias = [] } = useQuery({ queryKey: ['categorias'], queryFn: getCategorias })
  const { data: marcas = [] } = useQuery({ queryKey: ['marcas'], queryFn: getMarcas })
  const { data: unidades = [] } = useQuery({ queryKey: ['unidades'], queryFn: getUnidades })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

  // Variantes del producto actual
  const { data: variantes = [], isLoading: loadingVariantes } = useQuery({
    queryKey: ['variantes', Number(id)],
    queryFn: () => getVariantes(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (producto) {
      setForm({
        sku: producto.sku,
        nombre: producto.nombre,
        codigoBarras: producto.codigoBarras ?? '',
        descripcion: producto.descripcion ?? '',
        referencia: producto.referencia ?? '',
        categoriaId: producto.categoriaId ? String(producto.categoriaId) : '',
        marcaId: producto.marcaId ? String(producto.marcaId) : '',
        unidadMedidaId: producto.unidadMedidaId ? String(producto.unidadMedidaId) : '',
        precioBase: String(producto.precioBase),
        tipoIva: producto.tipoIva,
        manejaBodega: producto.manejaBodega,
        manejaLotes: producto.manejaLotes,
        manejaSerial: producto.manejaSerial,
        stockMinimo: String(producto.stockMinimo),
        stockMaximo: producto.stockMaximo ? String(producto.stockMaximo) : '',
        puntoReorden: String(producto.puntoReorden),
        activo: producto.activo,
      })
    }
  }, [producto])

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? updateProducto(Number(id), data) : createProducto(data),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      if (!isEdit && res?.id) {
        // Redirigir a edición en pestaña variantes
        navigate(`/inventario/productos/${res.id}?tab=variantes`)
      } else {
        navigate('/inventario/productos')
      }
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al guardar'),
  })

  // Mutaciones de variantes
  const mutCreateVariante = useMutation({
    mutationFn: createVariante,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variantes', Number(id)] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      setShowVarianteModal(false)
    }
  })

  const mutUpdateVariante = useMutation({
    mutationFn: ({ varId, data }: any) => updateVariante(varId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variantes', Number(id)] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      setVarianteAEditar(null)
    }
  })

  const mutToggleVariante = useMutation({
    mutationFn: toggleVariante,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variantes', Number(id)] })
    }
  })

  const mutDeleteVariante = useMutation({
    mutationFn: deleteVariante,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variantes', Number(id)] })
      qc.invalidateQueries({ queryKey: ['productos'] })
    }
  })

  const mutStockVariante = useMutation({
    mutationFn: ({ varId, data }: any) => ajustarStockVariante(varId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variantes', Number(id)] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      setVarianteAjustarStock(null)
    }
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload: any = {
      sku: form.sku,
      nombre: form.nombre,
      codigoBarras: form.codigoBarras || undefined,
      descripcion: form.descripcion || undefined,
      referencia: form.referencia || undefined,
      categoriaId: form.categoriaId ? +form.categoriaId : undefined,
      marcaId: form.marcaId ? +form.marcaId : undefined,
      unidadMedidaId: form.unidadMedidaId ? +form.unidadMedidaId : undefined,
      precioBase: +form.precioBase,
      precioWeb: +form.precioBase,
      tipoIva: form.tipoIva,
      manejaBodega: form.manejaBodega,
      manejaLotes: form.manejaLotes,
      manejaSerial: form.manejaSerial,
      stockMinimo: +form.stockMinimo,
      stockMaximo: form.stockMaximo ? +form.stockMaximo : undefined,
      puntoReorden: +form.puntoReorden,
    }
    if (isEdit) payload.activo = form.activo
    mutation.mutate(payload)
  }

  // Generador masivo de tallas
  const handleGenerarTallas = async (tallasList: string[]) => {
    if (!id || tallasList.length === 0) return
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
      for (const talla of tallasList) {
        const tClean = talla.trim()
        if (!tClean) continue
        if (existingTallas.has(tClean.toLowerCase())) continue

        const baseSku = form.sku || `PROD-${id}`
        const variantSku = `${baseSku}-${tClean}`.toUpperCase()
        if (existingSkus.has(variantSku.toLowerCase())) continue

        await createVariante({
          productoId: Number(id),
          sku: variantSku,
          nombre: `Talla ${tClean}`,
          atributos: [{ nombre: 'Talla', valor: tClean }],
          precioBase: Number(form.precioBase || 0),
          costoPromedio: Number(producto?.costoPromedio || 0),
        })
        creadas++
      }

      qc.invalidateQueries({ queryKey: ['variantes', Number(id)] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      setGeneratorMsg(`✓ Se generaron ${creadas} variantes de talla exitosamente.`)
      setCustomTallasInput('')
      setTimeout(() => setGeneratorMsg(null), 4000)
    } catch (err: any) {
      setGeneratorMsg(`Error generando variantes: ${err?.response?.data?.message || err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const totalStockVariante = (v: any) =>
    (v.stock ?? []).reduce((acc: number, s: any) => acc + parseFloat(s.cantidad || 0), 0)

  return (
    <div className="w-full space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/inventario/productos')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft size={18} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isEdit ? form.nombre || 'Editar producto' : 'Nuevo producto'}
            </h1>
            <p className="text-xs text-slate-400">
              {isEdit ? `SKU: ${form.sku || '—'} · ID: ${id}` : 'Registra un nuevo producto en el catálogo'}
            </p>
          </div>
        </div>

        {/* Botones de acción general */}
        {activeTab === 'general' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/inventario/productos')}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save size={16} />
              {mutation.isPending ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pestañas de Navegación del Producto */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Package size={16} />
            <span>Información General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variantes')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === 'variantes'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Layers size={16} />
            <span>Variantes y Tallas</span>
            {isEdit && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                variantes.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {variantes.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 1: INFORMACIÓN GENERAL DEL PRODUCTO                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identificación */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Identificación</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="SKU *">
                <input
                  value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  required
                  className={inputCls}
                  placeholder="P-001"
                />
              </Field>
              <Field label="Nombre *">
                <input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  required
                  className={inputCls}
                  placeholder="Ej. Zapato Deportivo Baby Walker Azul"
                />
              </Field>
              <Field label="Código de barras">
                <input
                  value={form.codigoBarras}
                  onChange={e => setForm(f => ({ ...f, codigoBarras: e.target.value }))}
                  className={inputCls}
                  placeholder="EAN13, UPC..."
                />
              </Field>
              <Field label="Referencia fabricante">
                <input
                  value={form.referencia}
                  onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
                  className={inputCls}
                  placeholder="Ref. fábrica o catálogo"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Descripción">
                  <input
                    value={form.descripcion}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    className={inputCls}
                    placeholder="Descripción detallada del producto"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Clasificación */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Clasificación</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Categoría">
                <select value={form.categoriaId} onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))} className={inputCls}>
                  <option value="">— Sin categoría —</option>
                  {categorias.filter((c: any) => c.activo).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </Field>
              <Field label="Marca">
                <select value={form.marcaId} onChange={e => setForm(f => ({ ...f, marcaId: e.target.value }))} className={inputCls}>
                  <option value="">— Sin marca —</option>
                  {marcas.filter((m: any) => m.activo).map((m: any) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </Field>
              <Field label="Unidad de medida">
                <select value={form.unidadMedidaId} onChange={e => setForm(f => ({ ...f, unidadMedidaId: e.target.value }))} className={inputCls}>
                  <option value="">— Seleccionar —</option>
                  {unidades.filter((u: any) => u.activo).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Precios y tributario */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Precios y tributario</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Precio de venta base">
                <CurrencyInput
                  value={form.precioBase}
                  onChange={val => setForm(f => ({ ...f, precioBase: val }))}
                />
              </Field>
              <Field label="Tipo de IVA">
                <select value={form.tipoIva} onChange={e => setForm(f => ({ ...f, tipoIva: e.target.value }))} className={inputCls}>
                  {TIPOS_IVA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
            </div>
            <p className="text-xs text-slate-400 mt-2">El costo promedio (CPP) se calcula automáticamente al recibir mercancía o registrar compras.</p>
          </div>

          {/* Control de stock */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Control de stock</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Field label="Stock mínimo">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stockMinimo}
                  onChange={e => setForm(f => ({ ...f, stockMinimo: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Stock máximo">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stockMaximo}
                  onChange={e => setForm(f => ({ ...f, stockMaximo: e.target.value }))}
                  className={inputCls}
                  placeholder="Sin límite"
                />
              </Field>
              <Field label="Punto de reorden">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.puntoReorden}
                  onChange={e => setForm(f => ({ ...f, puntoReorden: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-6">
              {[
                { key: 'manejaBodega', label: 'Controla stock por bodega' },
                { key: 'manejaLotes', label: 'Maneja lotes / vencimiento' },
                { key: 'manejaSerial', label: 'Maneja número de serie' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {isEdit && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-700">Producto activo</p>
                  <p className="text-xs text-slate-400">Los productos inactivos no aparecen en ventas ni movimientos</p>
                </div>
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pb-6">
            <button
              type="button"
              onClick={() => navigate('/inventario/productos')}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save size={16} />
              {mutation.isPending ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 2: VARIANTES Y TALLAS (INTEGRADA EN EL PRODUCTO)            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'variantes' && (
        <div className="space-y-6">
          {!isEdit ? (
            /* Si el producto es nuevo y aún no se ha guardado */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Guarda primero el producto</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">
                Para asociar tallas o variantes, primero debemos guardar los datos básicos del producto padre.
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="px-5 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                {mutation.isPending ? 'Guardando...' : 'Guardar y habilitar Tallas'}
              </button>
            </div>
          ) : (
            /* Si el producto ya existe */
            <>
              {generatorMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  generatorMsg.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <Info size={16} className="shrink-0" />
                  <span>{generatorMsg}</span>
                </div>
              )}

              {/* Generador Rápido de Tallas */}
              <div className="bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 border border-indigo-100 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Generador Rápido de Tallas</h3>
                      <p className="text-xs text-slate-500">Crea múltiples tallas automáticamente con un solo clic</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVarianteModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all shadow-xs"
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
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-medium transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                        title={`Generar: ${p.tallas.join(', ')}`}
                      >
                        <span>{p.label}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono">
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
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-medium"
                  />
                  <button
                    type="button"
                    disabled={isGenerating || !customTallasInput.trim()}
                    onClick={() => handleGenerarTallas(customTallasInput.split(','))}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap shadow-xs"
                  >
                    {isGenerating ? 'Generando...' : 'Crear tallas'}
                  </button>
                </div>
              </div>

              {/* Listado de Variantes */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Tallas y Variantes registradas</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                      {variantes.length}
                    </span>
                  </div>
                </div>

                {loadingVariantes ? (
                  <div className="py-16 text-center text-slate-400 text-sm">Cargando variantes...</div>
                ) : variantes.length === 0 ? (
                  <div className="py-16 px-4 text-center">
                    <Layers size={36} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Este producto aún no tiene tallas o variantes</p>
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
                          <th className="p-4">Ref. Fábrica (Talla)</th>
                          <th className="p-4">SKU / Código de Barras</th>
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
                                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs font-mono">
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
                              <td className="p-4 font-mono text-xs font-semibold text-slate-700">
                                {v.sku}
                              </td>

                              {/* Código de barras */}
                              <td className="p-4 font-mono text-xs text-slate-500">
                                {v.codigoBarras || '—'}
                              </td>

                              {/* Precio Base */}
                              <td className="p-4 text-right font-bold text-slate-800">
                                {fmt(parseFloat(v.precioBase || form.precioBase || 0))}
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
                                  className="text-slate-400 hover:text-slate-700 p-1"
                                  title={v.activo ? 'Desactivar variante' : 'Activar variante'}
                                >
                                  {v.activo ? (
                                    <ToggleRight size={22} className="text-emerald-600 inline" />
                                  ) : (
                                    <ToggleLeft size={22} className="text-slate-300 inline" />
                                  )}
                                </button>
                              </td>

                              {/* Acciones */}
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setVarianteAjustarStock(v)}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-100 transition-colors"
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
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: NUEVA / EDITAR VARIANTE MANUAL                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(showVarianteModal || varianteAEditar) && (
        <ModalVarianteForm
          producto={producto}
          baseSku={form.sku}
          precioSugerido={form.precioBase}
          variante={varianteAEditar}
          onClose={() => {
            setShowVarianteModal(false)
            setVarianteAEditar(null)
          }}
          onSubmit={(data: any) => {
            if (varianteAEditar) {
              mutUpdateVariante.mutate({ varId: varianteAEditar.id, data })
            } else {
              mutCreateVariante.mutate({ ...data, productoId: Number(id) })
            }
          }}
          isLoading={mutCreateVariante.isPending || mutUpdateVariante.isPending}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: AJUSTAR STOCK DE VARIANTE                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {varianteAjustarStock && (
        <ModalAjustarStockVariante
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

// ── Modal de creación / edición de variante individual ──
function ModalVarianteForm({ producto, baseSku, precioSugerido, variante, onClose, onSubmit, isLoading }: any) {
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
      precioBase: Number(precio || 0),
      codigoBarras: codigoBarras.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Tag size={18} />
            </div>
            <h2 className="font-bold text-slate-800 text-sm">
              {isEditing ? 'Editar Talla / Variante' : 'Nueva Talla / Variante'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Talla *</label>
            <input
              required
              type="text"
              value={talla}
              onChange={e => {
                const val = e.target.value
                setTalla(val)
                if (!isEditing && baseSku) {
                  setSku(`${baseSku}-${val}`.toUpperCase())
                }
              }}
              placeholder="Ej. 18, 19, 20 o M, L"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ref. de Fábrica (Talla) *</label>
            <input
              required
              type="text"
              value={sku}
              onChange={e => setSku(e.target.value)}
              placeholder="Ej. TG26-211-18 o REF-18"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Precio de Venta</label>
            <CurrencyInput
              value={precio}
              onChange={val => setPrecio(val)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">SKU / Código de Barras (Opcional)</label>
            <input
              type="text"
              value={codigoBarras}
              onChange={e => setCodigoBarras(e.target.value)}
              placeholder="Ej. 7701234567890"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Talla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal de ajuste de stock por bodega ──
function ModalAjustarStockVariante({ variante, bodegas, onClose, onSubmit, isLoading }: any) {
  const [bodegaId, setBodegaId] = useState(bodegas[0]?.id ? String(bodegas[0].id) : '')
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada')
  const [cantidad, setCantidad] = useState('1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cantNum = parseFloat(cantidad || '0')
    if (!bodegaId) return alert('Selecciona una bodega')
    if (cantNum <= 0) return alert('La cantidad debe ser mayor a 0')

    const cantFinal = tipo === 'salida' ? -cantNum : cantNum
    onSubmit({ bodegaId: Number(bodegaId), cantidad: cantFinal })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Warehouse size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Ajustar Stock</h2>
              <p className="text-[11px] text-slate-400">{variante.nombre} ({variante.sku})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Bodega de destino *</label>
            <select
              required
              value={bodegaId}
              onChange={e => setBodegaId(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-medium"
            >
              {bodegas.map((b: any) => (
                <option key={b.id} value={b.id}>{b.nombre} ({b.codigo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Operación</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('entrada')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  tipo === 'entrada'
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                + Entrada
              </button>
              <button
                type="button"
                onClick={() => setTipo('salida')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  tipo === 'salida'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                − Salida
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad de unidades/pares *</label>
            <input
              required
              type="number"
              min={1}
              step={1}
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-bold"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Aplicando...' : 'Aplicar Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
