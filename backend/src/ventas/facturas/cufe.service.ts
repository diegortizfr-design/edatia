import { Injectable } from '@nestjs/common'
import { createHash } from 'crypto'

@Injectable()
export class CufeService {
  /**
   * Calcula el CUFE (Código Único de Factura Electrónica) según especificación
   * técnica DIAN Anexo Técnico Versión 1.9 — SHA-384
   *
   * Cadena: NumFac + FecFac + HorFac + ValFac + "01" + ValImp1 +
   *         "04" + ValImp2 + "03" + ValImp3 + ValTot +
   *         NitOFE + NumAdq + ClaveTermica + AmbienteDestino
   */
  calcularCufe(params: {
    numFac: string        // ej: "SETP990094118"
    fecFac: string        // YYYY-MM-DD
    horFac: string        // HH:MM:SS-05:00
    valFac: number        // valor base sin impuestos
    valImp1: number       // IVA total
    valImp2: number       // ICA (generalmente 0)
    valImp3: number       // impuesto consumo (generalmente 0)
    valTot: number        // total factura
    nitOFE: string        // NIT empresa (sin DV, sin puntos)
    numAdq: string        // documento cliente
    claveTecnica: string  // de la resolución DIAN
    ambiente: string      // "1"=producción, "2"=pruebas
  }): string {
    const fmt = (n: number) => n.toFixed(2)
    const str =
      params.numFac +
      params.fecFac +
      params.horFac +
      fmt(params.valFac) +
      '01' + fmt(params.valImp1) +
      '04' + fmt(params.valImp2) +
      '03' + fmt(params.valImp3) +
      fmt(params.valTot) +
      params.nitOFE +
      params.numAdq +
      params.claveTecnica +
      params.ambiente

    return createHash('sha384').update(str).digest('hex')
  }

  /**
   * Código de seguridad del software = SHA384(softwareId + pin + numFac)
   * Se incluye en el XML dentro de SoftwareSecurityCode
   */
  calcularSoftwareSecurityCode(softwareId: string, pin: string, numFac: string): string {
    return createHash('sha384').update(softwareId + pin + numFac).digest('hex')
  }

  /**
   * URL del QR para consulta en DIAN
   */
  qrUrl(cufe: string, ambiente: string): string {
    const base = ambiente === '1'
      ? 'https://catalogo-vpfe.dian.gov.co'
      : 'https://catalogo-vpfe-hab.dian.gov.co'
    return `${base}/document/searchqr?documentkey=${cufe}`
  }
}
