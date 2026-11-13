"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Phase = "jour" | "sunset" | "nuit" | "matin";

const PHASE: Record<Phase, { color: string; icon: "sun" | "moon" | "dawn" }> = {
  jour: { color: "#6fd0d6", icon: "sun" },
  sunset: { color: "#ff9a52", icon: "sun" },
  nuit: { color: "#b9a3ff", icon: "moon" },
  matin: { color: "#ffc9a8", icon: "dawn" },
};

/** Le parcours de la présentation (édition 01) : seules les heures de départ sont fixées. */
const STEPS: { when: string; title: string; text: string; phase: Phase }[] = [
  { when: "Samedi · 10h", title: "Départ d'Abidjan", text: "Accueil, embarquement en car, présentation du programme et création des équipes.", phase: "jour" },
  { when: "En fin de matinée", title: "Exploration", text: "Balade en bateau, découverte guidée des îles et de leur végétation, histoire et culture locales.", phase: "jour" },
  { when: "Midi", title: "Arrivée sur la plage", text: "Installation, buffet du midi, découverte des espaces… et premiers passages au confessionnal.", phase: "jour" },
  { when: "L'après-midi", title: "Jeux et défis", text: "Les jeux de notre enfance, tir à la corde, mimes, compétitions entre équipes.", phase: "jour" },
  { when: "Au coucher du soleil", title: "Sunset & nuit", text: "DJ, barbecue, coucher de soleil, Loup-Garou autour du feu de camp. La musique jusque tard.", phase: "sunset" },
  { when: "Sous les étoiles", title: "Cinéma & repos", text: "Un film de notre enfance en plein air, puis des chambres et espaces de repos pour dormir sur place.", phase: "nuit" },
  { when: "Dimanche matin", title: "Le Réveil", text: "Petit-déjeuner, dernières interviews, départ du site vers 10h et retour en car jusqu'à Abidjan.", phase: "matin" },
];

function Icon({ kind }: { kind: "sun" | "moon" | "dawn" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      {kind === "moon" ? (
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      ) : kind === "dawn" ? (
        <path d="M5 17a7 7 0 0 1 14 0M3 20h18M12 5v3M5.6 9.6l1.8 1.4M18.4 9.6 16.6 11" />
      ) : (
        <>
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </>
      )}
    </svg>
  );
}

/**
 * Les 24 heures, du départ d'Abidjan au retour : une ligne qui se remplit
 * au scroll, dont la couleur passe du jour au coucher de soleil, à la nuit,
 * puis au matin.
 */
export function DayTimeline() {
  const root = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(".dt-fill", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 60%", scrub: 0.5 } });
        gsap.utils.toArray<HTMLElement>(".dt-step").forEach((el) =>
          gsap.from(el, { autoAlpha: 0, y: 24, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 80%" } }),
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <ol ref={root} className="relative ml-2 space-y-10 sm:ml-4">
      {/* rail + remplissage qui suit le scroll */}
      <span className="absolute bottom-2 left-[19px] top-2 w-[2px] bg-line" aria-hidden />
      <span
        className="dt-fill absolute bottom-2 left-[19px] top-2 w-[2px] origin-top"
        style={{ background: "linear-gradient(180deg,#6fd0d6 0%,#6fd0d6 45%,#ff9a52 62%,#b9a3ff 80%,#ffc9a8 100%)" }}
        aria-hidden
      />
      {STEPS.map((s) => {
        const p = PHASE[s.phase];
        return (
          <li key={s.title} className="dt-step relative grid grid-cols-[40px_1fr] gap-5">
            <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-dusk" style={{ borderColor: `${p.color}88`, color: p.color, boxShadow: `0 0 24px -6px ${p.color}` }}>
              <Icon kind={p.icon} />
            </span>
            <div className="pt-1">
              <p className="t-label" style={{ color: p.color }}>{s.when}</p>
              <h3 className="t-display mt-2 text-3xl text-paper sm:text-4xl">{s.title}</h3>
              <p className="mt-2 max-w-xl leading-relaxed text-paper-muted">{s.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
