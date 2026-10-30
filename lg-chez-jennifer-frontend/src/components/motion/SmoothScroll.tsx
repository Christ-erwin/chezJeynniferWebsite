"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Défilement doux (Lenis) synchronisé avec GSAP ScrollTrigger.
 * Désactivé si l'utilisateur demande moins d'animations.
 * (La classe `js-motion` est posée sur <html> par un script inline du layout,
 * avant le premier rendu, pour éviter tout flash.)
 */
export function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // ancres internes (#billetterie…) via Lenis pour garder la fluidité
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const hash = href.startsWith("#") ? href : href.startsWith(location.pathname + "#") ? href.slice(location.pathname.length) : "";
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80 });
      history.replaceState(null, "", hash);
    };
    document.addEventListener("click", onClick);

    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
