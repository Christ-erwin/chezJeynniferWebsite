import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JsonCollection } from '../common/json-collection.js';
import { CONCEPTS, type ConceptSlug, type EventRecord, type EventStatus, type PassTier } from './event.types.js';
import { seedEvents } from './events.seed.js';

const STATUSES: EventStatus[] = ['draft', 'published', 'cancelled'];

function str(v: unknown, field: string, { min = 1, max = 200, optional = false } = {}): string {
  if (v === undefined || v === null || v === '') {
    if (optional) return '';
    throw new BadRequestException(`${field} : champ obligatoire.`);
  }
  if (typeof v !== 'string') throw new BadRequestException(`${field} : texte attendu.`);
  const s = v.trim();
  if (s.length < min || s.length > max) throw new BadRequestException(`${field} : entre ${min} et ${max} caractères.`);
  return s;
}

function int(v: unknown, field: string, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new BadRequestException(`${field} : nombre entier entre ${min} et ${max}.`);
  return n;
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/** Valide et normalise une édition envoyée par l'admin. */
function parseEvent(raw: Record<string, unknown>): Omit<EventRecord, 'id' | 'createdAt' | 'updatedAt'> {
  const concepts = Array.isArray(raw.concepts) ? raw.concepts : [];
  if (concepts.length === 0 || !concepts.every((c) => CONCEPTS.includes(c as ConceptSlug))) {
    throw new BadRequestException('Choisis au moins un univers (Game Night, Loup-Garou, CinéLune).');
  }
  const startISO = str(raw.startISO, 'Date et heure');
  if (Number.isNaN(Date.parse(startISO))) throw new BadRequestException('Date et heure invalides.');

  const venueRaw = (raw.venue ?? {}) as Record<string, unknown>;
  const status = (raw.status ?? 'draft') as EventStatus;
  if (!STATUSES.includes(status)) throw new BadRequestException('Statut invalide.');

  const tiersRaw = Array.isArray(raw.tiers) ? (raw.tiers as Record<string, unknown>[]) : [];
  if (tiersRaw.length === 0) throw new BadRequestException('Ajoute au moins un pass (tarif).');
  const ids = new Set<string>();
  const tiers: PassTier[] = tiersRaw.map((t, i) => {
    const label = str(t.label, `Pass ${i + 1} — nom`, { max: 60 });
    const id = slugify(typeof t.id === 'string' && t.id ? t.id : label) || `pass-${i + 1}`;
    if (ids.has(id)) throw new BadRequestException(`Deux passes ont le même identifiant (${id}).`);
    ids.add(id);
    const price = int(t.price, `${label} — prix`, 100, 1_000_000);
    if (price % 5 !== 0) throw new BadRequestException(`${label} — le prix doit être un multiple de 5 FCFA (Mobile Money).`);
    return {
      id,
      label,
      price,
      seats: int(t.seats ?? 1, `${label} — places`, 1, 10),
      description: str(t.description, `${label} — description`, { optional: true, max: 240 }),
      perks: (Array.isArray(t.perks) ? t.perks : [])
        .filter((p): p is string => typeof p === 'string' && p.trim() !== '')
        .map((p) => p.trim().slice(0, 60))
        .slice(0, 8),
    };
  });

  const cover = str(raw.cover, 'Image', { max: 300 });
  if (!cover.startsWith('/') && !cover.startsWith('https://')) throw new BadRequestException('Image : chemin /images/… ou URL https.');

  return {
    title: str(raw.title, 'Titre', { max: 80 }),
    subtitle: str(raw.subtitle, 'Sous-titre', { optional: true, max: 140 }),
    concepts: concepts as ConceptSlug[],
    startISO: new Date(startISO).toISOString(),
    doors: str(raw.doors, 'Ouverture des portes', { max: 20 }),
    endLabel: str(raw.endLabel, 'Fin', { max: 20 }),
    venue: {
      name: str(venueRaw.name, 'Lieu', { max: 100 }),
      city: str(venueRaw.city, 'Ville', { max: 60 }),
      address: str(venueRaw.address, 'Adresse', { optional: true, max: 240 }) || undefined,
      revealedAfterBooking: venueRaw.revealedAfterBooking !== false,
    },
    cover,
    capacity: int(raw.capacity, 'Capacité', 1, 5000),
    status,
    note: str(raw.note, 'Note', { optional: true, max: 400 }) || undefined,
    tiers,
  };
}

@Injectable()
export class EventsService {
  readonly store = new JsonCollection<EventRecord>(process.env.EVENTS_FILE ?? 'data/events.json', seedEvents);

  get(id: string): EventRecord | undefined {
    return this.store.get(id);
  }

  require(id: string): EventRecord {
    const e = this.store.get(id);
    if (!e) throw new NotFoundException('Édition introuvable.');
    return e;
  }

  all(): EventRecord[] {
    return this.store.all().sort((a, b) => a.startISO.localeCompare(b.startISO));
  }

  /** Publiées et à venir — ce que le site affiche. */
  published(now = Date.now()): EventRecord[] {
    return this.all().filter((e) => e.status === 'published' && Date.parse(e.startISO) >= now);
  }

  create(raw: Record<string, unknown>): Promise<EventRecord> {
    const data = parseEvent(raw);
    return this.store.mutate(() => {
      let id = slugify(typeof raw.id === 'string' && raw.id ? raw.id : `${data.title}-${data.startISO.slice(0, 10)}`);
      if (!id) id = `edition-${Date.now()}`;
      if (this.store.get(id)) id = `${id}-${Date.now().toString(36).slice(-4)}`;
      const now = new Date().toISOString();
      const record: EventRecord = { ...data, id, createdAt: now, updatedAt: now };
      this.store.set(record);
      return record;
    });
  }

  /**
   * Mise à jour. `soldTierIds` : passes déjà vendus — on interdit de les
   * supprimer ou de changer leurs places (les billets émis y font référence).
   */
  update(id: string, raw: Record<string, unknown>, soldTierIds: Set<string>, seatsTaken: number): Promise<EventRecord> {
    const data = parseEvent(raw);
    return this.store.mutate(() => {
      const current = this.require(id);
      for (const tid of soldTierIds) {
        const before = current.tiers.find((t) => t.id === tid);
        const after = data.tiers.find((t) => t.id === tid);
        if (!after) throw new ConflictException(`Le pass « ${before?.label ?? tid} » a déjà été vendu : il ne peut pas être supprimé.`);
        if (before && after.seats !== before.seats) throw new ConflictException(`Le pass « ${after.label} » a déjà été vendu : son nombre de places ne peut plus changer.`);
      }
      if (data.capacity < seatsTaken) throw new ConflictException(`Capacité trop basse : ${seatsTaken} places sont déjà réservées.`);
      const next: EventRecord = { ...data, id, createdAt: current.createdAt, updatedAt: new Date().toISOString() };
      this.store.set(next);
      return next;
    });
  }

  remove(id: string, hasOrders: boolean): Promise<void> {
    return this.store.mutate(() => {
      this.require(id);
      if (hasOrders) throw new ConflictException('Des commandes existent pour cette édition : passe-la plutôt en « Annulée ».');
      this.store.delete(id);
    });
  }
}
