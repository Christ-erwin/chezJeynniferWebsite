"use client";

import { useState } from "react";
import { adminApi, METHOD_LABEL, ORDER_STATUS, type AdminOrder, type AdminTicket } from "@/lib/admin-api";
import { GENDER_LABEL, isLightColor, type EventPack, type PackChoice, type TeamDef } from "@/lib/catalog";
import { Badge, Button, CheckIcon, dateTime, ErrorNote, fcfa, Overlay, Select, XIcon } from "./ui";
import { useLoad } from "./useLoad";

/** Détail d'une commande + actions (valider le paiement, annuler). */
export function OrderPanel({ order: o, onClose, onChanged }: { order: AdminOrder; onClose: () => void; onChanged: (o: AdminOrder) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanned = o.tickets.filter((t) => t.usedAt).length;
  const phone = o.buyer.phone.replace(/\D/g, "");
  const event = useLoad(() => adminApi.event(o.eventId), o.eventId);
  const pack = event.data?.pack;
  const teams = event.data?.teams;
  const [mailing, setMailing] = useState(false);
  const [mailNote, setMailNote] = useState<string | null>(null);

  async function resend() {
    setMailing(true);
    setError(null);
    setMailNote(null);
    try {
      onChanged(await adminApi.resendEmail(o.id));
      setMailNote(`Billets envoyés à ${o.buyer.email}.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setMailing(false);
    }
  }

  async function refunded() {
    if (!o.refund || !confirm(`Confirmer que ${fcfa(o.refund.amount)} ont bien été remboursés à ${o.buyer.name} ?`)) return;
    setBusy(true);
    setError(null);
    try {
      onChanged(await adminApi.markRefunded(o.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function act(kind: "paid" | "cancel") {
    const msg =
      kind === "paid"
        ? `Confirmer que ${fcfa(o.total)} ont bien été reçus pour ${o.reference} ? Les billets seront émis.`
        : `Annuler ${o.reference} ? Les places seront libérées. Le remboursement éventuel se fait hors site.`;
    if (!confirm(msg)) return;
    setBusy(true);
    setError(null);
    try {
      onChanged(kind === "paid" ? await adminApi.markPaid(o.id) : await adminApi.cancelOrder(o.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Overlay title={`Commande ${o.reference}`} onClose={onClose} side>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
          {o.refund && <Badge tone={o.refund.doneAt ? "ok" : "warn"}>{o.refund.doneAt ? "Remboursée" : "À rembourser"}</Badge>}
          <span className="text-sm text-paper-muted">
            {METHOD_LABEL[o.paymentMethod]} · {o.provider === "manual" ? "saisie admin" : o.provider === "geniuspay" ? "GeniusPay" : "simulateur"}
          </span>
        </div>

        {o.refund && (
          <div className={`rounded-2xl border p-4 text-sm ${o.refund.doneAt ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/40 bg-amber-400/10 text-amber-100"}`}>
            <p className="font-semibold">
              {o.refund.doneAt ? `Remboursement de ${fcfa(o.refund.amount)} fait le ${dateTime(o.refund.doneAt)}.` : `Remboursement à faire : ${fcfa(o.refund.amount)}`}
            </p>
            {!o.refund.doneAt && (
              <>
                <p className="mt-1 opacity-80">
                  {o.eventDeletedAt ? `L'édition a été supprimée le ${dateTime(o.eventDeletedAt)}. ` : ""}
                  Rembourse le client par {METHOD_LABEL[o.paymentMethod]} au {o.buyer.phone}, puis valide ci-dessous.
                </p>
                <Button size="sm" variant="primary" className="mt-3" disabled={busy} onClick={refunded}>
                  <CheckIcon /> Marquer comme remboursé
                </Button>
              </>
            )}
          </div>
        )}

        <Section title="Client">
          <p className="font-semibold text-paper">{o.buyer.name}</p>
          <p className="text-paper-muted">
            <a href={`tel:${o.buyer.phone}`} className="hover:text-peach">{o.buyer.phone}</a>
            {" · "}
            <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="text-peach hover:underline">WhatsApp</a>
          </p>
          {o.buyer.email && <p className="text-paper-muted">{o.buyer.email}</p>}
        </Section>

        <Section title="Soirée">
          <p className="text-paper">{o.eventTitle}</p>
          <p className="text-sm text-paper-muted">{dateTime(o.eventDate)}</p>
        </Section>

        <Section title="Passes">
          <ul className="space-y-1.5">
            {o.items.map((i) => (
              <li key={i.tierId} className="flex justify-between text-sm">
                <span className="text-paper-muted">{i.quantity} × {i.label}</span>
                <span className="tabular-nums text-paper">{fcfa(i.quantity * i.unitPrice)}</span>
              </li>
            ))}
            {!!o.fee && (
              <li className="flex justify-between text-sm">
                <span className="text-paper-muted">Frais de paiement (pour GeniusPay)</span>
                <span className="tabular-nums text-paper-muted">{fcfa(o.fee)}</span>
              </li>
            )}
            <li className="flex justify-between border-t border-line pt-2 font-semibold">
              <span className="text-paper">{o.fee ? "Payé par le client" : "Total"}</span>
              <span className="tabular-nums text-peach">{fcfa(o.total)}</span>
            </li>
            {!!o.fee && (
              <li className="flex justify-between text-xs text-paper-dim">
                <span>Recette billets (ce qui te revient)</span>
                <span className="tabular-nums">{fcfa(o.total - o.fee)}</span>
              </li>
            )}
          </ul>
        </Section>

        {pack && o.status !== "cancelled" && <PacksEditor key={o.updatedAt} order={o} pack={pack} onChanged={onChanged} />}

        {o.tickets.length > 0 && (
          <Section title={`Billets · ${scanned}/${o.tickets.length} scanné${scanned > 1 ? "s" : ""}`}>
            <ul className="space-y-2">
              {o.tickets.map((t) => (
                <TicketRow key={`${t.code}-${o.updatedAt}`} order={o} ticket={t} teams={teams} onChanged={onChanged} onError={setError} />
              ))}
            </ul>
          </Section>
        )}

        <Section title="Historique">
          <ul className="space-y-1 text-sm text-paper-muted">
            <li>{dateTime(o.createdAt)} · créée</li>
            {o.paidAt && <li>{dateTime(o.paidAt)} · payée</li>}
            {o.history?.map((h, i) => <li key={i}>{dateTime(h.at)} · {h.action}</li>)}
          </ul>
        </Section>

        <p className="text-xs text-paper-dim">
          {o.imageConsentAt
            ? `Droit à l'image accepté en ligne le ${dateTime(o.imageConsentAt)} (pour toute la réservation).`
            : "Droit à l'image : pas d'accord enregistré (vente sur place ou ancienne commande)."}
        </p>

        {error && <ErrorNote>{error}</ErrorNote>}

        {o.status === "paid" && (
          <Section title="Envoyer les billets">
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent(`Bonjour ${o.buyer.name.split(" ")[0]} ! Voici tes billets pour ${o.eventTitle} chez Jeynnifer : ${location.origin}/reserver/confirmation/${o.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-full border border-line-strong px-3.5 text-sm font-semibold text-paper hover:border-peach hover:text-peach"
            >
              Envoyer par WhatsApp
            </a>
            {o.buyer.email && (
              <Button size="sm" variant="ghost" className="ml-2" disabled={mailing} onClick={resend}>
                {mailing ? "Envoi…" : o.emailedAt ? "Renvoyer par e-mail" : "Envoyer par e-mail"}
              </Button>
            )}
            <p className="mt-2 text-xs text-paper-dim">
              Le lien ouvre la page des billets (QR codes + adresse).
              {o.emailedAt ? ` E-mail envoyé le ${dateTime(o.emailedAt)}.` : o.buyer.email ? " E-mail pas encore envoyé." : " Pas d'e-mail pour cette commande."}
            </p>
            {mailNote && <p className="mt-2 text-xs text-emerald-300">{mailNote}</p>}
          </Section>
        )}

        <div className="flex flex-wrap gap-2 border-t border-line pt-5">
          {o.status !== "paid" && o.status !== "cancelled" && (
            <Button variant="primary" size="sm" disabled={busy} onClick={() => act("paid")}>
              <CheckIcon /> Paiement reçu
            </Button>
          )}
          {o.status !== "cancelled" && (
            <Button variant="danger" size="sm" disabled={busy || scanned > 0} title={scanned > 0 ? "Un billet a déjà été scanné" : undefined} onClick={() => act("cancel")}>
              <XIcon /> Annuler la commande
            </Button>
          )}
        </div>
      </div>
    </Overlay>
  );
}

/** Le pack de chaque place : modifiable (changement de taille, vente sur place…). */
function PacksEditor({ order: o, pack, onChanged }: { order: AdminOrder; pack: EventPack; onChanged: (o: AdminOrder) => void }) {
  const seats = o.items.reduce((n, i) => n + i.quantity * i.seats, 0);
  const [draft, setDraft] = useState<PackChoice[]>(() => Array.from({ length: seats }, (_, i) => o.packs?.[i] ?? { style: "", size: "" }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(Array.from({ length: seats }, (_, i) => o.packs?.[i] ?? { style: "", size: "" }));
  const set = (i: number, patch: Partial<PackChoice>) => setDraft((d) => d.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      onChanged(await adminApi.setOrderPacks(o.id, draft));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title={pack.label}>
      <ul className="space-y-2">
        {draft.map((p, i) => (
          <li key={i} className="grid grid-cols-[auto_1fr_5.5rem] items-center gap-2">
            <span className="w-14 text-xs text-paper-dim">Place {i + 1}</span>
            <Select aria-label={`Modèle, place ${i + 1}`} value={p.style} onChange={(e) => set(i, { style: e.target.value })} className="py-2! text-sm!">
              <option value="">Modèle…</option>
              {pack.styles.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select aria-label={`Taille, place ${i + 1}`} value={p.size} onChange={(e) => set(i, { size: e.target.value })} className="py-2! text-sm!">
              <option value="">Taille</option>
              {pack.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </li>
        ))}
      </ul>
      {!o.packs?.length && <p className="mt-2 text-xs text-amber-200">Pas encore renseigné pour cette commande.</p>}
      {error && <div className="mt-2"><ErrorNote>{error}</ErrorNote></div>}
      {dirty && (
        <Button size="sm" variant="primary" className="mt-3" disabled={busy || draft.some((p) => !p.style || !p.size)} onClick={save}>
          <CheckIcon /> Enregistrer
        </Button>
      )}
    </Section>
  );
}

/** Un billet : participant, sexe, équipe (modifiable : échange entre amis…), entrée. */
function TicketRow({
  order: o,
  ticket: t,
  teams,
  onChanged,
  onError,
}: {
  order: AdminOrder;
  ticket: AdminTicket;
  teams?: TeamDef[];
  onChanged: (o: AdminOrder) => void;
  onError: (m: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [holder, setHolder] = useState(t.holder);

  async function save(patch: { holder?: string; team?: string }) {
    setBusy(true);
    onError(null);
    try {
      onChanged(await adminApi.updateTicket(o.id, t.code, patch));
    } catch (err) {
      onError((err as Error).message);
      setHolder(t.holder);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="space-y-2 rounded-xl border border-line px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm text-paper">{t.code}</p>
          <p className="text-xs text-paper-dim">
            {t.label}
            {t.gender && ` · ${GENDER_LABEL[t.gender]}`}
            {t.pack && ` · ${t.pack.style} ${t.pack.size}`}
          </p>
        </div>
        {t.usedAt ? (
          <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-300"><CheckIcon className="h-4 w-4" /> {dateTime(t.usedAt)}</span>
        ) : (
          <span className="shrink-0 text-xs text-paper-dim">Pas encore entré</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          onBlur={() => holder.trim() !== t.holder && holder.trim().length >= 2 && save({ holder: holder.trim() })}
          disabled={busy}
          aria-label={`Participant du billet ${t.code}`}
          className="min-w-0 flex-1 rounded-lg border border-line-strong bg-night px-2.5 py-1.5 text-sm text-paper outline-none focus:border-peach"
        />
        {teams?.length ? (
          <Select
            aria-label={`Équipe du billet ${t.code}`}
            value={t.team?.name ?? ""}
            disabled={busy}
            onChange={(e) => e.target.value && confirm(`Passer ${t.holder} dans l'équipe ${e.target.value} ?`) && save({ team: e.target.value })}
            className="w-auto! py-1.5! text-sm!"
            style={t.team ? { background: t.team.color, color: isLightColor(t.team.color) ? "#141213" : "#fff", borderColor: "transparent" } : undefined}
          >
            {!t.team && <option value="">Équipe…</option>}
            {teams.map((x) => <option key={x.name} value={x.name}>Équipe {x.name}</option>)}
          </Select>
        ) : null}
      </div>
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-paper-dim">{title}</h3>
      {children}
    </section>
  );
}
