import { Injectable } from '@nestjs/common'

// Mapa de tipos de IVA → código DIAN y porcentaje
const IVA_MAP: Record<string, { pct: number; code: string }> = {
  IVA_19:  { pct: 19, code: '01' },
  IVA_5:   { pct: 5,  code: '01' },
  IVA_0:   { pct: 0,  code: '01' },
  EXCLUIDO:{ pct: 0,  code: '04' }, // excluido → sin impuesto
}

// Codigos medio de pago DIAN
const MEDIO_PAGO_MAP: Record<string, string> = {
  EFECTIVO:       '10',
  CHEQUE:         '20',
  TRANSFERENCIA:  '42',
  TARJETA_DEBITO: '49',
  TARJETA_CREDITO:'48',
}

@Injectable()
export class UblService {
  /**
   * Genera el XML UBL 2.1 completo para una factura electrónica DIAN
   * Cumple con Resolución 000042 de 2020 y Anexo Técnico 1.9
   */
  buildFacturaXml(params: {
    empresa: any
    cliente: any
    factura: any
    items: any[]
    resolucion: any
    config: any
    cufe: string
    qrUrl: string
    softwareSecurityCode: string
  }): string {
    const { empresa, cliente, factura, items, resolucion, config, cufe, qrUrl, softwareSecurityCode } = params
    const ambiente = config.ambiente === 'PRODUCCION' ? '1' : '2'
    const profileExecId = ambiente
    const now = new Date(factura.fecha)
    const fecFac = now.toISOString().split('T')[0]
    const horFac = now.toTimeString().split(' ')[0] + '-05:00'

    const fmt = (n: number | string) => Number(n).toFixed(2)
    const nitOFE = empresa.nit.replace(/[^0-9]/g, '').replace(/-.*/, '')
    const dvOFE = empresa.digitoVerificacion ?? calcDV(nitOFE)
    const numFac = `${resolucion.prefijo}${factura.numeroDIAN}`

    // Totales
    const subtotal = Number(factura.subtotal)
    const descuento = Number(factura.descuento)
    const iva = Number(factura.iva19) + Number(factura.iva5)
    const total = Number(factura.total)

    // Líneas XML
    const lineasXml = items.map((item, idx) => {
      const ivaCfg = IVA_MAP[item.tipoIva] ?? IVA_MAP.IVA_19
      const baseIva = Number(item.baseIva)
      const ivaValor = Number(item.ivaValor)
      const itemSubtotal = Number(item.subtotal)
      return `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${item.unidad ?? 'UND'}">${Number(item.cantidad).toFixed(4)}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="COP">${fmt(itemSubtotal)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="COP">${fmt(ivaValor)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="COP">${fmt(baseIva)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="COP">${fmt(ivaValor)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:Percent>${ivaCfg.pct}.00</cbc:Percent>
            <cac:TaxScheme>
              <cbc:ID>${ivaCfg.code}</cbc:ID>
              <cbc:Name>IVA</cbc:Name>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Description><![CDATA[${escXml(item.descripcion)}]]></cbc:Description>
        <cac:SellersItemIdentification>
          <cbc:ID>${escXml(item.producto?.sku ?? String(item.productoId))}</cbc:ID>
        </cac:SellersItemIdentification>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="COP">${fmt(Number(item.precioUnitario))}</cbc:PriceAmount>
        <cbc:BaseQuantity unitCode="${item.unidad ?? 'UND'}">1.0000</cbc:BaseQuantity>
      </cac:Price>
    </cac:InvoiceLine>`
    }).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:sts="dian:gov:co:facturaelectronica:Structures-2-1">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <sts:DianExtensions>
          <sts:InvoiceControl>
            <sts:InvoiceAuthorization>${resolucion.numeroResolucion}</sts:InvoiceAuthorization>
            <sts:AuthorizationPeriod>
              <cbc:StartDate>${resolucion.fechaResolucion.toISOString().split('T')[0]}</cbc:StartDate>
              <cbc:EndDate>${resolucion.fechaVigencia.toISOString().split('T')[0]}</cbc:EndDate>
            </sts:AuthorizationPeriod>
            <sts:AuthorizedInvoices>
              <sts:Prefix>${resolucion.prefijo}</sts:Prefix>
              <sts:From>${resolucion.numeroInicial}</sts:From>
              <sts:To>${resolucion.numeroFinal}</sts:To>
            </sts:AuthorizedInvoices>
          </sts:InvoiceControl>
          <sts:InvoiceSource>
            <cbc:IdentificationCode listAgencyID="6" listAgencyName="United Nations Economic Commission for Europe" listSchemeURI="urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1">CO</cbc:IdentificationCode>
          </sts:InvoiceSource>
          <sts:SoftwareProvider>
            <sts:ProviderID schemeAgencyID="195" schemeAgencyName="CO, DIAN" schemeID="${dvOFE}" schemeName="31">${nitOFE}</sts:ProviderID>
            <sts:SoftwareID schemeAgencyID="195" schemeAgencyName="CO, DIAN">${config.softwareId ?? ''}</sts:SoftwareID>
          </sts:SoftwareProvider>
          <sts:SoftwareSecurityCode schemeAgencyID="195" schemeAgencyName="CO, DIAN">${softwareSecurityCode}</sts:SoftwareSecurityCode>
          <sts:AuthorizationProvider>
            <sts:AuthorizationProviderID schemeAgencyID="195" schemeAgencyName="CO, DIAN" schemeID="4" schemeName="31">800197268</sts:AuthorizationProviderID>
          </sts:AuthorizationProvider>
          <sts:QRCode>${qrUrl}</sts:QRCode>
        </sts:DianExtensions>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1</cbc:ProfileID>
  <cbc:ProfileExecutionID>${profileExecId}</cbc:ProfileExecutionID>
  <cbc:ID>${numFac}</cbc:ID>
  <cbc:UUID schemeID="${profileExecId}" schemeName="CUFE-SHA384">${cufe}</cbc:UUID>
  <cbc:IssueDate>${fecFac}</cbc:IssueDate>
  <cbc:IssueTime>${horFac}</cbc:IssueTime>
  <cbc:InvoiceTypeCode listID="0204" listAgencyID="195" listAgencyName="CO, DIAN">01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${items.length}</cbc:LineCountNumeric>
  <cac:InvoicePeriod>
    <cbc:StartDate>${fecFac}</cbc:StartDate>
    <cbc:EndDate>${fecFac}</cbc:EndDate>
  </cac:InvoicePeriod>
  <cac:PaymentMeans>
    <cbc:ID>${factura.formaPago === 'CONTADO' ? '1' : '2'}</cbc:ID>
    <cbc:PaymentMeansCode>${MEDIO_PAGO_MAP[factura.medioPago] ?? '42'}</cbc:PaymentMeansCode>
    <cbc:PaymentDueDate>${factura.fechaVencimiento ? new Date(factura.fechaVencimiento).toISOString().split('T')[0] : fecFac}</cbc:PaymentDueDate>
  </cac:PaymentMeans>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="COP">${fmt(iva)}</cbc:TaxAmount>
    ${Number(factura.iva19) > 0 ? `<cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="COP">${fmt(Number(factura.baseIva19))}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="COP">${fmt(Number(factura.iva19))}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>19.00</cbc:Percent>
        <cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>` : ''}
    ${Number(factura.iva5) > 0 ? `<cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="COP">${fmt(Number(factura.baseIva5))}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="COP">${fmt(Number(factura.iva5))}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>5.00</cbc:Percent>
        <cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>` : ''}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${fmt(subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${fmt(subtotal - descuento)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">${fmt(total)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="COP">${fmt(descuento)}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="COP">${fmt(total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:AccountingSupplierParty>
    <cbc:AdditionalAccountID schemeAgencyID="195" schemeAgencyName="CO, DIAN">${empresa.tipoPersona === 'NATURAL' ? '2' : '1'}</cbc:AdditionalAccountID>
    <cac:Party>
      <cac:PartyName><cbc:Name><![CDATA[${escXml(empresa.nombre)}]]></cbc:Name></cac:PartyName>
      <cac:PhysicalLocation>
        <cac:Address>
          <cbc:ID>${empresa.codigoDane ?? '11001'}</cbc:ID>
          <cbc:CityName>${escXml(empresa.municipio ?? 'Bogotá D.C.')}</cbc:CityName>
          <cbc:PostalZone>${empresa.codigoPostal ?? '110111'}</cbc:PostalZone>
          <cbc:CountrySubentity>${escXml(empresa.departamento ?? 'Bogotá')}</cbc:CountrySubentity>
          <cac:AddressLine><cbc:Line><![CDATA[${escXml(empresa.direccion ?? '')}]]></cbc:Line></cac:AddressLine>
          <cac:Country>
            <cbc:IdentificationCode>CO</cbc:IdentificationCode>
            <cbc:Name languageID="es">Colombia</cbc:Name>
          </cac:Country>
        </cac:Address>
      </cac:PhysicalLocation>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName><![CDATA[${escXml(empresa.nombre)}]]></cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN" schemeID="${dvOFE}" schemeName="31">${nitOFE}</cbc:CompanyID>
        <cbc:TaxLevelCode listName="${empresa.regimenFiscal ?? '48'}">${empresa.regimenFiscal ?? '48'}</cbc:TaxLevelCode>
        <cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${escXml(empresa.nombre)}]]></cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN" schemeID="${dvOFE}" schemeName="31">${nitOFE}</cbc:CompanyID>
        <cac:CorporateRegistrationScheme><cbc:ID>${resolucion.prefijo}</cbc:ID></cac:CorporateRegistrationScheme>
      </cac:PartyLegalEntity>
      <cac:Contact><cbc:ElectronicMail>${empresa.email ?? ''}</cbc:ElectronicMail></cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cbc:AdditionalAccountID schemeAgencyID="195" schemeAgencyName="CO, DIAN">${cliente.tipoPersona === 'NATURAL' ? '2' : '1'}</cbc:AdditionalAccountID>
    <cac:Party>
      <cac:PartyName><cbc:Name><![CDATA[${escXml(cliente.nombreComercial ?? cliente.nombre)}]]></cbc:Name></cac:PartyName>
      <cac:PhysicalLocation>
        <cac:Address>
          <cbc:ID>${cliente.codigoDane ?? '11001'}</cbc:ID>
          <cbc:CityName>${escXml(cliente.municipio ?? '')}</cbc:CityName>
          <cbc:PostalZone>${cliente.codigoPostal ?? ''}</cbc:PostalZone>
          <cac:AddressLine><cbc:Line><![CDATA[${escXml(cliente.direccion ?? '')}]]></cbc:Line></cac:AddressLine>
          <cac:Country>
            <cbc:IdentificationCode>${cliente.pais ?? 'CO'}</cbc:IdentificationCode>
            <cbc:Name languageID="es">Colombia</cbc:Name>
          </cac:Country>
        </cac:Address>
      </cac:PhysicalLocation>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName><![CDATA[${escXml(cliente.nombre)}]]></cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN" schemeID="${cliente.digitoVerificacion ?? ''}" schemeName="${docSchemeName(cliente.tipoDocumento)}">${cliente.numeroDocumento}</cbc:CompanyID>
        <cbc:TaxLevelCode listName="${cliente.regimenFiscal ?? '49'}">${cliente.regimenFiscal ?? '49'}</cbc:TaxLevelCode>
        <cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${escXml(cliente.nombre)}]]></cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN" schemeID="${cliente.digitoVerificacion ?? ''}" schemeName="${docSchemeName(cliente.tipoDocumento)}">${cliente.numeroDocumento}</cbc:CompanyID>
      </cac:PartyLegalEntity>
      <cac:Contact><cbc:ElectronicMail>${cliente.email ?? ''}</cbc:ElectronicMail></cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>
  ${lineasXml}
</Invoice>`
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escXml(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function docSchemeName(tipoDoc: string): string {
  const map: Record<string, string> = { NIT: '31', CC: '13', CE: '22', PASAPORTE: '91', PEP: '47' }
  return map[tipoDoc] ?? '31'
}

// Algoritmo dígito verificación NIT (módulo 11)
function calcDV(nit: string): string {
  const primos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
  const digits = nit.replace(/[^0-9]/g, '').split('').reverse()
  const suma = digits.reduce((acc, d, i) => acc + parseInt(d) * primos[i], 0)
  const resto = suma % 11
  return String(resto > 1 ? 11 - resto : resto)
}
