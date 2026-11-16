"use client";

import { useState } from "react";
import { adminApi, type AnalyticsReport } from "@/lib/admin-api";
import { CONCEPTS } from "@/lib/catalog";
import { useLoad } from "@/components/admin/useLoad";
import { Button, Card, dateLong, Empty, ErrorNote, PageHead, RefreshIcon, Skeleton } from "@/components/admin/ui";

const RANGES = [7, 30, 90, 365] as const;
const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "–");

/** Nom lisible d'une page du site. */
function pageLabel(path: string, report: AnalyticsReport): string {
  if (path === "/") return "Accueil";
  if (path === "/evenements") return "Calendrier des soirées";
  if (path === "/reserver/confirmation") return "Billets (après paiement)";
  if (path === "/paiement") return "Paiement";
  if (path === "/statut") return "Statut";
  const concept = CONCEPTS.find((c) => `/${c.slug}` === path);
  if (concept) return `Page ${concept.name}`;
  if (path.startsWith("/reserver/")) {
    const id = path.slice("/reserver/".length);
    const ev = report.funnel.find((f) => f.id === id);
    return `Réservation · ${ev?.title ?? id}`;
  }
  return path;
}

export default function StatsPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const report = useLoad(() => adminApi.analytics(days), String(days));
  const r = report.data;

  return (
    <div className="space-y-8">
      <PageHead
        title="Statistiques"
        sub={
          r?.since
            ? `Visites du site public (sans l'admin), comptées depuis le ${dateLong(r.since)}. Sans cookies.`
            : "Visites du site public (sans l'admin). Sans cookies."
        }
        actions={
          <>
            <div className="inline-flex rounded-full border border-line p-0.5" role="group" aria-label="Période">
              {RANGES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDays(n)}
                  aria-pressed={days === n}
                  className={`h-8 cursor-pointer rounded-full px-3 text-sm font-semibold ${days === n ? "bg-paper text-cacao" : "text-paper-muted hover:text-paper"}`}
                >
                  {n === 365 ? "1 an" : `${n} j`}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={report.reload} aria-label="Actualiser"><RefreshIcon /> Actualiser</Button>
          </>
        }
      />

      {report.error && <ErrorNote>{report.error}</ErrorNote>}
      {!r ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          {/* chiffres clés */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Visiteurs" value={nf(r.totals.visitors)} hint="personnes différentes par jour" />
            <Kpi label="Pages vues" value={nf(r.totals.views)} hint={r.totals.visitors ? `${(r.totals.views / r.totals.visitors).toFixed(1).replace(".", ",")} pages par visiteur` : " "} />
            <Kpi label="Arrivées sur le site" value={nf(r.totals.entries)} hint="visites, toutes sources confondues" />
          </div>

          {/* tunnel par édition */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-paper">De la visite au billet</h2>
            <p className="mt-1 text-sm text-paper-muted">Par édition à venir, sur la période : combien regardent, ouvrent la réservation, lancent un paiement et paient.</p>
            {r.funnel.length === 0 ? (
              <Empty>Aucune édition publiée à venir.</Empty>
            ) : (
              <div className="mt-5 space-y-6">
                {r.funnel.map((f) => (
                  <Funnel key={f.id} f={f} />
                ))}
              </div>
            )}
          </Card>

          {/* visites par jour */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-paper">Visiteurs par jour</h2>
            <DayChart series={r.series} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-paper">D&apos;où viennent les visiteurs</h2>
              <p className="mt-1 text-sm text-paper-muted">
                Astuce : ajoute <code className="rounded bg-paper/8 px-1">?src=insta</code> à tes liens (bio Instagram, statut WhatsApp…) pour les reconnaître à coup sûr.
              </p>
              <Bars items={r.sources} empty="Pas encore de visite." />
            </Card>
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-paper">Pages les plus vues</h2>
              <Bars items={r.pages.map((p) => ({ name: pageLabel(p.name, r), count: p.count }))} empty="Pas encore de visite." />
            </Card>
          </div>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-paper">Appareils</h2>
            <Bars
              items={[
                { name: "Téléphone", count: r.devices.mobile ?? 0 },
                { name: "Ordinateur", count: r.devices.desktop ?? 0 },
                { name: "Tablette", count: r.devices.tablet ?? 0 },
              ].filter((d) => d.count > 0)}
              empty="Pas encore de visite."
              percent
            />
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-paper-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-paper">{value}</p>
      <p className="mt-1 text-xs text-paper-dim">{hint}</p>
    </Card>
  );
}

function Funnel({ f }: { f: AnalyticsReport["funnel"][number] }) {
  const steps = [
    { label: "Page du concept", n: f.conceptViews },
    { label: "Page de réservation", n: f.bookingViews },
    { label: "Paiements lancés", n: f.checkouts },
    { label: "Payés", n: f.paid },
  ];
  const max = Math.max(1, ...steps.map((s) => s.n));
  return (
    <div>
      <p className="font-semibold text-paper">
        {f.title} <span className="text-sm font-normal text-paper-dim">· {dateLong(f.startISO)}</span>
      </p>
      <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.label} className="rounded-xl border border-line bg-night p-3">
            <p className="text-xs text-paper-dim">{s.label}</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums text-paper">{nf(s.n)}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper/8">
              <div className="h-full rounded-full bg-peach" style={{ width: `${(s.n / max) * 100}%` }} />
            </div>
            {/* au-delà de 100 % (lien direct vers la réservation, sans passer par le concept) : pas de pourcentage */}
            {i > 0 && steps[i - 1].n > 0 && s.n <= steps[i - 1].n && (
              <p className="mt-1.5 text-xs text-paper-muted">{pct(s.n, steps[i - 1].n)} de l&apos;étape d&apos;avant</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function DayChart({ series }: { series: AnalyticsReport["series"] }) {
  const max = Math.max(1, ...series.map((d) => d.visitors));
  const total = series.reduce((s, d) => s + d.visitors, 0);
  return (
    <div className="mt-5 flex h-40 items-end gap-px sm:gap-1" role="img" aria-label={`${total} visiteurs sur ${series.length} jours`}>
      {series.map((d) => (
        <div key={d.date} className="group relative flex h-full flex-1 items-end">
          <div
            className="w-full rounded-t-sm bg-peach/80 transition-colors group-hover:bg-brand"
            style={{ height: `${Math.max(2, (d.visitors / max) * 100)}%`, opacity: d.visitors ? 1 : 0.25 }}
          />
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-cream px-2 py-1 text-xs font-semibold text-cacao group-hover:block">
            {new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {d.visitors} visiteur{d.visitors > 1 ? "s" : ""} · {d.views} pages
          </span>
        </div>
      ))}
    </div>
  );
}

function Bars({ items, empty, percent = false }: { items: { name: string; count: number }[]; empty: string; percent?: boolean }) {
  if (!items.length) return <p className="mt-4 text-sm text-paper-dim">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <ul className="mt-4 space-y-3">
      {items.map((i) => (
        <li key={i.name}>
          <div className="flex justify-between gap-4 text-sm">
            <span className="truncate text-paper-muted">{i.name}</span>
            <span className="shrink-0 font-semibold tabular-nums text-paper">{percent ? pct(i.count, total) : nf(i.count)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper/8">
            <div className="h-full rounded-full bg-peach" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
