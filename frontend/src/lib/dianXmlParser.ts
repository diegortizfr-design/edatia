/**
 * Parser de Facturas Electrónicas DIAN Colombia (UBL 2.1)
 * Soporta contenedores AttachedDocument (CDATA / Base64) y documentos Invoice directos.
 */

export interface DianParsedItem {
  orden: number
  lineId: string
  sku: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuentoPct: number
  descuentoValor: number
  subtotal: number
  ivaPct: number
  ivaValor: number
  total: number
}

export interface DianParsedInvoice {
  prefijo: string
  consecutivo: string
  numeroCompleto: string
  cufe?: string
  fechaEmision: string
  fechaVencimiento: string
  formaPago: 'CONTADO' | 'CREDITO'
  medioPagoDian?: string
  notas?: string
  proveedor: {
    nombre: string
    nombreComercial?: string
    nit: string
    tipoDocumento: string
    email?: string
    telefono?: string
    direccion?: string
    ciudad?: string
    pais: string
  }
  adquiriente?: {
    nombre: string
    nit: string
  }
  totales: {
    subtotal: number
    total: number
  }
  items: DianParsedItem[]
}

export function parseDianXml(content: string): DianParsedInvoice {
  let invoiceXml = content

  // 1. Desempaquetar contenedor AttachedDocument si aplica
  if (content.includes('AttachedDocument')) {
    // Buscar CDATA en Description
    const cdataMatch = content.match(/<(?:[a-zA-Z0-9_-]+:)?Description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/(?:[a-zA-Z0-9_-]+:)?Description>/i)
    if (cdataMatch && cdataMatch[1] && cdataMatch[1].includes('<Invoice')) {
      invoiceXml = cdataMatch[1]
    } else {
      // Buscar Base64 en EmbeddedDocumentBinaryObject
      const b64Match = content.match(/<(?:[a-zA-Z0-9_-]+:)?EmbeddedDocumentBinaryObject[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9_-]+:)?EmbeddedDocumentBinaryObject>/i)
      if (b64Match && b64Match[1]) {
        try {
          const rawB64 = b64Match[1].trim()
          let decoded = ''
          if (typeof window !== 'undefined' && typeof window.atob === 'function') {
            decoded = decodeURIComponent(escape(window.atob(rawB64)))
          } else if (typeof Buffer !== 'undefined') {
            decoded = Buffer.from(rawB64, 'base64').toString('utf8')
          }
          if (decoded.includes('<Invoice')) {
            invoiceXml = decoded
          }
        } catch (e) {
          console.warn('[dianXmlParser] No se pudo decodificar Base64 de AttachedDocument:', e)
        }
      }
    }
  }

  // Helpers de extracción con límites exactos de etiqueta
  const getTagValue = (xml: string, tagName: string): string => {
    if (!xml) return ''
    const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tagName}>`, 'i')
    const m = xml.match(regex)
    return m ? m[1].trim() : ''
  }

  const getSection = (xml: string, sectionName: string): string => {
    if (!xml) return ''
    const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${sectionName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${sectionName}>`, 'i')
    const m = xml.match(regex)
    return m ? m[1] : ''
  }

  const getAllSections = (xml: string, sectionName: string): string[] => {
    if (!xml) return []
    const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${sectionName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${sectionName}>`, 'gi')
    const matches: string[] = []
    let match: RegExpExecArray | null
    while ((match = regex.exec(xml)) !== null) {
      matches.push(match[1])
    }
    return matches
  }

  // 2. Número de Factura, Prefijo y Consecutivo
  const fullId = getTagValue(invoiceXml, 'ID')
  let prefijo = ''
  let consecutivo = fullId
  const matchNum = fullId.match(/^([A-Za-z_-]+)\s*(\d+)$/)
  if (matchNum) {
    prefijo = matchNum[1]
    consecutivo = matchNum[2]
  } else {
    const dashMatch = fullId.match(/^([A-Za-z0-9]+)[-_](\d+)$/)
    if (dashMatch) {
      prefijo = dashMatch[1]
      consecutivo = dashMatch[2]
    }
  }

  // CUFE
  const cufe = getTagValue(invoiceXml, 'UUID')

  // Fechas y Medios de Pago
  const fechaEmision = getTagValue(invoiceXml, 'IssueDate')
  const paymentMeans = getSection(invoiceXml, 'PaymentMeans')
  const fechaVencimiento = (paymentMeans ? getTagValue(paymentMeans, 'PaymentDueDate') : '') || getTagValue(invoiceXml, 'PaymentDueDate') || fechaEmision
  const paymentMeansId = paymentMeans ? getTagValue(paymentMeans, 'ID') : ''
  const paymentMeansCode = paymentMeans ? getTagValue(paymentMeans, 'PaymentMeansCode') : ''
  const note = getTagValue(invoiceXml, 'Note')

  // DIAN estándar: 1 = Contado, 2 = Crédito
  let formaPago: 'CONTADO' | 'CREDITO' = 'CONTADO'
  if (paymentMeansId === '2' || (fechaVencimiento && fechaEmision && fechaVencimiento > fechaEmision)) {
    formaPago = 'CREDITO'
  }

  // 3. Proveedor (AccountingSupplierParty)
  const supplierSection = getSection(invoiceXml, 'AccountingSupplierParty')
  const provNombre = getTagValue(supplierSection, 'RegistrationName') || getTagValue(supplierSection, 'Name')
  const provNit = getTagValue(supplierSection, 'CompanyID')
  const provEmail = getTagValue(supplierSection, 'ElectronicMail')
  const provTel = getTagValue(supplierSection, 'Telephone')
  const provDireccion = getTagValue(supplierSection, 'Line')
  const provCiudad = getTagValue(supplierSection, 'CityName')

  // 4. Adquiriente / Comprador (AccountingCustomerParty)
  const customerSection = getSection(invoiceXml, 'AccountingCustomerParty')
  const custNombre = getTagValue(customerSection, 'RegistrationName') || getTagValue(customerSection, 'Name')
  const custNit = getTagValue(customerSection, 'CompanyID')

  // 5. Totales
  const legalTotalSection = getSection(invoiceXml, 'LegalMonetaryTotal')
  const subtotalTotal = parseFloat(getTagValue(legalTotalSection, 'LineExtensionAmount') || '0')
  const totalFactura = parseFloat(getTagValue(legalTotalSection, 'PayableAmount') || '0')

  // 6. Líneas de Productos (InvoiceLine)
  const linesRaw = getAllSections(invoiceXml, 'InvoiceLine')
  const items: DianParsedItem[] = linesRaw.map((lineXml, index) => {
    const lineId = getTagValue(lineXml, 'ID')
    const cantidad = parseFloat(getTagValue(lineXml, 'InvoicedQuantity') || '1')
    const lineExtension = parseFloat(getTagValue(lineXml, 'LineExtensionAmount') || '0')

    // Price
    const priceSection = getSection(lineXml, 'Price')
    let precioUnitario = parseFloat(getTagValue(priceSection, 'PriceAmount') || '0')
    if (!precioUnitario && cantidad > 0) {
      precioUnitario = lineExtension / cantidad
    }

    // Item details
    const itemSection = getSection(lineXml, 'Item')
    const descripcion = getTagValue(itemSection, 'Description')
    const sellersId = getTagValue(itemSection, 'ID') // SKU / Referencia del proveedor

    // Descuento en línea (AllowanceCharge)
    const allowCharge = getSection(lineXml, 'AllowanceCharge')
    let descuentoPct = 0
    let descuentoValor = 0
    if (allowCharge) {
      const isCharge = getTagValue(allowCharge, 'ChargeIndicator') === 'true'
      if (!isCharge) {
        descuentoPct = parseFloat(getTagValue(allowCharge, 'MultiplierFactorNumeric') || '0')
        descuentoValor = parseFloat(getTagValue(allowCharge, 'Amount') || '0')
      }
    }

    // Impuesto / IVA (TaxTotal -> TaxSubtotal -> Percent)
    const taxTotalSection = getSection(lineXml, 'TaxTotal')
    const taxSubtotalSection = getSection(taxTotalSection, 'TaxSubtotal')
    let ivaPct = 0
    if (taxSubtotalSection) {
      const pctStr = getTagValue(taxSubtotalSection, 'Percent')
      if (pctStr) ivaPct = parseFloat(pctStr)
    }
    const ivaValor = parseFloat(getTagValue(taxTotalSection, 'TaxAmount') || '0')

    return {
      orden: index + 1,
      lineId,
      sku: sellersId || '',
      descripcion,
      cantidad,
      precioUnitario,
      descuentoPct,
      descuentoValor,
      subtotal: lineExtension || (cantidad * precioUnitario),
      ivaPct,
      ivaValor,
      total: (lineExtension || (cantidad * precioUnitario)) + ivaValor,
    }
  })

  return {
    prefijo,
    consecutivo,
    numeroCompleto: fullId,
    cufe,
    fechaEmision,
    fechaVencimiento,
    formaPago,
    medioPagoDian: paymentMeansCode,
    notas: note,
    proveedor: {
      nombre: provNombre,
      nit: provNit,
      tipoDocumento: 'NIT',
      email: provEmail,
      telefono: provTel,
      direccion: provDireccion,
      ciudad: provCiudad,
      pais: 'Colombia',
    },
    adquiriente: {
      nombre: custNombre,
      nit: custNit,
    },
    totales: {
      subtotal: subtotalTotal,
      total: totalFactura,
    },
    items,
  }
}
