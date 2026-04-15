import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProducto, createProducto, updateProducto,
  getCategorias, getMarcas, getUnidades,
} from '../../services/inventario.service'
import { ArrowLeft, Save } from 'lucide-react'

const TIPOS_IVA = [
  { value: 'GRAVADO_19', label: 'Gravado 19%' },
  { value: 'GRAVADO_5', label: 'Gravado 5%' },
  { value: 'EXENTO', label: 'Exento (0%)' },
  { value: 'EXCLUIDO', label: 'Excluido' },
]

export function ProductoForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    sku: '', nombre: '', codigoBarras: '', descripcion: '', referencia: '',
    categoriaId: '', marcaId: '', unidadMedidaId: '',
    precioBase: '0', tipoIva: 'GRAVADO_19',
    manejaBodega: true, manejaLotes: false, manejaSerial: false,
    stockMinimo: '0', stockMaximo: '', puntoReorden: '0',
    activo: true,
  })

  const { data: producto } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => getProducto(Number(id)),
    enabled: isEdit,
  })

  const { data: categorias = [] } = useQuery({ queryKey: ['categorias'], queryFn: getCategorias })
  const { data: marcas = [] } = useQuery({ queryKey: ['marcas'], queryFn: getMarcas })
  const { data: unidades = [] } = useQuery({ queryKey: ['unidades'], queryFn: getUnidades })

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      navigate('/inventario/productos')
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al guardar'),
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

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">{label}</label>
        {children}
      </div>
    )
  }

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h1>
          {isEdit && <p className="text-sm text-slate-400">ID: {id}</p>}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificación */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Identificación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SKU *">
              <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                required className={inputCls} placeholder="P-001" />
            </Field>
            <Field label="Nombre *">
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                required className={inputCls} placeholder="Nombre del producto" />
            </Field>
            <Field label="Código de barras">
              <input value={form.codigoBarras} onChange={e => setForm(f => ({ ...f, codigoBarras: e.target.value }))}
                className={inputCls} placeholder="EAN13, UPC..." />
            </Field>
            <Field label="Referencia fabricante">
              <input value={form.referencia} onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
                className={inputCls} />
            </Field>
            <Field label="Descripción">
              <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Clasificación */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Clasificación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Categoría">
              <select value={form.categoriaId} onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))} className={inputCls}>
                <option value="">— Sin categoría —</option>
                {categorias.filter(c => c.activo).map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Marca">
              <select value={form.marcaId} onChange={e => setForm(f => ({ ...f, marcaId: e.target.value }))} className={inputCls}>
                <option value="">— Sin marca —</option>
                {marcas.filter(m => m.activo).map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Unidad de medida">
              <select value={form.unidadMedidaId} onChange={e => setForm(f => ({ ...f, unidadMedidaId: e.target.value }))} className={inputCls}>
                <option value="">— Seleccionar —</option>
                {unidades.filter(u => u.activo).map(u => (
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
              <input type="number" min="0" step="0.01" value={form.precioBase}
                onChange={e => setForm(f => ({ ...f, precioBase: e.target.value }))}
                className={inputCls} />
            </Field>
            <Field label="Tipo de IVA">
              <select value={form.tipoIva} onChange={e => setForm(f => ({ ...f, tipoIva: e.target.value }))} className={inputCls}>
                {TIPOS_IVA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>
          <p className="text-xs text-slate-400 mt-2">El costo promedio (CPP) se calcula automáticamente al recibir mercancía.</p>
        </div>

        {/* Control de stock */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Control de stock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Field label="Stock mínimo">
              <input type="number" min="0" step="0.001" value={form.stockMinimo}
                onChange={e => setForm(f => ({ ...f, stockMinimo: e.target.value }))}
                className={inputCls} />
            </Field>
            <Field label="Stock máximo">
              <input type="number" min="0" step="0.001" value={form.stockMaximo}
                onChange={e => setForm(f => ({ ...f, stockMaximo: e.target.value }))}
                className={inputCls} placeholder="Sin límite" />
            </Field>
            <Field label="Punto de reorden">
              <input type="number" min="0" step="0.001" value={form.puntoReorden}
                onChange={e => setForm(f => ({ ...f, puntoReorden: e.target.value }))}
                className={inputCls} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-6">
            {[
              { key: 'manejaBodega', label: 'Controla stock por bodega' },
              { key: 'manejaLotes', label: 'Maneja lotes / vencimiento' },
              { key: 'manejaSerial', label: 'Maneja número de serie' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {isEdit && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.activo}
                onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                className="w-4 h-4 accent-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-700">Producto activo</p>
                <p className="text-xs text-slate-400">Los productos inactivos no aparecen en ventas ni movimientos</p>
              </div>
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            <Save size={16} />
            {mutation.isLoading ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </form>
    </div>
  )
}
