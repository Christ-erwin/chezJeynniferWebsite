import { Injectable, Logger } from '@nestjs/common';
import QRCode from 'qrcode';
import type { EventRecord } from '../events/event.types.js';
import type { Order } from '../orders/order.types.js';
import { ticketEmail } from './ticket-email.js';

/**
 * Envoi des billets par e-mail via Resend (https://resend.com/docs/api-reference/emails/send-email).
 *  - RESEND_API_KEY : clé API Resend (re_…)
 *  - MAIL_FROM : expéditeur sur un domaine vérifié chez Resend,
 *    ex. « Les Soirées chez Jeynnifer <billets@chezjeynnifer.online> »
 *  - MAIL_REPLY_TO (facultatif) : adresse où arrivent les réponses
 *  - WHATSAPP_NUMBER (facultatif) : contact affiché en pied d'e-mail
 * Sans clé : rien n'est envoyé (les billets restent sur la page de confirmation).
 */
@Injectable()
export class MailService {
  private readonly log = new Logger('Mail');
  private readonly apiKey = process.env.RESEND_API_KEY;
  private readonly from = process.env.MAIL_FROM ?? 'Les Soirées chez Jeynnifer <billets@chezjeynnifer.online>';
  /** ignorée si ce n'est pas une adresse valide (« a@b.c » ou « Nom <a@b.c> ») : un mauvais réglage ne doit pas bloquer l'envoi */
  private readonly replyTo = validAddress(process.env.MAIL_REPLY_TO);
  private readonly site = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  /** numéro WhatsApp de contact (chiffres seuls), le même que sur le site */
  private readonly whatsapp = (process.env.WHATSAPP_NUMBER ?? '2250787879780').replace(/\D/g, '');

  constructor() {
    if (!this.apiKey) this.log.warn('RESEND_API_KEY absent : les billets ne sont pas envoyés par e-mail.');
    if (process.env.MAIL_REPLY_TO && !this.replyTo) this.log.warn(`MAIL_REPLY_TO ignoré (adresse invalide) : « ${process.env.MAIL_REPLY_TO} »`);
  }

  get enabled(): boolean {
    return !!this.apiKey;
  }

  /** Envoie les billets d'une commande payée. Renvoie false si rien n'a été envoyé. */
  async sendTickets(order: Order, event: EventRecord | undefined): Promise<boolean> {
    if (!this.apiKey || !order.buyer.email || order.status !== 'paid' || order.tickets.length === 0) return false;
    const mail = ticketEmail(order, event, {
      tickets: `${this.site}/reserver/confirmation/${order.id}`,
      logo: `${this.site}/brand/logo-light.png`,
      whatsapp: `https://wa.me/${this.whatsapp}?text=${encodeURIComponent(`Bonjour ! Une question sur ma commande ${order.reference}.`)}`,
    });
    const attachments = await Promise.all(
      order.tickets.map(async (t, i) => ({
        filename: `billet-${i + 1}.png`,
        content: (await QRCode.toBuffer(t.code, { width: 300, margin: 1, errorCorrectionLevel: 'M' })).toString('base64'),
        content_id: `qr-${i}`,
      })),
    );
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: this.from,
        to: [order.buyer.email],
        ...(this.replyTo ? { reply_to: this.replyTo } : {}),
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        attachments,
        headers: { 'X-Entity-Ref-ID': order.reference },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend ${res.status} : ${body.slice(0, 300)}`);
    }
    this.log.log(`billets envoyés à ${order.buyer.email} (${order.reference})`);
    return true;
  }
}

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
/** « a@b.c » ou « Nom <a@b.c> », sinon undefined. */
export function validAddress(raw: string | undefined): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  const m = /^[^<>]*<([^<>]+)>$/.exec(v);
  return EMAIL.test(m ? m[1].trim() : v) ? v : undefined;
}
