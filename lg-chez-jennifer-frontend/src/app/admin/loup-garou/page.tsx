"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { WINNERS } from "@/lib/werewolf";
import { useAdminSession } from "@/components/admin/AdminShell";
import { useLoad } from "@/components/admin/useLoad";
import { Badge, Button, Card, dateTime, Empty, ErrorNote, ExternalIcon, Field, Input, Overlay, PageHead, PlayIcon, PlusIcon, Select, Skeleton } from "@/components/admin/ui";

const STATUS = {
  setup: { label: "En préparation", tone: "mute" },
  live: { label: "En cours", tone: "warn" },
  ended: { label: "Terminée", tone: "ok" },
} as const;

export default function WerewolfGamesPage() {
  const session = useAdminSession();
  const isAdmin = session?.role === "admin";
  const games = useLoad(adminApi.games);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-8">
      <PageHead
        title="Loup-Garou"
        sub="Prépare chaque partie (joueurs, photos, rôles). Le soir même : l'écran public sur la télé, la régie sur ton téléphone."
        actions={
          isAdmin && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <PlusIcon /> Nouvelle partie
            </Button>
          )
        }
      />
      {games.error && <ErrorNote>{games.error}</ErrorNote>}

      {!games.data ? (
        <div className="space-y-3">{Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : games.data.length === 0 ? (
        <Card>
          <Empty>Aucune partie pour l&apos;instant.{isAdmin && " Crée la première pour y ajouter les joueurs."}</Empty>
        </Card>
      ) : (
        <ul className="space-y-3">
          {games.data.map((g) => {
            const winner = WINNERS.find((w) => w.id === g.winner);
            return (
              <li key={g.id}>
                <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-semibold text-paper">{g.title}</h2>
                      <Badge tone={STATUS[g.status].tone}>{STATUS[g.status].label}</Badge>
                      {winner && <Badge tone="info">Victoire : {winner.label}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-paper-muted">
                      {g.players} joueurs · {g.status === "setup" ? `${g.ready}/${g.players} prêts (nom + rôle)` : `${g.alive} en vie`} · modifiée le {dateTime(g.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isAdmin && (
                      <Link href={`/admin/loup-garou/${g.id}`} className="inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-sm font-semibold text-paper hover:border-peach hover:text-peach">
                        Préparer
                      </Link>
                    )}
                    <Link href={`/admin/loup-garou/${g.id}/regie`} className="inline-flex h-10 items-center gap-2 rounded-full bg-wolf px-4 text-sm font-semibold text-white hover:bg-wolf-bright">
                      <PlayIcon className="h-4 w-4" /> Régie
                    </Link>
                    <a href={`/ecran/loup-garou/${g.id}`} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-full border border-wolf/50 px-4 text-sm font-semibold text-paper hover:border-wolf-bright">
                      <ExternalIcon /> Écran public
                    </a>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {creating && <NewGame onClose={() => setCreating(false)} />}
    </div>
  );
}

function NewGame({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const events = useLoad(adminApi.events);
  const [title, setTitle] = useState("Soirée Loup-Garou");
  const [count, setCount] = useState("20");
  const [eventId, setEventId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lgEvents = (events.data ?? []).filter((e) => e.concepts.includes("loup-garou") && e.status !== "cancelled");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const g = await adminApi.createGame({ title, count: Number(count), eventId: eventId || undefined });
      router.push(`/admin/loup-garou/${g.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Overlay title="Nouvelle partie" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Nom de la partie">{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} required />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre de joueurs" hint="Modifiable ensuite (3 à 40).">
            {(id) => <Input id={id} type="number" min={3} max={40} value={count} onChange={(e) => setCount(e.target.value)} required />}
          </Field>
          <Field label="Soirée liée (facultatif)">
            {(id) => (
              <Select id={id} value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">Aucune</option>
                {lgEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} · {ev.startISO.slice(0, 10)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Création…" : "Créer et ajouter les joueurs"}
          </Button>
        </div>
      </form>
    </Overlay>
  );
}
