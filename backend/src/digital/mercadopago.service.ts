import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

const MP_API = 'https://api.mercadopago.com';

export interface MpPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
}

export interface MpPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  payment_method_id?: string;
  payment_type_id?: string;
}

/**
 * Integración Mercado Pago (Checkout Pro).
 * Las credenciales se leen SOLO de variables de entorno, por tienda:
 *   MP_ACCESS_TOKEN_<SLUG>      (obligatoria para habilitar MP en esa tienda)
 *   MP_WEBHOOK_SECRET_<SLUG>    (opcional: valida la firma x-signature)
 *   STORE_URL_<SLUG>            (opcional: URL pública de retorno)
 */
@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  private envKey(slug: string) {
    return slug.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  }

  getAccessToken(slug: string): string | null {
    return process.env[`MP_ACCESS_TOKEN_${this.envKey(slug)}`] || null;
  }

  isEnabled(slug: string) {
    return !!this.getAccessToken(slug);
  }

  getStoreUrl(slug: string, dominioPropio?: string | null) {
    const fromEnv = process.env[`STORE_URL_${this.envKey(slug)}`];
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    if (dominioPropio) return `https://${dominioPropio}`;
    return `https://${slug}.edatia.com`;
  }

  async createPreference(params: {
    slug: string;
    dominioPropio?: string | null;
    orderId: number;
    orderNumero: string;
    items: MpPreferenceItem[];
    payerName: string;
  }): Promise<{ id: string; initPoint: string } | null> {
    const token = this.getAccessToken(params.slug);
    if (!token) return null;

    const storeUrl = this.getStoreUrl(params.slug, params.dominioPropio);
    const apiUrl = (process.env.PUBLIC_API_URL || 'https://api.edatia.com/api/v1').replace(/\/$/, '');
    const ref = encodeURIComponent(params.orderNumero);

    const body = {
      items: params.items.map((i) => ({ ...i, currency_id: 'COP' })),
      payer: { name: params.payerName.slice(0, 100) },
      external_reference: String(params.orderId),
      notification_url: `${apiUrl}/public/tiendas/${encodeURIComponent(params.slug)}/mercadopago/webhook`,
      back_urls: {
        success: `${storeUrl}/?pago=exito&pedido=${ref}`,
        pending: `${storeUrl}/?pago=pendiente&pedido=${ref}`,
        failure: `${storeUrl}/?pago=fallido&pedido=${ref}`,
      },
      auto_return: 'approved',
      statement_descriptor: 'BABYWORLD',
      // Expira en 48h para no dejar links de pago eternos
      expires: true,
      expiration_date_to: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    };

    try {
      const res = await fetch(`${MP_API}/checkout/preferences`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `pref-${params.slug}-${params.orderId}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        // No se loguea el token; solo el código de estado
        this.logger.error(`MP createPreference falló (HTTP ${res.status}) pedido ${params.orderNumero}`);
        return null;
      }
      const data: any = await res.json();
      return { id: data.id, initPoint: data.init_point };
    } catch (err: any) {
      this.logger.error(`MP createPreference error de red: ${err?.message}`);
      return null;
    }
  }

  /** Consulta el pago directamente en MP: es la única fuente de verdad. */
  async getPayment(slug: string, paymentId: string): Promise<MpPayment | null> {
    const token = this.getAccessToken(slug);
    if (!token || !/^\d{1,20}$/.test(paymentId)) return null;
    try {
      const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        this.logger.warn(`MP getPayment HTTP ${res.status} para pago ${paymentId}`);
        return null;
      }
      return (await res.json()) as MpPayment;
    } catch (err: any) {
      this.logger.error(`MP getPayment error de red: ${err?.message}`);
      return null;
    }
  }

  /**
   * Valida la cabecera x-signature si hay secreto configurado.
   * Si no hay secreto, se acepta (el pago igual se re-verifica contra la API de MP).
   */
  verifySignature(slug: string, headers: Record<string, any>, dataId: string): boolean {
    const secret = process.env[`MP_WEBHOOK_SECRET_${this.envKey(slug)}`];
    if (!secret) {
      // TODO(security): configurar MP_WEBHOOK_SECRET_<SLUG> para rechazar notificaciones falsificadas en origen.
      return true;
    }
    const sig = String(headers['x-signature'] || '');
    const requestId = String(headers['x-request-id'] || '');
    const parts = Object.fromEntries(
      sig.split(',').map((p) => p.split('=').map((s) => s.trim()) as [string, string]),
    );
    const ts = parts['ts'];
    const v1 = parts['v1'];
    if (!ts || !v1) return false;

    const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
    const manifest = `id:${id};request-id:${requestId};ts:${ts};`;
    const expected = createHmac('sha256', secret).update(manifest).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
