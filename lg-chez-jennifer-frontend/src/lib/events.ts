import { API_BASE_URL } from "@/lib/api";
import type { ConceptSlug, EventEdition } from "@/lib/catalog";

/**
 * Lecture des éditions publiées depuis l'API (côté serveur).
 * Mise en cache 30 s : une modification faite dans l'admin apparaît sur le
 * site en moins d'une minute. Si l'API est injoignable, on renvoie une liste
 * vide plutôt que de casser la page.
 */
const REVALIDATE = 30;

/** Ajoute `salesOpen` (billetterie ouverte ou pas encore) : calculé ici, côté serveur, à chaque relecture. */
function withSales(e: Omit<EventEdition, "salesOpen">): EventEdition {
  return { ...e, salesOpen: !e.salesOpenAt || Date.parse(e.salesOpenAt) <= Date.now() };
}

export async function fetchUpcomingEvents(concept?: ConceptSlug): Promise<EventEdition[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, { next: { revalidate: REVALIDATE, tags: ["events"] } });
    if (!res.ok) return [];
    const list = ((await res.json()) as Omit<EventEdition, "salesOpen">[]).map(withSales);
    return list
      .filter((e) => !concept || e.concepts.includes(concept))
      .sort((a, b) => a.startISO.localeCompare(b.startISO));
  } catch {
    return [];
  }
}

export async function fetchEvent(id: string): Promise<EventEdition | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(id)}`, { next: { revalidate: REVALIDATE, tags: ["events"] } });
    if (!res.ok) return null;
    return withSales((await res.json()) as Omit<EventEdition, "salesOpen">);
  } catch {
    return null;
  }
}
