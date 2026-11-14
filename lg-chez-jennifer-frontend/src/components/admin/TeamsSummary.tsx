"use client";

import { adminApi, type AdminTicket, type AdminEvent } from "@/lib/admin-api";
import { GENDER_LABEL, isLightColor, type Gender } from "@/lib/catalog";
import { Card, ErrorNote, Skeleton } from "./ui";
import { useLoad } from "./useLoad";

/**
 * Composition des équipes d'après les billets payés : qui est dans quelle
 * équipe, et combien de places restent par sexe dans chacune.
 */
export function TeamsSummary({ event }: { event: AdminEvent }) {
  const orders = useLoad(() => adminApi.orders({ eventId: event.id, status: "paid" }), event.id);
  const teams = event.teams ?? [];

  if (orders.error) return <ErrorNote>{orders.error}</ErrorNote>;
  if (!orders.data) return <Skeleton className="h-48" />;

  const tickets = orders.data.flatMap((o) => o.tickets.map((t) => ({ ...t, reference: o.reference })));
  const unassigned = tickets.filter((t) => !t.team);
  const n = teams.length || 1;
  const slots = (g: Gender) => Math.ceil((event.genders?.[g] ?? 0) / n);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-paper">Équipes</h2>
        <p className="text-sm text-paper-muted">
          {tickets.length - unassigned.length} participant{tickets.length - unassigned.length > 1 ? "s" : ""} placé{tickets.length - unassigned.length > 1 ? "s" : ""} · tirage au paiement
        </p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {teams.map((team) => {
          const members = tickets.filter((t) => t.team?.name === team.name);
          const ink = isLightColor(team.color) ? "#141213" : "#ffffff";
          return (
            <section key={team.name} className="overflow-hidden rounded-xl border border-line">
              <header className="flex items-center justify-between px-4 py-2.5 text-sm font-bold" style={{ background: team.color, color: ink }}>
                <span>Équipe {team.name}</span>
                <span className="tabular-nums">{members.length}</span>
              </header>
              <div className="grid grid-cols-2 gap-3 p-4">
                {(event.genders ? (["fille", "garcon"] as const) : [null]).map((g) => {
                  const list = g ? members.filter((m) => m.gender === g) : members;
                  return (
                    <div key={g ?? "tous"}>
                      {g && (
                        <p className="mb-1.5 text-xs uppercase tracking-[0.1em] text-paper-dim">
                          {GENDER_LABEL[g]}s {list.length}/{slots(g)}
                        </p>
                      )}
                      <Members list={list} />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {unassigned.length > 0 && (
        <p className="mt-3 text-sm text-amber-200">
          {unassigned.length} billet{unassigned.length > 1 ? "s" : ""} sans équipe (vendus avant l&apos;activation des équipes) : attribue-les depuis la commande.
        </p>
      )}
    </Card>
  );
}

function Members({ list }: { list: (AdminTicket & { reference: string })[] }) {
  if (!list.length) return <p className="text-sm text-paper-dim">·</p>;
  return (
    <ul className="space-y-1 text-sm">
      {list.map((m) => (
        <li key={m.code} className="truncate text-paper" title={`${m.holder} · ${m.reference}`}>
          {m.holder}
        </li>
      ))}
    </ul>
  );
}
