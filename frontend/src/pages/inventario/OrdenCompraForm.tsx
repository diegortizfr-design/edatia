import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProveedores, getBodegas, buscarProductos,
  createOrdenCompra,
} from '../../services/inventario.service'
import { getDocumentosConfig } from '../../services/configuracion.service'
import { getImpuestos } from '../../services/erp.service'
import { getApiError } from '../../services/api'
import { ArrowLeft, Plus, Trash2, Search, Save } from 'lucide-react'

interface LineaItem {
  productoId: number
  productoNombre: string
  productoSku: string
  cantidad: string
  costoUnitario: string
  descuentoPct: string
  ivaPct: number
  tieneIvaOriginal: boolean
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export function OrdenCompraForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const [header, setHeader] = useState({ proveedorId: '', bodegaId: '', fechaEsperada: '', notas: '' })
  const [documentoConfigId, setDocumentoConfigId] = useState('')
  const [items, setItems] = useState<LineaItem[]>([])
  const [busqueda, setBusqueda] = useState('')

  const { data: proveedores = [] } = useQuery({ queryKey: ['proveedores'], queryFn: () => getProveedores() })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })
  const { data: documentos = [] } = useQuery({ queryKey: ['documentos-config'], queryFn: getDocumentosConfig })

  const { data: sugerencias = [], isFetching: buscando } = useQuery({
    queryKey: ['buscar-prod-oc', busqueda],
    queryFn: () => buscarProductos(busqueda),
    enabled: busqueda.length >= 2,
  })

  // Obtener impuestos del sistema (Configuración > General > Impuestos)
  const { data: impuestos = [] } = useQuery({ queryKey: ['impuestos'], queryFn: getImpuestos })
  const impuestosIva = impuestos.filter((imp: any) => 
    (imp.tipo === 'IVA' || imp.tipo === 'CONSUMO') && 
    imp.activo !== false && 
    imp.estado !== 'INACTIVO' &&
    imp.retencionCompra !== true
  )

  function resolveProductoIva(producto: any): number {
    const isExento = producto.productoExentoIva === true || 
                     producto.liquidarIva === false || 
                     producto.tipoIva === 'EXENTO' || 
                     producto.tipoIva === 'EXCLUIDO' ||
                     (Array.isArray(producto.appliedTaxIds) && producto.appliedTaxIds.length === 0)
    if (isExento) return 0

    // 1. Resolver por appliedTaxIds buscando en los impuestos del sistema
    if (Array.isArray(producto.appliedTaxIds) && producto.appliedTaxIds.length > 0) {
      for (const taxId of producto.appliedTaxIds) {
        const matching = impuestos.find((t: any) => 
          String(t.id) === String(taxId) || 
          (taxId === 'iva_19' && Number(t.tarifa) === 19) ||
          (taxId === 'iva_5' && Number(t.tarifa) === 5)
        )
        if (matching && Number(matching.tarifa) >= 0) {
          return Number(matching.tarifa)
        }
      }
    }

    // 2. Resolver por tipoIva estándar
    if (producto.tipoIva === 'GRAVADO_5' || producto.tipoIva === 'IVA_5') return 5
    if (producto.tipoIva === 'GRAVADO_19' || producto.tipoIva === 'IVA_19') return 19
    if (typeof producto.tipoIva === 'string' && producto.tipoIva.startsWith('GRAVADO_')) {
      const parsed = parseFloat(producto.tipoIva.replace('GRAVADO_', ''))
      if (!isNaN(parsed)) return parsed
    }

    // 3. Fallback a impuesto por defecto configurado
    if (impuestosIva.length > 0) {
      const def = impuestosIva.find((t: any) => t.esDefecto) || impuestosIva[0]
      return Number(def.tarifa) || 0
    }

    return 19
  }

  // Filter documents by type 'OC' and active state, matching destination sucursal
  const bodegaSeleccionada = bodegas.find(b => b.id === Number(header.bodegaId))
  const sucursalId = bodegaSeleccionada?.sucursalId
  const documentosFiltrados = documentos.filter((doc: any) => 
    doc.sigla === 'OC' && 
    doc.estado === 'ACTIVO' &&
    (doc.sucursalId === null || doc.sucursalId === sucursalId)
  )

  const handleBodegaChange = (bId: string) => {
    setHeader(h => ({ ...h, bodegaId: bId }))
    setDocumentoConfigId('') // reset document resolution to avoid sucursal mismatch
  }

  const mutation = useMutation({
    mutationFn: createOrdenCompra,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ordenes-compra'] })
      navigate(`/inventario/ordenes-compra/${data.id}`)
    },
    onError: (err: any) => {
      setError(getApiError(err, 'Error al crear la orden'))
    },
  })

  function addItem(producto: any) {
    const ya = items.find(i => i.productoId === producto.id)
    if (ya) { setBusqueda(''); return }

    // Priorizar costo unitario base del catálogo, luego promedio, luego último
    const costoSugerido = Number(producto.costo) || Number(producto.costoPromedio) || Number(producto.costoUltimo) || 0

    // Detectar si el producto viene con IVA o sin IVA según su configuración e impuestos del sistema
    const ivaPct = resolveProductoIva(producto)

    setItems(prev => [...prev, {
      productoId: producto.id,
      productoNombre: producto.nombre,
      productoSku: producto.sku,
      cantidad: '1',
      costoUnitario: String(costoSugerido),
      descuentoPct: '0',
      ivaPct: ivaPct,
      tieneIvaOriginal: ivaPct > 0,
    }])
    setBusqueda('')
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof LineaItem, val: any) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  // Calcular totales en vivo
  const lineas = items.map(item => {
    const cant = parseFloat(item.cantidad) || 0
    const costo = parseFloat(item.costoUnitario) || 0
    const dto = parseFloat(item.descuentoPct) || 0
    const subtotalBruto = cant * costo
    const descuentoVal = subtotalBruto * (dto / 100)
    const subtotal = subtotalBruto - descuentoVal
    const ivaVal = subtotal * (item.ivaPct / 100)
    const totalItem = subtotal + ivaVal
    return { 
      ...item, 
      subtotalCalc: subtotal, 
      descuentoCalc: descuentoVal, 
      ivaCalc: ivaVal, 
      totalCalc: totalItem 
    }
  })
  const totalSubtotal = lineas.reduce((acc, l) => acc + l.subtotalCalc, 0)
  const totalDescuento = lineas.reduce((acc, l) => acc + l.descuentoCalc, 0)
  const totalIva = lineas.reduce((acc, l) => acc + l.ivaCalc, 0)
  const totalNeto = totalSubtotal + totalIva

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!header.proveedorId) return setError('Selecciona un proveedor')
    if (!header.bodegaId) return setError('Selecciona una bodega destino')
    if (!documentoConfigId) return setError('Selecciona una resolución/documento para la orden de compra')
    if (items.length === 0) return setError('Agrega al menos un producto')

    mutation.mutate({
      documentoConfigId: Number(documentoConfigId),
      proveedorId: +header.proveedorId,
      bodegaId: +header.bodegaId,
      fechaEsperada: header.fechaEsperada || undefined,
      notas: header.notas || undefined,
      items: items.map(item => ({
        productoId: item.productoId,
        cantidad: parseFloat(item.cantidad),
        costoUnitario: parseFloat(item.costoUnitario),
        descuentoPct: parseFloat(item.descuentoPct) || 0,
        ivaPct: item.ivaPct,
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
              <div className="flex gap-2">
                <select value={header.proveedorId} onChange={e => setHeader(h => ({ ...h, proveedorId: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— Seleccionar proveedor —</option>
                  {proveedores.filter(p => p.activo).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}{p.nombreComercial && p.nombreComercial !== p.nombre ? ` (${p.nombreComercial})` : ''}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => navigate('/configuracion/terceros/nuevo?role=proveedor')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 whitespace-nowrap"
                >
                  Crear Proveedor
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bodega destino *</label>
              <select value={header.bodegaId} onChange={e => handleBodegaChange(e.target.value)} required className={inputCls}>
                <option value="">— Seleccionar bodega —</option>
                {bodegas.filter(b => b.activo).map(b => (
                  <option key={b.id} value={b.id}>{b.nombre} ({b.codigo})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Documento OC (Prefijo) *</label>
              <select value={documentoConfigId} onChange={e => setDocumentoConfigId(e.target.value)} required className={inputCls}>
                <option value="">— Seleccionar resolución OC —</option>
                {documentosFiltrados.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre} ({d.prefijo})</option>
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
              <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-72 overflow-y-auto">
                {sugerencias.map(p => {
                  const costoBase = Number(p.costo) || Number(p.costoPromedio) || Number(p.costoUltimo) || 0
                  const ivaPctProd = resolveProductoIva(p)
                  const labelIva = ivaPctProd === 0 ? 'Sin IVA' : `IVA ${ivaPctProd}%`

                  return (
                    <button key={p.id} type="button" onClick={() => addItem(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 font-mono">{p.sku}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-600 font-semibold">Costo: {fmt(costoBase)}</span>
                          <span className="text-slate-300">·</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            ivaPctProd === 0 ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {labelIva}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-indigo-600 flex items-center gap-1 font-semibold whitespace-nowrap"><Plus size={13} /> Agregar</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => navigate('/inventario/productos/nuevo')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <Plus size={12} /> ¿El producto no existe? Crear Producto nuevo
            </button>
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
                    <th className="text-left py-2.5 text-xs font-semibold text-slate-500 uppercase">Producto</th>
                    <th className="text-right py-2.5 text-xs font-semibold text-slate-500 uppercase w-24">Cantidad</th>
                    <th className="text-right py-2.5 text-xs font-semibold text-slate-500 uppercase w-32">Costo unit.</th>
                    <th className="text-right py-2.5 text-xs font-semibold text-slate-500 uppercase w-20">Dto %</th>
                    <th className="text-center py-2.5 text-xs font-semibold text-slate-500 uppercase w-32">IVA</th>
                    <th className="text-right py-2.5 text-xs font-semibold text-slate-500 uppercase w-28">Subtotal</th>
                    <th className="text-right py-2.5 text-xs font-semibold text-slate-500 uppercase w-28">Total</th>
                    <th className="py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineas.map((item, idx) => (
                    <tr key={item.productoId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 pr-2">
                        <p className="font-medium text-slate-800">{item.productoNombre}</p>
                        <p className="text-xs text-slate-400 font-mono">{item.productoSku}</p>
                      </td>
                      <td className="py-2.5 px-1">
                        <input type="number" min="0.001" step="0.001" value={item.cantidad}
                          onChange={e => updateItem(idx, 'cantidad', e.target.value)}
                          className="w-full text-right px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
                      </td>
                      <td className="py-2.5 px-1">
                        <input type="number" min="0" step="0.01" value={item.costoUnitario}
                          onChange={e => updateItem(idx, 'costoUnitario', e.target.value)}
                          className="w-full text-right px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
                      </td>
                      <td className="py-2.5 px-1">
                        <input type="number" min="0" max="100" step="0.01" value={item.descuentoPct}
                          onChange={e => updateItem(idx, 'descuentoPct', e.target.value)}
                          className="w-full text-right px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
                      </td>
                      <td className="py-2.5 px-1">
                        <select
                          value={item.ivaPct}
                          onChange={e => updateItem(idx, 'ivaPct', Number(e.target.value))}
                          className={`w-full px-2 py-1 border rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                            item.ivaPct > 0 
                              ? 'border-indigo-200 bg-indigo-50/60 text-indigo-700' 
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          <option value={0}>0% (Sin IVA)</option>
                          {impuestosIva.map((imp: any) => (
                            <option key={imp.id} value={Number(imp.tarifa)}>
                              {imp.tarifa}% ({imp.nombre})
                            </option>
                          ))}
                          {/* Fallback si el ítem tiene un porcentaje no presente en los activos */}
                          {item.ivaPct > 0 && !impuestosIva.some((imp: any) => Number(imp.tarifa) === Number(item.ivaPct)) && (
                            <option value={item.ivaPct}>{item.ivaPct}% (IVA {item.ivaPct}%)</option>
                          )}
                        </select>
                        {item.ivaCalc > 0 && (
                          <span className="text-[10px] text-indigo-600 block text-right mt-0.5 font-medium">
                            +{fmt(item.ivaCalc)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-medium text-slate-600 font-mono">{fmt(item.subtotalCalc)}</td>
                      <td className="py-2.5 pl-2 text-right font-bold text-slate-800 font-mono">{fmt(item.totalCalc)}</td>
                      <td className="py-2.5 pl-2 text-center">
                        <button type="button" onClick={() => removeItem(idx)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={5} className="pt-3 text-right text-xs font-medium text-slate-500">Subtotal:</td>
                    <td colSpan={2} className="pt-3 text-right text-sm font-semibold text-slate-700 font-mono">{fmt(totalSubtotal)}</td>
                    <td></td>
                  </tr>
                  {totalDescuento > 0 && (
                    <tr>
                      <td colSpan={5} className="py-1 text-right text-xs font-medium text-emerald-600">Descuento aplicado:</td>
                      <td colSpan={2} className="py-1 text-right text-sm font-semibold text-emerald-600 font-mono">-{fmt(totalDescuento)}</td>
                      <td></td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={5} className="py-1 text-right text-xs font-medium text-slate-500">
                      IVA {totalIva === 0 ? '(Productos sin IVA)' : ''}:
                    </td>
                    <td colSpan={2} className={`py-1 text-right text-sm font-semibold font-mono ${totalIva > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {fmt(totalIva)}
                    </td>
                    <td></td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td colSpan={5} className="py-2.5 text-right text-sm font-bold text-slate-800">Total Orden de Compra:</td>
                    <td colSpan={2} className="py-2.5 text-right text-lg font-extrabold text-slate-900 font-mono">{fmt(totalNeto)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={mutation.isPending || items.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            <Save size={16} />
            {mutation.isPending ? 'Creando...' : 'Crear orden de compra'}
          </button>
        </div>
      </form>
    </div>
  )
}
