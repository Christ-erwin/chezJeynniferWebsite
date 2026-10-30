"use client";

import Image from "next/image";
import Link from "next/link";
import { adminApi, EVENT_STATUS } from "@/lib/admin-api";
import { conceptNames, formatPrice } from "@/lib/catalog";
import { useLoad } from "@/components/admin/useLoad";
import { Badge, Card, dateLong, Empty, ErrorNote, FillBar, PageHead, PlusIcon, Skeleton } from "@/components/admin/ui";

export default function AdminEventsPage() {
  const { data, error, at } = useLoad(adminApi.events);

  return (
    <div className="space-y-8">
      <PageHead
        title="Éditions"
        sub="Chaque soirée mise en vente : date, lieu, passes et capacité. Seules les éditions « En ligne » apparaissent sur le site."
        actions={
          <Link href="/admin/evenements/nouveau" className="inline-flex h-11 items-center gap-2 rounded-full bg-peach px-5 text-sm font-semibold text-cacao hover:bg-[#ffd9bd]">
            <PlusIcon /> Nouvelle édition
          </Link>
        }
      />
      {error && <ErrorNote>{error}</ErrorNote>}

      {!data ? (
        <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : data.length === 0 ? (
        <Card><Empty>Aucune édition. Crée la première pour ouvrir la billetterie.</Empty></Card>
      ) : (
        <ul className="space-y-3">
          {data.map((e) => {
            const past = Date.parse(e.startISO) < at;
            const st = EVENT_STATUS[e.status];
            return (
              <li key={e.id}>
                <Link href={`/admin/evenements/${e.id}`} className="group block">
                  <Card className="flex flex-col gap-4 p-4 transition-colors group-hover:border-peach/40 sm:flex-row sm:items-center sm:p-5">
                    <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl sm:w-40">
                      <Image src={e.cover} unoptimized={e.cover.startsWith("http")} alt="" fill sizes="160px" className={`object-cover ${past ? "grayscale" : ""}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-paper group-hover:text-peach">{e.title}</h2>
                        <Badge tone={st.tone}>{st.label}</Badge>
                        {past && <Badge tone="mute">Passée</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-paper-muted">
                        {dateLong(e.startISO)} · {e.doors} · {e.venue.name}, {e.venue.city}
                      </p>
                      <p className="mt-0.5 text-sm text-paper-dim">
                        {conceptNames(e.concepts)} · {e.tiers.map((t) => `${t.label} ${formatPrice(t.price)}`).join(" · ")}
                      </p>
                    </div>
                    <div className="w-full sm:w-52">
                      <div className="flex justify-between text-sm">
                        <span className="text-paper-muted">Réservées</span>
                        <span className="tabular-nums text-paper"><strong>{e.seatsTaken}</strong> / {e.capacity}</span>
                      </div>
                      <div className="mt-2"><FillBar sold={e.seatsTaken} capacity={e.capacity} /></div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
