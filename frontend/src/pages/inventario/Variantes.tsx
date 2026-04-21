import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProductos, getVariantes, createVariante, updateVariante,
  toggleVariante, ajustarStockVariante, getBodegas,
} from '../../services/inventario.service'
import { Plus, Tag, ChevronDown, ChevronUp, X, Edit2, ToggleLeft, ToggleRight, Warehouse } from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}
function fmtN(n: number) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
}

export function Variantes() {
  const qc = useQueryClient()
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [stockModal, setStockModal] = useState<any>(null)

  const { data: productos = [] } = useQuery({ queryKey: ['productos'], queryFn: () => getProductos({ activo: true }) })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

  const { data: variantes = [], isLoading } = useQuery({
    queryKey: ['variantes', productoSeleccionado?.id],
    queryFn: () => getVariantes(productoSeleccionado.id),
    enabled: !!productoSeleccionado,
  })

  const mutCreate  = useMutation({ mutationFn: createVariante,  onSuccess: () => { qc.invalidateQueries({ queryKey: ['variantes'] }); setShowForm(false) } })
  const mutUpdate  = useMutation({ mutationFn: ({ id, ...d }: any) => updateVariante(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['variantes'] }); setEditando(null) } })
  const mutToggle  = useMutation({ mutationFn: (id: number) => toggleVariante(id),   onSuccess: () => qc.invalidateQueries({ queryKey: ['variantes'] }) })
  const mutStock   = useMutation({ mutationFn: ({ id, ...d }: any) => ajustarStockVariante(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['variantes'] }); setStockModal(null) } })

  const totalStock = (v: any) => (v.stock ?? []).reduce((a: number, s: any) => a + parseFloat(s.cantidad), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Variantes de Producto</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestiona tallas, colores y otras combinaciones</p>
        </div>
        {productoSeleccionado && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Nueva variante
          </button>
        )}
      </div>

      {/* Selector de producto */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Selecciona un producto para ver sus variantes</label>
        <div className="flex flex-wrap gap-2">
          {(productos as any[]).filter(p => p.activo).map((p: any) => (
            <button key={p.id} onClick={() => setProductoSeleccionado(p)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                productoSeleccionado?.id === p.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}>
              {p.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de variantes */}
      {productoSeleccionado && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Tag size={16} className="text-indigo-600" />
            <h2 className="font-semibold text-slate-800">
              Variantes de <span className="text-indigo-700">{productoSeleccionado.nombre}</span>
            </h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{(variantes as any[]).length}</span>
          </div>

          {isLoading && <p className="text-center py-12 text-slate-400">Cargando variantes...</p>}

          {!isLoading && (variantes as any[]).length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <Tag size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Este producto no tiene variantes.</p>
              <button onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                Crear primera variante
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(variantes as any[]).map((v: any) => (
              <div key={v.id} className={`bg-white rounded-xl border shadow-sm p-5 space-y-3 ${v.activo ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{v.nombre}</p>
                    <p className="text-xs font-mono text-indigo-600">{v.sku}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditando(v)} title="Editar" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => mutToggle.mutate(v.id)} title={v.activo ? 'Desactivar' : 'Activar'}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      {v.activo ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
                    </button>
                  </div>
                </div>

                {/* Atributos */}
                <div className="flex flex-wrap gap-1.5">
                  {(v.atributos as any[] ?? []).map((a: any, i: number) => (
                    <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {a.nombre}: {a.valor}
                    </span>
                  ))}
                </div>

                {/* Precios */}
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Costo CPP</p>
                    <p className="font-semibold text-slate-700">{fmt(parseFloat(v.costoPromedio))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Precio base</p>
                    <p className="font-semibold text-slate-700">{fmt(parseFloat(v.precioBase))}</p>
                  </div>
                </div>

                {/* Stock por bodega */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</p>
                    <p className="text-sm font-bold text-slate-800">{fmtN(totalStock(v))} und</p>
                  </div>
                  {(v.stock as any[] ?? []).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Warehouse size={10} />{s.bodega?.nombre}</span>
                      <span className="font-medium text-slate-700">{fmtN(parseFloat(s.cantidad))}</span>
                    </div>
                  ))}
                  <button onClick={() => setStockModal(v)}
                    className="w-full mt-1 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium">
                    + Ajustar stock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal nueva variante */}
      {showForm && (
        <VarianteModal
          producto={productoSeleccionado}
          onClose={() => setShowForm(false)}
          onSubmit={(data: any) => mutCreate.mutate({ ...data, productoId: productoSeleccionado.id })}
          isLoading={mutCreate.isPending}
          error={mutCreate.error as any}
        />
      )}

      {/* Modal editar variante */}
      {editando && (
        <VarianteModal
          producto={productoSeleccionado}
          variante={editando}
          onClose={() => setEditando(null)}
          onSubmit={(data: any) => mutUpdate.mutate({ id: editando.id, ...data })}
          isLoading={mutUpdate.isPending}
          error={mutUpdate.error as any}
        />
      )}

      {/* Modal ajuste de stock */}
      {stockModal && (
        <StockModal
          variante={stockModal}
          bodegas={bodegas as any[]}
          onClose={() => setStockModal(null)}
          onSubmit={(data: any) => mutStock.mutate({ id: stockModal.id, ...data })}
          isLoading={mutStock.isPending}
        />
      )}
    </div>
  )
}

function VarianteModal({ producto, variante, onClose, onSubmit, isLoading, error }: any) {
  const [form, setForm] = useState({
    sku: variante?.sku ?? '',
    nombre: variante?.nombre ?? '',
    costoPromedio: variante?.costoPromedio ?? '',
    precioBase: variante?.precioBase ?? '',
    codigoBarras: variante?.codigoBarras ?? '',
    atributos: variante?.atributos ?? [{ nombre: '', valor: '' }],
  })

  const setAtributo = (i: number, k: string, v: string) => {
    const atts = [...form.atributos]
    atts[i] = { ...atts[i], [k]: v }
    setForm(f => ({ ...f, atributos: atts }))
  }

  const addAtributo = () => setForm(f => ({ ...f, atributos: [...f.atributos, { nombre: '', valor: '' }] }))
  const removeAtributo = (i: number) => setForm(f => ({ ...f, atributos: f.atributos.filter((_: any, idx: number) => idx !== i) }))

  const handleSubmit = (e: any) => {
    e.preventDefault()
    const atributosFiltrados = form.atributos.filter((a: any) => a.nombre && a.valor)
    onSubmit({
      sku: form.sku,
      nombre: form.nombre,
      costoPromedio: form.costoPromedio ? parseFloat(String(form.costoPromedio)) : undefined,
      precioBase: form.precioBase ? parseFloat(String(form.precioBase)) : undefined,
      codigoBarras: form.codigoBarras || undefined,
      atributos: atributosFiltrados,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-bold text-slate-800">{variante ? 'Editar' : 'Nueva'} Variante — {producto?.nombre}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">SKU *</label>
              <input required value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" placeholder="SKU-VAR-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre descriptivo *</label>
              <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Talla L / Rojo" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Costo CPP</label>
              <input type="number" min={0} step={0.0001} value={form.costoPromedio} onChange={e => setForm(f => ({ ...f, costoPromedio: e.target.value }))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Precio base</label>
              <input type="number" min={0} step={0.01} value={form.precioBase} onChange={e => setForm(f => ({ ...f, precioBase: e.target.value }))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Código de barras</label>
              <input value={form.codigoBarras} onChange={e => setForm(f => ({ ...f, codigoBarras: e.target.value }))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>

          {/* Atributos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Atributos</label>
              <button type="button" onClick={addAtributo} className="text-xs text-indigo-600 hover:underline font-medium">+ Agregar</button>
            </div>
            <div className="space-y-2">
              {form.atributos.map((a: any, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={a.nombre} onChange={e => setAtributo(i, 'nombre', e.target.value)}
                    placeholder="Atributo (ej. Talla)"
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                  <input value={a.valor} onChange={e => setAtributo(i, 'valor', e.target.value)}
                    placeholder="Valor (ej. L)"
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                  <button type="button" onClick={() => removeAtributo(i)} className="text-slate-400 hover:text-red-500 p-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error?.response?.data?.message ?? 'Error al guardar'}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {isLoading ? 'Guardando...' : variante ? 'Actualizar' : 'Crear variante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StockModal({ variante, bodegas, onClose, onSubmit, isLoading }: any) {
  const [form, setForm] = useState({ bodegaId: '', cantidad: '', tipo: 'entrada' })

  const handleSubmit = (e: any) => {
    e.preventDefault()
    const cantidad = parseFloat(form.cantidad) * (form.tipo === 'salida' ? -1 : 1)
    onSubmit({ bodegaId: +form.bodegaId, cantidad })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Ajustar stock — {variante.nombre}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Bodega *</label>
            <select required value={form.bodegaId} onChange={e => setForm(f => ({ ...f, bodegaId: e.target.value }))}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
              <option value="">Selecciona...</option>
              {bodegas.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
            <div className="flex gap-2">
              {['entrada', 'salida'].map(t => (
                <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.tipo === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {t === 'entrada' ? '+ Entrada' : '− Salida'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad *</label>
            <input required type="number" min={0.001} step={0.001} value={form.cantidad}
              onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {isLoading ? 'Guardando...' : 'Aplicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
