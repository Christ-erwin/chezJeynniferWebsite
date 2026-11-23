export const CONCEPTS = ['game-night', 'loup-garou', 'cine-lune', 'beach-party'] as const;
export type ConceptSlug = (typeof CONCEPTS)[number];

/**
 * draft : en préparation (invisible) · published : en ligne et réservable ·
 * hidden : masquée du site (billets vendus toujours valables, vente sur place possible) · cancelled : annulée
 */
export type EventStatus = 'draft' | 'published' | 'hidden' | 'cancelled';

export type PassTier = {
  id: string;
  label: string;
  /** FCFA (XOF), multiple de 5 (Mobile Money) */
  price: number;
  /** places couvertes par un pass */
  seats: number;
  description: string;
  perks: string[];
};

/** Pack offert à chaque participant : modèle et taille choisis à la réservation, pour chaque place. */
export type EventPack = { label: string; styles: string[]; sizes: string[] };

/**
 * Modèle réservé à un sexe : nom terminé par « (fille) » ou « (garçon) ».
 * Ex. « Crop top noir (fille) » → filles seulement ; « T-shirt noir » → tout le monde.
 */
export function styleGender(style: string): 'fille' | 'garcon' | undefined {
  if (/\(\s*filles?\s*\)/i.test(style)) return 'fille';
  if (/\(\s*gar[cç]ons?\s*\)/i.test(style)) return 'garcon';
  return undefined;
}

export const GENDERS = ['fille', 'garcon'] as const;
export type Gender = (typeof GENDERS)[number];

/** Places réservées à chaque sexe (la somme = capacité). */
export type GenderQuota = Record<Gender, number>;

/** Équipe tirée au sort au paiement (ex. Beach Party : Rouge, Bleu, Vert, Jaune). */
export type TeamDef = { name: string; color: string };

export type EventRecord = {
  id: string;
  title: string;
  subtitle: string;
  concepts: ConceptSlug[];
  /** ISO avec fuseau, ex. 2026-11-15T19:00:00+00:00 (Abidjan = UTC+0) */
  startISO: string;
  doors: string;
  endLabel: string;
  venue: { name: string; city: string; address?: string; revealedAfterBooking: boolean };
  cover: string;
  capacity: number;
  /** ouverture de la billetterie en ligne (ISO) : avant, l'édition est visible mais pas encore en vente */
  salesOpenAt?: string;
  pack?: EventPack;
  /** places par sexe : le sexe de chaque participant est demandé à la réservation */
  genders?: GenderQuota;
  /** équipes : chaque billet payé est placé au hasard dans une équipe, à parts égales par sexe */
  teams?: TeamDef[];
  status: EventStatus;
  note?: string;
  tiers: PassTier[];
  createdAt: string;
  updatedAt: string;
};

/** Ce que voit le public : sans adresse précise, avec les places restantes. */
export type PublicEvent = Omit<EventRecord, 'status' | 'createdAt' | 'updatedAt' | 'venue'> & {
  venue: { name: string; city: string; revealedAfterBooking: boolean };
  remaining: number;
  /** places restantes par sexe (éditions avec quotas) */
  remainingByGender?: GenderQuota;
  /** frais de paiement ajoutés en ligne (pour les afficher avant de payer) */
  paymentFee?: { percent: number; fixed: number };
};
