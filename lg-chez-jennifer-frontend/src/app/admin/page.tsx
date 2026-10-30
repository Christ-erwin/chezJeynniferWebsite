"use client";

import Link from "next/link";
import { adminApi, EVENT_STATUS, METHOD_LABEL, ORDER_STATUS, type AdminPaymentMethod } from "@/lib/admin-api";
import { useLoad } from "@/components/admin/useLoad";
import { Badge, Button, Card, dateLong, dateTime, ErrorNote, fcfa, FillBar, PageHead, PlusIcon, RefreshIcon, Skeleton } from "@/components/admin/ui";

export default function AdminDashboard() {
  const stats = useLoad(adminApi.stats);
  const recent = useLoad(() => adminApi.orders());
  const s = stats.data;
  const reload = () => {
    stats.reload();
    recent.reload();
  };

  const upcoming = s?.perEvent.filter((e) => e.status !== "cancelled" && Date.parse(e.startISO) >= stats.at - 86400000) ?? [];
  const maxDay = Math.max(1, ...(s?.days.map((d) => d.revenue) ?? [0]));
  const totalMethods = s ? Object.values(s.byMethod).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-8">
      <PageHead
        title="Tableau de bord"
        sub="Les ventes et le remplissage de tes soirées, en direct."
        actions={
          <>
            <Button size="sm" onClick={reload} aria-label="Actualiser"><RefreshIcon /> Actualiser</Button>
            <Link href="/admin/evenements/nouveau" className="inline-flex h-9 items-center gap-2 rounded-full bg-peach px-3.5 text-sm font-semibold text-cacao hover:bg-[#ffd9bd]">
              <PlusIcon /> Nouvelle édition
            </Link>
          </>
        }
      />
      {stats.error && <ErrorNote>{stats.error}</ErrorNote>}

      {/* chiffres clés */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {s ? (
          <>
            <Kpi label="Chiffre d'affaires" value={fcfa(s.revenue)} sub={`${fcfa(s.revenue7d)} sur 7 jours`} accent />
            <Kpi label="Billets vendus" value={String(s.ticketsSold)} sub={`${s.ordersPaid} commande${s.ordersPaid > 1 ? "s" : ""} payée${s.ordersPaid > 1 ? "s" : ""}`} />
            <Kpi label="En attente de paiement" value={String(s.ordersPending)} sub="places bloquées 20 min" />
            <Kpi label="Taux de paiement" value={`${Math.round(s.conversion * 100)} %`} sub="commandes abouties" />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[112px]" />)
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* remplissage */}
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-paper">Remplissage des prochaines soirées</h2>
          {!s ? (
            <Skeleton className="mt-5 h-40" />
          ) : upcoming.length === 0 ? (
            <p className="mt-5 text-paper-muted">Aucune soirée à venir. <Link className="text-peach underline" href="/admin/evenements/nouveau">Créer une édition</Link></p>
          ) : (
            <ul className="mt-5 space-y-5">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <Link href={`/admin/evenements/${e.id}`} className="font-semibold text-paper hover:text-peach">{e.title}</Link>
                    <span className="text-sm tabular-nums text-paper-muted">
                      <strong className="text-paper">{e.seatsSold}</strong> / {e.capacity} places
                      {e.seatsPending > 0 && <span className="text-paper-dim"> · {e.seatsPending} en attente</span>}
                    </span>
                  </div>
                  <div className="mt-2"><FillBar sold={e.seatsSold} pending={e.seatsPending} capacity={e.capacity} /></div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-paper-dim">
                    <span>{dateLong(e.startISO)}</span>
                    <Badge tone={EVENT_STATUS[e.status].tone}>{EVENT_STATUS[e.status].label}</Badge>
                    <span>{fcfa(e.revenue)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          {/* ventes 14 jours */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-paper">Ventes des 14 derniers jours</h2>
            {!s ? (
              <Skeleton className="mt-5 h-32" />
            ) : (
              <div className="mt-5 flex h-32 items-end gap-1.5" role="img" aria-label={`Ventes sur 14 jours : ${fcfa(s.days.reduce((a, d) => a + d.revenue, 0))}`}>
                {s.days.map((d) => (
                  <div key={d.date} className="group relative flex h-full flex-1 items-end">
                    <div className="w-full rounded-t-md bg-peach/80 transition-colors group-hover:bg-peach" style={{ height: `${Math.max(3, (d.revenue / maxDay) * 100)}%`, opacity: d.revenue ? 1 : 0.25 }} />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-cream px-2 py-1 text-xs font-semibold text-cacao group-hover:block">
                      {new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {fcfa(d.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* moyens de paiement */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-paper">Encaissements par moyen</h2>
            {s && (
              <ul className="mt-4 space-y-3">
                {(Object.keys(s.byMethod) as AdminPaymentMethod[]).map((m) => (
                  <li key={m}>
                    <div className="flex justify-between text-sm">
                      <span className="text-paper-muted">{METHOD_LABEL[m]}</span>
                      <span className="font-semibold tabular-nums text-paper">{fcfa(s.byMethod[m])}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper/8">
                      <div className={`h-full ${m === "wave" ? "bg-sky-400" : m === "orange_money" ? "bg-orange-400" : "bg-emerald-400"}`} style={{ width: `${totalMethods ? (s.byMethod[m] / totalMethods) * 100 : 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* dernières commandes */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-paper">Dernières commandes</h2>
          <Link href="/admin/commandes" className="text-sm font-semibold text-peach hover:underline">Tout voir</Link>
        </div>
        {!recent.data ? (
          <div className="px-6 pb-6"><Skeleton className="h-40" /></div>
        ) : recent.data.length === 0 ? (
          <p className="px-6 pb-8 text-paper-muted">Aucune commande pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {recent.data.slice(0, 6).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/commandes?o=${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-paper/3 sm:px-6">
                  <span className="font-mono text-sm text-paper-muted">{o.reference}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-paper">{o.buyer.name}</span>
                  <span className="hidden text-sm text-paper-dim sm:inline">{o.eventTitle}</span>
                  <span className="text-sm tabular-nums text-paper">{fcfa(o.total)}</span>
                  <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                  <span className="w-28 text-right text-xs text-paper-dim">{dateTime(o.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <Card className={`p-4 sm:p-5 ${accent ? "border-peach/30 bg-linear-to-br from-peach/10 to-night-2" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-paper-dim">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums sm:text-[1.7rem] ${accent ? "text-peach" : "text-paper"}`}>{value}</p>
      <p className="mt-1 text-xs text-paper-muted">{sub}</p>
    </Card>
  );
}
