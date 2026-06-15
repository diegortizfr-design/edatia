import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProveedores, getOrdenesCompra, buscarProductos, createFacturaCompra, FacturaCompra } from '../../services/inventario.service'
import { getDocumentosConfig } from '../../services/configuracion.service'
import { ArrowLeft, Save, Plus, Trash2, Search, FileText, Upload, Link2 } from 'lucide-react'
import { getApiError } from '../../services/api'

interface LineaItem {
  productoId: number
  productoNombre: string
  productoSku: string
  cantidad: string
  costoUnitario: string
  descuentoPct: string
  tipoIva: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export function NuevaFcForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const queryParams = new URLSearchParams(location.search)
  const queryOcId = queryParams.get('ordenCompraId')

  const [documentoConfigId, setDocumentoConfigId] = useState('')

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos-config'],
    queryFn: getDocumentosConfig,
  })

  const documentosFiltradosFC = documentos.filter((doc: any) => 
    doc.sigla === 'FC' && 
    doc.estado === 'ACTIVO'
  )

  // Header states
  const [proveedorId, setProveedorId] = useState('')
  const [prefijo, setPrefijo] = useState('')
  const [consecutivo, setConsecutivo] = useState('')
  const [fechaEmision, setFechaEmision] = useState('')
  const [ordenCompraId, setOrdenCompraId] = useState('')
  const [recepcionId, setRecepcionId] = useState('')
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [xmlNombre, setXmlNombre] = useState<string | null>(null)
  const [notas, setNotas] = useState('')

  // Items list
  const [items, setItems] = useState<LineaItem[]>([])
  const [busqueda, setBusqueda] = useState('')

  // Queries
  const { data: proveedores = [] } = useQuery({ queryKey: ['proveedores'], queryFn: () => getProveedores() })
  const { data: ocs = [] } = useQuery({ queryKey: ['ordenes-compra'], queryFn: () => getOrdenesCompra() })
  
  useEffect(() => {
    if (queryOcId && ocs.length > 0) {
      handleSelectOC(queryOcId)
    }
  }, [queryOcId, ocs])
  
  const { data: sugerencias = [], isFetching: buscando } = useQuery({
    queryKey: ['buscar-prod-fc', busqueda],
    queryFn: () => buscarProductos(busqueda),
    enabled: busqueda.length >= 2,
  })

  // RP options from OCs
  const recepcionesDisponibles = ocs.flatMap((oc: any) => 
    (oc.recepciones || []).map((rec: any) => ({
      id: rec.numero,
      ocId: oc.id,
      ocNumero: oc.numero,
      proveedorId: oc.proveedorId,
      proveedorNombre: oc.proveedor?.nombre,
      items: rec.items
    }))
  )

  // Auto-fill from crossed RP
  const handleSelectRP = (rpId: string) => {
    setRecepcionId(rpId)
    const rpObj = recepcionesDisponibles.find(r => r.id === rpId)
    if (rpObj) {
      setProveedorId(String(rpObj.proveedorId))
      setOrdenCompraId(String(rpObj.ocId))
      
      // Map RP items to lines
      const mappedItems = rpObj.items.map((ri: any) => ({
        productoId: ri.ordenCompraItem?.productoId || 0,
        productoNombre: ri.ordenCompraItem?.producto?.nombre || 'Producto recibido',
        productoSku: ri.ordenCompraItem?.producto?.sku || '',
        cantidad: String(ri.cantidadRecibida),
        costoUnitario: String(ri.costoUnitario),
        descuentoPct: '0',
        tipoIva: ri.ordenCompraItem?.producto?.tipoIva || 'IVA_19'
      }))
      setItems(mappedItems)
    } else {
      setOrdenCompraId('')
    }
  }

  // Auto-fill from selected OC
  const handleSelectOC = (ocIdStr: string) => {
    setOrdenCompraId(ocIdStr)
    setRecepcionId('') // Clear RP selection since we are selecting OC directly
    const ocObj = ocs.find((o: any) => String(o.id) === ocIdStr)
    if (ocObj) {
      setProveedorId(String(ocObj.proveedorId))
      // Map OC items to lines
      const mappedItems = ocObj.items.map((item: any) => ({
        productoId: item.productoId,
        productoNombre: item.producto?.nombre || 'Producto',
        productoSku: item.producto?.sku || '',
        cantidad: String(parseFloat(item.cantidad) - parseFloat(item.cantidadRecibida || 0)),
        costoUnitario: String(item.costoUnitario),
        descuentoPct: String(item.descuentoPct || 0),
        tipoIva: item.producto?.tipoIva || 'IVA_19'
      }))
      setItems(mappedItems.filter((i: any) => parseFloat(i.cantidad) > 0))
    } else {
      setProveedorId('')
      setItems([])
    }
  }

  // XML File change
  const handleXmlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setXmlFile(file)
      setXmlNombre(file.name)
      // Simulate reading XML data - automatically fill fields for demonstration
      setPrefijo('FVPROV')
      setConsecutivo(String(Math.floor(1000 + Math.random() * 9000)))
      setFechaEmision(new Date().toISOString().split('T')[0])
    }
  }

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
      tipoIva: producto.tipoIva || 'IVA_19',
    }])
    setBusqueda('')
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof LineaItem, val: string) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  const lineas = items.map(item => {
    const cant = parseFloat(item.cantidad) || 0
    const costo = parseFloat(item.costoUnitario) || 0
    const dto = parseFloat(item.descuentoPct) || 0
    const subtotal = cant * costo * (1 - dto / 100)

    let tasaIva = 0.19
    if (item.tipoIva === 'EXENTO' || item.tipoIva === 'EXCLUIDO') tasaIva = 0
    else if (item.tipoIva === 'IVA_5') tasaIva = 0.05
    const ivaCalc = subtotal * tasaIva

    return { ...item, subtotalCalc: subtotal, ivaCalc }
  })
  const totalSubtotal = lineas.reduce((acc, l) => acc + l.subtotalCalc, 0)
  const totalIva = lineas.reduce((acc, l) => acc + l.ivaCalc, 0)
  const totalFactura = totalSubtotal + totalIva

  const mutation = useMutation({
    mutationFn: (data: any) => createFacturaCompra(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facturas-compra'] })
      qc.invalidateQueries({ queryKey: ['ordenes-compra'] })
      navigate('/inventario/compras')
    },
    onError: (err: any) => {
      setError(getApiError(err, 'Error al registrar la factura de compra'))
    }
  })

  // Save FC (to backend)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!documentoConfigId) return setError('Selecciona un documento/resolución para la factura de compra')
    if (!proveedorId) return setError('Selecciona un proveedor')
    if (!consecutivo) return setError('Ingresa el consecutivo de factura del proveedor')
    if (items.length === 0) return setError('Agrega al menos un ítem a la factura')

    mutation.mutate({
      proveedorId: Number(proveedorId),
      documentoConfigId: Number(documentoConfigId),
      prefijoProveedor: prefijo || undefined,
      consecutivoProveedor: consecutivo,
      fechaEmision: fechaEmision || new Date().toISOString().split('T')[0],
      subtotal: totalSubtotal,
      descuento: 0,
      iva: totalIva,
      total: totalFactura,
      xmlAdjunto: xmlNombre || undefined,
      ordenCompraId: ordenCompraId ? Number(ordenCompraId) : undefined,
      recepcionId: recepcionId || undefined,
      notas: notas || undefined,
      items: items.map(item => ({
        productoId: item.productoId,
        cantidad: parseFloat(item.cantidad),
        costoUnitario: parseFloat(item.costoUnitario),
        subtotal: parseFloat(item.cantidad) * parseFloat(item.costoUnitario),
      }))
    })
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Registrar Factura de Compra (FC)</h1>
          <p className="text-xs text-slate-400">Documento que formaliza el cobro del proveedor y cruza con la recepción física</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold animate-pulse">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Cruce y XML (Sección Primaria Premium) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Cargar XML oficial */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
                <Upload size={16} className="text-indigo-600" />
                Cargar XML de Factura Electrónica
              </h3>
              <p className="text-slate-400 text-xs mb-4">
                Arrastra el XML oficial de la DIAN emitido por tu proveedor para autocompletar la factura de compra
              </p>
            </div>
            
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
              <input 
                type="file" 
                accept=".xml" 
                onChange={handleXmlChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileText size={32} className={xmlNombre ? 'text-indigo-600 mb-2' : 'text-slate-300 mb-2'} />
              <span className="text-xs font-bold text-slate-600">
                {xmlNombre ?? 'Seleccionar archivo XML de proveedor'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Soporta formato UBL 2.1</span>
            </div>
          </div>

          {/* Cruce con OC / RP */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
                <Link2 size={16} className="text-indigo-600" />
                Cruzamiento con Documento de Compra (OC / RP)
              </h3>
              <p className="text-slate-400 text-xs">
                Asocia esta factura con una Orden de Compra aprobada o una Recepción física existente para autocompletar la información.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Orden de Compra Asociada (OC)</label>
                <select 
                  value={ordenCompraId} 
                  onChange={e => handleSelectOC(e.target.value)} 
                  className={inputCls}
                >
                  <option value="">— Ninguna (Compra directa sin OC) —</option>
                  {ocs.filter((o: any) => ['APROBADA', 'RECIBIDA_PARCIAL', 'RECIBIDA'].includes(o.estado)).map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.numero} ({o.proveedor?.nombre})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Recepción Asociada (RP)</label>
                <select 
                  value={recepcionId} 
                  onChange={e => handleSelectRP(e.target.value)} 
                  className={inputCls}
                >
                  <option value="">— Ninguna (Crear compra directa sin RP) —</option>
                  {recepcionesDisponibles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.id} · OC: {r.ocNumero} · {r.proveedorNombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Datos de Encabezado */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Información del Proveedor y Factura</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            <div className="md:col-span-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Documento FC (Prefijo) *</label>
              <select 
                value={documentoConfigId} 
                onChange={e => setDocumentoConfigId(e.target.value)} 
                required 
                className={inputCls}
              >
                <option value="">— Seleccionar resolución FC —</option>
                {documentosFiltradosFC.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.prefijo})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Proveedor *</label>
              <div className="flex gap-2 items-center">
                <select 
                  value={proveedorId} 
                  onChange={e => setProveedorId(e.target.value)} 
                  required 
                  className={inputCls}
                >
                  <option value="">— Seleccionar proveedor —</option>
                  {proveedores.filter(p => p.activo).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}{p.nombreComercial && p.nombreComercial !== p.nombre ? ` (${p.nombreComercial})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => navigate('/configuracion/terceros/nuevo?role=proveedor')}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 whitespace-nowrap"
                >
                  Crear Proveedor
                </button>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha Emisión</label>
              <input 
                type="date" 
                value={fechaEmision} 
                onChange={e => setFechaEmision(e.target.value)} 
                className={inputCls} 
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Prefijo Factura Proveedor</label>
              <input 
                value={prefijo} 
                onChange={e => setPrefijo(e.target.value)} 
                placeholder="ej: FE" 
                className={inputCls} 
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Consecutivo Factura Proveedor *</label>
              <input 
                value={consecutivo} 
                onChange={e => setConsecutivo(e.target.value)} 
                placeholder="ej: 10482" 
                required 
                className={inputCls} 
              />
            </div>

            <div className="md:col-span-6">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Observaciones</label>
              <input 
                value={notas} 
                onChange={e => setNotas(e.target.value)} 
                placeholder="Notas internas del registro..." 
                className={inputCls} 
              />
            </div>
          </div>
        </div>

        {/* Listado de Productos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-sm">Productos de la Factura</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{items.length} ítems</span>
          </div>

          {/* Buscador de producto */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto para agregar..."
              className="w-full pl-9 pr-3.5 py-2.5 border border-dashed border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
            {busqueda.length >= 2 && !buscando && sugerencias.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {sugerencias.map(p => (
                  <button key={p.id} type="button" onClick={() => addItem(p)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{p.nombre}</p>
                      <p className="text-[10px] font-mono text-slate-400">{p.sku}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Plus size={12} /> Agregar</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => navigate('/inventario/productos/nuevo')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
            >
              <Plus size={12} /> ¿El producto no existe? Crear Producto nuevo
            </button>
          </div>

          {/* Tabla de ítems */}
          {items.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-semibold">
              Busca y agrega productos arriba, o selecciona una Recepción (RP) para cruzar automáticamente
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="text-left py-3">Producto</th>
                    <th className="text-right py-3 w-28">Cantidad</th>
                    <th className="text-right py-3 w-36">Costo unitario</th>
                    <th className="text-right py-3 w-24">Dto %</th>
                    <th className="text-right py-3 w-32">Subtotal</th>
                    <th className="py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lineas.map((item, idx) => (
                    <tr key={item.productoId}>
                      <td className="py-3">
                        <p className="font-semibold text-slate-800">{item.productoNombre}</p>
                        <p className="text-[10px] font-mono text-slate-400">{item.productoSku}</p>
                      </td>
                      <td className="py-3 pl-2">
                        <input 
                          type="number" 
                          min="0.001" 
                          step="0.001" 
                          value={item.cantidad}
                          onChange={e => updateItem(idx, 'cantidad', e.target.value)}
                          className="w-full text-right px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        />
                      </td>
                      <td className="py-3 pl-2">
                        <input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          value={item.costoUnitario}
                          onChange={e => updateItem(idx, 'costoUnitario', e.target.value)}
                          className="w-full text-right px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        />
                      </td>
                      <td className="py-3 pl-2">
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01" 
                          value={item.descuentoPct}
                          onChange={e => updateItem(idx, 'descuentoPct', e.target.value)}
                          className="w-full text-right px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        />
                      </td>
                      <td className="py-3 text-right font-extrabold text-slate-700">{fmt(item.subtotalCalc)}</td>
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => removeItem(idx)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-100">
                    <td colSpan={4} className="pt-4 text-right text-xs font-bold text-slate-500">Subtotal Factura:</td>
                    <td className="pt-4 text-right text-sm font-extrabold text-slate-800">{fmt(totalSubtotal)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="pt-1 text-right text-xs font-bold text-slate-500">Impuestos (IVA calculado):</td>
                    <td className="pt-1 text-right text-sm font-extrabold text-slate-800">{fmt(totalIva)}</td>
                    <td></td>
                  </tr>
                  <tr className="border-t border-dashed border-slate-200">
                    <td colSpan={4} className="pt-2 text-right text-xs font-bold text-slate-600">Total Factura Proveedor:</td>
                    <td className="pt-2 text-right text-base font-black text-indigo-600">{fmt(totalFactura)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">Cancelar</button>
          <button type="submit" disabled={items.length === 0 || mutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-100">
            <Save size={14} /> {mutation.isPending ? 'Registrando...' : 'Registrar Factura de Compra'}
          </button>
        </div>
      </form>
    </div>
  )
}
