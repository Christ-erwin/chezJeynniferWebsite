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
  ];
}
