"use client";

import { useEffect, useState } from "react";
import type Lenis from "lenis";

/**
 * Bouton flottant en bas à droite : apparaît après un peu de défilement et
 * remonte en haut de la page (en douceur via Lenis quand il est actif).
 */
export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setShow(window.scrollY > 600);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const toTop = () => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Remonter en haut de la page"
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      className={`fixed right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-night/85 text-paper shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] backdrop-blur transition-[opacity,transform,border-color,color] duration-300 hover:border-peach hover:text-peach sm:right-8 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
