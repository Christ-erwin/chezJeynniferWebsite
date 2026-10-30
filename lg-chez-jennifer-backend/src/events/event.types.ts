export const CONCEPTS = ['game-night', 'loup-garou', 'cine-lune'] as const;
export type ConceptSlug = (typeof CONCEPTS)[number];

export type EventStatus = 'draft' | 'published' | 'cancelled';

export type PassTier = {
  id: string;
  label: string;
  /** FCFA (XOF), multiple de 5 (contrainte CinetPay) */
  price: number;
  /** places couvertes par un pass */
  seats: number;
  description: string;
  perks: string[];
};

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
};
