import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getApiError } from '../../services/api'
import { Plus, Trash2, ShoppingBag, CreditCard, Layers, CheckCircle2, ChevronRight, RefreshCw, AlertCircle, Calendar } from 'lucide-react'
import {
  getClientes, getCliente, createFactura, getPedido, getPedidos, getFacturas
} from '../../services/ventas.service'
import { getProductos, getBodegas, getStock } from '../../services/inventario.service'
import { getDocumentosConfig, incrementarConsecutivo, getFormasPago, getMediosPago } from '../../services/configuracion.service'
import { getVendedores } from '../../services/erp.service'

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

const TIPO_IVA_OPTIONS = [
  { value: 'IVA_19',    label: 'IVA 19%' },
  { value: 'IVA_5',     label: 'IVA 5%' },
  { value: 'IVA_0',     label: 'IVA 0%' },
  { value: 'EXCLUIDO',  label: 'Excluido' },
]

const MEDIO_PAGO_OPTIONS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
  { value: 'OTRO', label: 'Otro' },
]

const CANAL_OPTIONS = ['Directo', 'Digital']
const NIVEL_OPTIONS = ['Precio 1', 'Precio 2', 'Precio 3', 'Precio 4']

const LINE_DEFAULT = () => ({
  _key: Math.random().toString(36).slice(2),
  productoId: '',
  descripcion: '',
  unidad: 'UND',
  cantidad: 1,
  precioUnitario: 0,
  descuentoPct: 0,
  tipoIva: 'IVA_19',
  loteNumero: '',
})

function calcLine(line: any) {
  const quantity = Number(line.cantidad || 0)
  const price = Number(line.precioUnitario || 0)
  const discountPct = Number(line.descuentoPct || 0)

  const bruto = quantity * price
  const descuento = bruto * (discountPct / 100)
  const base = bruto - descuento
  const ivaPct = line.tipoIva === 'IVA_19' ? 0.19 : line.tipoIva === 'IVA_5' ? 0.05 : 0
  const iva = base * ivaPct
  return { bruto, descuento, base, iva, total: base + iva }
}

function calcTotals(lines: any[]) {
  let subtotal = 0, descuento = 0
  let base19 = 0, iva19 = 0, base5 = 0, iva5 = 0
  let totalCant = 0

  lines.forEach(l => {
    const c = calcLine(l)
    subtotal += c.bruto
    descuento += c.descuento
    totalCant += Number(l.cantidad || 0)
    if (l.tipoIva === 'IVA_19') { base19 += c.base; iva19 += c.iva }
    if (l.tipoIva === 'IVA_5')  { base5  += c.base; iva5  += c.iva }
  })

  return { totalCant, subtotal, descuento, base19, iva19, base5, iva5, total: subtotal - descuento + iva19 + iva5 }
}

export function FacturaForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryPedidoId = searchParams.get('pedidoId')
  const qc = useQueryClient()

  // Tabs layout: 'detalles' | 'formas_pago' | 'pedidos'
  const [activeTab, setActiveTab] = useState<'detalles' | 'formas_pago' | 'pedidos'>('detalles')
  const [tipoDocumento, setTipoDocumento] = useState<'FV' | 'FVE' | ''>('')
  const [selectedDocId, setSelectedDocId] = useState<string>('')

  const [clienteId, setClienteId] = useState('')
  const [clienteQ, setClienteQ] = useState('')

  // State flag: active implies client and prefix are set, unlocking the invoice form
  const isInvoiceActive = !!(tipoDocumento && clienteId)

  // Cabecera fields
  const [bodegaId, setBodegaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [vendedorNombre, setVendedorNombre] = useState('')
  const [vendedorId, setVendedorId] = useState<number | ''>('')
  const [canal, setCanal] = useState('Directo')
  const [nivel, setNivel] = useState('Precio 1')
  const [imprimeDcto, setImprimeDcto] = useState(true)
  const [notas, setNotas] = useState('')
  const [direccion, setDireccion] = useState('')
  const [sucursalCliente, setSucursalCliente] = useState('Principal')

  // Formas de pago
  const [formaPago, setFormaPago] = useState('CONTADO')
  const [medioPago, setMedioPago] = useState('EFECTIVO')
  const [fechaVencimiento, setFechaVencimiento] = useState('')

  // Retenciones
  const [retefuente, setRetefuente] = useState('')
  const [reteiva, setReteiva] = useState('')
  const [reteica, setReteica] = useState('')

  // Linked order tracker
  const [pedidoId, setPedidoId] = useState<number | null>(null)
  const [pedidoNumero, setPedidoNumero] = useState<string | null>(null)

  // Items lines list
  const [lines, setLines] = useState<any[]>([])
  const [productoQ, setProductoQ] = useState<Record<string, string>>({})
  const [quickSearchQ, setQuickSearchQ] = useState('')

  // Queries
  const { data: allDocs = [] } = useQuery({
    queryKey: ['documentos-config'],
    queryFn: getDocumentosConfig,
  })

  const docConfigs = useMemo(() => {
    return allDocs.filter((d: any) => (d.sigla === 'FV' || d.sigla === 'FVE') && d.estado === 'ACTIVO')
  }, [allDocs])

  const { data: vendedores = [] } = useQuery({
    queryKey: ['vendedores'],
    queryFn: getVendedores,
  })

  const { data: clientesAll = [] } = useQuery({ queryKey: ['clientes'], queryFn: () => getClientes() })
  const { data: bodegas = [] } = useQuery({ queryKey: ['bodegas'], queryFn: getBodegas })

  const { data: formasPagoList = [] } = useQuery({
    queryKey: ['config-formas-pago'],
    queryFn: getFormasPago,
  })

  const { data: mediosPagoList = [] } = useQuery({
    queryKey: ['config-medios-pago'],
    queryFn: getMediosPago,
  })

  // Set default forma de pago once loaded
  useEffect(() => {
    const activeFormas = formasPagoList.filter((f: any) => f.activo)
    if (activeFormas.length > 0 && !activeFormas.find((f: any) => f.codigo === formaPago)) {
      setFormaPago(activeFormas[0].codigo)
    }
  }, [formasPagoList, formaPago])

  // Set default medio de pago once loaded
  useEffect(() => {
    const activeMedios = mediosPagoList.filter((m: any) => m.activo)
    if (activeMedios.length > 0 && !activeMedios.find((m: any) => m.codigo === medioPago)) {
      setMedioPago(activeMedios[0].codigo)
    }
  }, [mediosPagoList, medioPago])

  const selectedDoc = useMemo(() => {
    return docConfigs.find((d: any) => String(d.id) === String(selectedDocId))
  }, [docConfigs, selectedDocId])

  const bodegasFiltradas = useMemo(() => {
    if (!selectedDoc || selectedDoc.sucursalId === null || selectedDoc.sucursalId === undefined) {
      return bodegas
    }
    return bodegas.filter((b: any) => b.sucursalId === selectedDoc.sucursalId)
  }, [bodegas, selectedDoc])

  // Keep bodegaId valid within the filtered warehouses
  useEffect(() => {
    if (bodegasFiltradas.length > 0) {
      const isValid = bodegasFiltradas.some((b: any) => String(b.id) === String(bodegaId))
      if (!isValid) {
        setBodegaId(String(bodegasFiltradas[0].id))
      }
    } else {
      setBodegaId('')
    }
  }, [bodegasFiltradas, bodegaId])
  const { data: productosAll = [] } = useQuery({ queryKey: ['productos'], queryFn: () => getProductos({ activo: true }) })

  // Active client details (pagoPromedioDias, plazoCredito, etc.)
  const { data: clienteFull } = useQuery<any>({
    queryKey: ['cliente', clienteId],
    queryFn: () => getCliente(Number(clienteId)),
    enabled: !!clienteId,
  })

  // Stock values for current selected Bodega
  const { data: stockItems = [] } = useQuery<any>({
    queryKey: ['stock', bodegaId],
    queryFn: () => getStock({ bodegaId: Number(bodegaId) }),
    enabled: !!bodegaId,
  })

  // Pedidos list for this client
  const { data: clientPedidos = [], isLoading: loadingPedidos } = useQuery<any>({
    queryKey: ['client-pedidos', clienteId],
    queryFn: () => getPedidos({ clienteId: Number(clienteId), estado: 'APROBADO' }),
    enabled: !!clienteId,
  })

  // List of all invoices to calculate consecutive locally
  const { data: listFacturas = [] } = useQuery<any>({
    queryKey: ['list-facturas'],
    queryFn: () => getFacturas(),
  })

  const selectedFormaPagoObj = useMemo(() => {
    return formasPagoList.find((f: any) => f.codigo === formaPago)
  }, [formasPagoList, formaPago])

  const exigeVencimiento = selectedFormaPagoObj ? selectedFormaPagoObj.generaCartera : (formaPago !== 'CONTADO')

  const mutIncrementConsecutive = useMutation({
    mutationFn: (id: number) => incrementarConsecutivo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentos-config'] })
    }
  })

  // Mutations
  const mutCreate = useMutation({
    mutationFn: createFactura,
    onSuccess: async () => {
      if (selectedDocId) {
        try {
          await mutIncrementConsecutive.mutateAsync(Number(selectedDocId))
        } catch (e) {
          console.error("Error updating consecutive on server:", e)
        }
      }
      qc.invalidateQueries({ queryKey: ['facturas'] })
      qc.invalidateQueries({ queryKey: ['pedidos'] })
      navigate('/ventas/facturas')
    },
  })

  // Stock lookup map
  const stockMap = useMemo(() => {
    const map = new Map<number, number>()
    stockItems.forEach((s: any) => {
      map.set(s.productoId, Number(s.cantidad || 0))
    })
    return map
  }, [stockItems])

  // Clients search filtering
  const clientesFiltrados = useMemo(() =>
    clienteQ
      ? (clientesAll as any[]).filter((c: any) =>
          c.nombre.toLowerCase().includes(clienteQ.toLowerCase()) ||
          c.numeroDocumento?.includes(clienteQ))
      : clientesAll as any[]
  , [clientesAll, clienteQ])

  // Products quick search filtering
  const quickSearchProds = useMemo(() => {
    if (!quickSearchQ.trim()) return []
    return (productosAll as any[]).filter((p: any) =>
      p.nombre.toLowerCase().includes(quickSearchQ.toLowerCase()) ||
      p.sku.toLowerCase().includes(quickSearchQ.toLowerCase())
    )
  }, [productosAll, quickSearchQ])

  // Calculate invoice numbers / Draft sequence
  const computedConsecutive = useMemo(() => {
    if (!tipoDocumento) return 'BORRADOR'
    const doc = docConfigs.find((d: any) => String(d.id) === String(selectedDocId)) || docConfigs.find((d: any) => d.sigla === tipoDocumento)
    const basePrefix = doc?.prefijo || tipoDocumento
    const startSeq = doc?.consecutivoSiguiente || 1
    
    // Count how many matching invoices exist in the system
    const matching = (listFacturas as any[]).filter(f => f.tipoDocumento === tipoDocumento)
    const nextSeq = Math.max(startSeq, matching.length + 1)
    return `${basePrefix}-${nextSeq}`
  }, [listFacturas, tipoDocumento, selectedDocId, docConfigs])

  // Totals calculations
  const totals = useMemo(() => calcTotals(lines), [lines])
  const esAgente = clienteFull?.agenteRetenedor ?? false

  const totalRetenciones = esAgente
    ? Number(retefuente || 0) + Number(reteiva || 0) + Number(reteica || 0)
    : 0

  const totalFacturaFinal = Math.max(0, totals.total - totalRetenciones)

  // Handle client selection defaults
  useEffect(() => {
    if (clienteFull) {
      setSucursalCliente('Principal')
      setDireccion(clienteFull.direccion || '')
      if (clienteFull.plazoCredito > 0) {
        setFormaPago('CREDITO')
        const limitDate = new Date()
        limitDate.setDate(limitDate.getDate() + Number(clienteFull.plazoCredito))
        setFechaVencimiento(limitDate.toISOString().slice(0, 10))
      } else {
        setFormaPago('CONTADO')
        setFechaVencimiento('')
      }
    }
  }, [clienteFull])

  const handleSucursalChange = (val: string) => {
    setSucursalCliente(val)
    if (val === 'Principal') {
      setDireccion(clienteFull?.direccion || '')
    } else {
      const found = clienteFull?.sucursales?.find((s: any) => s.descripcion === val)
      if (found) {
        setDireccion(found.direccion || '')
      }
    }
  }

  // Trigger invoice transition
  const activateInvoice = (tipo: 'FV' | 'FVE', cId: string, cName: string) => {
    setTipoDocumento(tipo)
    if (!selectedDocId) {
      const doc = docConfigs.find((d: any) => d.sigla === tipo && d.estado === 'ACTIVO')
      if (doc) {
        setSelectedDocId(String(doc.id))
      } else {
        setSelectedDocId(tipo)
      }
    }
    setClienteId(cId)
    setClienteQ(cName)
    setFecha(new Date().toISOString().slice(0, 10))
    setLines([LINE_DEFAULT()])
  }

  // Pre-load from query parameter (pedidoId)
  useEffect(() => {
    if (queryPedidoId && bodegas.length > 0 && clientesAll.length > 0 && docConfigs.length > 0) {
      getPedido(Number(queryPedidoId)).then((p: any) => {
        setTipoDocumento('FV')
        const doc = docConfigs.find((d: any) => d.sigla === 'FV' && d.estado === 'ACTIVO')
        if (doc) {
          setSelectedDocId(doc.id)
        }
        setClienteId(String(p.clienteId))
        setClienteQ(p.cliente?.nombre ?? '')
        setBodegaId(String(p.bodegaId))
        setFecha(new Date().toISOString().slice(0, 10))
        setPedidoId(p.id)
        setPedidoNumero(p.numero)
        if (p.items?.length) {
          setLines(p.items.map((it: any) => ({
            _key: Math.random().toString(36).slice(2),
            productoId: String(it.productoId ?? ''),
            descripcion: it.descripcion ?? '',
            unidad: it.unidad ?? 'UND',
            cantidad: Number(it.cantidad),
            precioUnitario: Number(it.precioUnitario),
            descuentoPct: Number(it.descuentoPct ?? 0),
            tipoIva: it.tipoIva ?? 'IVA_19',
            loteNumero: '',
          })))
        }
      }).catch(err => {
        console.error("Error loading query param order:", err)
      })
    }
  }, [queryPedidoId, bodegas, clientesAll, docConfigs])

  // Quick import items from selected order
  const importPedidoItems = (ped: any) => {
    if (!ped.items?.length) return alert('Este pedido no contiene artículos')
    setPedidoId(ped.id)
    setPedidoNumero(ped.numero)
    setBodegaId(String(ped.bodegaId))

    const newLines = ped.items.map((it: any) => ({
      _key: Math.random().toString(36).slice(2),
      productoId: String(it.productoId ?? ''),
      descripcion: it.descripcion ?? '',
      unidad: it.unidad ?? 'UND',
      cantidad: Number(it.cantidad),
      precioUnitario: Number(it.precioUnitario),
      descuentoPct: Number(it.descuentoPct ?? 0),
      tipoIva: it.tipoIva ?? 'IVA_19',
      loteNumero: '',
    }))

    // Ask to replace or append
    if (lines.length === 1 && !lines[0].productoId) {
      setLines(newLines)
    } else {
      if (confirm('¿Desea reemplazar los artículos actuales por los de este pedido? (Cancelar los añadirá al final)')) {
        setLines(newLines)
      } else {
        setLines(prev => [...prev.filter(l => l.productoId), ...newLines])
      }
    }
    setActiveTab('detalles')
  }

  const updateLine = (key: string, field: string, value: any) => {
    setLines(prev => prev.map(l => l._key === key ? { ...l, [field]: value } : l))
  }

  const removeLine = (key: string) => {
    setLines(prev => prev.filter(l => l._key !== key))
  }

  const addLine = () => {
    setLines(prev => [...prev, LINE_DEFAULT()])
  }

  const selectProductoForLine = (key: string, prod: any) => {
    setLines(prev => prev.map(l => l._key === key ? {
      ...l,
      productoId: prod.id,
      descripcion: prod.nombre,
      unidad: prod.unidad ?? 'UND',
      precioUnitario: Number(prod.precioBase ?? 0),
      tipoIva: prod.tipoIva === 'GRAVADO_19' ? 'IVA_19'
              : prod.tipoIva === 'GRAVADO_5' ? 'IVA_5'
              : prod.tipoIva === 'EXENTO' ? 'IVA_0'
              : 'EXCLUIDO',
    } : l))
    setProductoQ(prev => ({ ...prev, [key]: '' }))
  }

  const handleQuickAddProduct = (prod: any) => {
    const newLine = {
      _key: Math.random().toString(36).slice(2),
      productoId: String(prod.id),
      descripcion: prod.nombre,
      unidad: prod.unidad ?? 'UND',
      cantidad: 1,
      precioUnitario: Number(prod.precioBase ?? 0),
      descuentoPct: 0,
      tipoIva: prod.tipoIva === 'GRAVADO_19' ? 'IVA_19'
              : prod.tipoIva === 'GRAVADO_5' ? 'IVA_5'
              : prod.tipoIva === 'EXENTO' ? 'IVA_0'
              : 'EXCLUIDO',
      loteNumero: '',
    }

    if (lines.length === 1 && !lines[0].productoId) {
      setLines([newLine])
    } else {
      setLines(prev => [...prev, newLine])
    }
    setQuickSearchQ('')
  }

  const handleVendedorChange = (e: any) => {
    const vId = e.target.value
    setVendedorId(vId ? Number(vId) : '')
    const selectedV = vendedores.find(v => String(v.id) === String(vId))
    setVendedorNombre(selectedV ? selectedV.nombre : '')
  }

  const handleResetDocument = () => {
    if (confirm('¿Desea cambiar de cliente? Esto reiniciará los ítems y los datos ingresados.')) {
      setTipoDocumento('')
      setSelectedDocId('')
      setClienteId('')
      setClienteQ('')
      setLines([])
      setPedidoId(null)
      setPedidoNumero(null)
      setNotas('')
      setRetefuente('')
      setReteiva('')
      setReteica('')
    }
  }

  const handleSubmit = () => {
    if (!clienteId) return alert('Seleccione un cliente')
    if (lines.length === 0 || lines.some(l => !l.productoId)) return alert('Debe agregar al menos un ítem con producto válido')

    const payload: any = {
      clienteId: Number(clienteId),
      bodegaId: Number(bodegaId),
      fecha,
      formaPago,
      medioPago,
      fechaVencimiento: exigeVencimiento ? (fechaVencimiento || undefined) : undefined,
      notas: notas || undefined,
      vendedorNombre: vendedorNombre || undefined,
      vendedorId: vendedorId ? Number(vendedorId) : undefined,
      canal,
      nivel,
      imprimeDcto,
      tipoDocumento: tipoDocumento || 'FV',
      numero: computedConsecutive,
      pedidoId: pedidoId || undefined,
      direccion: direccion || undefined,
      sucursalCliente: sucursalCliente || undefined,
      items: lines.map(l => ({
        productoId: Number(l.productoId),
        descripcion: l.descripcion,
        unidad: l.unidad,
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
        descuentoPct: Number(l.descuentoPct),
        tipoIva: l.tipoIva,
      })),
    }

    if (esAgente) {
      if (retefuente) payload.retefuente = Number(retefuente)
      if (reteiva)    payload.reteiva    = Number(reteiva)
      if (reteica)    payload.reteica    = Number(reteica)
    }

    mutCreate.mutate(payload)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Causación de Facturación</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Facturas de Venta Electrónicas (FVE) y Remisiones Internas (FV)</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full ${isInvoiceActive ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            {isInvoiceActive ? 'Modo Factura Real' : 'Borrador / Draft'}
          </span>
        </div>
      </div>

      {/* Main Grid: 3 Cols Form, 1 Col Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Form Container */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Card 1: Prefix & Client Lookup (Locked when active) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Paso 1: Parámetros del Documento</h2>
              {isInvoiceActive && (
                <button onClick={handleResetDocument} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">
                  Reiniciar / Cambiar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Prefix Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Prefijo / Tipo *</label>
                <select
                  value={selectedDocId}
                  disabled={isInvoiceActive}
                  onChange={e => {
                    const docId = e.target.value
                    setSelectedDocId(docId)
                    const doc = docConfigs.find((d: any) => String(d.id) === String(docId))
                    if (doc) {
                      setTipoDocumento(doc.sigla)
                    } else if (docId === 'FV' || docId === 'FVE') {
                      setTipoDocumento(docId)
                    } else {
                      setTipoDocumento('')
                    }
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                >
                  <option value="">Seleccione Prefijo...</option>
                  {docConfigs.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.prefijo} - {doc.nombre} {doc.esElectronico ? '(Electrónico)' : ''}
                    </option>
                  ))}
                  {docConfigs.length === 0 && (
                    <>
                      <option value="FV">FV (Remisión Interna / Venta)</option>
                      <option value="FVE">FVE (Factura de Venta Electrónica)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Client Autocomplete Selector */}
              <div className="md:col-span-2 relative">
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Cliente *</label>
                {isInvoiceActive && clienteFull ? (
                  <div className="p-2 border border-emerald-200 bg-emerald-50/50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-emerald-800">{clienteFull.nombre}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">NIT/CC: {clienteFull.numeroDocumento} • {clienteFull.correo || 'Sin correo'}</p>
                    </div>
                    {clienteFull.pagoPromedioDias !== undefined && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Paga prom: {clienteFull.pagoPromedioDias} días
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      value={clienteQ}
                      disabled={!tipoDocumento}
                      onChange={e => setClienteQ(e.target.value)}
                      placeholder={tipoDocumento ? "Escriba Nit, Identificación o Nombre del cliente..." : "Primero seleccione el prefijo..."}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-slate-50"
                    />
                    {clienteQ && clientesFiltrados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto mt-1">
                        {clientesFiltrados.slice(0, 10).map((c: any) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => activateInvoice(tipoDocumento as any, String(c.id), c.nombre)}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs border-b border-slate-100 last:border-0"
                          >
                            <p className="font-semibold text-slate-800">{c.nombre}</p>
                            <p className="text-[10px] text-slate-400">NIT: {c.numeroDocumento}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Credit Avg days Header Banner */}
            {isInvoiceActive && clienteFull && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 rounded-lg text-xs text-slate-700">
                <AlertCircle size={16} className="text-indigo-600 shrink-0" />
                <div className="flex-1">
                  <span>Indicador de Cartera: <strong>{clienteFull.nombre}</strong> presenta un promedio histórico de pago de <strong>{clienteFull.pagoPromedioDias ?? 0} días</strong>. </span>
                  {clienteFull.plazoCredito > 0 && <span>Plazo límite parametrizado: <strong>{clienteFull.plazoCredito} días</strong>.</span>}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Commercial Metadata (Unlocked after step 1) */}
          <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 transition-opacity duration-300 ${!isInvoiceActive ? 'opacity-40 pointer-events-none' : ''}`}>
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Información de Venta</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Vendedor</label>
                <select
                  value={vendedorId}
                  onChange={handleVendedorChange}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-indigo-100"
                >
                  <option value="">Seleccione vendedor...</option>
                  {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Bodega Egreso *</label>
                <select
                  value={bodegaId}
                  onChange={e => setBodegaId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-indigo-100"
                >
                  {bodegasFiltradas.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Canal de Venta</label>
                <select
                  value={canal}
                  onChange={e => setCanal(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-indigo-100"
                >
                  {CANAL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Nivel de Precios</label>
                <select
                  value={nivel}
                  onChange={e => setNivel(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-indigo-100"
                >
                  {NIVEL_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Sucursal Cliente</label>
                <select
                  value={sucursalCliente}
                  onChange={e => handleSucursalChange(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-indigo-100"
                >
                  <option value="Principal">Principal ({clienteFull?.direccion || 'Sin dirección'})</option>
                  {(clienteFull?.sucursales || []).map((s: any) => (
                    <option key={s.id} value={s.descripcion}>{s.descripcion}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Dirección de Despacho</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  placeholder="Dirección de despacho..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Observaciones / Notas Internas</label>
                <input
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Detalles sobre el despacho, transportadora, etc..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-7">
                <input
                  type="checkbox"
                  id="imprimeDcto"
                  checked={imprimeDcto}
                  onChange={e => setImprimeDcto(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                />
                <label htmlFor="imprimeDcto" className="text-xs text-slate-600 font-medium select-none">Imprime Dto.</label>
              </div>
            </div>
            
            {pedidoNumero && (
              <div className="p-2 border border-pink-200 bg-pink-50/20 text-pink-700 text-xs font-semibold rounded-lg flex items-center justify-between">
                <span>Enlazado con Pedido: <strong>{pedidoNumero}</strong></span>
                <button
                  onClick={() => { setPedidoId(null); setPedidoNumero(null) }}
                  className="text-red-500 hover:text-red-700 text-xs font-bold"
                >
                  Quitar Enlace
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sidebar Panel (Totals & Action) */}
        <div className="space-y-6">
          
          {/* Totals Sidebar Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Consecutivo Causación</h3>
              <p className="font-mono text-xs font-bold text-slate-655 mt-2 p-2 bg-slate-50 rounded text-center border border-slate-200">
                {computedConsecutive}
              </p>
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Desglose de Totales</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Cant. Artículos</span>
                  <span>{totals.totalCant}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal Bruto</span>
                  <span>{fmt(totals.subtotal)}</span>
                </div>
                {totals.descuento > 0 && (
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Descuentos (-)</span>
                    <span className="text-rose-500">-{fmt(totals.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal Base</span>
                  <span>{fmt(totals.subtotal - totals.descuento)}</span>
                </div>

                {/* Taxes list */}
                {totals.iva19 > 0 && (
                  <div className="flex justify-between text-slate-650 font-semibold">
                    <span>IVA 19%</span>
                    <span>{fmt(totals.iva19)}</span>
                  </div>
                )}
                {totals.iva5 > 0 && (
                  <div className="flex justify-between text-slate-650 font-semibold">
                    <span>IVA 5%</span>
                    <span>{fmt(totals.iva5)}</span>
                  </div>
                )}

                {/* Retenciones list */}
                {esAgente && totalRetenciones > 0 && (
                  <div className="border-t border-slate-100 pt-2 space-y-1.5">
                    <span className="block text-[10px] font-bold text-amber-700">RETENCIONES (-)</span>
                    {retefuente && (
                      <div className="flex justify-between text-amber-800 text-[11px]">
                        <span>Retefuente</span>
                        <span>-{fmt(Number(retefuente))}</span>
                      </div>
                    )}
                    {reteiva && (
                      <div className="flex justify-between text-amber-800 text-[11px]">
                        <span>ReteIVA</span>
                        <span>-{fmt(Number(reteiva))}</span>
                      </div>
                    )}
                    {reteica && (
                      <div className="flex justify-between text-amber-800 text-[11px]">
                        <span>ReteICA</span>
                        <span>-{fmt(Number(reteica))}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Red/Pink Balance display panel */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1">
              <span className="block text-[9px] font-bold text-rose-500 uppercase tracking-wider">Saldo Factura / Balance</span>
              <p className="text-xl font-bold text-rose-700 tracking-tight">
                {fmt(totalFacturaFinal)}
              </p>
              <div className="text-[10px] text-rose-600/80 font-medium pt-1 border-t border-rose-100">
                {exigeVencimiento ? (
                  <span>Registrará cartera a cobrar (Plazo {fechaVencimiento ? new Date(fechaVencimiento).toLocaleDateString('es-CO') : 'definido'})</span>
                ) : (
                  <span>Registrará ingreso inmediato de contado via {medioPago.replace('_', ' ')}</span>
                )}
              </div>
            </div>

            {/* Error notifications */}
            {mutCreate.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 flex gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{getApiError(mutCreate.error, 'Error al guardar el comprobante.')}</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isInvoiceActive || mutCreate.isPending}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                {mutCreate.isPending ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Creando Factura...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Crear Factura</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/ventas/facturas')}
                className="w-full py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors text-center block"
              >
                Cancelar
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Card 3: Tabs Area (Detalles, Pago, Pedidos) - Full Width Section */}
      <div className={`transition-opacity duration-300 ${!isInvoiceActive ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Tabs Header */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setActiveTab('detalles')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-r border-slate-200 transition-colors ${activeTab === 'detalles' ? 'bg-white text-indigo-600 border-b-2 border-b-indigo-600' : 'text-slate-500 hover:bg-slate-100/50'}`}
            >
              <ShoppingBag size={14} /> Detalles de Artículos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('formas_pago')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-r border-slate-200 transition-colors ${activeTab === 'formas_pago' ? 'bg-white text-indigo-600 border-b-2 border-b-indigo-600' : 'text-slate-500 hover:bg-slate-100/50'}`}
            >
              <CreditCard size={14} /> Formas de Pago
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pedidos')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'pedidos' ? 'bg-white text-indigo-600 border-b-2 border-b-indigo-600' : 'text-slate-500 hover:bg-slate-100/50'}`}
            >
              <Layers size={14} /> Cargar Pedido/Prefactura
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-5">
            
            {/* TAB 1: DETALLES */}
            {activeTab === 'detalles' && (
              <div className="space-y-4">
                {/* Quick search and add bar */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Búsqueda rápida y adición de productos</label>
                  <input
                    value={quickSearchQ}
                    onChange={e => setQuickSearchQ(e.target.value)}
                    placeholder="Escriba SKU, Código de barras o Nombre para agregar..."
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold"
                  />
                  {quickSearchQ && quickSearchProds.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-2xl z-30 max-h-48 overflow-y-auto mt-1">
                      {quickSearchProds.slice(0, 10).map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleQuickAddProduct(p)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs border-b border-slate-150 last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{p.nombre}</p>
                            <p className="text-[10px] text-slate-400">SKU: {p.sku} | CPP: {fmt(Number(p.costoPromedio))}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                            Base: {fmt(Number(p.precioBase))}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-2.5 text-left font-semibold">SKU / Producto</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Descripción</th>
                        <th className="px-3 py-2.5 text-left font-semibold w-16">Lote</th>
                        <th className="px-3 py-2.5 text-right font-semibold w-14">Disp</th>
                        <th className="px-3 py-2.5 text-right font-semibold w-16">Cant</th>
                        <th className="px-3 py-2.5 text-right font-semibold w-24">Precio Unit</th>
                        <th className="px-3 py-2.5 text-right font-semibold w-14">Dcto %</th>
                        <th className="px-3 py-2.5 text-left font-semibold w-20">IVA</th>
                        <th className="px-3 py-2.5 text-right font-semibold w-24">Total</th>
                        <th className="px-2 py-2.5 w-6" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {lines.map((line) => {
                        const calcResult = calcLine(line)
                        const qKey = line._key
                        const prodQ = productoQ[qKey] ?? ''
                        const prodsFiltrados = prodQ
                          ? (productosAll as any[]).filter((p: any) =>
                              p.nombre.toLowerCase().includes(prodQ.toLowerCase()) ||
                              p.sku.toLowerCase().includes(prodQ.toLowerCase()))
                          : []

                        const availableStock = line.productoId ? (stockMap.get(Number(line.productoId)) ?? 0) : 0

                        return (
                          <tr key={line._key} className="align-top hover:bg-slate-50/50">
                            {/* Product selector */}
                            <td className="px-2 py-2 relative">
                              {line.productoId ? (
                                <div className="flex items-center gap-1 p-1 border border-slate-200 bg-slate-100 rounded text-[10px] font-bold">
                                  <span className="truncate max-w-[100px]">
                                    {(productosAll as any[]).find((p: any) => String(p.id) === String(line.productoId))?.nombre ?? `ID ${line.productoId}`}
                                  </span>
                                  <button onClick={() => updateLine(line._key, 'productoId', '')} className="text-slate-400 hover:text-red-500 font-bold ml-auto shrink-0">×</button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <input
                                    value={prodQ}
                                    onChange={e => setProductoQ(prev => ({ ...prev, [qKey]: e.target.value }))}
                                    placeholder="Buscar..."
                                    className="w-full p-1 border border-slate-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-indigo-200"
                                  />
                                  {prodQ && prodsFiltrados.length > 0 && (
                                    <div className="absolute top-full left-0 bg-white border border-slate-200 rounded-lg shadow-xl z-20 min-w-[200px] max-h-36 overflow-y-auto">
                                      {prodsFiltrados.slice(0, 8).map((p: any) => (
                                        <button key={p.id} type="button"
                                          onClick={() => selectProductoForLine(line._key, p)}
                                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-[11px] border-b border-slate-100">
                                          <p className="font-semibold">{p.nombre}</p>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Desc */}
                            <td className="px-2 py-2">
                              <input
                                value={line.descripcion}
                                onChange={e => updateLine(line._key, 'descripcion', e.target.value)}
                                className="w-full p-1 border border-slate-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-indigo-100"
                              />
                            </td>

                            {/* Lote */}
                            <td className="px-2 py-2">
                              <input
                                value={line.loteNumero}
                                onChange={e => updateLine(line._key, 'loteNumero', e.target.value)}
                                placeholder="N/A"
                                className="w-full p-1 border border-slate-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-indigo-100 w-16"
                              />
                            </td>

                            {/* Disp */}
                            <td className="px-2 py-3 text-right text-[11px] font-semibold text-slate-500 pr-3">
                              {availableStock}
                            </td>

                            {/* Cant */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min={0.0001}
                                step="any"
                                value={line.cantidad}
                                onChange={e => updateLine(line._key, 'cantidad', e.target.value)}
                                className="w-full p-1 border border-slate-200 rounded text-[11px] text-right outline-none focus:ring-1 focus:ring-indigo-100"
                              />
                            </td>

                            {/* Precio */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={line.precioUnitario}
                                onChange={e => updateLine(line._key, 'precioUnitario', e.target.value)}
                                className="w-full p-1 border border-slate-200 rounded text-[11px] text-right outline-none focus:ring-1 focus:ring-indigo-100"
                              />
                            </td>

                            {/* Descuento Pct */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={line.descuentoPct}
                                onChange={e => updateLine(line._key, 'descuentoPct', e.target.value)}
                                className="w-full p-1 border border-slate-200 rounded text-[11px] text-right outline-none focus:ring-1 focus:ring-indigo-100"
                              />
                            </td>

                            {/* IVA */}
                            <td className="px-2 py-2">
                              <select
                                value={line.tipoIva}
                                onChange={e => updateLine(line._key, 'tipoIva', e.target.value)}
                                className="w-full p-1 border border-slate-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-indigo-100 bg-white"
                              >
                                {TIPO_IVA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </td>

                            {/* Total */}
                            <td className="px-2 py-3 text-right font-bold text-slate-700 text-[11px] whitespace-nowrap">
                              {fmt(calcResult.total)}
                            </td>

                            {/* Delete */}
                            <td className="px-1 py-3 text-center">
                              {lines.length > 1 && (
                                <button onClick={() => removeLine(line._key)} className="text-slate-300 hover:text-red-500 font-medium">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-655 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Agregar Item Vacío
                  </button>
                  <span className="text-xs text-slate-500 pt-2">Total ítems cargados: {lines.filter(l => l.productoId).length}</span>
                </div>
              </div>
            )}

            {/* TAB 2: FORMAS DE PAGO & RETENCIONES */}
            {activeTab === 'formas_pago' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Forma de Pago *</label>
                    <select
                      value={formaPago}
                      onChange={e => setFormaPago(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-indigo-100"
                    >
                      {formasPagoList
                        .filter((f: any) => f.activo)
                        .map((f: any) => (
                          <option key={f.id} value={f.codigo}>
                            {f.nombre}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Medio de Pago</label>
                    <select
                      value={medioPago}
                      onChange={e => setMedioPago(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-indigo-100"
                    >
                      {mediosPagoList
                        .filter((m: any) => m.activo)
                        .map((m: any) => (
                          <option key={m.id} value={m.codigo}>
                            {m.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                  {exigeVencimiento && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Fecha Vencimiento *</label>
                      <input
                        type="date"
                        value={fechaVencimiento}
                        onChange={e => setFechaVencimiento(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-100"
                      />
                    </div>
                  )}
                </div>

                {/* Retenciones */}
                {esAgente ? (
                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-5 space-y-3">
                    <div className="flex gap-2 items-center text-amber-800 font-bold text-xs uppercase tracking-wider">
                      <AlertCircle size={14} />
                      <span>Retenciones Aplicables (Cliente es Agente Retenedor)</span>
                    </div>
                    <p className="text-amber-700/80 text-[10px]">
                      El cliente seleccionado tiene habilitado el flag de agente retenedor. Ingrese los valores de retención que apliquen:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-700 mb-1 uppercase tracking-wider">Retención en Fuente ($)</label>
                        <input
                          type="number"
                          min={0}
                          value={retefuente}
                          onChange={e => setRetefuente(e.target.value)}
                          placeholder="0"
                          className="w-full p-2 border border-amber-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-700 mb-1 uppercase tracking-wider">ReteIVA ($)</label>
                        <input
                          type="number"
                          min={0}
                          value={reteiva}
                          onChange={e => setReteiva(e.target.value)}
                          placeholder="0"
                          className="w-full p-2 border border-amber-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-700 mb-1 uppercase tracking-wider">ReteICA ($)</label>
                        <input
                          type="number"
                          min={0}
                          value={reteica}
                          onChange={e => setReteica(e.target.value)}
                          placeholder="0"
                          className="w-full p-2 border border-amber-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-xs">
                    Este cliente <strong>no es agente retenedor</strong>, por lo tanto no se causarán retenciones de forma automática.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PEDIDOS PENDIENTES */}
            {activeTab === 'pedidos' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Pedidos Aprobados del Cliente</h3>
                <p className="text-slate-500 text-xs">Haga clic en un pedido pendiente para importar todos sus artículos directamente a esta factura.</p>
                
                {loadingPedidos && <div className="text-center py-6 text-slate-400">Cargando pedidos...</div>}
                
                {!loadingPedidos && clientPedidos.length === 0 && (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    No hay pedidos pendientes o pre-facturas en estado APROBADO para este cliente.
                  </div>
                )}

                {!loadingPedidos && clientPedidos.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {clientPedidos.map((ped: any) => (
                      <div
                        key={ped.id}
                        className="p-4 border border-slate-200 rounded-xl hover:border-indigo-400 bg-white hover:bg-indigo-50/10 cursor-pointer transition-all flex flex-col justify-between"
                        onClick={() => importPedidoItems(ped)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-700">{ped.numero}</span>
                            <p className="text-[11px] text-slate-500">Fecha: {new Date(ped.fecha).toLocaleDateString('es-CO')}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                            APROBADO
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-400">{ped.items?.length ?? 0} ítems</span>
                          <span className="text-xs font-bold text-indigo-600">{fmt(Number(ped.total))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
