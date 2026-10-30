"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi, EVENT_STATUS } from "@/lib/admin-api";
import { useLoad } from "@/components/admin/useLoad";
import { EventForm } from "@/components/admin/EventForm";
import { Badge, ErrorNote, ExternalIcon, PageHead, Skeleton } from "@/components/admin/ui";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = useLoad(() => adminApi.event(id), id);

  return (
    <div className="space-y-8">
      <Link href="/admin/evenements" className="text-sm text-paper-muted hover:text-peach">← Éditions</Link>
      {error && <ErrorNote>{error}</ErrorNote>}
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
              </span>
            }
            actions={
              <>
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
          <EventForm key={data.updatedAt} event={data} />
        </>
      )}
    </div>
  );
}
