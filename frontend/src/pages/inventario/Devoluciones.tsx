import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getProductos, getBodegas, postDevolucionProveedor, postDevolucionCliente } from '../../services/inventario.service'
import { RotateCcw, ArrowDownCircle, ArrowUpCircle, CheckCircle, X } from 'lucide-react'

type TipoDevolucion = 'proveedor' | 'cliente'

export function Devoluciones() {
  const qc = useQueryClient()
  const [tipo, setTipo] = useState<TipoDevolucion>('proveedor')
  const [success, setSuccess] = useState<string | null>(null)

  const { data: productos = [] } = useQuery({ queryKey: ['productos'], queryFn: () => getProductos({ activo: true }) })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

  const mutProveedor = useMutation({
    mutationFn: postDevolucionProveedor,
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['movimientos'] })
      setSuccess(`Devolución a proveedor registrada — ${data.numero}`)
    },
  })

  const mutCliente = useMutation({
    mutationFn: postDevolucionCliente,
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['movimientos'] })
      setSuccess(`Devolución de cliente registrada — ${data.numero}`)
    },
  })

  const isPending = mutProveedor.isPending || mutCliente.isPending
  const error = (mutProveedor.error || mutCliente.error) as any

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Devoluciones</h1>
        <p className="text-slate-500 text-sm mt-0.5">Registra devoluciones a proveedor o de cliente</p>
      </div>

      {/* Tipo selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setTipo('proveedor'); setSuccess(null); mutProveedor.reset() }}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
            tipo === 'proveedor'
              ? 'border-amber-400 bg-amber-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <ArrowDownCircle size={24} className={tipo === 'proveedor' ? 'text-amber-500' : 'text-slate-400'} />
          <div>
            <p className={`font-semibold text-sm ${tipo === 'proveedor' ? 'text-amber-800' : 'text-slate-700'}`}>
              Devolución a Proveedor
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Reduce stock — mercancía que regresa al proveedor</p>
          </div>
        </button>
        <button
          onClick={() => { setTipo('cliente'); setSuccess(null); mutCliente.reset() }}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
            tipo === 'cliente'
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <ArrowUpCircle size={24} className={tipo === 'cliente' ? 'text-indigo-500' : 'text-slate-400'} />
          <div>
            <p className={`font-semibold text-sm ${tipo === 'cliente' ? 'text-indigo-800' : 'text-slate-700'}`}>
              Devolución de Cliente
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Aumenta stock — cliente devuelve la mercancía</p>
          </div>
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle size={18} className="text-green-600 shrink-0" />
          <span className="text-green-800 text-sm font-medium flex-1">{success}</span>
          <button onClick={() => setSuccess(null)}><X size={16} className="text-green-500" /></button>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className={`flex items-center gap-2 px-6 py-4 border-b border-slate-100 ${tipo === 'proveedor' ? 'bg-amber-50/50' : 'bg-indigo-50/50'}`}>
          <RotateCcw size={16} className={tipo === 'proveedor' ? 'text-amber-500' : 'text-indigo-500'} />
          <h2 className="font-semibold text-slate-800 text-sm">
            {tipo === 'proveedor' ? 'Datos de la devolución a proveedor' : 'Datos de la devolución de cliente'}
          </h2>
        </div>

        {tipo === 'proveedor'
          ? <DevolucionProveedorForm
              productos={productos as any[]}
              bodegas={bodegas as any[]}
              onSubmit={(d) => mutProveedor.mutate(d)}
              isLoading={isPending}
              error={error}
            />
          : <DevolucionClienteForm
              productos={productos as any[]}
              bodegas={bodegas as any[]}
              onSubmit={(d) => mutCliente.mutate(d)}
              isLoading={isPending}
              error={error}
            />
        }
      </div>
    </div>
  )
}

function DevolucionProveedorForm({ productos, bodegas, onSubmit, isLoading, error }: any) {
  const [form, setForm] = useState({ productoId: '', bodegaId: '', cantidad: '', motivo: '', referencia: '' })
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: any) => {
    e.preventDefault()
    onSubmit({
      productoId: +form.productoId,
      bodegaId: +form.bodegaId,
      cantidad: +form.cantidad,
      motivo: form.motivo || undefined,
      referencia: form.referencia || undefined,
    })
    setForm({ productoId: '', bodegaId: '', cantidad: '', motivo: '', referencia: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Producto *</label>
          <select required value={form.productoId} onChange={set('productoId')}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-200 bg-white">
            <option value="">Selecciona producto...</option>
            {productos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Bodega de origen *</label>
          <select required value={form.bodegaId} onChange={set('bodegaId')}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-200 bg-white">
            <option value="">Selecciona bodega...</option>
            {bodegas.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad *</label>
        <input required type="number" min="0.01" step="any" value={form.cantidad} onChange={set('cantidad')}
          placeholder="0"
          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-200" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Referencia / N° Nota crédito</label>
        <input value={form.referencia} onChange={set('referencia')}
          placeholder="NC-0001, OC-2024-001..."
          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-200" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Motivo</label>
        <textarea value={form.motivo} onChange={set('motivo')} rows={3}
          placeholder="Producto defectuoso, vencido, error en pedido..."
          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-200 resize-none" />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error?.response?.data?.message ?? 'Error al registrar la devolución'}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={isLoading}
          className="px-5 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors">
          {isLoading ? 'Registrando...' : 'Registrar devolución a proveedor'}
        </button>
      </div>
    </form>
  )
}

function DevolucionClienteForm({ productos, bodegas, onSubmit, isLoading, error }: any) {
  const [form, setForm] = useState({ productoId: '', bodegaId: '', cantidad: '', costoUnitario: '', motivo: '', referencia: '' })
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: any) => {
    e.preventDefault()
    onSubmit({
      productoId: +form.productoId,
      bodegaId: +form.bodegaId,
      cantidad: +form.cantidad,
      costoUnitario: form.costoUnitario ? +form.costoUnitario : undefined,
      motivo: form.motivo || undefined,
      referencia: form.referencia || undefined,
    })
    setForm({ productoId: '', bodegaId: '', cantidad: '', costoUnitario: '', motivo: '', referencia: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Producto *</label>
          <select required value={form.productoId} onChange={set('productoId')}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
            <option value="">Selecciona producto...</option>
            {productos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Bodega de destino *</label>
          <select required value={form.bodegaId} onChange={set('bodegaId')}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
            <option value="">Selecciona bodega...</option>
            {bodegas.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad *</label>
          <input required type="number" min="0.01" step="any" value={form.cantidad} onChange={set('cantidad')}
            placeholder="0"
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Costo unitario <span className="text-slate-400 font-normal">(para recalcular CPP)</span>
          </label>
          <input type="number" min="0" step="any" value={form.costoUnitario} onChange={set('costoUnitario')}
            placeholder="Opcional — usa CPP actual si se omite"
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Referencia / N° Venta original</label>
        <input value={form.referencia} onChange={set('referencia')}
          placeholder="VTA-0001, FAC-2024-100..."
          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Motivo</label>
        <textarea value={form.motivo} onChange={set('motivo')} rows={3}
          placeholder="Producto dañado, talla incorrecta, no cumple expectativas..."
          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error?.response?.data?.message ?? 'Error al registrar la devolución'}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={isLoading}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {isLoading ? 'Registrando...' : 'Registrar devolución de cliente'}
        </button>
      </div>
    </form>
  )
}
