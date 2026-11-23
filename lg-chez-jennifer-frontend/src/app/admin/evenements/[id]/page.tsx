"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { adminApi, EVENT_STATUS, type AdminEvent } from "@/lib/admin-api";
import { useLoad } from "@/components/admin/useLoad";
import { EventForm } from "@/components/admin/EventForm";
import { PacksSummary } from "@/components/admin/PacksSummary";
import { TeamsSummary } from "@/components/admin/TeamsSummary";
import { Badge, Button, ErrorNote, ExternalIcon, PageHead, Skeleton } from "@/components/admin/ui";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, reload } = useLoad(() => adminApi.event(id), id);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  /** Masquer du site / remettre en ligne, en un clic */
  async function toggleVisibility(e: AdminEvent) {
    const hide = e.status === "published";
    const msg = hide
      ? `Masquer « ${e.title} » du site ?\n\nElle ne sera plus visible ni réservable en ligne. Les billets déjà vendus restent valables et tu pourras la remettre en ligne à tout moment.`
      : `Remettre « ${e.title} » en ligne ?\n\nElle redeviendra visible et réservable sur le site.`;
    if (!confirm(msg)) return;
    setToggling(true);
    setToggleError(null);
    try {
      await adminApi.setEventStatus(e.id, hide ? "hidden" : "published");
      reload();
    } catch (err) {
      setToggleError((err as Error).message);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/evenements" className="text-sm text-paper-muted hover:text-peach">← Éditions</Link>
      {error && <ErrorNote>{error}</ErrorNote>}
      {toggleError && <ErrorNote>{toggleError}</ErrorNote>}
      {!data ? (
        !error && <Skeleton className="h-96" />
      ) : (
        <>
          <PageHead
            title={data.title}
            sub={
              <span className="inline-flex flex-wrap items-center gap-2">
                <Badge tone={EVENT_STATUS[data.status].tone}>{EVENT_STATUS[data.status].label}</Badge>
                {data.seatsTaken} / {data.capacity} places réservées
                {data.status === "hidden" && <span className="text-amber-200">· invisible sur le site, billets vendus valables</span>}
              </span>
            }
            actions={
              <>
                {(data.status === "published" || data.status === "hidden") && (
                  <Button size="sm" variant={data.status === "published" ? "ghost" : "primary"} disabled={toggling} onClick={() => toggleVisibility(data)}>
                    {toggling ? "…" : data.status === "published" ? "Masquer du site" : "Remettre en ligne"}
                  </Button>
                )}
                <Link href={`/admin/commandes?eventId=${data.id}`} className="inline-flex h-9 items-center rounded-full border border-line-strong px-3.5 text-sm font-semibold text-paper hover:border-peach hover:text-peach">
                  Commandes
                </Link>
                {data.status === "published" && (
                  <a href={`/reserver/${data.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-full border border-line-strong px-3.5 text-sm font-semibold text-paper hover:border-peach hover:text-peach">
                    <ExternalIcon /> Voir sur le site
                  </a>
                )}
              </>
            }
          />
          {data.teams?.length ? <TeamsSummary event={data} /> : null}
          {data.pack && <PacksSummary eventId={data.id} pack={data.pack} />}
          <EventForm key={data.updatedAt} event={data} />
        </>
      )}
    </div>
  );
}
