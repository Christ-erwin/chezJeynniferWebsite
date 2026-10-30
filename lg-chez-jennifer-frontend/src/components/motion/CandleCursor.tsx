"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Une lueur de bougie qui suit doucement le pointeur (desktop uniquement) :
 * l'ambiance "lumière tamisée" jusque dans la navigation.
 */
export function CandleCursor() {
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = glow.current;
    if (!el) return;
    const ok = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!ok.matches) return;

    gsap.set(el, { xPercent: -50, yPercent: -50 });
    const x = gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
      el.style.opacity = "1";
    };
    const leave = () => (el.style.opacity = "0");
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={glow}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-60 hidden h-[420px] w-[420px] rounded-full opacity-0 mix-blend-soft-light transition-opacity duration-500 [@media(hover:hover)_and_(pointer:fine)]:block"
      style={{
        background:
          "radial-gradient(circle, rgba(246,201,167,0.38) 0%, rgba(232,162,90,0.14) 35%, transparent 70%)",
      }}
    />
  );
}
