"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { gsap } from "gsap";
import { getOrder, type Order } from "@/lib/api";
import { dateParts, formatPrice } from "@/lib/catalog";
import { whatsappLink } from "@/lib/site";
import { PassButton, GhostButton, Logo } from "@/components/ui";
import { CheckIcon, PinIcon, CalendarIcon, WhatsappIcon } from "@/components/icons";

const POLL_MS = 3000;
const POLL_MAX = 100; // ~5 min

export function Confirmation({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const celebrated = useRef(false);

  useEffect(() => {
    let n = 0;
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;
    const tick = async () => {
      try {
        const o = await getOrder(orderId);
        if (!alive) return;
        setOrder(o);
        setError(null);
        if (o.status === "pending") {
          if (++n < POLL_MAX) timer = setTimeout(tick, POLL_MS);
          else setGaveUp(true);
        }
      } catch (e) {
        if (!alive) return;
        setError((e as Error).message);
        if (++n < POLL_MAX) timer = setTimeout(tick, POLL_MS * 2);
      }
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [orderId]);

  // petite célébration quand les billets apparaissent
  useEffect(() => {
    if (order?.status !== "paid" || celebrated.current) return;
    celebrated.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from(".cf-ticket", { y: 60, autoAlpha: 0, rotate: -3, duration: 1.1, stagger: 0.15, ease: "expo.out" });
    gsap.fromTo(
      ".cf-spark",
      { scale: 0, autoAlpha: 1 },
      { scale: 1, autoAlpha: 0, duration: 1.6, stagger: 0.03, ease: "expo.out", x: () => gsap.utils.random(-260, 260), y: () => gsap.utils.random(-220, 60) },
    );
  }, [order?.status]);

  if (error && !order) {
    return (
      <Shell>
        <h1 className="t-display text-5xl text-paper">Commande introuvable</h1>
        <p className="mt-4 text-paper-muted">{error}</p>
        <div className="mt-8"><PassButton href="/evenements">Voir les événements</PassButton></div>
      </Shell>
    );
  }

  if (!order) {
    return (
      <Shell>
        <Spinner />
        <p className="mt-6 text-paper-muted">On récupère ta commande…</p>
      </Shell>
    );
  }

  const { long } = dateParts(order.eventDate);

  if (order.status === "pending") {
    return (
      <Shell>
        <Spinner />
        <h1 className="t-display mt-8 text-5xl text-paper sm:text-6xl">Valide le paiement sur ton téléphone</h1>
        <p className="mx-auto mt-4 max-w-md text-paper-muted">
          Une demande de {formatPrice(order.total)} a été envoyée via {order.paymentMethod === "wave" ? "Wave" : "Orange Money"} au{" "}
          {order.buyer.phone}. Cette page se met à jour toute seule.
        </p>
        <p className="mt-6 font-mono text-sm text-paper-dim">Référence {order.reference}</p>
        {gaveUp && (
          <p className="mt-8 text-sm text-paper-muted">
            Toujours rien ? Recharge la page, ou{" "}
            <a className="text-peach underline" href={whatsappLink(`Bonjour, ma commande ${order.reference} est toujours en attente.`)} target="_blank" rel="noopener noreferrer">
              écris-nous sur WhatsApp
            </a>
            .
          </p>
        )}
      </Shell>
    );
  }

  if (order.status !== "paid") {
    const why =
      order.status === "expired" ? "Le délai de paiement est dépassé : les places ont été libérées." : "Le paiement n'a pas abouti. Aucun montant n'a été débité.";
    return (
      <Shell>
        <h1 className="t-display text-5xl text-paper sm:text-6xl">Paiement non finalisé</h1>
        <p className="mx-auto mt-4 max-w-md text-paper-muted">{why}</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <PassButton href={`/reserver/${order.eventId}`}>Réessayer</PassButton>
          <GhostButton href="/evenements" arrow={false}>Voir les autres soirées</GhostButton>
        </div>
      </Shell>
    );
  }

  return (
    <main id="contenu" className="relative mx-auto max-w-4xl px-5 pb-24 pt-32 sm:px-8">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-40">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} className="cf-spark absolute block h-2 w-2 rounded-full opacity-0" style={{ background: i % 3 ? "#f6c9a7" : "#ffcf8a", boxShadow: "0 0 10px #ffcf8a" }} />
        ))}
      </div>

      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-peach text-cacao">
          <CheckIcon className="h-6 w-6" />
        </span>
        <p className="t-script mt-6 text-4xl text-peach">C&apos;est réservé !</p>
        <h1 className="t-display mt-2 text-5xl text-paper sm:text-6xl">On t&apos;attend, {order.buyer.name.split(" ")[0]}.</h1>
        <p className="mx-auto mt-4 max-w-lg text-paper-muted">
          Garde cette page (ou fais une capture) : chaque QR code est une entrée. Commande {order.reference} · {formatPrice(order.total)}.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {order.tickets.map((t, i) => (
          <article key={t.code} className="cf-ticket relative overflow-hidden rounded-[1.4rem] bg-cream text-cacao">
            <div className="flex items-start justify-between gap-4 p-6">
              <div>
                <Logo tone="cacao" className="text-sm" />
                <p className="t-caps mt-5 text-3xl">{order.eventTitle.replace(" chez Jeynnifer", "")}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-cacao-muted"><CalendarIcon className="h-4 w-4" /> {long}</p>
                {order.venue && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-cacao-muted"><PinIcon className="h-4 w-4" /> {order.venue.address ?? order.venue.name}</p>
                )}
              </div>
              <span className="rounded-full bg-cacao px-3 py-1 text-xs font-bold text-peach">{i + 1}/{order.tickets.length}</span>
            </div>
            <div className="relative flex items-center justify-between gap-4 border-t-2 border-dashed border-cacao/20 p-6">
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-night" />
              <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-night" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cacao-muted">{t.label}</p>
                <p className="mt-1 font-semibold">{t.holder}</p>
                <p className="mt-2 font-mono text-sm">{t.code}</p>
              </div>
              <QRCodeSVG value={t.code} size={96} bgColor="transparent" fgColor="#2b1a14" level="M" />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row print:hidden">
        <button onClick={() => window.print()} className="inline-flex items-center justify-center rounded-full bg-peach px-7 py-3.5 font-semibold text-cacao">
          Imprimer / enregistrer en PDF
        </button>
        <a href={whatsappLink(`Bonjour ! J'ai réservé (${order.reference}) pour ${order.eventTitle}.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-paper/30 px-7 py-3.5 font-semibold text-paper hover:border-peach hover:text-peach">
          <WhatsappIcon className="h-4 w-4" /> Une question ?
        </a>
      </div>
      <p className="mt-6 text-center text-sm text-paper-dim">
        <Link href="/" className="hover:text-peach">Retour à l&apos;accueil</Link>
      </p>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="contenu" className="mx-auto flex min-h-[80svh] max-w-2xl flex-col items-center justify-center px-5 pb-20 pt-32 text-center">
      {children}
    </main>
  );
}

function Spinner() {
  return (
    <span className="relative flex h-16 w-16 items-center justify-center">
      <span className="absolute inset-0 animate-ping rounded-full bg-peach/20" />
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-peach/20 border-t-peach" />
    </span>
  );
}
