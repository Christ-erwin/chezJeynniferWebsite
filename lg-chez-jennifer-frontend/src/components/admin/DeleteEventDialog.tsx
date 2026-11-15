"use client";

import { useEffect, useState } from "react";
import { adminApi, type AdminEvent, type DeletionImpact } from "@/lib/admin-api";
import { Button, ErrorNote, Overlay, Skeleton, TrashIcon, fcfa } from "./ui";

const METHOD: Record<string, string> = { wave: "Wave", orange_money: "Orange Money", cash: "Espèces" };

/**
 * Confirmation de suppression d'une édition. S'il y a des commandes payées,
 * liste les clients à rembourser (montant, moyen de paiement, téléphone) :
 * à la validation, leurs commandes sont annulées et marquées « à rembourser ».
 */
export function DeleteEventDialog({ event, onClose, onDeleted }: { event: AdminEvent; onClose: () => void; onDeleted: () => void }) {
  const [impact, setImpact] = useState<DeletionImpact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi.deletionImpact(event.id).then(setImpact, (e: Error) => setError(e.message));
  }, [event.id]);

  const hasOrders = !!impact && (impact.paid.length > 0 || impact.pending > 0);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await adminApi.deleteEvent(event.id, hasOrders);
      onDeleted();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Overlay title={`Supprimer « ${event.title} » ?`} onClose={onClose}>
      {!impact && !error && <Skeleton className="h-24" />}

      {impact && !hasOrders && <p className="text-sm text-paper-muted">Aucune commande pour cette édition. Elle sera supprimée définitivement.</p>}

      {impact && hasOrders && (
        <div className="space-y-4">
          {impact.paid.length > 0 && (
            <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-100">
              <p className="font-semibold">
                ⚠️ {impact.paid.length} commande{impact.paid.length > 1 ? "s" : ""} déjà payée{impact.paid.length > 1 ? "s" : ""} : il faudra rembourser{" "}
                {impact.paid.length > 1 ? "ces clients" : "ce client"}, soit {fcfa(impact.refundTotal)} au total.
              </p>
              <p className="mt-1 text-amber-100/80">
                Le remboursement se fait hors du site (Wave, Orange Money ou espèces). Les commandes resteront dans « Commandes » avec la mention
                « À rembourser » : tu les marqueras comme remboursées au fur et à mesure.
              </p>
            </div>
          )}
          {impact.paid.length > 0 && (
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {impact.paid.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-paper">{o.buyer.name}</span>
                    <span className="block text-xs text-paper-dim">
                      {o.reference} · {o.seats} place{o.seats > 1 ? "s" : ""} · {METHOD[o.paymentMethod] ?? o.paymentMethod} · {o.buyer.phone}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-peach">{fcfa(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
          {impact.pending > 0 && (
            <p className="text-sm text-paper-muted">
              {impact.pending} commande{impact.pending > 1 ? "s" : ""} en attente de paiement {impact.pending > 1 ? "seront annulées" : "sera annulée"}.
            </p>
          )}
          <p className="text-sm text-paper-muted">Les billets de cette édition ne seront plus valables. Cette action est définitive.</p>
        </div>
      )}

      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" onClick={onClose} disabled={busy}>
          Annuler
        </Button>
        <Button type="button" variant="danger" onClick={confirm} disabled={busy || !impact}>
          <TrashIcon /> {busy ? "Suppression…" : impact?.paid.length ? "Supprimer et noter les remboursements" : "Supprimer l'édition"}
        </Button>
      </div>
    </Overlay>
  );
}
