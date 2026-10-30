"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PHASES = [
  { moon: 0, title: "La nuit tombe", text: "Le maître du jeu distribue les rôles en secret. Tout le monde ferme les yeux." },
  { moon: 0.35, title: "Les loups chassent", text: "Les loups se réveillent et désignent leur victime, en silence, d'un simple regard." },
  { moon: 0.7, title: "Le village s'éveille", text: "On découvre qui n'a pas survécu à la nuit. Les soupçons commencent." },
  { moon: 1, title: "Le vote", text: "On débat, on bluffe, on se défend… puis le village élimine un suspect." },
];

/** Phase de lune dessinée : `p` = 0 (nouvelle lune) → 1 (pleine lune rouge). */
function Moon({ p }: { p: number }) {
  return (
    <span className="relative block h-14 w-14 overflow-hidden rounded-full bg-[#2a0d10] shadow-[0_0_30px_rgba(200,38,47,0.25)]">
      <span
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_40%_35%,#ffb3a6,#c8262f_60%,#5a0f15)]"
        style={{ clipPath: `inset(0 ${100 - p * 100}% 0 0 round 999px)`, opacity: 0.35 + p * 0.65 }}
      />
    </span>
  );
}

/** Le déroulé d'une manche — une ligne de temps qui se remplit au scroll. */
export function NightCycle() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".nc-fill",
          { scaleX: 0, scaleY: 0 },
          { scaleX: 1, scaleY: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 60%", scrub: true } },
        );
        gsap.utils.toArray<HTMLElement>(".nc-step").forEach((el) => {
          gsap.from(el, { autoAlpha: 0.15, y: 30, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative">
      {/* fil : horizontal sur grand écran, vertical sur mobile */}
      <div className="absolute left-7 top-0 h-full w-px bg-line md:left-0 md:top-7 md:h-px md:w-full" />
      <div className="nc-fill absolute left-7 top-0 h-full w-px origin-top bg-wolf md:left-0 md:top-7 md:h-px md:w-full md:origin-left" />

      <ol className="relative grid gap-10 md:grid-cols-4 md:gap-8">
        {PHASES.map((ph, i) => (
          <li key={ph.title} className="nc-step relative flex gap-6 md:block">
            <Moon p={ph.moon} />
            <div className="md:mt-8">
              <p className="t-label text-paper-dim">Phase {i + 1}</p>
              <h3 className="t-display mt-2 text-3xl text-paper">{ph.title}</h3>
              <p className="mt-2 leading-relaxed text-paper-muted">{ph.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
