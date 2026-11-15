import type { EventRecord } from '../events/event.types.js';
import type { Order } from '../orders/order.types.js';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Abidjan' })
    .format(new Date(iso))
    .replace(':', 'h');

const fcfa = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/\s/g, ' ')} FCFA`;

export type TicketEmail = { subject: string; html: string; text: string };

/**
 * E-mail « tes billets » : un bloc par billet (QR code en image intégrée
 * cid:qr-<i>, code, titulaire, équipe, pack), puis l'adresse et le lien vers
 * la page des billets. Mise en page en tableaux + styles en ligne : c'est ce
 * que les messageries (Gmail, Outlook, Apple Mail) affichent correctement.
 */
export function ticketEmail(order: Order, event: EventRecord | undefined, links: { tickets: string; logo: string; whatsapp?: string }): TicketEmail {
  const first = order.buyer.name.split(' ')[0];
  const title = order.eventTitle;
  const n = order.tickets.length;
  const venue = event ? [event.venue.name, event.venue.city].filter(Boolean).join(', ') : '';
  const address = event?.venue.address;

  const ticketBlocks = order.tickets
    .map((t, i) => {
      // l'équipe : bandeau pleine largeur en haut du billet (lisible aussi sur téléphone)
      const team = t.team
        ? `<tr><td colspan="2" style="background:${t.team.color};color:${isLight(t.team.color) ? '#141213' : '#ffffff'};padding:10px 16px;border-radius:15px 15px 0 0;font-weight:700;font-size:13px;letter-spacing:.14em;text-transform:uppercase">Équipe ${esc(t.team.name)}</td></tr>`
        : '';
      const pack = t.pack ? `<tr><td style="padding-top:6px;color:#5c5652;font-size:13px;line-height:1.4">Pack : ${esc(t.pack.style)} · ${esc(t.pack.size)}</td></tr>` : '';
      return `
      <tr><td style="padding:0 0 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6e1da;border-radius:16px;background:#ffffff">
          ${team}
          <tr>
            <td width="132" style="padding:14px" valign="top">
              <img src="cid:qr-${i}" width="118" height="118" alt="QR code du billet ${esc(t.code)}" style="display:block;border:0" />
            </td>
            <td style="padding:14px 14px 14px 0" valign="middle">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td style="color:#8b857e;font-size:11px;letter-spacing:.12em;text-transform:uppercase">Billet ${n > 1 ? `${i + 1}/${n}` : ''}</td></tr>
                <tr><td style="padding-top:4px;font-size:18px;line-height:1.25;font-weight:700;color:#141213">${esc(t.holder)}</td></tr>
                <tr><td style="padding-top:2px;color:#5c5652;font-size:13px">${esc(t.label)}</td></tr>
                ${pack}
                <tr><td style="padding-top:8px;font-family:Menlo,Consolas,monospace;font-size:12px;color:#141213;white-space:nowrap">${esc(t.code)}</td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td></tr>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:Helvetica,Arial,sans-serif;color:#141213">
  <div style="display:none;max-height:0;overflow:hidden">Tes ${n > 1 ? `${n} billets` : 'billet'} pour ${esc(title)} : présente le QR code à l'entrée.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td style="background:#ffffff;padding:24px 24px 8px;border-radius:16px;border:1px solid #e6e1da">
          <img src="${esc(links.logo)}" width="96" alt="Les Soirées chez Jeynnifer" style="display:block;border:0;max-width:96px;height:auto" />
          <p style="margin:20px 0 0;color:#5c5652;font-size:13px">Commande ${esc(order.reference)} · paiement confirmé</p>
          <h1 style="margin:6px 0 0;font-size:22px;line-height:1.3;font-weight:700">Bonjour ${esc(first)}, voici ${n > 1 ? 'tes billets' : 'ton billet'}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#141213">
            ${n > 1 ? `${n} billets` : '1 billet'} pour <strong>${esc(title)}</strong>. Présente ${n > 1 ? 'chaque' : 'le'} QR code à l'entrée${n > 1 ? ' : un code par personne' : ''}.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 6px;border-top:1px solid #e6e1da;border-bottom:1px solid #e6e1da">
            <tr><td style="padding:14px 0;font-size:14px;line-height:1.7">
              <strong>Quand :</strong> ${esc(fmtDate(order.eventDate))}<br />
              ${venue ? `<strong>Où :</strong> ${esc(venue)}<br />` : ''}
              ${address ? `<strong>Adresse :</strong> ${esc(address)}<br />` : ''}
              <strong>Commande :</strong> ${esc(order.reference)} · ${esc(fcfa(order.total))}
            </td></tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">${ticketBlocks}</table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:4px 0 22px;font-size:14px;line-height:1.6;color:#5c5652">
              Tes billets sont aussi disponibles en ligne : <a href="${esc(links.tickets)}" style="color:#e3092b;font-weight:700">voir mes billets</a>.
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:20px 12px;color:#8b857e;font-size:12px;line-height:1.6">
          Une question ? ${links.whatsapp ? `<a href="${esc(links.whatsapp)}" style="color:#e3092b">Écris-nous sur WhatsApp</a>` : 'Réponds simplement à cet e-mail'}.<br />
          Les Soirées chez Jeynnifer · Abidjan
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `À très vite, ${first} !`,
    '',
    `Paiement confirmé. Voici ${n > 1 ? `tes ${n} billets` : 'ton billet'} pour ${title}.`,
    `Quand : ${fmtDate(order.eventDate)}`,
    venue ? `Où : ${venue}` : '',
    address ? `Adresse : ${address}` : '',
    `Commande : ${order.reference} · ${fcfa(order.total)}`,
    '',
    ...order.tickets.map(
      (t, i) =>
        `Billet ${i + 1} — ${t.holder} — ${t.code}${t.team ? ` — Équipe ${t.team.name}` : ''}${t.pack ? ` — Pack ${t.pack.style} · ${t.pack.size}` : ''}`,
    ),
    '',
    `Tes billets (QR codes) : ${links.tickets}`,
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n');

  // objet de reçu (référence + « confirmée ») : aide Gmail à classer l'e-mail en « Principale »
  return { subject: `Commande ${order.reference} confirmée · ${n > 1 ? 'tes billets' : 'ton billet'} pour ${title}`, html, text };
}

/** Couleur claire (ex. jaune) : texte foncé par-dessus. */
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const v = parseInt(m[1], 16);
  const [r, g, b] = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}
