/**
 * Point d'entrée unique pour parler au backend NestJS.
 * L'URL de base vient de NEXT_PUBLIC_API_BASE_URL (voir .env.local).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(
      "Le service de réservation est injoignable pour le moment. Réessaie dans un instant.",
      0,
    );
  }
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body.message) message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    } catch {
      /* corps non JSON */
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

/* ---------------------------------- santé --------------------------------- */
export type HealthResponse = { status: string; service: string; timestamp: string };

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health", { cache: "no-store" });
}

/* -------------------------------- commandes ------------------------------- */
export type PaymentMethod = "wave" | "orange_money";

export type CreateOrderInput = {
  eventId: string;
  items: { tierId: string; quantity: number }[];
  buyer: { name: string; phone: string; email?: string };
  paymentMethod: PaymentMethod;
};

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "expired";

export type Ticket = { code: string; label: string; holder: string };

export type Order = {
  id: string;
  reference: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  buyer: { name: string; phone: string; email?: string };
  items: { tierId: string; label: string; quantity: number; unitPrice: number }[];
  total: number;
  currency: "XOF";
  createdAt: string;
  venue?: { name: string; city: string; address?: string };
  tickets: Ticket[];
};

export type CreateOrderResponse = {
  order: Order;
  payment: { provider: "mock" | "cinetpay"; url: string };
};

export function createOrder(input: CreateOrderInput) {
  return apiFetch<CreateOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getOrder(id: string) {
  return apiFetch<Order>(`/orders/${encodeURIComponent(id)}`, { cache: "no-store" });
}

export function confirmMockPayment(orderId: string, success: boolean) {
  return apiFetch<Order>(`/payments/mock/${encodeURIComponent(orderId)}/confirm`, {
    method: "POST",
    body: JSON.stringify({ success }),
  });
}
