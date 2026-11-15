import { createHmac, timingSafeEqual } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { Order } from '../orders/order.types.js';
import type { CheckResult, InitResult, PaymentProvider } from './payment.provider.js';

const BASE = 'https://geniuspay.ci/api/v1/merchant';

type GeniusResponse<T> = { success?: boolean; message?: string; error?: { code?: string; message?: string }; data?: T };
type GeniusPayment = {
  reference: string;
  amount: number | string;
  currency?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'cancelled' | 'refunded';
  checkout_url?: string;
  payment_url?: string;
};

/**
 * GeniusPay — guichet Mobile Money (Wave, Orange Money, MTN, Moov…).
 * Doc : https://geniuspay.ci/docs/api
 *
 * Flux :
 *  1. init()  → POST /payments avec payment_method = wave | orange_money
 *     → lien direct de l'opérateur (QR code Wave sur ordinateur, appli sur
 *     téléphone). Repli sur la page GeniusPay si le mode direct échoue.
 *  2. GeniusPay appelle le webhook (payment.success, payment.failed…).
 *  3. on NE fait JAMAIS confiance au webhook seul : check() relit le statut
 *     (GET /payments/{reference}) et contrôle le montant avant de valider.
 */
export class GeniusPayProvider implements PaymentProvider {
  readonly name = 'geniuspay' as const;
  private readonly log = new Logger('GeniusPay');

  constructor(
    private readonly publicKey: string,
    private readonly secretKey: string,
    private readonly frontendUrl: string,
  ) {
    if (publicKey.startsWith('pk_sandbox_')) this.log.warn('clés SANDBOX : paiements de test, aucun argent réel.');
  }

  private headers() {
    return { 'X-API-Key': this.publicKey, 'X-API-Secret': this.secretKey, 'Content-Type': 'application/json', Accept: 'application/json' };
  }

  /**
   * Mode direct : le client est envoyé tout de suite sur Wave ou Orange Money
   * (le moyen choisi sur le site). Si GeniusPay refuse le mode direct pour ce
   * moyen, repli sur leur page de paiement (le client rechoisit l'opérateur).
   */
  async init(order: Order): Promise<InitResult> {
    try {
      return await this.create(order, order.paymentMethod);
    } catch {
      this.log.warn(`mode direct ${order.paymentMethod} refusé pour ${order.reference}, repli sur la page GeniusPay`);
      return this.create(order);
    }
  }

  private async create(order: Order, method?: Order['paymentMethod']): Promise<InitResult> {
    const back = `${this.frontendUrl}/reserver/confirmation/${order.id}`;
    const body = {
      ...(method ? { payment_method: method } : {}),
      amount: order.total,
      currency: 'XOF',
      description: `${order.eventTitle} — ${order.items.map((i) => `${i.quantity}x ${i.label}`).join(', ')}`.slice(0, 500),
      customer: {
        name: order.buyer.name,
        phone: order.buyer.phone,
        ...(order.buyer.email ? { email: order.buyer.email } : {}),
        country: 'CI',
      },
      success_url: back,
      error_url: back,
      metadata: { order_id: order.id, order_reference: order.reference, method: order.paymentMethod },
    };

    const res = await fetch(`${BASE}/payments`, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    const json = (await res.json().catch(() => ({}))) as GeniusResponse<GeniusPayment>;
    // direct → payment_url (Wave / Orange Money) ; page GeniusPay → checkout_url.
    // En sandbox, le mode direct peut répondre 201 sans lien : on prend alors
    // checkout_url s'il est fourni, sinon repli (voir init).
    const url = method ? (json.data?.payment_url ?? json.data?.checkout_url) : (json.data?.checkout_url ?? json.data?.payment_url);
    if (!res.ok || !url || !json.data?.reference) {
      const why = res.ok
        ? `pas de lien de paiement dans la réponse (champs : ${Object.keys(json.data ?? {}).join(', ') || 'aucun'})`
        : `${json.error?.code ?? ''} ${json.error?.message ?? json.message ?? ''}`;
      // l'échec du mode direct n'est qu'un avertissement : le repli prend le relais
      this.log[method ? 'warn' : 'error'](`init ${method ?? 'checkout'} refusé (${res.status}) : ${why}`);
      throw new Error('Le paiement n’a pas pu être initialisé. Réessaie dans un instant.');
    }
    return { url, providerRef: json.data.reference };
  }

  async check(order: Order): Promise<CheckResult> {
    if (!order.providerRef) return 'pending';
    const res = await fetch(`${BASE}/payments/${encodeURIComponent(order.providerRef)}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`statut indisponible (HTTP ${res.status})`);
    const json = (await res.json()) as GeniusResponse<GeniusPayment>;
    const p = json.data;
    if (!p) return 'pending';
    if (p.status === 'completed') {
      // garde-fou : le montant encaissé doit être celui de la commande
      if (Number(p.amount) !== order.total || (p.currency && p.currency !== 'XOF')) {
        this.log.error(`montant incohérent pour ${order.reference} : ${p.amount} ${p.currency}`);
        return 'failed';
      }
      return 'paid';
    }
    if (p.status === 'failed' || p.status === 'expired' || p.status === 'cancelled') return 'failed';
    return 'pending';
  }
}

/**
 * Signature du webhook : HMAC-SHA256(timestamp + "." + corps JSON, whsec_…),
 * envoyée dans X-Webhook-Signature. Horodatage de plus de 5 min refusé (rejeu).
 */
export function verifyGeniusWebhook(secret: string, signature: string | undefined, timestamp: string | undefined, rawBody: string): boolean {
  if (!signature || !timestamp) return false;
  const ts = Number(timestamp);
  // horodatage en secondes (ou millisecondes, selon l'envoi)
  const ms = ts > 1e12 ? ts : ts * 1000;
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ms) > 300_000) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const got = signature.replace(/^sha256=/, '');
  return got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}
