"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmMockPayment, getOrder, type Order } from "@/lib/api";
import { formatPrice } from "@/lib/catalog";
import { PAYMENT_METHODS } from "@/components/PaymentBadges";
import { LockIcon } from "@/components/icons";

/**
 * Simulateur de paiement (développement uniquement — le backend ne l'active
 * que si CinetPay n'est pas configuré). En production, le client est envoyé
 * sur le vrai guichet CinetPay où il valide avec Wave ou Orange Money.
 */
export default function SimulationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"ok" | "ko" | null>(null);

  useEffect(() => {
    getOrder(orderId).then(setOrder, (e: Error) => setError(e.message));
  }, [orderId]);

  const method = PAYMENT_METHODS.find((m) => m.id === order?.paymentMethod) ?? PAYMENT_METHODS[0];

  async function decide(success: boolean) {
    setBusy(success ? "ok" : "ko");
    try {
      await confirmMockPayment(orderId, success);
      router.replace(`/reserver/confirmation/${orderId}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <main id="contenu" className="flex min-h-[100svh] items-center justify-center px-5 pb-16 pt-28">
      <div className="w-full max-w-sm">
        <p className="mb-4 rounded-full border border-dashed border-peach/40 px-4 py-2 text-center text-xs text-peach">
          Simulateur de paiement — mode développement, aucun argent réel
        </p>

        <div className="overflow-hidden rounded-[2.2rem] border-[6px] border-[#1d1612] bg-white text-[#111] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
          <div className="px-6 py-5 text-center" style={{ background: method.color, color: method.ink }}>
            <p className="text-2xl font-black tracking-tight">{method.name}</p>
            <p className="text-xs opacity-80">Demande de paiement</p>
          </div>

          <div className="space-y-5 px-6 py-7">
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {!order && !error && <p className="py-10 text-center text-sm text-neutral-500">Chargement…</p>}
            {order && (
              <>
                <div className="text-center">
                  <p className="text-sm text-neutral-500">Montant à payer</p>
                  <p className="mt-1 text-4xl font-black tabular-nums">{formatPrice(order.total)}</p>
                </div>
                <dl className="space-y-2 rounded-2xl bg-neutral-100 p-4 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-neutral-500">Marchand</dt><dd className="font-semibold">Les Soirées chez Jeynnifer</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-neutral-500">Objet</dt><dd className="text-right font-semibold">{order.eventTitle}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-neutral-500">Référence</dt><dd className="font-mono">{order.reference}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-neutral-500">Numéro</dt><dd className="font-mono">{order.buyer.phone}</dd></div>
                </dl>

                {order.status === "pending" ? (
                  <div className="space-y-3">
                    <button onClick={() => decide(true)} disabled={!!busy} className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold disabled:opacity-60" style={{ background: method.color, color: method.ink }}>
                      <LockIcon className="h-4 w-4" /> {busy === "ok" ? "Validation…" : "Valider le paiement"}
                    </button>
                    <button onClick={() => decide(false)} disabled={!!busy} className="w-full rounded-2xl py-3 text-sm font-semibold text-neutral-500 hover:bg-neutral-100 disabled:opacity-60">
                      {busy === "ko" ? "Annulation…" : "Refuser"}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => router.replace(`/reserver/confirmation/${orderId}`)} className="w-full rounded-2xl bg-neutral-900 py-4 font-bold text-white">
                    Voir ma commande
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
