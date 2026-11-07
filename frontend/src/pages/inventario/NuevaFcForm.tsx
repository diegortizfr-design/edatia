import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getProveedores, getOrdenesCompra, buscarProductos, createFacturaCompra, FacturaCompra,
  getProductos, createProducto, createProveedor 
} from '../../services/inventario.service'
import { getDocumentosConfig, getFormasPago, getMediosPago } from '../../services/configuracion.service'
import { getCajasBancos, getImpuestos } from '../../services/erp.service'
import { 
  ArrowLeft, Save, Plus, Trash2, Search, FileText, Upload, Link2, 
  Calendar, CreditCard, DollarSign, Clock, AlertCircle, CheckCircle2,
  Loader2, Check, FileCheck, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { parseDianXml, DianParsedInvoice } from '../../lib/dianXmlParser'
import { ModalCrearProductoRapido } from '../../components/ModalCrearProductoRapido'
import { CurrencyInput } from '../../components/CurrencyInput'
import { getApiError } from '../../services/api'

interface LineaItem {
  productoId: number
  productoNombre: string
  productoSku: string
  cantidad: string
  costoUnitario: string
  descuentoPct: string
  ivaPct: number
  tipoIva?: string
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

  const documentosFiltradosCE = documentos.filter((doc: any) => 
    doc.sigla === 'CE' && 
    doc.estado === 'ACTIVO'
  )

  const documentosFiltradosCXP = documentos.filter((doc: any) => 
    doc.sigla === 'CXP' && 
    doc.estado === 'ACTIVO'
  )

  // Cajas y Bancos para salida de dinero en compras de contado
  const { data: cajasBancos = [] } = useQuery({
    queryKey: ['cajas-bancos'],
    queryFn: getCajasBancos,
  })

  const cajasBancosActivos = useMemo(() => {
    return (cajasBancos as any[]).filter((cb: any) => cb.activo !== false)
  }, [cajasBancos])

  // Impuestos del sistema (Configuración > General > Contable / Impuestos)
  const { data: impuestos = [] } = useQuery({
    queryKey: ['impuestos'],
    queryFn: getImpuestos,
  })

  const impuestosIva = useMemo(() => {
    return (impuestos as any[]).filter((imp: any) =>
      (imp.tipo === 'IVA' || imp.tipo === 'CONSUMO') &&
      imp.activo !== false &&
      imp.estado !== 'INACTIVO' &&
      imp.retencionCompra !== true
    )
  }, [impuestos])

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
        const matching = (impuestos as any[]).find((t: any) => 
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

  // Estados de documentos específicos
  const [documentoCeId, setDocumentoCeId] = useState('')
  const [cajaBancoId, setCajaBancoId] = useState('')
  const [documentoCxpId, setDocumentoCxpId] = useState('')

  // Preselección automática
  useEffect(() => {
    if (documentosFiltradosFC.length > 0 && !documentoConfigId) {
      setDocumentoConfigId(String(documentosFiltradosFC[0].id))
    }
  }, [documentosFiltradosFC, documentoConfigId])

  useEffect(() => {
    if (documentosFiltradosCE.length > 0 && !documentoCeId) {
      setDocumentoCeId(String(documentosFiltradosCE[0].id))
    }
  }, [documentosFiltradosCE, documentoCeId])

  useEffect(() => {
    if (documentosFiltradosCXP.length > 0 && !documentoCxpId) {
      setDocumentoCxpId(String(documentosFiltradosCXP[0].id))
    }
  }, [documentosFiltradosCXP, documentoCxpId])

  useEffect(() => {
    if (cajasBancosActivos.length > 0 && !cajaBancoId) {
      const preferida = cajasBancosActivos.find((cb: any) => cb.aplicaPagos) || cajasBancosActivos[0]
      if (preferida) setCajaBancoId(String(preferida.id))
    }
  }, [cajasBancosActivos, cajaBancoId])

  // Header states
  const [proveedorId, setProveedorId] = useState('')
  const [prefijo, setPrefijo] = useState('')
  const [consecutivo, setConsecutivo] = useState('')
  const [fechaEmision, setFechaEmision] = useState(() => new Date().toISOString().split('T')[0])
  const [ordenCompraId, setOrdenCompraId] = useState('')
  const [recepcionId, setRecepcionId] = useState('')
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [xmlNombre, setXmlNombre] = useState<string | null>(null)
  const [procesandoXml, setProcesandoXml] = useState(false)
  const [xmlParsedData, setXmlParsedData] = useState<DianParsedInvoice | null>(null)
  const [notas, setNotas] = useState('')

  // ── Formas y Medios de Pago Dinámicos (Configuración General) ──
  const [formaPago, setFormaPago] = useState('CONTADO')
  const [medioPago, setMedioPago] = useState('')
  const [diasCredito, setDiasCredito] = useState(30)
  const [fechaVencimiento, setFechaVencimiento] = useState(() => new Date().toISOString().split('T')[0])

  const { data: formasPagoList = [] } = useQuery({
    queryKey: ['config-formas-pago'],
    queryFn: getFormasPago,
  })

  const { data: mediosPagoList = [] } = useQuery({
    queryKey: ['config-medios-pago'],
    queryFn: getMediosPago,
  })

  const formasPagoActivas = useMemo(() => {
    const list = (formasPagoList as any[]).filter((f: any) => f.activo !== false)
    if (list.length > 0) return list
    return [
      { id: 1, codigo: 'CONTADO', nombre: 'Contado', generaCartera: false },
      { id: 2, codigo: 'CREDITO', nombre: 'Crédito', generaCartera: true },
    ]
  }, [formasPagoList])

  const mediosPagoActivos = useMemo(() => {
    const list = (mediosPagoList as any[]).filter((m: any) => m.activo !== false)
    if (list.length > 0) return list
    return [
      { id: 1, codigo: 'EFECTIVO', nombre: 'Efectivo' },
      { id: 2, codigo: 'TRANSFERENCIA', nombre: 'Transferencia Bancaria' },
    ]
  }, [mediosPagoList])

  // Inicializar forma de pago
  useEffect(() => {
    if (formasPagoActivas.length > 0 && !formasPagoActivas.some((f: any) => f.codigo === formaPago)) {
      setFormaPago(formasPagoActivas[0].codigo)
    }
  }, [formasPagoActivas, formaPago])

  // Inicializar medio de pago
  useEffect(() => {
    if (mediosPagoActivos.length > 0 && (!medioPago || !mediosPagoActivos.some((m: any) => m.codigo === medioPago))) {
      setMedioPago(mediosPagoActivos[0].codigo)
    }
  }, [mediosPagoActivos, medioPago])

  const formaPagoObj = useMemo(() => {
    return formasPagoActivas.find((f: any) => f.codigo === formaPago)
  }, [formasPagoActivas, formaPago])

  const esCredito = formaPagoObj ? (formaPagoObj.generaCartera || formaPago === 'CREDITO') : formaPago === 'CREDITO'

  // Sincronizar fecha de vencimiento según fecha de emisión y días de crédito
  useEffect(() => {
    const baseDateStr = fechaEmision || new Date().toISOString().split('T')[0]
    if (esCredito) {
      const d = new Date(baseDateStr)
      d.setDate(d.getDate() + Number(diasCredito || 0))
      setFechaVencimiento(d.toISOString().split('T')[0])
    } else {
      setFechaVencimiento(baseDateStr)
    }
  }, [fechaEmision, diasCredito, esCredito])

  // Si el usuario cambia manualmente la fecha de vencimiento, recalcular días
  const handleFechaVencChange = (vencStr: string) => {
    setFechaVencimiento(vencStr)
    if (vencStr && fechaEmision) {
      const em = new Date(fechaEmision).getTime()
      const ve = new Date(vencStr).getTime()
      const diffDays = Math.round((ve - em) / (1000 * 60 * 60 * 24))
      if (!isNaN(diffDays)) {
        setDiasCredito(Math.max(0, diffDays))
      }
    }
  }

  // Items list
  const [items, setItems] = useState<LineaItem[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [showModalCrear, setShowModalCrear] = useState(false)

  // Queries
  const { data: proveedores = [] } = useQuery({ queryKey: ['proveedores'], queryFn: () => getProveedores() })
  const { data: ocs = [] } = useQuery({ queryKey: ['ordenes-compra'], queryFn: () => getOrdenesCompra() })
  
  // Si cambia el proveedor y tiene plazo parametrizado, precargarlo
  useEffect(() => {
    if (proveedorId && proveedores.length > 0) {
      const prov = (proveedores as any[]).find((p: any) => String(p.id) === String(proveedorId))
      if (prov) {
        const dias = Number(prov.plazoCredito) || Number(prov.plazoEntregaDias) || 0
        if (dias > 0) {
          setDiasCredito(dias)
          const formaCredito = formasPagoActivas.find((f: any) => f.generaCartera || f.codigo === 'CREDITO')
          if (formaCredito) {
            setFormaPago(formaCredito.codigo)
          }
        }
      }
    }
  }, [proveedorId, proveedores, formasPagoActivas])

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
      
      const mappedItems = rpObj.items.map((ri: any) => {
        const prod = ri.ordenCompraItem?.producto || {}
        let ivaTarifa = 19
        if (ri.ordenCompraItem?.ivaPct !== undefined) {
          ivaTarifa = Number(ri.ordenCompraItem.ivaPct)
        } else if (Number(ri.ordenCompraItem?.ivaValor) === 0) {
          ivaTarifa = 0
        } else if (Number(ri.ordenCompraItem?.subtotal) > 0 && Number(ri.ordenCompraItem?.ivaValor) > 0) {
          ivaTarifa = Math.round((Number(ri.ordenCompraItem.ivaValor) / Number(ri.ordenCompraItem.subtotal)) * 100)
        } else {
          ivaTarifa = resolveProductoIva(prod)
        }

        return {
          productoId: ri.ordenCompraItem?.productoId || 0,
          productoNombre: prod.nombre || 'Producto recibido',
          productoSku: prod.sku || '',
          cantidad: String(Math.round(Number(ri.cantidadRecibida)) || 1),
          costoUnitario: String(Math.round(Number(ri.costoUnitario)) || 0),
          descuentoPct: '0',
          ivaPct: ivaTarifa,
          tipoIva: ivaTarifa === 0 ? 'EXCLUIDO' : `IVA_${ivaTarifa}`,
        }
      })
      setItems(mappedItems)
    } else {
      setOrdenCompraId('')
    }
  }

  // Auto-fill from selected OC
  const handleSelectOC = (ocIdStr: string) => {
    setOrdenCompraId(ocIdStr)
    setRecepcionId('')
    const ocObj = ocs.find((o: any) => String(o.id) === ocIdStr)
    if (ocObj) {
      setProveedorId(String(ocObj.proveedorId))
      const mappedItems = ocObj.items.map((item: any) => {
        const prod = item.producto || {}
        let ivaTarifa = 19
        if (item.ivaPct !== undefined) {
          ivaTarifa = Number(item.ivaPct)
        } else if (Number(item.ivaValor) === 0) {
          ivaTarifa = 0
        } else if (Number(item.subtotal) > 0 && Number(item.ivaValor) > 0) {
          ivaTarifa = Math.round((Number(item.ivaValor) / Number(item.subtotal)) * 100)
        } else {
          ivaTarifa = resolveProductoIva(prod)
        }

        return {
          productoId: item.productoId,
          productoNombre: prod.nombre || 'Producto',
          productoSku: prod.sku || '',
          cantidad: String(Math.round(parseFloat(item.cantidad) - parseFloat(item.cantidadRecibida || 0)) || 1),
          costoUnitario: String(Math.round(Number(item.costoUnitario)) || 0),
          descuentoPct: String(item.descuentoPct || 0),
          ivaPct: ivaTarifa,
          tipoIva: ivaTarifa === 0 ? 'EXCLUIDO' : `IVA_${ivaTarifa}`,
        }
      })
      setItems(mappedItems.filter((i: any) => parseFloat(i.cantidad) > 0))
    } else {
      setProveedorId('')
      setItems([])
    }
  }

  // Limpiar XML cargado
  const handleClearXml = () => {
    setXmlFile(null)
    setXmlNombre(null)
    setXmlParsedData(null)
  }

  // XML File change (Procesamiento completo de Factura Electrónica UBL 2.1)
  const handleXmlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    setXmlFile(file)
    setXmlNombre(file.name)
    setProcesandoXml(true)
    setError(null)

    try {
      const xmlText = await file.text()
      const parsed = parseDianXml(xmlText)

      if (!parsed.consecutivo && !parsed.numeroCompleto) {
        throw new Error('No se pudo identificar el número de factura en el XML. Asegúrate de adjuntar una Factura Electrónica de Venta válida de la DIAN.')
      }

      setXmlParsedData(parsed)

      // 1. Datos del Documento (Prefijo y Consecutivo)
      setPrefijo(parsed.prefijo || '')
      setConsecutivo(parsed.consecutivo || parsed.numeroCompleto)

      if (parsed.fechaEmision) {
        setFechaEmision(parsed.fechaEmision)
      }
      if (parsed.fechaVencimiento) {
        setFechaVencimiento(parsed.fechaVencimiento)
      }
      if (parsed.formaPago) {
        setFormaPago(parsed.formaPago)
      }
      if (parsed.notas) {
        setNotas(prev => prev ? `${prev} | ${parsed.notas}` : (parsed.notas || ''))
      }

      // 2. Resolver o Crear Proveedor automáticamente
      let provIdFinal = ''
      if (parsed.proveedor && (parsed.proveedor.nit || parsed.proveedor.nombre)) {
        const cleanNit = parsed.proveedor.nit?.replace(/[^0-9]/g, '') || ''
        const provNorm = parsed.proveedor.nombre?.toLowerCase().trim() || ''

        const provExistente = (proveedores as any[]).find((p: any) => {
          const pNit = p.numeroDocumento?.replace(/[^0-9]/g, '') || ''
          const pNom = p.nombre?.toLowerCase().trim() || ''
          return (cleanNit && pNit === cleanNit) || (provNorm && pNom === provNorm)
        })

        if (provExistente) {
          provIdFinal = String(provExistente.id)
          setProveedorId(provIdFinal)
          toast.success(`Proveedor identificado: ${provExistente.nombre}`)
        } else if (parsed.proveedor.nombre) {
          try {
            const nuevoProv = await createProveedor({
              nombre: parsed.proveedor.nombre,
              numeroDocumento: parsed.proveedor.nit || `NIT-${Date.now().toString().slice(-6)}`,
              tipoDocumento: 'NIT',
              email: parsed.proveedor.email || undefined,
              telefono: parsed.proveedor.telefono || undefined,
              direccion: parsed.proveedor.direccion || undefined,
              ciudad: parsed.proveedor.ciudad || undefined,
              pais: 'Colombia',
              activo: true,
            })
            qc.invalidateQueries({ queryKey: ['proveedores'] })
            provIdFinal = String(nuevoProv.id)
            setProveedorId(provIdFinal)
            toast.success(`Proveedor registrado automáticamente: ${nuevoProv.nombre}`)
          } catch (errProv) {
            console.warn('[handleXmlChange] No se pudo registrar proveedor automático:', errProv)
            toast.error(`Proveedor ${parsed.proveedor.nombre} no encontrado en el sistema. Puedes seleccionarlo o crearlo manualmente.`)
          }
        }
      }

      // 3. Resolver o Crear Productos del catálogo y agregarlos
      if (parsed.items && parsed.items.length > 0) {
        let catalogo: any[] = []
        try {
          catalogo = await getProductos({ activo: true })
        } catch (e) {
          catalogo = []
        }

        const itemsMapeados: LineaItem[] = []
        let productosCreadosCount = 0

        for (const itemXml of parsed.items) {
          const skuBusq = itemXml.sku?.trim().toUpperCase()
          const descBusq = itemXml.descripcion?.trim().toLowerCase()

          // Buscar coincidencia en catálogo por SKU, Código de barras o Nombre exacto
          let prodEncontrado = catalogo.find((p: any) => {
            const pSku = p.sku?.trim().toUpperCase()
            const pBar = p.codigoBarras?.trim().toUpperCase()
            const pNom = p.nombre?.trim().toLowerCase()
            return (skuBusq && (pSku === skuBusq || pBar === skuBusq)) || (descBusq && pNom === descBusq)
          })

          // Si el producto no existe en el catálogo, crearlo automáticamente para no truncar la importación
          if (!prodEncontrado) {
            try {
              const skuGenerado = itemXml.sku?.trim().toUpperCase() || `PROD-${Date.now().toString().slice(-6)}`
              const nuevoProducto = await createProducto({
                sku: skuGenerado,
                nombre: itemXml.descripcion.trim(),
                costoPromedio: itemXml.precioUnitario,
                precioBase: Math.round(itemXml.precioUnitario * 1.3),
                tipoIva: itemXml.ivaPct === 0 ? 'EXCLUIDO' : (itemXml.ivaPct === 5 ? 'GRAVADO_5' : 'GRAVADO_19'),
                manejaBodega: true,
                activo: true,
              })
              prodEncontrado = nuevoProducto
              productosCreadosCount++
              catalogo.push(nuevoProducto)
            } catch (errProd) {
              console.warn('[handleXmlChange] Error autocreando producto:', errProd)
            }
          }

          if (prodEncontrado) {
            itemsMapeados.push({
              productoId: prodEncontrado.id,
              productoNombre: prodEncontrado.nombre,
              productoSku: prodEncontrado.sku,
              cantidad: String(itemXml.cantidad || 1),
              costoUnitario: String(Math.round(itemXml.precioUnitario || 0)),
              descuentoPct: String(itemXml.descuentoPct || 0),
              ivaPct: itemXml.ivaPct !== undefined ? itemXml.ivaPct : resolveProductoIva(prodEncontrado),
              tipoIva: itemXml.ivaPct === 0 ? 'EXCLUIDO' : `IVA_${itemXml.ivaPct}`,
            })
          }
        }

        setItems(itemsMapeados)
        qc.invalidateQueries({ queryKey: ['productos'] })

        let resumenMsg = `Factura cargada: ${itemsMapeados.length} productos procesados`
        if (productosCreadosCount > 0) {
          resumenMsg += ` (${productosCreadosCount} creados en catálogo)`
        }
        toast.success(resumenMsg)
      } else {
        toast.error('El XML no contiene ítems de producto válidos')
      }
    } catch (err: any) {
      console.error('[handleXmlChange] Error parsing XML:', err)
      setError(err?.message || 'Error al procesar el archivo XML de la factura electrónica')
      toast.error('Error al procesar el archivo XML de la factura')
    } finally {
      setProcesandoXml(false)
    }
  }

  function addItem(producto: any) {
    const yaIdx = items.findIndex(i => i.productoId === producto.id)
    if (yaIdx >= 0) {
      // Si el producto ya está en la factura, incrementar la cantidad en 1
      setItems(prev => prev.map((item, idx) => idx === yaIdx ? { ...item, cantidad: String((parseFloat(item.cantidad) || 0) + 1) } : item))
      setBusqueda('')
      return
    }
    const costoSugerido = Number(producto.costo) || Number(producto.costoPromedio) || Number(producto.costoUltimo) || 0
    const ivaTarifa = resolveProductoIva(producto)
    setItems(prev => [...prev, {
      productoId: producto.id,
      productoNombre: producto.nombre,
      productoSku: producto.sku,
      cantidad: '1',
      costoUnitario: String(Math.round(costoSugerido) || 0),
      descuentoPct: '0',
      ivaPct: ivaTarifa,
      tipoIva: ivaTarifa === 0 ? 'EXCLUIDO' : `IVA_${ivaTarifa}`,
    }])
    setBusqueda('')
  }

  const handleKeyDownBusqueda = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      const term = busqueda.trim()
      if (!term) return

      if (sugerencias.length > 0) {
        const exactMatch = sugerencias.find((p: any) => 
          p.sku?.toUpperCase() === term.toUpperCase() || 
          p.codigoBarras?.toUpperCase() === term.toUpperCase()
        )
        addItem(exactMatch || sugerencias[0])
        return
      }

      try {
        const prods = await buscarProductos(term)
        if (prods && prods.length > 0) {
          const exactMatch = prods.find((p: any) => 
            p.sku?.toUpperCase() === term.toUpperCase() || 
            p.codigoBarras?.toUpperCase() === term.toUpperCase()
          )
          addItem(exactMatch || prods[0])
        }
      } catch (err) {
        console.error('Error buscando producto al presionar Enter/Scanner:', err)
      }
    }
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof LineaItem, val: any) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  const lineas = items.map(item => {
    const cant = parseFloat(item.cantidad) || 0
    const costo = parseFloat(item.costoUnitario) || 0
    const dto = parseFloat(item.descuentoPct) || 0
    const subtotal = cant * costo * (1 - dto / 100)

    let tasaIva = (item.ivaPct !== undefined ? item.ivaPct : 19) / 100
    if (isNaN(tasaIva) || tasaIva < 0) tasaIva = 0

    const ivaCalc = subtotal * tasaIva
    const totalCalc = subtotal + ivaCalc

    return { 
      ...item, 
      ivaPct: item.ivaPct !== undefined ? item.ivaPct : Math.round(tasaIva * 100),
      subtotalCalc: subtotal, 
      ivaCalc, 
      totalCalc 
    }
  })
  const totalSubtotal = lineas.reduce((acc, l) => acc + l.subtotalCalc, 0)
  const totalIva = lineas.reduce((acc, l) => acc + l.ivaCalc, 0)
  const totalFactura = totalSubtotal + totalIva
  const baseGravada = lineas.filter(l => l.ivaPct > 0).reduce((acc, l) => acc + l.subtotalCalc, 0)
  const baseExenta = lineas.filter(l => l.ivaPct === 0).reduce((acc, l) => acc + l.subtotalCalc, 0)

  const mutation = useMutation({
    mutationFn: (data: any) => createFacturaCompra(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facturas-compra'] })
      qc.invalidateQueries({ queryKey: ['ordenes-compra'] })
      qc.invalidateQueries({ queryKey: ['saldos-proveedores'] })
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
    if (!esCredito && cajasBancosActivos.length > 0 && !cajaBancoId) {
      return setError('Selecciona la Caja o Banco desde donde se realiza el pago de contado')
    }

    mutation.mutate({
      proveedorId: Number(proveedorId),
      documentoConfigId: Number(documentoConfigId),
      prefijoProveedor: prefijo || undefined,
      consecutivoProveedor: consecutivo,
      fechaEmision: fechaEmision || new Date().toISOString().split('T')[0],
      fechaVencimiento: fechaVencimiento || undefined,
      formaPago,
      medioPago: !esCredito ? medioPago : undefined,
      diasCredito: esCredito ? Number(diasCredito) : 0,
      documentoCxpId: esCredito && documentoCxpId ? Number(documentoCxpId) : undefined,
      documentoCeId: !esCredito && documentoCeId ? Number(documentoCeId) : undefined,
      cajaBancoId: !esCredito && cajaBancoId ? Number(cajaBancoId) : undefined,
      subtotal: totalSubtotal,
      descuento: 0,
      iva: totalIva,
      total: totalFactura,
      xmlAdjunto: xmlNombre || undefined,
      ordenCompraId: ordenCompraId ? Number(ordenCompraId) : undefined,
      recepcionId: recepcionId || undefined,
      notas: notas || undefined,
      items: lineas.map(item => ({
        productoId: item.productoId,
        cantidad: parseFloat(item.cantidad) || 0,
        costoUnitario: parseFloat(item.costoUnitario) || 0,
        subtotal: item.subtotalCalc,
        ivaPct: item.ivaPct,
        ivaValor: item.ivaCalc,
        descuentoPct: parseFloat(item.descuentoPct) || 0,
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
          <p className="text-xs text-slate-400">Documento que formaliza el cobro del proveedor, genera la cuenta por pagar y cruza con la recepción física</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold animate-pulse">
          {error}
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        onKeyDown={(e) => {
          // Prevenir que el lector de código de barras o la tecla Enter envíe la factura accidentalmente
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.preventDefault()
          }
        }}
        className="space-y-6"
      >
        
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
            
            {procesandoXml ? (
              <div className="border-2 border-dashed border-indigo-300 rounded-xl p-6 bg-indigo-50/40 flex flex-col items-center justify-center">
                <Loader2 size={32} className="text-indigo-600 animate-spin mb-2" />
                <span className="text-xs font-bold text-indigo-700">Analizando Factura DIAN...</span>
                <span className="text-[10px] text-indigo-500 mt-1">Identificando proveedor, retenciones e ítems</span>
              </div>
            ) : xmlParsedData ? (
              <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/40 relative">
                <button 
                  type="button" 
                  onClick={handleClearXml} 
                  title="Quitar XML"
                  className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                >
                  <X size={15} />
                </button>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                    <FileCheck size={20} />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">
                        {xmlParsedData.prefijo ? `${xmlParsedData.prefijo}-${xmlParsedData.consecutivo}` : xmlParsedData.consecutivo}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {xmlParsedData.formaPago}
                      </span>
                    </div>
                    <p className="text-slate-750 font-semibold">{xmlParsedData.proveedor.nombre}</p>
                    <p className="text-slate-400 text-[10px]">
                      NIT: {xmlParsedData.proveedor.nit} • {xmlParsedData.items.length} productos identificados • Total: {fmt(xmlParsedData.totales.total)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-semibold truncate max-w-[220px]" title={xmlNombre || ''}>
                    📄 {xmlNombre}
                  </span>
                  <label className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer">
                    Cambiar archivo
                    <input type="file" accept=".xml" onChange={handleXmlChange} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                <input 
                  type="file" 
                  accept=".xml" 
                  onChange={handleXmlChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileText size={32} className="text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-600">
                  Seleccionar archivo XML de proveedor
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Soporta formato UBL 2.1 (AttachedDocument e Invoice)</span>
              </div>
            )}
          </div>

          {/* Vínculo con Orden de Compra (OC) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
                <Link2 size={16} className="text-indigo-600" />
                Vincular Orden de Compra (OC)
              </h3>
              <p className="text-slate-400 text-xs">
                Asocia esta factura con una Orden de Compra aprobada para autocompletar el proveedor y productos.
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Orden de Compra Asociada (OC)</label>
                <select 
                  value={ordenCompraId} 
                  onChange={e => handleSelectOC(e.target.value)} 
                  className={`${inputCls} disabled:opacity-60 disabled:cursor-not-allowed`}
                  disabled={!!queryOcId}
                >
                  <option value="">— Ninguna (Factura de Compra directa) —</option>
                  {ocs.filter((o: any) => ['APROBADA', 'ENVIADA', 'FACTURADA', 'RECIBIDA_PARCIAL'].includes(o.estado)).map((o: any) => (
                    <option key={o.id} value={o.id}>
                       {o.numero} ({o.proveedor?.nombre})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-indigo-900 text-xs flex items-start gap-2">
                <span className="font-bold shrink-0 text-indigo-600">ℹ️ Nota:</span>
                <span>Al registrar esta Factura de Compra se formaliza la obligación contable. El ingreso físico a inventario se realiza creando la <strong>Recepción de Producto (RP)</strong> sobre esta factura.</span>
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
                  className={`${inputCls} disabled:opacity-60 disabled:cursor-not-allowed`}
                  disabled={!!queryOcId}
                >
                  <option value="">— Seleccionar proveedor —</option>
                  {proveedores.filter(p => p.activo).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}{p.nombreComercial && p.nombreComercial !== p.nombre ? ` (${p.nombreComercial})` : ''}
                    </option>
                  ))}
                </select>
                {!queryOcId && (
                  <button
                    type="button"
                    onClick={() => navigate('/configuracion/terceros/nuevo?role=proveedor')}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 whitespace-nowrap"
                  >
                    Crear Proveedor
                  </button>
                )}
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

        {/* ── Condiciones de Pago y Cartera (CXP) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <CreditCard size={16} className="text-indigo-600" />
              Condiciones de Pago y Cartera (Cuentas por Pagar)
            </h2>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${esCredito ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {esCredito ? 'Genera Cuenta por Pagar (CXP)' : 'Pago Inmediato de Contado'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Forma de Pago (desde Configuración General) */}
            <div className="md:col-span-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Forma de Pago *
              </label>
              <select
                value={formaPago}
                onChange={e => setFormaPago(e.target.value)}
                required
                className={inputCls}
              >
                {formasPagoActivas.map((f: any) => (
                  <option key={f.id || f.codigo} value={f.codigo}>
                    {f.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Si es Crédito: Documento CXP + Plazo + Fecha Vencimiento */}
            {esCredito ? (
              <>
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Documento CXP (Cuenta por Pagar)
                  </label>
                  <select
                    value={documentoCxpId}
                    onChange={e => setDocumentoCxpId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Consecutivo CXP Automático —</option>
                    {documentosFiltradosCXP.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nombre} ({d.prefijo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Plazo de Crédito (Días) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={diasCredito}
                      onChange={e => setDiasCredito(Math.max(0, parseInt(e.target.value || '0', 10)))}
                      className={inputCls}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      días
                    </span>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="date"
                    value={fechaVencimiento}
                    onChange={e => handleFechaVencChange(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
              </>
            ) : (
              /* Si es Contado: Documento CE + Caja/Banco + Medio de Pago */
              <>
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Documento CE (Comprobante de Egreso)
                  </label>
                  <select
                    value={documentoCeId}
                    onChange={e => setDocumentoCeId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Consecutivo CE Automático —</option>
                    {documentosFiltradosCE.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nombre} ({d.prefijo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Caja o Banco de Pago (Salida Fondos) *
                  </label>
                  <select
                    value={cajaBancoId}
                    onChange={e => setCajaBancoId(e.target.value)}
                    required
                    className={inputCls}
                  >
                    <option value="">— Seleccionar Caja o Banco —</option>
                    {cajasBancosActivos.map((cb: any) => (
                      <option key={cb.id} value={cb.id}>
                        [{cb.tipo}] {cb.nombre} {cb.cuentaPUC ? `(${cb.cuentaPUC})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Medio de Pago Principal *
                  </label>
                  <select
                    value={medioPago}
                    onChange={e => setMedioPago(e.target.value)}
                    required
                    className={inputCls}
                  >
                    {mediosPagoActivos.map((m: any) => (
                      <option key={m.id || m.codigo} value={m.codigo}>
                        {m.nombre} {m.cajaBanco?.nombre ? `(${m.cajaBanco.nombre})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Banner explicativo del impacto en Cartera */}
          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            esCredito ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900' : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}>
            {esCredito ? (
              <>
                <Clock size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Factura de Compra a Crédito (CXP)</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Esta compra creará una obligación en el módulo de <strong>Cartera / Cuentas por Pagar (CXP)</strong> con vencimiento el <strong>{new Date(fechaVencimiento + 'T00:00:00').toLocaleDateString('es-CO')}</strong> ({diasCredito} días de plazo) para su programación y control de abonos.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Factura de Compra de Contado</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Esta compra quedará registrada como cancelada inmediatamente vía <strong>{mediosPagoActivos.find((m: any) => m.codigo === medioPago)?.nombre || medioPago || 'Contado'}</strong> (saldo $0).
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Listado de Productos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-sm">Productos de la Factura</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{items.length} ítems</span>
          </div>

          {xmlParsedData && (
            <div className="mb-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  <strong>Ítems autocompletados desde el XML:</strong> Se cargaron {items.length} productos con sus cantidades, costos unitarios e impuestos según la factura electrónica de {xmlParsedData.proveedor.nombre}.
                </span>
              </div>
            </div>
          )}

          {/* Buscador de producto */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={handleKeyDownBusqueda}
              placeholder="Buscar producto para agregar o escanear código de barras..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />

            {busqueda.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {buscando ? (
                  <div className="p-3 text-xs text-slate-400 text-center">Buscando productos...</div>
                ) : sugerencias.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">No se encontraron productos con ese término</div>
                ) : (
                  sugerencias.map((prod: any) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => addItem(prod)}
                      className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{prod.nombre}</p>
                        <p className="text-[10px] font-mono text-slate-400">SKU: {prod.sku}</p>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                        Costo: {fmt(Number(prod.costoPromedio) || Number(prod.costo) || 0)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => setShowModalCrear(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              + ¿El producto no existe? Crear Producto nuevo
            </button>
          </div>

          {/* Tabla de ítems */}
          {items.length === 0 ? (
            <div className="border-2 border-dashed border-slate-100 rounded-xl p-8 text-center text-slate-400 text-xs">
              Busca y agrega productos arriba, o selecciona una Recepción (RP) para cruzar automáticamente
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100 pb-2">
                    <th className="text-left pb-2">Producto</th>
                    <th className="text-right pb-2 w-20">Cantidad</th>
                    <th className="text-right pb-2 w-32">Costo Unitario</th>
                    <th className="text-right pb-2 w-20">Descuento %</th>
                    <th className="text-right pb-2 w-28">$ Subtotal</th>
                    <th className="text-center pb-2 w-36">% Impuesto</th>
                    <th className="text-right pb-2 w-28">$ IVA Línea</th>
                    <th className="text-right pb-2 w-28">Total</th>
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineas.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 pr-2">
                        <p className="font-semibold text-slate-800">{item.productoNombre}</p>
                        <p className="text-[10px] font-mono text-slate-400">{item.productoSku}</p>
                      </td>
                      <td className="py-3 pl-1">
                        <input 
                          type="number" 
                          min="1" 
                          step="1" 
                          value={item.cantidad}
                          onChange={e => updateItem(idx, 'cantidad', e.target.value)}
                          className="w-full text-right px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono" 
                        />
                      </td>
                      <td className="py-3 pl-1">
                        <CurrencyInput
                          value={item.costoUnitario}
                          onChange={val => updateItem(idx, 'costoUnitario', val)}
                        />
                      </td>
                      <td className="py-3 pl-1">
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01" 
                          value={item.descuentoPct}
                          onChange={e => updateItem(idx, 'descuentoPct', e.target.value)}
                          className="w-full text-right px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono" 
                        />
                      </td>
                      <td className="py-3 pl-2 text-right font-medium text-slate-700 font-mono">
                        {fmt(item.subtotalCalc)}
                      </td>
                      <td className="py-3 px-1">
                        <select
                          value={item.ivaPct}
                          onChange={e => {
                            const val = Number(e.target.value)
                            updateItem(idx, 'ivaPct', val)
                            updateItem(idx, 'tipoIva', val === 0 ? 'EXCLUIDO' : `IVA_${val}`)
                          }}
                          className={`w-full px-2 py-1.5 border rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
                            item.ivaPct > 0 
                              ? 'border-indigo-200 bg-indigo-50/60 text-indigo-700' 
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          <option value={0}>0% (Exento)</option>
                          {impuestosIva.map((imp: any) => (
                            <option key={imp.id} value={Number(imp.tarifa)}>
                              {imp.tarifa}% ({imp.nombre})
                            </option>
                          ))}
                          {item.ivaPct > 0 && !impuestosIva.some((imp: any) => Number(imp.tarifa) === Number(item.ivaPct)) && (
                            <option value={item.ivaPct}>{item.ivaPct}% (IVA {item.ivaPct}%)</option>
                          )}
                        </select>
                      </td>
                      <td className="py-3 pl-2 text-right font-bold text-indigo-600 font-mono">
                        <div>{fmt(item.ivaCalc)}</div>
                        {parseFloat(item.cantidad) > 1 && item.ivaPct > 0 && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({fmt(Math.round(item.ivaCalc / (parseFloat(item.cantidad) || 1)))} c/u)
                          </div>
                        )}
                      </td>
                      <td className="py-3 pl-2 text-right font-extrabold text-slate-800 font-mono">
                        {fmt(item.totalCalc)}
                      </td>
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
                    <td colSpan={7} className="pt-3 text-right text-xs font-bold text-slate-500">Subtotal Factura (Base Total):</td>
                    <td className="pt-3 text-right text-sm font-extrabold text-slate-800 font-mono">{fmt(totalSubtotal)}</td>
                    <td></td>
                  </tr>
                  {baseExenta > 0 && (
                    <tr>
                      <td colSpan={7} className="pt-1 text-right text-[11px] font-semibold text-slate-400">
                        Subtotal Exento / 0% IVA (sin impuesto):
                      </td>
                      <td className="pt-1 text-right text-xs font-bold text-slate-500 font-mono">{fmt(baseExenta)}</td>
                      <td></td>
                    </tr>
                  )}
                  {baseGravada > 0 && (
                    <tr>
                      <td colSpan={7} className="pt-1 text-right text-[11px] font-semibold text-slate-400">
                        Base Gravada (con IVA):
                      </td>
                      <td className="pt-1 text-right text-xs font-bold text-slate-700 font-mono">{fmt(baseGravada)}</td>
                      <td></td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={7} className="pt-1 text-right text-xs font-bold text-slate-500">Impuestos (IVA liquidado):</td>
                    <td className="pt-1 text-right text-sm font-extrabold text-indigo-600 font-mono">{fmt(totalIva)}</td>
                    <td></td>
                  </tr>
                  <tr className="border-t border-dashed border-slate-200">
                    <td colSpan={7} className="pt-2 text-right text-xs font-bold text-slate-600">Total Factura Proveedor:</td>
                    <td className="pt-2 text-right text-base font-black text-indigo-600 font-mono">{fmt(totalFactura)}</td>
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

      {/* Modal para crear producto rápido sin salir de la FC */}
      <ModalCrearProductoRapido
        isOpen={showModalCrear}
        onClose={() => setShowModalCrear(false)}
        initialSearch={busqueda}
        onSuccess={(nuevoProd) => {
          addItem(nuevoProd)
          setBusqueda('')
        }}
      />
    </div>
  )
}
