"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TicketIcon } from "@/components/icons";

/**
 * Barre flottante "Prendre mon pass" qui apparaît après le premier écran
 * d'une page univers : la réservation reste à un geste, partout.
 */
export function StickyPass({ label, from, accent }: { label: string; from?: string; accent: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const target = document.getElementById("billetterie");
    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.9;
      const atTickets = target ? target.getBoundingClientRect().top < window.innerHeight * 0.85 : false;
      setShow(pastHero && !atTickets);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 transition-all duration-500 ease-(--ease-soft) ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0"
      }`}
    >
      <Link
        href="#billetterie"
        className="flex max-w-full items-center gap-3 rounded-full border border-line-strong bg-night/85 py-2 pl-4 pr-2 shadow sm:gap-4 sm:pl-5-[0_20px_50px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
        <span className="min-w-0 truncate text-sm text-paper">
          {label}
          {from && <span className="ml-2 hidden text-paper-dim sm:inline">dès {from}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-peach px-4 py-2.5 text-sm font-semibold text-cacao">
          <TicketIcon className="h-4 w-4" /> Prendre mon pass
        </span>
      </Link>
    </div>
  );
}
