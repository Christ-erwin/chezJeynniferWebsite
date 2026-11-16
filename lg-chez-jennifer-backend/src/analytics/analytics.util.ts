/**
 * Classement des visites : source (d'où vient le visiteur), appareil, robots.
 * Fonctions pures, testées dans analytics.util.spec.ts.
 */

export type Device = 'mobile' | 'tablet' | 'desktop';

/** Nom de la source, à partir du paramètre de campagne, du référent ou de l'appli. */
export function classifySource(input: { src?: string; ref?: string; ua?: string; ownHosts?: string[] }): string | null {
  const tag = input.src?.trim().toLowerCase();
  if (tag) return byName(tag) ?? capitalize(tag.slice(0, 30));

  let host = '';
  try {
    host = input.ref ? new URL(input.ref).hostname.toLowerCase().replace(/^www\./, '') : '';
  } catch {
    host = '';
  }
  // navigation à l'intérieur du site : pas une nouvelle entrée
  if (host && (input.ownHosts ?? []).some((h) => host === h || host.endsWith(`.${h}`))) return null;
  if (host) return byName(host) ?? host.slice(0, 40);

  // pas de référent : les applis l'indiquent parfois dans leur navigateur intégré
  const ua = input.ua ?? '';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook';
  if (/musical_ly|TikTok|BytedanceWebview/i.test(ua)) return 'TikTok';
  if (/WhatsApp/i.test(ua)) return 'WhatsApp';
  return 'Direct';
}

const NAMES: [RegExp, string][] = [
  [/insta|^ig$/, 'Instagram'],
  [/facebook|^fb$|fb\.com|fb\.me/, 'Facebook'],
  [/whatsapp|wa\.me|^wa$/, 'WhatsApp'],
  [/tiktok/, 'TikTok'],
  [/google/, 'Google'],
  [/bing/, 'Bing'],
  [/youtube|youtu\.be/, 'YouTube'],
  [/snapchat|^snap$/, 'Snapchat'],
  [/twitter|^t\.co$|^x\.com$|^x$/, 'X (Twitter)'],
  [/linkedin|lnkd\.in/, 'LinkedIn'],
  [/telegram|t\.me/, 'Telegram'],
];

function byName(s: string): string | undefined {
  return NAMES.find(([re]) => re.test(s))?.[1];
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function classifyDevice(ua = ''): Device {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android|Opera Mini|IEMobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

/** Robots, aperçus de liens (WhatsApp, Facebook…), navigateurs automatisés : non comptés. */
export function isBot(ua = ''): boolean {
  return !ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|curl|wget|python|axios|node-fetch|vercel/i.test(ua);
}

/** Chemin de page propre (sans paramètres), ou null s'il ne doit pas être compté. */
export function cleanPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.length > 300) return null;
  const path = raw.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (/^\/(admin|ecran|api|_next)(\/|$)/.test(path)) return null;
  // pages propres à une commande : regroupées (sinon une « page » par client)
  if (path.startsWith('/reserver/confirmation/')) return '/reserver/confirmation';
  if (path.startsWith('/paiement/')) return '/paiement';
  return path.slice(0, 120);
}
