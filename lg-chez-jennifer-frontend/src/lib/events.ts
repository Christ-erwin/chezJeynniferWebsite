import { API_BASE_URL } from "@/lib/api";
import type { ConceptSlug, EventEdition } from "@/lib/catalog";

/**
 * Lecture des éditions publiées depuis l'API (côté serveur).
 * Mise en cache 30 s : une modification faite dans l'admin apparaît sur le
 * site en moins d'une minute. Si l'API est injoignable, on renvoie une liste
 * vide plutôt que de casser la page.
 */
const REVALIDATE = 30;

export async function fetchUpcomingEvents(concept?: ConceptSlug): Promise<EventEdition[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, { next: { revalidate: REVALIDATE, tags: ["events"] } });
    if (!res.ok) return [];
    const list = (await res.json()) as EventEdition[];
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
    return (await res.json()) as EventEdition;
  } catch {
    return null;
  }
}
