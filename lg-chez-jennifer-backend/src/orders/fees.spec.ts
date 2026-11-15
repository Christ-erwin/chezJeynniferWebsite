import { describe, expect, it } from 'vitest';
import { paymentFee } from './fees.js';

const rule = { percent: 2.5, fixed: 100 };
/** ce que GeniusPay laisse : payé − (1 % + 100 + 1,5 %) */
const net = (paid: number) => paid - (paid * 0.025 + 100);

describe('paymentFee', () => {
  it.each([5000, 10000, 30000, 60000, 120000])('le net couvre le prix des billets (%i)', (price) => {
    const fee = paymentFee(price, rule);
    expect((price + fee) % 100).toBe(0);
    expect(net(price + fee)).toBeGreaterThanOrEqual(price);
    expect(net(price + fee - 100)).toBeLessThan(price); // pas de centaine en trop
  });

  it('60 000 → 61 700', () => expect(60000 + paymentFee(60000, rule)).toBe(61700));
  it('sans règle ou prix nul : pas de frais', () => {
    expect(paymentFee(60000, undefined)).toBe(0);
    expect(paymentFee(0, rule)).toBe(0);
  });
});
