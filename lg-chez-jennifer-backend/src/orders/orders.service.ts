import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { EventsService } from '../events/events.service.js';
import type { EventRecord, PublicEvent } from '../events/event.types.js';
import { PAYMENT_PROVIDER, type PaymentProvider } from '../payments/payment.provider.js';
import { OrdersStore } from './orders.store.js';
import type { Order, OrderItem, OrderStatus, PaymentMethod, PublicOrder, Ticket } from './order.types.js';

/** Une commande non payée bloque ses places pendant ce délai. */
const HOLD_MS = 20 * 60 * 1000;
/** Pas plus de N places par commande en ligne. */
const MAX_SEATS_PER_ORDER = 10;
/** Intervalle minimal entre deux vérifications de statut auprès de l'agrégateur. */
const CHECK_EVERY_MS = 5000;

export type CreateOrderInput = {
  eventId?: unknown;
  items?: unknown;
  buyer?: { name?: unknown; phone?: unknown; email?: unknown };
  paymentMethod?: unknown;
};

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I : lisible à l'oral
function code(len: number) {
  return Array.from(randomBytes(len), (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/** Normalise un numéro ivoirien vers +225XXXXXXXXXX (10 chiffres). */
export function normalizeCiPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('225') && digits.length === 13 ? digits.slice(3) : digits;
  if (!/^(01|05|07|21|25|27)\d{8}$/.test(local)) return null;
  return `+225${local}`;
}

const seatsOf = (o: Order) => o.items.reduce((n, i) => n + i.quantity * i.seats, 0);
const holds = (o: Order) => o.status === 'paid' || o.status === 'pending';

export type CheckinResult =
  | { ok: true; ticket: Ticket; order: Pick<Order, 'reference' | 'eventId' | 'eventTitle' | 'buyer'>; checkedIn: number; total: number }
  | { ok: false; reason: 'unknown' | 'not-paid' | 'already-used' | 'wrong-event'; message: string; ticket?: Ticket; order?: Pick<Order, 'reference' | 'eventId' | 'eventTitle' | 'buyer' | 'status'> };

@Injectable()
export class OrdersService {
  private readonly log = new Logger('Orders');
  private lastCheck = new Map<string, number>();

  constructor(
    private readonly store: OrdersStore,
    private readonly events: EventsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  /* ============================== places ================================ */
  seatsTaken(eventId: string): number {
    this.expireStaleInMemory();
    return this.store
      .all()
      .filter((o) => o.eventId === eventId && holds(o))
      .reduce((s, o) => s + seatsOf(o), 0);
  }

  soldTierIds(eventId: string): Set<string> {
    const ids = new Set<string>();
    for (const o of this.store.all()) if (o.eventId === eventId && o.status === 'paid') o.items.forEach((i) => ids.add(i.tierId));
    return ids;
  }

  hasOrders(eventId: string): boolean {
    return this.store.all().some((o) => o.eventId === eventId && o.status !== 'expired' && o.status !== 'failed');
  }

  toPublicEvent(e: EventRecord): PublicEvent {
    const { status: _s, createdAt: _c, updatedAt: _u, venue, ...rest } = e;
    return {
      ...rest,
      venue: { name: venue.name, city: venue.city, revealedAfterBooking: venue.revealedAfterBooking },
      remaining: Math.max(e.capacity - this.seatsTaken(e.id), 0),
    };
  }

  /* ========================= commande en ligne ========================= */
  async create(input: CreateOrderInput): Promise<{ order: PublicOrder; payment: { provider: string; url: string } }> {
    const event = typeof input.eventId === 'string' ? this.events.get(input.eventId) : undefined;
    if (!event || event.status !== 'published') throw new BadRequestException('Cette soirée est introuvable.');
    if (Date.parse(event.startISO) < Date.now()) throw new BadRequestException('Cette soirée est déjà passée.');

    const items = this.parseItems(event, input.items, MAX_SEATS_PER_ORDER);
    const buyer = this.parseBuyer(input.buyer);
    const method = input.paymentMethod;
    if (method !== 'wave' && method !== 'orange_money') throw new BadRequestException('Choisis Wave ou Orange Money.');

    const order = await this.reserve(event, items, buyer, method, this.provider.name);

    try {
      const init = await this.provider.init(order);
      if (init.providerRef) await this.store.mutate(() => this.store.set({ ...order, providerRef: init.providerRef }));
      return { order: this.toPublic(order), payment: { provider: this.provider.name, url: init.url } };
    } catch (e) {
      await this.store.mutate(() => this.store.set({ ...order, status: 'cancelled', updatedAt: new Date().toISOString() }));
      throw new BadRequestException((e as Error).message);
    }
  }

  async get(id: string): Promise<PublicOrder> {
    let order = this.store.get(id);
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.status === 'pending' && order.provider === 'cinetpay') {
      const last = this.lastCheck.get(id) ?? 0;
      if (Date.now() - last > CHECK_EVERY_MS) {
        this.lastCheck.set(id, Date.now());
        order = await this.applyCheck(order);
      }
    }
    if (order.status === 'pending' && Date.now() - Date.parse(order.createdAt) > HOLD_MS) {
      order = await this.setStatus(order.id, 'expired');
    }
    return this.toPublic(order);
  }

  /** Webhook : on retrouve la commande par sa référence et on relit le statut. */
  async handleNotification(reference: string) {
    const order = this.store.findByReference(reference);
    if (order) await this.applyCheck(order);
  }

  /** Simulateur local uniquement. */
  async confirmMock(id: string, success: boolean): Promise<PublicOrder> {
    const order = this.store.get(id);
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.provider !== 'mock') throw new BadRequestException('Cette commande n’utilise pas le simulateur.');
    if (order.status !== 'pending') return this.toPublic(order);
    return this.toPublic(await this.setStatus(id, success ? 'paid' : 'failed'));
  }

  /* ================================ admin ================================ */
  list(filter: { eventId?: string; status?: string; q?: string }): Order[] {
    this.expireStaleInMemory();
    const q = filter.q?.trim().toLowerCase();
    return this.store
      .all()
      .filter((o) => !filter.eventId || o.eventId === filter.eventId)
      .filter((o) => !filter.status || o.status === filter.status)
      .filter(
        (o) =>
          !q ||
          o.reference.toLowerCase().includes(q) ||
          o.buyer.name.toLowerCase().includes(q) ||
          o.buyer.phone.includes(q.replace(/\s/g, '')) ||
          (o.buyer.email ?? '').toLowerCase().includes(q) ||
          o.tickets.some((t) => t.code.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getAdmin(id: string): Order {
    const o = this.store.get(id);
    if (!o) throw new NotFoundException('Commande introuvable.');
    return o;
  }

  /** Vente sur place / par WhatsApp, enregistrée directement comme payée. */
  async createManual(input: CreateOrderInput & { method?: unknown }): Promise<Order> {
    const event = typeof input.eventId === 'string' ? this.events.get(input.eventId) : undefined;
    if (!event) throw new BadRequestException('Édition introuvable.');
    if (event.status === 'cancelled') throw new BadRequestException('Cette édition est annulée.');
    const items = this.parseItems(event, input.items, 50);
    const buyer = this.parseBuyer(input.buyer);
    const method = input.method ?? input.paymentMethod;
    if (method !== 'wave' && method !== 'orange_money' && method !== 'cash') throw new BadRequestException('Moyen de paiement invalide.');
    const order = await this.reserve(event, items, buyer, method, 'manual');
    return this.setStatus(order.id, 'paid', 'vente enregistrée par l’admin');
  }

  /** Paiement reçu hors site (ex. transfert direct) : on valide à la main. */
  async markPaid(id: string): Promise<Order> {
    const o = this.getAdmin(id);
    if (o.status === 'paid') return o;
    if (o.status !== 'pending') {
      // une commande expirée/échouée peut être réactivée si les places sont encore là
      const event = this.events.require(o.eventId);
      if (this.seatsTaken(o.eventId) + seatsOf(o) > event.capacity) throw new ConflictException('Plus assez de places pour valider cette commande.');
      await this.store.mutate(() => this.store.set({ ...o, status: 'pending' }));
    }
    return this.setStatus(id, 'paid', 'paiement validé manuellement');
  }

  /** Annule une commande (libère les places). Le remboursement se fait hors site. */
  cancel(id: string): Promise<Order> {
    return this.store.mutate(() => {
      const o = this.getAdmin(id);
      if (o.status === 'cancelled') return o;
      if (o.tickets.some((t) => t.usedAt)) throw new ConflictException('Un billet de cette commande a déjà été scanné à l’entrée.');
      const now = new Date().toISOString();
      const next: Order = { ...o, status: 'cancelled', updatedAt: now, history: [...(o.history ?? []), { at: now, action: `annulée (était : ${o.status})` }] };
      this.store.set(next);
      return next;
    });
  }

  /** Contrôle à l'entrée : valide un billet une seule fois. */
  checkin(rawCode: unknown, eventId?: string): Promise<CheckinResult> {
    const codeStr = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
    return this.store.mutate((): CheckinResult => {
      const order = this.store.all().find((o) => o.tickets.some((t) => t.code === codeStr));
      if (!codeStr || !order) return { ok: false, reason: 'unknown', message: 'Billet inconnu.' };
      const ticket = order.tickets.find((t) => t.code === codeStr)!;
      const info = { reference: order.reference, eventId: order.eventId, eventTitle: order.eventTitle, buyer: order.buyer, status: order.status };
      if (eventId && order.eventId !== eventId) return { ok: false, reason: 'wrong-event', message: `Billet valable pour « ${order.eventTitle} », pas pour cette soirée.`, ticket, order: info };
      if (order.status !== 'paid') return { ok: false, reason: 'not-paid', message: 'Commande non payée ou annulée.', ticket, order: info };
      if (ticket.usedAt) return { ok: false, reason: 'already-used', message: 'Billet déjà utilisé.', ticket, order: info };
      const now = new Date().toISOString();
      const tickets = order.tickets.map((t) => (t.code === codeStr ? { ...t, usedAt: now } : t));
      this.store.set({ ...order, tickets, updatedAt: now });
      const all = this.store.all().filter((o) => o.eventId === order.eventId && o.status === 'paid');
      return {
        ok: true,
        ticket: { ...ticket, usedAt: now },
        order: { reference: order.reference, eventId: order.eventId, eventTitle: order.eventTitle, buyer: order.buyer },
        checkedIn: all.reduce((n, o) => n + o.tickets.filter((t) => t.usedAt).length, 0),
        total: all.reduce((n, o) => n + o.tickets.length, 0),
      };
    });
  }

  stats() {
    this.expireStaleInMemory();
    const orders = this.store.all();
    const paid = orders.filter((o) => o.status === 'paid');
    const byMethod = (m: PaymentMethod) => paid.filter((o) => o.paymentMethod === m).reduce((s, o) => s + o.total, 0);
    const since = (days: number) => Date.now() - days * 86400000;
    const perEvent = this.events.all().map((e) => {
      const eo = orders.filter((o) => o.eventId === e.id);
      const ep = eo.filter((o) => o.status === 'paid');
      return {
        id: e.id,
        title: e.title,
        startISO: e.startISO,
        status: e.status,
        capacity: e.capacity,
        seatsSold: ep.reduce((s, o) => s + seatsOf(o), 0),
        seatsPending: eo.filter((o) => o.status === 'pending').reduce((s, o) => s + seatsOf(o), 0),
        revenue: ep.reduce((s, o) => s + o.total, 0),
        orders: ep.length,
        checkedIn: ep.reduce((n, o) => n + o.tickets.filter((t) => t.usedAt).length, 0),
        tickets: ep.reduce((n, o) => n + o.tickets.length, 0),
      };
    });
    // ventes des 14 derniers jours (pour le graphique)
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
      const dayPaid = paid.filter((o) => (o.paidAt ?? o.createdAt).slice(0, 10) === d);
      return { date: d, revenue: dayPaid.reduce((s, o) => s + o.total, 0), tickets: dayPaid.reduce((n, o) => n + o.tickets.length, 0) };
    });
    return {
      revenue: paid.reduce((s, o) => s + o.total, 0),
      revenue7d: paid.filter((o) => Date.parse(o.paidAt ?? o.createdAt) >= since(7)).reduce((s, o) => s + o.total, 0),
      ticketsSold: paid.reduce((n, o) => n + o.tickets.length, 0),
      ordersPaid: paid.length,
      ordersPending: orders.filter((o) => o.status === 'pending').length,
      conversion: orders.length ? paid.length / orders.filter((o) => o.status !== 'pending').length || 0 : 0,
      byMethod: { wave: byMethod('wave'), orange_money: byMethod('orange_money'), cash: byMethod('cash') },
      perEvent,
      days,
    };
  }

  toCsv(orders: Order[]): string {
    const esc = (v: unknown) => {
      const s = String(v ?? '');
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = ['Référence', 'Statut', 'Édition', 'Date commande', 'Nom', 'Téléphone', 'E-mail', 'Passes', 'Places', 'Total (FCFA)', 'Paiement', 'Payé le', 'Billets', 'Scannés'];
    const rows = orders.map((o) => [
      o.reference,
      o.status,
      o.eventTitle,
      o.createdAt,
      o.buyer.name,
      o.buyer.phone,
      o.buyer.email ?? '',
      o.items.map((i) => `${i.quantity}x ${i.label}`).join(' + '),
      seatsOf(o),
      o.total,
      o.paymentMethod,
      o.paidAt ?? '',
      o.tickets.map((t) => t.code).join(' '),
      o.tickets.filter((t) => t.usedAt).length,
    ]);
    // BOM + point-virgule : s'ouvre proprement dans Excel en français
    return '﻿' + [head, ...rows].map((r) => r.map(esc).join(';')).join('\n');
  }

  /* ============================== internes ============================== */
  private parseItems(event: EventRecord, raw: unknown, maxSeats: number): OrderItem[] {
    if (!Array.isArray(raw) || raw.length === 0) throw new BadRequestException('Choisis au moins un pass.');
    const items: OrderItem[] = [];
    for (const r of raw as { tierId?: unknown; quantity?: unknown }[]) {
      const tier = event.tiers.find((t) => t.id === r?.tierId);
      const qty = Number(r?.quantity);
      if (!tier) throw new BadRequestException('Pass inconnu.');
      if (!Number.isInteger(qty) || qty < 0 || qty > maxSeats) throw new BadRequestException('Quantité invalide.');
      if (qty > 0) items.push({ tierId: tier.id, label: tier.label, quantity: qty, unitPrice: tier.price, seats: tier.seats });
    }
    const seats = items.reduce((s, i) => s + i.quantity * i.seats, 0);
    if (seats === 0) throw new BadRequestException('Choisis au moins un pass.');
    if (seats > maxSeats) throw new BadRequestException(`Pas plus de ${maxSeats} places par commande.`);
    return items;
  }

  private parseBuyer(raw: CreateOrderInput['buyer']): Order['buyer'] {
    const name = typeof raw?.name === 'string' ? raw.name.trim().replace(/\s+/g, ' ') : '';
    if (name.length < 2 || name.length > 80) throw new BadRequestException('Indique ton nom et prénom.');
    const phone = typeof raw?.phone === 'string' ? normalizeCiPhone(raw.phone) : null;
    if (!phone) throw new BadRequestException('Numéro de téléphone ivoirien invalide (10 chiffres, ex. 07 07 07 07 07).');
    const email = typeof raw?.email === 'string' ? raw.email.trim() : '';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Adresse e-mail invalide.');
    return { name, phone, ...(email ? { email } : {}) };
  }

  /** Bloque les places sous verrou (pas de survente) et crée la commande en attente. */
  private reserve(event: EventRecord, items: OrderItem[], buyer: Order['buyer'], method: PaymentMethod, provider: Order['provider']): Promise<Order> {
    const seats = items.reduce((s, i) => s + i.quantity * i.seats, 0);
    return this.store.mutate(() => {
      this.expireStaleInMemory();
      const taken = this.store
        .all()
        .filter((o) => o.eventId === event.id && holds(o))
        .reduce((s, o) => s + seatsOf(o), 0);
      if (taken + seats > event.capacity) {
        const left = Math.max(event.capacity - taken, 0);
        throw new ConflictException(left === 0 ? 'Cette soirée est complète.' : `Il ne reste que ${left} place(s).`);
      }
      const now = new Date().toISOString();
      const order: Order = {
        id: randomUUID(),
        reference: `JEY-${code(6)}`,
        eventId: event.id,
        eventTitle: `${event.title} chez Jeynnifer`,
        eventDate: event.startISO,
        status: 'pending',
        paymentMethod: method,
        buyer,
        items,
        total: items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
        currency: 'XOF',
        createdAt: now,
        updatedAt: now,
        provider,
        tickets: [],
      };
      this.store.set(order);
      return order;
    });
  }

  private async applyCheck(order: Order): Promise<Order> {
    try {
      const result = await this.provider.check(order);
      if (result === 'paid') return this.setStatus(order.id, 'paid');
      if (result === 'failed') return this.setStatus(order.id, 'failed');
    } catch (e) {
      this.log.warn(`vérification impossible pour ${order.reference} : ${(e as Error).message}`);
    }
    return order;
  }

  private setStatus(id: string, status: OrderStatus, note?: string): Promise<Order> {
    return this.store.mutate(() => {
      const current = this.store.get(id)!;
      if (current.status !== 'pending') return current; // idempotent : un paiement validé ne se dé-valide pas
      const now = new Date().toISOString();
      const next: Order = { ...current, status, updatedAt: now };
      if (note) next.history = [...(current.history ?? []), { at: now, action: note }];
      if (status === 'paid') {
        next.paidAt = now;
        next.tickets = this.issueTickets(current);
        this.log.log(`commande payée ${current.reference} — ${current.total} XOF`);
      }
      this.store.set(next);
      return next;
    });
  }

  private issueTickets(order: Order): Ticket[] {
    const tickets: Ticket[] = [];
    for (const item of order.items) {
      for (let i = 0; i < item.quantity * item.seats; i++) {
        tickets.push({ code: `${order.reference}-${code(4)}`, label: item.label, holder: order.buyer.name });
      }
    }
    return tickets;
  }

  /** Expire en mémoire les commandes en attente trop anciennes (persisté au prochain mutate). */
  private expireStaleInMemory() {
    const now = Date.now();
    for (const o of this.store.all()) {
      if (o.status === 'pending' && now - Date.parse(o.createdAt) > HOLD_MS) {
        this.store.set({ ...o, status: 'expired', updatedAt: new Date().toISOString() });
      }
    }
  }

  toPublic(o: Order): PublicOrder {
    const event = this.events.get(o.eventId);
    return {
      id: o.id,
      reference: o.reference,
      eventId: o.eventId,
      eventTitle: o.eventTitle,
      eventDate: o.eventDate,
      status: o.status,
      paymentMethod: o.paymentMethod,
      buyer: o.buyer,
      items: o.items.map(({ seats: _seats, ...rest }) => rest),
      total: o.total,
      currency: o.currency,
      createdAt: o.createdAt,
      tickets: o.status === 'paid' ? o.tickets.map(({ usedAt: _u, ...t }) => t) : [],
      // l'adresse précise n'est révélée qu'une fois le paiement validé
      venue: event
        ? { name: event.venue.name, city: event.venue.city, ...(o.status === 'paid' && event.venue.address ? { address: event.venue.address } : {}) }
        : undefined,
    };
  }
}
