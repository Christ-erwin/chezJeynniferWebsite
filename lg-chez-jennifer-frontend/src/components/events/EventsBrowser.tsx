"use client";

import { useMemo, useState } from "react";
import { CONCEPTS, type ConceptSlug, type EventEdition } from "@/lib/catalog";
import { EventCard } from "./EventCard";

/** Filtre par univers (lu depuis ?soiree=… à l'arrivée) + regroupement par mois. */
export function EventsBrowser({ events, initial }: { events: EventEdition[]; initial?: ConceptSlug }) {
  const [filter, setFilter] = useState<ConceptSlug | "all">(initial ?? "all");

  const groups = useMemo(() => {
    const list = events.filter((e) => filter === "all" || e.concepts.includes(filter));
    const map = new Map<string, EventEdition[]>();
    for (const e of list) {
      const key = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Africa/Abidjan" }).format(new Date(e.startISO));
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.entries()];
  }, [events, filter]);

  const tabs: { id: ConceptSlug | "all"; label: string; accent?: string }[] = [
    { id: "all", label: "Toutes les soirées" },
    ...CONCEPTS.map((c) => ({ id: c.slug, label: c.displayName, accent: c.accent })),
  ];

  const select = (id: ConceptSlug | "all") => {
    setFilter(id);
    const url = new URL(window.location.href);
    if (id === "all") url.searchParams.delete("soiree");
    else url.searchParams.set("soiree", id);
    window.history.replaceState(null, "", url);
  };

  return (
    <div>
      <div role="tablist" aria-label="Filtrer par univers" className="flex flex-wrap gap-2.5">
        {tabs.map((t) => {
          const active = filter === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => select(t.id)}
              className={`inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                active ? "border-peach bg-peach text-cacao" : "border-line-strong text-paper-muted hover:border-paper/50 hover:text-paper"
              }`}
            >
              {t.accent && <span className="h-2 w-2 rounded-full" style={{ background: t.accent }} />}
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-12 space-y-16">
        {groups.length === 0 && (
          <p className="rounded-[1.4rem] border border-line bg-night-2 p-10 text-center text-paper-muted">
            Pas encore de date pour cet univers. Les prochaines arrivent très vite.
          </p>
        )}
        {groups.map(([month, list]) => (
          <section key={month} aria-label={month}>
            <h2 className="t-display mb-6 flex items-baseline gap-4 text-4xl capitalize text-paper">
              {month}
              <span className="h-px flex-1 bg-line" />
              <span className="font-sans text-sm normal-case text-paper-dim">{list.length} soirée{list.length > 1 ? "s" : ""}</span>
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
