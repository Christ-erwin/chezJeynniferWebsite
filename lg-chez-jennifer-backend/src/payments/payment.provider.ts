import type { Order } from '../orders/order.types.js';

export type InitResult = { url: string; providerRef?: string };
export type CheckResult = 'paid' | 'failed' | 'pending';

/**
 * Un agrégateur de paiement Mobile Money.
 * Wave et Orange Money passent par le MÊME agrégateur (CinetPay) : pas
 * d'intégration opérateur par opérateur (Wave Business direct exige RCCM + DFE).
 */
export interface PaymentProvider {
  readonly name: 'mock' | 'cinetpay';
  init(order: Order): Promise<InitResult>;
  check(order: Order): Promise<CheckResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
