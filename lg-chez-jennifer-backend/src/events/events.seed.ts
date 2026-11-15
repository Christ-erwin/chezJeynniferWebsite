import type { EventRecord, PassTier } from './event.types.js';

/**
 * Éditions de départ, écrites dans data/events.json au premier démarrage.
 * Ensuite tout se gère depuis l'espace admin. ⚠️ Données d'exemple.
 */
const solo = (price: number, extra: string[] = []): PassTier => ({
  id: 'solo',
  label: 'Pass Solo',
  price,
  seats: 1,
  description: 'Une place. Tu viens seul·e — c’est parfait, tu repartiras accompagné·e.',
  perks: ['1 entrée', ...extra],
});
const duo = (price: number, extra: string[] = []): PassTier => ({
  id: 'duo',
  label: 'Pass Duo',
  price,
  seats: 2,
  description: 'Deux places, entre amis ou en couple, à prix doux.',
  perks: ['2 entrées', ...extra],
});

export function seedEvents(): EventRecord[] {
  const now = new Date().toISOString();
  const base = { status: 'published' as const, createdAt: now, updatedAt: now };
  return [
    {
      ...base,
      id: 'halloween-2026',
      title: 'Halloween',
      subtitle: 'La nuit où les trois univers se rencontrent',
      concepts: ['loup-garou', 'game-night', 'cine-lune'],
      startISO: '2026-10-30T19:00:00+00:00',
      doors: '19h00',
      endLabel: '02h00',
      venue: { name: 'Lieu secret', city: 'Abidjan', address: 'Adresse communiquée par WhatsApp la veille', revealedAfterBooking: true },
      cover: '/images/ev-halloween.jpg',
      capacity: 80,
      tiers: [solo(10000, ['1 cocktail d’accueil']), duo(18000, ['2 cocktails d’accueil'])],
      note: 'Costume conseillé. L’adresse est envoyée après confirmation du paiement.',
    },
    {
      ...base,
      id: 'game-night-2026-11',
      title: 'Game Night',
      subtitle: 'UNO, mimes, Devine Tête & défis',
      concepts: ['game-night'],
      startISO: '2026-11-15T19:00:00+00:00',
      doors: '19h00',
      endLabel: '01h00',
      venue: { name: 'Abidjan', city: 'Abidjan', address: 'Adresse communiquée par WhatsApp la veille', revealedAfterBooking: true },
      cover: '/images/ev-gn.jpg',
      capacity: 60,
      tiers: [solo(5000), duo(9000)],
    },
    {
      ...base,
      id: 'cine-lune-2026-12',
      title: 'CinéLune',
      subtitle: 'Séance en plein air sous les guirlandes',
      concepts: ['cine-lune'],
      startISO: '2026-12-10T19:30:00+00:00',
      doors: '19h30',
      endLabel: '23h30',
      venue: { name: 'Jardin — Abidjan', city: 'Abidjan', address: 'Adresse communiquée par WhatsApp la veille', revealedAfterBooking: true },
      cover: '/images/ev-cine.jpg',
      capacity: 50,
      tiers: [solo(5000, ['Popcorn offert']), duo(9000, ['Popcorn offert x2'])],
      note: 'Plaids et coussins fournis. Le film est annoncé une semaine avant.',
    },
    BEACH_PARTY_NOEL_2026(base),
  ];
}

/** Jeynnifer Beach Party, édition 01 : Spéciale Noël à Assinie (affiche du 12 → 13 décembre 2026). */
export const BEACH_TEAMS = [
  { name: 'Rouge', color: '#e3092b' },
  { name: 'Bleu', color: '#2f6fed' },
  { name: 'Vert', color: '#1fae5b' },
  { name: 'Jaune', color: '#f5c518' },
];

export const BEACH_PARTY_NOEL_2026 =(base: Pick<EventRecord, 'status' | 'createdAt' | 'updatedAt'>): EventRecord => ({
  ...base,
  id: 'beach-party-noel-2026',
  title: 'Beach Party · Spéciale Noël',
  subtitle: 'Deux jours à Assinie pour déconnecter, s’amuser et replonger dans nos souvenirs d’enfance.',
  concepts: ['beach-party', 'loup-garou', 'cine-lune'],
  startISO: '2026-12-12T10:00:00+00:00',
  doors: 'Départ 10h00',
  endLabel: 'Dim. 13 · 10h00',
  venue: { name: 'Assinie', city: 'Assinie', address: 'Départ en car depuis Abidjan : point de rendez-vous envoyé par WhatsApp', revealedAfterBooking: true },
  cover: '/images/bp-affiche-noel.jpg',
  capacity: 32,
  salesOpenAt: '2026-11-16T10:00:00+00:00',
  pack: { label: 'Pack personnalisé', styles: ['T-shirt noir', 'Crop top noir (fille)'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  // 16 filles + 16 garçons, répartis au paiement en 4 équipes de 4 filles + 4 garçons
  genders: { fille: 16, garcon: 16 },
  teams: BEACH_TEAMS,
  tiers: [
    {
      id: 'beach-pass',
      label: 'Pass Beach Party',
      price: 60000,
      seats: 1,
      description: 'Le week-end complet, du départ d’Abidjan le samedi au retour le dimanche.',
      perks: [
        'Transport aller-retour en car',
        'Balade et visite en bateau',
        'Accès au site et espace de repos',
        'Buffet du midi et barbecue du soir',
        'Jeux, DJ et Loup-Garou au feu de camp',
        'Cinéma en plein air',
        'Pack personnalisé offert',
      ],
    },
  ],
  note: 'Départ d’Abidjan en car le samedi à 10h, retour le dimanche après 10h. Nuit sur place. Pack offert : t-shirt noir, ou crop top noir au choix pour les filles.',
});
