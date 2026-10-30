/** Wave / Orange Money passent par l'agrégateur ; "cash" = vente enregistrée à la main par l'admin. */
export type PaymentMethod = 'wave' | 'orange_money' | 'cash';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';

export type OrderItem = { tierId: string; label: string; quantity: number; unitPrice: number; seats: number };

export type Ticket = { code: string; label: string; holder: string; usedAt?: string };

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
  total: number;
  currency: 'XOF';
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  provider: 'mock' | 'cinetpay' | 'manual';
  providerRef?: string;
  tickets: Ticket[];
  /** trace des actions faites depuis l'admin */
  history?: { at: string; action: string }[];
};

/** Vue renvoyée au navigateur du client (sans champs internes). */
export type PublicOrder = Omit<Order, 'provider' | 'providerRef' | 'updatedAt' | 'paidAt' | 'items' | 'history'> & {
  items: Omit<OrderItem, 'seats'>[];
  venue?: { name: string; city: string; address?: string };
};
