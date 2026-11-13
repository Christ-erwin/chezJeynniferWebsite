"use client";

import { adminApi } from "@/lib/admin-api";
import type { EventPack } from "@/lib/catalog";
import { Card, ErrorNote, Skeleton } from "./ui";
import { useLoad } from "./useLoad";

/**
 * Packs à préparer pour une édition : nombre de pièces par modèle et par
 * taille, d'après les commandes payées. Les places payées sans choix
 * (ventes sur place) sont signalées à part.
 */
export function PacksSummary({ eventId, pack }: { eventId: string; pack: EventPack }) {
  const orders = useLoad(() => adminApi.orders({ eventId, status: "paid" }), eventId);

  if (orders.error) return <ErrorNote>{orders.error}</ErrorNote>;
  if (!orders.data) return <Skeleton className="h-40" />;

  const count = new Map<string, number>();
  let missing = 0;
  for (const o of orders.data) {
    const seats = o.items.reduce((n, i) => n + i.quantity * i.seats, 0);
    for (let i = 0; i < seats; i++) {
      const p = o.packs?.[i];
      if (p) count.set(`${p.style}|${p.size}`, (count.get(`${p.style}|${p.size}`) ?? 0) + 1);
      else missing++;
    }
  }
  const total = [...count.values()].reduce((a, b) => a + b, 0);
  const sizes = pack.sizes;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-paper">{pack.label} : à préparer</h2>
        <p className="text-sm text-paper-muted">
          {total} pièce{total > 1 ? "s" : ""} · commandes payées
        </p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.1em] text-paper-dim">
              <th className="py-2 pr-4 font-semibold">Modèle</th>
              {sizes.map((s) => (
                <th key={s} className="px-2 py-2 text-center font-semibold">{s}</th>
              ))}
              <th className="py-2 pl-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {pack.styles.map((style) => {
              const row = sizes.map((s) => count.get(`${style}|${s}`) ?? 0);
              return (
                <tr key={style} className="border-t border-line">
                  <td className="py-2.5 pr-4 text-paper">{style}</td>
                  {row.map((n, i) => (
                    <td key={sizes[i]} className={`px-2 py-2.5 text-center tabular-nums ${n ? "font-semibold text-paper" : "text-paper-dim"}`}>{n || "·"}</td>
                  ))}
                  <td className="py-2.5 pl-2 text-right font-semibold tabular-nums text-peach">{row.reduce((a, b) => a + b, 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {missing > 0 && (
        <p className="mt-3 text-sm text-amber-200">
          {missing} place{missing > 1 ? "s" : ""} payée{missing > 1 ? "s" : ""} sans choix de pack (ventes sur place) : complète-les depuis la commande.
        </p>
      )}
    </Card>
  );
}
