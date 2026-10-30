import { Logger } from '@nestjs/common';
import type { Order } from '../orders/order.types.js';
import type { CheckResult, InitResult, PaymentProvider } from './payment.provider.js';

const BASE = 'https://api-checkout.cinetpay.com/v2';

type CinetPayResponse<T> = { code: string; message: string; description?: string; data?: T };

/**
 * CinetPay — guichet unique Mobile Money (Wave CI, Orange Money CI, MTN, Moov).
 * Doc : https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation
 *
 * Flux :
 *  1. init()  → POST /v2/payment         → URL du guichet où le client valide
 *  2. CinetPay appelle notify_url (webhook) quand le statut change
 *  3. on NE fait JAMAIS confiance au webhook seul : check() relit le statut
 *     auprès de CinetPay (POST /v2/payment/check) avant de valider la commande.
 */
export class CinetPayProvider implements PaymentProvider {
  readonly name = 'cinetpay' as const;
  private readonly log = new Logger('CinetPay');

  constructor(
    private readonly apiKey: string,
    private readonly siteId: string,
    private readonly publicApiUrl: string,
    private readonly frontendUrl: string,
  ) {}

  async init(order: Order): Promise<InitResult> {
    const [surname, ...rest] = order.buyer.name.trim().split(/\s+/);
    const body = {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: order.reference,
      amount: order.total,
      currency: 'XOF',
      description: `${order.eventTitle} — ${order.items.map((i) => `${i.quantity}x ${i.label}`).join(', ')}`.slice(0, 250),
      notify_url: `${this.publicApiUrl}/payments/cinetpay/notify`,
      return_url: `${this.frontendUrl}/reserver/confirmation/${order.id}`,
      channels: 'MOBILE_MONEY',
      lang: 'FR',
      customer_name: rest.join(' ') || surname,
      customer_surname: surname,
      customer_phone_number: order.buyer.phone.replace('+', ''),
      customer_email: order.buyer.email ?? '',
      metadata: JSON.stringify({ orderId: order.id, method: order.paymentMethod }),
    };

    const res = await fetch(`${BASE}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as CinetPayResponse<{ payment_url: string; payment_token: string }>;
    if (json.code !== '201' || !json.data?.payment_url) {
      this.log.error(`init refusé (${json.code}) : ${json.message} ${json.description ?? ''}`);
      throw new Error('Le paiement n’a pas pu être initialisé. Réessaie dans un instant.');
    }
    return { url: json.data.payment_url, providerRef: json.data.payment_token };
  }

  async check(order: Order): Promise<CheckResult> {
    const res = await fetch(`${BASE}/payment/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey: this.apiKey, site_id: this.siteId, transaction_id: order.reference }),
    });
    const json = (await res.json()) as CinetPayResponse<{ status: string; amount: string; currency: string }>;
    const status = json.data?.status;
    if (status === 'ACCEPTED') {
      // garde-fou : le montant encaissé doit être celui de la commande
      if (Number(json.data?.amount) !== order.total || json.data?.currency !== 'XOF') {
        this.log.error(`montant incohérent pour ${order.reference} : ${json.data?.amount} ${json.data?.currency}`);
        return 'failed';
      }
      return 'paid';
    }
    if (status === 'REFUSED' || status === 'CANCELED') return 'failed';
    return 'pending';
  }
}
