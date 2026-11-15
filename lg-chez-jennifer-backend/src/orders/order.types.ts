import type { Gender, TeamDef } from '../events/event.types.js';

/** Wave / Orange Money passent par l'agrégateur ; "cash" = vente enregistrée à la main par l'admin. */
export type PaymentMethod = 'wave' | 'orange_money' | 'cash';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';

export type OrderItem = { tierId: string; label: string; quantity: number; unitPrice: number; seats: number };

/** Choix du pack offert pour une place (modèle + taille). */
export type PackChoice = { style: string; size: string };

/** Une place : qui vient (nom) et son sexe (éditions avec quotas / équipes). */
export type Participant = { name?: string; gender?: Gender };

export type Ticket = {
  code: string;
  label: string;
  holder: string;
  usedAt?: string;
  pack?: PackChoice;
  gender?: Gender;
  /** équipe tirée au sort au paiement */
  team?: TeamDef;
};

export type Order = {
  id: string;
  /** référence courte lisible, communiquée au client et envoyée à l'agrégateur */
  reference: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  buyer: { name: string; phone: string; email?: string };
  items: OrderItem[];
  /** un choix de pack par place, dans l'ordre des billets (éditions avec pack offert) */
  packs?: PackChoice[];
  /** une entrée par place, dans l'ordre des billets */
  participants?: Participant[];
  /** montant payé par le client = billets + frais de paiement */
  total: number;
  /** frais de paiement répercutés sur le client (inclus dans total) ; absent = aucun */
  fee?: number;
  currency: 'XOF';
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  provider: 'mock' | 'geniuspay' | 'manual';
  providerRef?: string;
  tickets: Ticket[];
  /** billets envoyés par e-mail */
  emailedAt?: string;
  /** édition supprimée : la commande a été annulée à ce moment-là */
  eventDeletedAt?: string;
  /** remboursement à faire au client (commande payée d'une édition supprimée) ; doneAt = remboursé */
  refund?: { amount: number; doneAt?: string };
  /** droit à l'image accepté par l'acheteur (pour lui et sa réservation), case cochée avant paiement */
  imageConsentAt?: string;
  /** trace des actions faites depuis l'admin */
  history?: { at: string; action: string }[];
};

/** Vue renvoyée au navigateur du client (sans champs internes). */
export type PublicOrder = Omit<Order, 'provider' | 'providerRef' | 'updatedAt' | 'paidAt' | 'items' | 'history' | 'emailedAt'> & {
  items: Omit<OrderItem, 'seats'>[];
  venue?: { name: string; city: string; address?: string };
};
