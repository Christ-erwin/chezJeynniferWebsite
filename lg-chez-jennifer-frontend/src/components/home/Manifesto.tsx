"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { UserIcon, UsersIcon, HeartIcon } from "@/components/icons";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const TEXT =
  "Pas besoin d'une musique assourdissante pour passer une bonne soirée. On vient pour jouer, rire, discuter, rencontrer du monde, manger, boire un verre, regarder un film — et surtout partager un vrai moment ensemble.";

/** Mots qui portent la promesse : ils s'allument en pêche plutôt qu'en crème. */
const KEY = new Set(["jouer,", "rire,", "rencontrer", "regarder", "partager", "ensemble."]);

const FOR = [
  { icon: UserIcon, label: "Seul·e", text: "Personne ne reste dans son coin." },
  { icon: UsersIcon, label: "Entre amis", text: "La bande au complet, en mieux." },
  { icon: HeartIcon, label: "En couple", text: "Un rendez-vous qui sort de l'ordinaire." },
];

/**
 * La promesse de la marque, épinglée : chaque mot s'allume au rythme du
 * scroll, comme une salle qui se réveille. Puis les trois façons de venir.
 */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const words = gsap.utils.toArray<HTMLElement>(".mf-word");
        gsap
          .timeline({
            scrollTrigger: {
              trigger: ".mf-pin",
              start: "top top",
              end: "+=140%",
              scrub: 0.6,
              pin: true,
            },
          })
          .fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.08, ease: "none" })
          .fromTo(".mf-glow", { scale: 0.6, opacity: 0 }, { scale: 1.2, opacity: 1, ease: "none" }, 0);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="a-propos" className="relative bg-night">
      <div className="mf-pin relative flex min-h-[100svh] items-center overflow-hidden py-24">
        <div className="mf-glow pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(232,162,90,0.22),transparent_65%)] blur-2xl" />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
          <p className="t-label mb-8 text-peach">Notre manière de sortir</p>
          <p className="t-display text-[2rem] leading-[1.18] sm:text-5xl lg:text-[3.6rem]">
            {TEXT.split(" ").map((w, i) => (
              <span key={i} className={`mf-word ${KEY.has(w) ? "italic text-peach" : "text-paper"}`}>
                {w}{" "}
              </span>
            ))}
          </p>
          <p className="t-script mt-8 text-3xl text-paper-muted sm:text-4xl">— chez Jeynnifer</p>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1400px] px-5 pb-24 sm:px-8">
        <div className="grid gap-px overflow-hidden rounded-[1.4rem] border border-line bg-line sm:grid-cols-3" data-stagger>
          {FOR.map(({ icon: Icon, label, text }) => (
            <div key={label} className="flex items-start gap-4 bg-night-2 p-7 sm:p-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-peach/30 text-peach">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="t-display text-2xl text-paper">Viens {label.toLowerCase()}</p>
                <p className="mt-1 text-sm text-paper-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
