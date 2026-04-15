import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProveedores, getBodegas, buscarProductos,
  createOrdenCompra,
} from '../../services/inventario.service'
import { ArrowLeft, Plus, Trash2, Search, Save } from 'lucide-react'

interface LineaItem {
  productoId: number
  productoNombre: string
  productoSku: string
  cantidad: string
  costoUnitario: string
  descuentoPct: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export function OrdenCompraForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const [header, setHeader] = useState({ proveedorId: '', bodegaId: '', fechaEsperada: '', notas: '' })
  const [items, setItems] = useState<LineaItem[]>([])
  const [busqueda, setBusqueda] = useState('')

  const { data: proveedores = [] } = useQuery({ queryKey: ['proveedores'], queryFn: () => getProveedores() })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })
  const { data: sugerencias = [], isFetching: buscando } = useQuery({
    queryKey: ['buscar-prod-oc', busqueda],
    queryFn: () => buscarProductos(busqueda),
    enabled: busqueda.length >= 2,
  })

  const mutation = useMutation({
    mutationFn: createOrdenCompra,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ordenes-compra'] })
      navigate(`/inventario/ordenes-compra/${data.id}`)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al crear la orden'))
    },
  })

  function addItem(producto: any) {
    const ya = items.find(i => i.productoId === producto.id)
    if (ya) { setBusqueda(''); return }
    setItems(prev => [...prev, {
      productoId: producto.id,
      productoNombre: producto.nombre,
      productoSku: producto.sku,
      cantidad: '1',
      costoUnitario: String(Number(producto.costoPromedio) || 0),
      descuentoPct: '0',
    }])
    setBusqueda('')
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof LineaItem, val: string) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  // Calcular totales en vivo
  const lineas = items.map(item => {
    const cant = parseFloat(item.cantidad) || 0
    const costo = parseFloat(item.costoUnitario) || 0
    const dto = parseFloat(item.descuentoPct) || 0
    const subtotal = cant * costo * (1 - dto / 100)
    return { ...item, subtotalCalc: subtotal }
  })
  const totalBruto = lineas.reduce((acc, l) => acc + l.subtotalCalc, 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!header.proveedorId) return setError('Selecciona un proveedor')
    if (!header.bodegaId) return setError('Selecciona una bodega destino')
    if (items.length === 0) return setError('Agrega al menos un producto')

    mutation.mutate({
      proveedorId: +header.proveedorId,
      bodegaId: +header.bodegaId,
      fechaEsperada: header.fechaEsperada || undefined,
      notas: header.notas || undefined,
      items: items.map(item => ({
        productoId: item.productoId,
        cantidad: parseFloat(item.cantidad),
        costoUnitario: parseFloat(item.costoUnitario),
        descuentoPct: parseFloat(item.descuentoPct) || 0,
      })),
    })
  }

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Nueva Orden de Compra</h1>
          <p className="text-xs text-slate-400">Se creará en estado BORRADOR</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Encabezado */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Datos de la orden</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Proveedor *</label>
              <select value={header.proveedorId} onChange={e => setHeader(h => ({ ...h, proveedorId: e.target.value }))} required className={inputCls}>
                <option value="">— Seleccionar proveedor —</option>
                {proveedores.filter(p => p.activo).map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}{p.nombreComercial && p.nombreComercial !== p.nombre ? ` (${p.nombreComercial})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bodega destino *</label>
              <select value={header.bodegaId} onChange={e => setHeader(h => ({ ...h, bodegaId: e.target.value }))} required className={inputCls}>
                <option value="">— Seleccionar bodega —</option>
                {bodegas.filter(b => b.activo).map(b => (
                  <option key={b.id} value={b.id}>{b.nombre} ({b.codigo})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha esperada de entrega</label>
              <input type="date" value={header.fechaEsperada} onChange={e => setHeader(h => ({ ...h, fechaEsperada: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notas</label>
              <input value={header.notas} onChange={e => setHeader(h => ({ ...h, notas: e.target.value }))} className={inputCls} placeholder="Observaciones..." />
            </div>
          </div>
        </div>

        {/* Ítems */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Productos</h2>
            <span className="text-xs text-slate-400">{items.length} ítem(s)</span>
          </div>

          {/* Buscador de producto */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto para agregar..."
              className="w-full pl-9 pr-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-solid"
            />
            {busqueda.length >= 2 && !buscando && sugerencias.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                {sugerencias.map(p => (
                  <button key={p.id} type="button" onClick={() => addItem(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.nombre}</p>
                      <p className="text-xs text-slate-400">{p.sku}</p>
                    </div>
                    <span className="text-xs text-indigo-600 flex items-center gap-1"><Plus size={12} /> Agregar</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabla de ítems */}
          {items.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
              Busca y agrega productos arriba
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Producto</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase w-28">Cantidad</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase w-36">Costo unit.</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase w-24">Dto %</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase w-32">Subtotal</th>
                    <th className="py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineas.map((item, idx) => (
                    <tr key={item.productoId}>
                      <td className="py-2 pr-2">
                        <p className="font-medium text-slate-800">{item.productoNombre}</p>
                        <p className="text-xs text-slate-400">{item.productoSku}</p>
                      </td>
                      <td className="py-2 px-1">
                        <input type="number" min="0.001" step="0.001" value={item.cantidad}
                          onChange={e => updateItem(idx, 'cantidad', e.target.value)}
                          className="w-full text-right px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </td>
                      <td className="py-2 px-1">
                        <input type="number" min="0" step="0.01" value={item.costoUnitario}
                          onChange={e => updateItem(idx, 'costoUnitario', e.target.value)}
                          className="w-full text-right px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </td>
                      <td className="py-2 px-1">
                        <input type="number" min="0" max="100" step="0.01" value={item.descuentoPct}
                          onChange={e => updateItem(idx, 'descuentoPct', e.target.value)}
                          className="w-full text-right px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      </td>
                      <td className="py-2 pl-2 text-right font-semibold text-slate-700">{fmt(item.subtotalCalc)}</td>
                      <td className="py-2 pl-2">
                        <button type="button" onClick={() => removeItem(idx)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={4} className="pt-3 text-right text-sm font-semibold text-slate-600">Total estimado:</td>
                    <td className="pt-3 text-right text-base font-bold text-slate-800">{fmt(totalBruto)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="pt-1">
                      <p className="text-xs text-slate-400 text-right">* IVA se calcula según configuración de cada producto</p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={mutation.isLoading || items.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            <Save size={16} />
            {mutation.isLoading ? 'Creando...' : 'Crear orden de compra'}
          </button>
        </div>
      </form>
    </div>
  )
}
