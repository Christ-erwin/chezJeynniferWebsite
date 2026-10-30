"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FRAMES = [
  { time: "19h30", title: "Accueil sous les guirlandes", text: "Tu choisis ton pouf, ton plaid, ta place. Les lumières sont déjà tamisées.", img: "/images/cine-wide.jpg" },
  { time: "20h00", title: "Popcorn & boissons", text: "De quoi grignoter et trinquer avant que l'écran ne s'allume.", img: "/images/cine-popcorn.jpg" },
  { time: "20h30", title: "Le film commence", text: "Un film choisi avec soin, un public qui rit, frissonne et réagit ensemble.", img: "/images/cine-garden.jpg" },
  { time: "22h30", title: "Après le générique", text: "On reste, on en parle, on refait la fin. C'est souvent le meilleur moment.", img: "/images/cine-small.jpg" },
];

function Sprockets() {
  return (
    <div aria-hidden className="flex h-7 items-center gap-4 overflow-hidden px-3">
      {Array.from({ length: 60 }, (_, i) => (
        <span key={i} className="h-3.5 w-5 shrink-0 rounded-[3px] bg-[#08070d]" />
      ))}
    </div>
  );
}

/** Le rituel d'une séance, sur une pellicule qui défile au rythme du scroll. */
export function FilmStrip() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".fs-track",
          { x: () => window.innerWidth * 0.15 },
          {
            x: () => -(root.current!.querySelector<HTMLElement>(".fs-track")!.scrollWidth - window.innerWidth * 0.85),
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="overflow-hidden py-6 motion-reduce:overflow-x-auto">
      <div className="fs-track w-max -rotate-[1.5deg] bg-[#1a1622] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
        <Sprockets />
        <ol className="flex gap-4 px-4">
          {FRAMES.map((f) => (
            <li key={f.title} className="w-[78vw] shrink-0 sm:w-[460px]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-sm">
                <Image src={f.img} alt="" fill sizes="460px" className="object-cover sepia-[0.15]" />
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-mono text-xs text-moon">{f.time}</p>
                  <h3 className="t-display mt-1 text-3xl text-paper">{f.title}</h3>
                  <p className="mt-1 text-sm text-paper-muted">{f.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <Sprockets />
      </div>
    </div>
  );
}
