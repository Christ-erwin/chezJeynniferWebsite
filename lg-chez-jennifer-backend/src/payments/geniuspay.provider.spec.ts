import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeniusPayProvider, verifyGeniusWebhook } from './geniuspay.provider.js';
import type { Order } from '../orders/order.types.js';

const order = {
  id: 'ord1',
  reference: 'JEY-ABC123',
  eventTitle: 'Beach Party',
  items: [{ quantity: 1, label: 'Pass Beach Party' }],
  buyer: { name: 'Awa Koné', phone: '+2250700000000' },
  paymentMethod: 'wave',
  total: 60000,
} as unknown as Order;

const reply = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body }) as Response;

describe('GeniusPay', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('envoie directement sur l’opérateur choisi (Wave)', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(201, { success: true, data: { reference: 'MTX-1', status: 'pending', amount: 60000, payment_url: 'https://pay.wave.com/x', gateway: 'wave' } }));
    vi.stubGlobal('fetch', fetch);
    const res = await new GeniusPayProvider('pk_sandbox_a', 'sk_sandbox_b', 'https://site').init(order);
    expect(res).toEqual({ url: 'https://pay.wave.com/x', providerRef: 'MTX-1' });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://geniuspay.ci/api/v1/merchant/payments');
    expect(init.headers['X-API-Key']).toBe('pk_sandbox_a');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ payment_method: 'wave', amount: 60000, currency: 'XOF', success_url: 'https://site/reserver/confirmation/ord1', metadata: { order_id: 'ord1' } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('se replie sur la page GeniusPay si le mode direct est refusé', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(reply(422, { success: false, error: { code: 'GATEWAY_UNAVAILABLE' } }))
      .mockResolvedValueOnce(reply(201, { success: true, data: { reference: 'MTX-2', status: 'pending', amount: 60000, checkout_url: 'https://geniuspay.ci/checkout/y' } }));
    vi.stubGlobal('fetch', fetch);
    const res = await new GeniusPayProvider('pk', 'sk', 'https://site').init({ ...order, paymentMethod: 'orange_money' } as Order);
    expect(res).toEqual({ url: 'https://geniuspay.ci/checkout/y', providerRef: 'MTX-2' });
    expect(JSON.parse(fetch.mock.calls[0][1].body).payment_method).toBe('orange_money');
    expect(JSON.parse(fetch.mock.calls[1][1].body).payment_method).toBeUndefined();
  });

  it('valide seulement si payé ET montant exact', async () => {
    const p = new GeniusPayProvider('pk', 'sk', 'https://site');
    const o = { ...order, providerRef: 'MTX-1' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(200, { data: { reference: 'MTX-1', status: 'completed', amount: 60000, currency: 'XOF' } })));
    expect(await p.check(o)).toBe('paid');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(200, { data: { reference: 'MTX-1', status: 'completed', amount: 200, currency: 'XOF' } })));
    expect(await p.check(o)).toBe('failed');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(200, { data: { reference: 'MTX-1', status: 'processing', amount: 60000 } })));
    expect(await p.check(o)).toBe('pending');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(200, { data: { reference: 'MTX-1', status: 'expired', amount: 60000 } })));
    expect(await p.check(o)).toBe('failed');
  });

  it('vérifie la signature du webhook', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const raw = '{"event":"payment.success"}';
    const sig = createHmac('sha256', 'whsec_x').update(`${ts}.${raw}`).digest('hex');
    expect(verifyGeniusWebhook('whsec_x', sig, ts, raw)).toBe(true);
    expect(verifyGeniusWebhook('whsec_y', sig, ts, raw)).toBe(false);
    expect(verifyGeniusWebhook('whsec_x', sig, String(Number(ts) - 600), raw)).toBe(false);
  });
});
