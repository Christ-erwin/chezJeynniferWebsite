import type { Order } from '../orders/order.types.js';
import type { CheckResult, InitResult, PaymentProvider } from './payment.provider.js';

/**
 * Simulateur de paiement pour le développement local : renvoie vers une page
 * du site qui imite l'écran de validation Wave / Orange Money. Le statut est
 * ensuite posé par POST /api/payments/mock/:id/confirm.
 * Refusé en production sauf ALLOW_MOCK_PAYMENTS=true (voir payments.module).
 */
export class MockProvider implements PaymentProvider {
  readonly name = 'mock' as const;
  constructor(private readonly frontendUrl: string) {}

  async init(order: Order): Promise<InitResult> {
    return { url: `${this.frontendUrl}/paiement/simulation/${order.id}` };
  }

  async check(): Promise<CheckResult> {
    return 'pending';
  }
}
