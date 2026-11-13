"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type EventEdition, formatPrice, salesOpenLabel } from "@/lib/catalog";
import { whatsappLink } from "@/lib/site";
import { CheckIcon, WhatsappIcon } from "@/components/icons";

const UNITS = [
  { label: "jours", ms: 86_400_000 },
  { label: "heures", ms: 3_600_000 },
  { label: "minutes", ms: 60_000 },
  { label: "secondes", ms: 1000 },
];

/**
 * Édition annoncée mais pas encore en vente : compte à rebours jusqu'à
 * l'ouverture de la billetterie, puis la page se recharge avec le formulaire.
 */
export function SalesSoon({ event, opensAt }: { event: EventEdition; opensAt: string }) {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = Date.parse(opensAt);
    const tick = () => {
      const ms = target - Date.now();
      setLeft(Math.max(0, ms));
      if (ms <= 0) router.refresh();
    };
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [opensAt, router]);

  // chaque unité = ce qui reste une fois les unités plus grandes retirées
  const parts = UNITS.map((u, i) => ({ ...u, v: Math.floor(((left ?? 0) % (i ? UNITS[i - 1].ms : Infinity)) / u.ms) }));

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-[1.4rem] border border-peach/30 bg-night-2 p-7 sm:p-10">
        <p className="t-label text-peach">Billetterie</p>
        <h2 className="t-display mt-3 text-4xl text-paper sm:text-5xl">Ouverture le {salesOpenLabel(opensAt)}.</h2>
        <p className="mt-4 max-w-lg text-paper-muted">
          Seulement {event.capacity} places. Garde cette page ouverte : le formulaire de réservation apparaît dès l&apos;ouverture.
        </p>
        <div className="mt-8 grid max-w-md grid-cols-4 gap-2" aria-live="off" role="timer" aria-label={`Ouverture de la billetterie le ${salesOpenLabel(opensAt)}`}>
          {parts.map((p) => (
            <div key={p.label} className="rounded-xl border border-line bg-night px-2 py-3 text-center">
              <span className="block text-3xl font-light tabular-nums text-paper sm:text-4xl">{left === null ? "–" : String(p.v).padStart(2, "0")}</span>
              <span className="t-label mt-1 block text-[0.6rem]! text-paper-dim">{p.label}</span>
            </div>
          ))}
        </div>
        <a
          href={whatsappLink(`Bonjour ! Préviens-moi à l'ouverture de la billetterie : ${event.title}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-brand px-6 py-3.5 font-semibold text-white transition-colors hover:bg-brand-bright"
        >
          <WhatsappIcon className="h-5 w-5" /> Me prévenir sur WhatsApp
        </a>
      </div>

      <ul className="grid content-start gap-4">
        {event.tiers.map((t) => (
          <li key={t.id} className="rounded-[1.4rem] border border-line bg-night-2 p-6">
            <div className="flex items-baseline justify-between gap-4">
              <p className="t-display text-2xl text-paper">{t.label}</p>
              <p className="whitespace-nowrap font-semibold text-peach">{formatPrice(t.price)}</p>
            </div>
            {t.description && <p className="mt-2 text-sm text-paper-muted">{t.description}</p>}
            {t.perks.length > 0 && (
              <ul className="mt-4 grid gap-2 text-sm text-paper-muted">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-peach" /> {p}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
