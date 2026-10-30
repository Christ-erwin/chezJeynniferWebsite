"use client";

import { API_BASE_URL, ApiError } from "@/lib/api";
import type { ConceptSlug, PassTier } from "@/lib/catalog";
import type { Game, GameState, GameSummary, Player, WinnerId } from "@/lib/werewolf";

/**
 * Client de l'espace admin. La session (jeton signé par le backend, 12 h)
 * est gardée dans le navigateur ; un 401 renvoie vers /admin/login.
 */

export type Role = "admin" | "staff";
export type AdminSession = { token: string; role: Role; expiresAt: string };

const KEY = "jey:admin-session";

export function getSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AdminSession;
    if (Date.parse(s.expiresAt) <= Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible */
  }
}

/** Session expirée : l'AdminShell écoute cet événement et renvoie vers la connexion. */
function expired() {
  clearSession();
  window.dispatchEvent(new Event("jey:session"));
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const session = getSession();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/admin${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Serveur injoignable. Vérifie ta connexion.", 0);
  }
  if (res.status === 401 && !path.startsWith("/auth/login")) {
    expired();
    throw new ApiError("Session expirée, reconnecte-toi.", 401);
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
  return res;
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await request(path, init);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/* --------------------------------- types ---------------------------------- */
export type EventStatus = "draft" | "published" | "cancelled";

export type AdminEvent = {
  id: string;
  title: string;
  subtitle: string;
  concepts: ConceptSlug[];
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
  seatsTaken: number;
  soldTierIds: string[];
};

export type EventInput = Omit<AdminEvent, "id" | "createdAt" | "updatedAt" | "seatsTaken" | "soldTierIds">;

export type AdminOrderStatus = "pending" | "paid" | "failed" | "cancelled" | "expired";
export type AdminPaymentMethod = "wave" | "orange_money" | "cash";

export type AdminTicket = { code: string; label: string; holder: string; usedAt?: string };

export type AdminOrder = {
  id: string;
  reference: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  status: AdminOrderStatus;
  paymentMethod: AdminPaymentMethod;
  buyer: { name: string; phone: string; email?: string };
  items: { tierId: string; label: string; quantity: number; unitPrice: number; seats: number }[];
  total: number;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  provider: "mock" | "cinetpay" | "manual";
  tickets: AdminTicket[];
  history?: { at: string; action: string }[];
};

export type Stats = {
  revenue: number;
  revenue7d: number;
  ticketsSold: number;
  ordersPaid: number;
  ordersPending: number;
  conversion: number;
  byMethod: Record<AdminPaymentMethod, number>;
  perEvent: {
    id: string;
    title: string;
    startISO: string;
    status: EventStatus;
    capacity: number;
    seatsSold: number;
    seatsPending: number;
    revenue: number;
    orders: number;
    checkedIn: number;
    tickets: number;
  }[];
  days: { date: string; revenue: number; tickets: number }[];
};

type OrderRef = { reference: string; eventId: string; eventTitle: string; buyer: AdminOrder["buyer"] };
export type CheckinResult =
  | { ok: true; ticket: AdminTicket; order: OrderRef; checkedIn: number; total: number }
  | {
      ok: false;
      reason: "unknown" | "not-paid" | "already-used" | "wrong-event";
      message: string;
      ticket?: AdminTicket;
      order?: OrderRef & { status: AdminOrderStatus };
    };

export type OrderFilter = { eventId?: string; status?: string; q?: string };

const qs = (f: OrderFilter) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
};

/* ---------------------------------- API ----------------------------------- */
export const adminApi = {
  async login(password: string): Promise<AdminSession> {
    const s = await json<AdminSession>("/auth/login", { method: "POST", body: JSON.stringify({ password }) });
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* stockage indisponible : la session ne survivra pas au rechargement */
    }
    return s;
  },
  me: () => json<{ role: Role; expiresAt: string }>("/auth/me"),

  stats: () => json<Stats>("/stats"),

  events: () => json<AdminEvent[]>("/events"),
  event: (id: string) => json<AdminEvent>(`/events/${encodeURIComponent(id)}`),
  createEvent: (e: EventInput) => json<AdminEvent>("/events", { method: "POST", body: JSON.stringify(e) }),
  updateEvent: (id: string, e: EventInput) =>
    json<AdminEvent>(`/events/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(e) }),
  deleteEvent: (id: string) => json<void>(`/events/${encodeURIComponent(id)}`, { method: "DELETE" }),

  orders: (f: OrderFilter = {}) => json<AdminOrder[]>(`/orders${qs(f)}`),
  createManualOrder: (input: {
    eventId: string;
    items: { tierId: string; quantity: number }[];
    buyer: { name: string; phone: string; email?: string };
    method: AdminPaymentMethod;
  }) => json<AdminOrder>("/orders", { method: "POST", body: JSON.stringify(input) }),
  markPaid: (id: string) => json<AdminOrder>(`/orders/${encodeURIComponent(id)}/mark-paid`, { method: "POST" }),
  cancelOrder: (id: string) => json<AdminOrder>(`/orders/${encodeURIComponent(id)}/cancel`, { method: "POST" }),
  async exportCsv(f: OrderFilter = {}) {
    const res = await request(`/orders/export.csv${qs(f)}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commandes-chez-jeynnifer-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  checkin: (code: string, eventId?: string) =>
    json<CheckinResult>("/checkin", { method: "POST", body: JSON.stringify({ code, eventId }) }),

  /* ----------------------------- Loup-Garou ------------------------------ */
  games: () => json<GameSummary[]>("/games"),
  game: (id: string) => json<Game>(`/games/${encodeURIComponent(id)}`),
  gameState: (id: string) => json<GameState>(`/games/${encodeURIComponent(id)}/state`),
  createGame: (input: { title: string; count: number; eventId?: string }) =>
    json<Game>("/games", { method: "POST", body: JSON.stringify(input) }),
  saveGame: (id: string, input: { title: string; eventId?: string; players: Player[] }) =>
    json<Game>(`/games/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteGame: (id: string) => json<void>(`/games/${encodeURIComponent(id)}`, { method: "DELETE" }),
  eliminate: (id: string, playerId: string) =>
    json<GameState>(`/games/${encodeURIComponent(id)}/eliminate`, { method: "POST", body: JSON.stringify({ playerId }) }),
  /** resurrect: vraie résurrection (animée sur l'écran) ; sinon correction silencieuse d'une erreur */
  revive: (id: string, playerId: string, resurrect = false) =>
    json<GameState>(`/games/${encodeURIComponent(id)}/revive`, { method: "POST", body: JSON.stringify({ playerId, resurrect }) }),
  setChief: (id: string, playerId: string | null) =>
    json<GameState>(`/games/${encodeURIComponent(id)}/chief`, { method: "POST", body: JSON.stringify({ playerId }) }),
  /** lance la partie (ou rejoue l'introduction) sur les écrans */
  startGame: (id: string) => json<GameState>(`/games/${encodeURIComponent(id)}/start`, { method: "POST" }),
  finishGame: (id: string, winner: WinnerId) =>
    json<GameState>(`/games/${encodeURIComponent(id)}/finish`, { method: "POST", body: JSON.stringify({ winner }) }),
  resetGame: (id: string) => json<GameState>(`/games/${encodeURIComponent(id)}/reset`, { method: "POST" }),

  /** Recadre (portrait 3:4, visage en haut) et compresse la photo dans le navigateur, puis l'envoie. */
  async uploadPortrait(file: File): Promise<string> {
    const data = await portraitDataUrl(file);
    const res = await json<{ path: string }>("/media", { method: "POST", body: JSON.stringify({ data }) });
    return res.path;
  },
};

/** URL affichable d'une photo de joueur (stockée par l'API, ou image du site). */
export function mediaUrl(path?: string): string | undefined {
  if (!path) return undefined;
  return path.startsWith("media/") ? `${API_BASE_URL}/${path}` : path;
}

async function portraitDataUrl(file: File, width = 600, height = 800): Promise<string> {
  if (!file.type.startsWith("image/")) throw new ApiError("Choisis un fichier image (JPG, PNG…).", 400);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ApiError("Cette image n'a pas pu être lue (format HEIC ? Exporte-la en JPG).", 400);
  }
  const target = width / height;
  const src = bitmap.width / bitmap.height;
  // recadrage centré ; sur une photo en hauteur, on garde plutôt le haut (le visage)
  const sw = src > target ? bitmap.height * target : bitmap.width;
  const sh = src > target ? bitmap.height : bitmap.width / target;
  const sx = (bitmap.width - sw) / 2;
  const sy = src > target ? 0 : Math.max(0, (bitmap.height - sh) * 0.25);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.86);
}

/* ------------------------------- libellés --------------------------------- */
export const ORDER_STATUS: Record<AdminOrderStatus, { label: string; tone: Tone }> = {
  paid: { label: "Payée", tone: "ok" },
  pending: { label: "En attente", tone: "warn" },
  expired: { label: "Expirée", tone: "mute" },
  failed: { label: "Échouée", tone: "bad" },
  cancelled: { label: "Annulée", tone: "bad" },
};

export const EVENT_STATUS: Record<EventStatus, { label: string; tone: Tone }> = {
  published: { label: "En ligne", tone: "ok" },
  draft: { label: "Brouillon", tone: "mute" },
  cancelled: { label: "Annulée", tone: "bad" },
};

export const METHOD_LABEL: Record<AdminPaymentMethod, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  cash: "Espèces",
};

export type Tone = "ok" | "warn" | "bad" | "mute" | "info";
