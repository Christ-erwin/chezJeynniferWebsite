"use client";

import { useState } from "react";
import { adminApi, METHOD_LABEL, ORDER_STATUS, type AdminOrder } from "@/lib/admin-api";
import { Badge, Button, CheckIcon, dateTime, ErrorNote, fcfa, Overlay, XIcon } from "./ui";

/** Détail d'une commande + actions (valider le paiement, annuler). */
export function OrderPanel({ order: o, onClose, onChanged }: { order: AdminOrder; onClose: () => void; onChanged: (o: AdminOrder) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanned = o.tickets.filter((t) => t.usedAt).length;
  const phone = o.buyer.phone.replace(/\D/g, "");

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
          <span className="text-sm text-paper-muted">
            {METHOD_LABEL[o.paymentMethod]} · {o.provider === "manual" ? "saisie admin" : o.provider === "cinetpay" ? "CinetPay" : "simulateur"}
          </span>
        </div>

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
            <li className="flex justify-between border-t border-line pt-2 font-semibold">
              <span className="text-paper">Total</span>
              <span className="tabular-nums text-peach">{fcfa(o.total)}</span>
            </li>
          </ul>
        </Section>

        {o.tickets.length > 0 && (
          <Section title={`Billets · ${scanned}/${o.tickets.length} scanné${scanned > 1 ? "s" : ""}`}>
            <ul className="space-y-2">
              {o.tickets.map((t) => (
                <li key={t.code} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2">
                  <div>
                    <p className="font-mono text-sm text-paper">{t.code}</p>
                    <p className="text-xs text-paper-dim">{t.label}</p>
                  </div>
                  {t.usedAt ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-300"><CheckIcon className="h-4 w-4" /> {dateTime(t.usedAt)}</span>
                  ) : (
                    <span className="text-xs text-paper-dim">Pas encore entré</span>
                  )}
                </li>
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
            <p className="mt-2 text-xs text-paper-dim">Le lien ouvre la page des billets (QR codes + adresse).</p>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-paper-dim">{title}</h3>
      {children}
    </section>
  );
}
