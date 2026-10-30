"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const GAMES = [
  { name: "UNO", tag: "2 à 10 joueurs", text: "Le classique qui met tout le monde d'accord… jusqu'au +4.", color: "#e3423a", icon: "M14 10h20a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4ZM18 30l12-12" },
  { name: "Jeux de mimes", tag: "En équipes", text: "Zéro parole, cent fous rires. Même les plus timides s'y mettent.", color: "#f4b93a", icon: "M24 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12ZM12 40l6-14h12l6 14M10 24l8 2M38 24l-8 2" },
  { name: "Devine mon dessin", tag: "En équipes", text: "Un crayon, une minute, une salle qui crie des réponses.", color: "#2e9d5b", icon: "M10 38l4-12L32 8l8 8-18 18-12 4ZM28 12l8 8" },
  { name: "Devine Tête", tag: "3 joueurs et +", text: "Un mot sur le front, et tout le monde t'aide… ou pas.", color: "#2f6fd6", icon: "M24 10a14 14 0 1 1 0 28 14 14 0 0 1 0-28ZM20 22a4 4 0 1 1 6 3c-1 1-2 2-2 4M24 33v.5" },
  { name: "Quiz & blind test", tag: "En équipes", text: "Culture générale, refrains, sons… le buzzer n'attend personne.", color: "#b05ad6", icon: "M18 34V14l18-4v20M18 34a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM36 30a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" },
  { name: "Défis d'adresse", tag: "Libre", text: "Tours qui tremblent, gobelets qui volent, mains qui hésitent.", color: "#f08a3c", icon: "M14 38h20M16 30h16M18 22h12M20 14h8" },
];

function GameCard({ g, i }: { g: (typeof GAMES)[number]; i: number }) {
  return (
    <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-[1.4rem] border-[3px] border-[#fff6ea] bg-[#fff6ea] p-1 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.75)]">
      <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[1.1rem] p-6 text-white" style={{ background: g.color }}>
        <div className="flex items-start justify-between">
          <span className="font-sans text-sm font-black italic">{String(i + 1).padStart(2, "0")}</span>
          <span className="rounded-full bg-black/20 px-3 py-1 text-[0.7rem] font-bold">{g.tag}</span>
        </div>
        <svg viewBox="0 0 48 48" className="mx-auto my-4 h-20 w-20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d={g.icon} />
        </svg>
        <div>
          <h3 className="t-caps text-3xl leading-none">{g.name}</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/85">{g.text}</p>
        </div>
        <span aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
      </div>
    </article>
  );
}

/**
 * Les jeux de la soirée, distribués comme une main de cartes : sur grand
 * écran la section s'épingle, le paquet se déploie en éventail au scroll.
 * Sur mobile : un défilement horizontal simple.
 */
export function GameFan() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".gf-card");
        const n = cards.length;
        gsap.set(cards, { xPercent: -50, yPercent: -50, rotate: (i) => (i - n / 2) * 1.5, x: 0, y: (i) => -i * 2 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: ".gf-pin", start: "top top", end: "+=160%", scrub: 0.7, pin: true, invalidateOnRefresh: true },
        });
        tl.from(".gf-head", { autoAlpha: 0, y: 30, duration: 0.3 })
          .to(
            cards,
            {
              x: (i) => (i - (n - 1) / 2) * Math.min(205, (window.innerWidth - 320) / (n - 1)),
              y: (i) => Math.abs(i - (n - 1) / 2) ** 2 * 14,
              rotate: (i) => (i - (n - 1) / 2) * 7,
              duration: 1,
              ease: "power2.inOut",
              stagger: 0.04,
            },
            0.1,
          )
          .to({}, { duration: 0.35 });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      {/* grand écran : éventail épinglé */}
      <div className="gf-pin relative hidden h-[100svh] overflow-hidden lg:block">
        <div className="gf-head absolute inset-x-0 top-[12%] z-10 text-center">
          <p className="t-label text-game">Les tables de la soirée</p>
          <h2 className="t-display mx-auto mt-3 max-w-3xl text-6xl text-paper">Six jeux, une seule règle : s&apos;amuser.</h2>
        </div>
        <div className="absolute left-1/2 top-[62%] h-0 w-0">
          {GAMES.map((g, i) => (
            <div key={g.name} className="gf-card absolute left-0 top-0 h-[340px] w-[240px]" style={{ zIndex: i }}>
              <GameCard g={g} i={i} />
            </div>
          ))}
        </div>
      </div>

      {/* mobile / tablette : liste horizontale */}
      <div className="lg:hidden">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <p className="t-label text-game" data-reveal>Les tables de la soirée</p>
          <h2 className="t-display mt-3 text-5xl text-paper" data-split>Six jeux, une seule règle : s&apos;amuser.</h2>
        </div>
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
          {GAMES.map((g, i) => (
            <div key={g.name} className="h-[340px] w-[240px] shrink-0 snap-center">
              <GameCard g={g} i={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
