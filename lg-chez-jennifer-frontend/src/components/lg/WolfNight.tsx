"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { PassButton, GhostButton } from "@/components/ui";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const BEATS = [
  { k: "Minuit", t: "Le village s'endort." },
  { k: "Une heure", t: "Les loups ouvrent les yeux." },
  { k: "À l'aube", t: "Qui ment ? Qui observe ? Qui survivra ?" },
];

const EMBERS = Array.from({ length: 26 }, (_, i) => ({ left: (i * 41) % 100, bottom: (i * 17) % 35, size: 2 + (i % 3) }));

/**
 * Entrée dans la nuit du village. Sur grand écran la scène s'épingle : la
 * caméra avance vers le loup, la lune rougit, et la nuit se raconte en trois
 * temps. Sur mobile (et en reduced-motion) : une scène fixe, sans épinglage.
 */
export function WolfNight() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(".wn-title", { type: "words,chars,lines", mask: "lines", linesClass: "u-line" });
        gsap
          .timeline({ delay: 0.8, defaults: { ease: "expo.out" } })
          .from(".wn-photo-in", { scale: 1.35, filter: "brightness(0)", duration: 3, ease: "power2.out" }, 0)
          .from(split.chars, { yPercent: 120, rotate: 8, duration: 1.2, stagger: 0.035 }, 0.5)
          .from(".wn-sub, .wn-kicker, .wn-ctas", { autoAlpha: 0, y: 24, duration: 1.1, stagger: 0.12 }, 1)
          .from(".wn-fog", { autoAlpha: 0, duration: 2.5 }, 0.4);

        gsap.utils.toArray<HTMLElement>(".wn-ember").forEach((e, i) => {
          const d = 6 + (i % 6);
          gsap
            .timeline({ repeat: -1, delay: (i * 0.41) % 5 })
            .fromTo(e, { y: 0, x: 0 }, { y: -300 - (i % 4) * 70, x: (i % 2 ? 1 : -1) * (15 + (i % 5) * 10), duration: d, ease: "none" }, 0)
            .fromTo(e, { autoAlpha: 0 }, { autoAlpha: 0.95, duration: d * 0.2 }, 0)
            .to(e, { autoAlpha: 0, duration: d * 0.3 }, d * 0.7);
        });

        return () => split.revert();
      });

      // séquence épinglée — grand écran uniquement
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.set(".wn-beat", { autoAlpha: 0, y: 40 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=220%", scrub: 0.8, pin: true },
        });
        tl.to(".wn-intro", { autoAlpha: 0, y: -80, duration: 1 }, 0)
          .to(".wn-photo", { scale: 1.3, xPercent: -4, yPercent: 3, duration: 4, ease: "none" }, 0)
          .to(".wn-red", { autoAlpha: 1, duration: 3 }, 0.8)
          .to(".wn-dark", { autoAlpha: 0.55, duration: 2 }, 1);
        BEATS.forEach((_, i) => {
          const at = 1 + i * 1.1;
          tl.to(`.wn-beat-${i}`, { autoAlpha: 1, y: 0, duration: 0.5 }, at);
          if (i < BEATS.length - 1) tl.to(`.wn-beat-${i}`, { autoAlpha: 0, y: -40, duration: 0.4 }, at + 0.8);
        });
        tl.to({}, { duration: 0.6 });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[#070404]">
      <div className="wn-photo absolute inset-0 will-change-transform" style={{ transformOrigin: "58% 42%" }}>
        <div className="wn-photo-in absolute inset-0">
          <Image src="/images/lg-scene.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[55%_40%] saturate-[1.15]" />
        </div>
      </div>
      <div className="wn-red pointer-events-none absolute inset-0 opacity-0 mix-blend-multiply bg-[radial-gradient(60%_60%_at_58%_38%,rgba(200,38,47,0.25),rgba(74,11,16,0.85)_70%)]" />
      <div className="wn-dark pointer-events-none absolute inset-0 bg-[#070404] opacity-0" />

      {/* brume */}
      <div className="wn-fog pointer-events-none absolute -inset-x-1/4 bottom-[-10%] h-1/2">
        <div className="anim-drift absolute inset-0 bg-[radial-gradient(50%_60%_at_40%_70%,rgba(255,235,230,0.12),transparent_70%)] blur-2xl" />
        <div className="anim-drift absolute inset-0 bg-[radial-gradient(45%_50%_at_70%_80%,rgba(200,38,47,0.18),transparent_70%)] blur-3xl [animation-delay:-12s]" />
      </div>

      {/* braises */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {EMBERS.map((e, i) => (
          <span key={i} className="wn-ember absolute rounded-full opacity-0" style={{ left: `${e.left}%`, bottom: `${e.bottom}%`, width: e.size, height: e.size, background: "#ff6b4a", boxShadow: "0 0 8px 2px rgba(255,80,60,0.7)" }} />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_35%,rgba(7,4,4,0.75)_80%,#070404_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#070404]/90 via-[#070404]/40 to-transparent md:w-2/3" />

      {/* intro */}
      <div className="wn-intro relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-20 sm:px-8 md:justify-center md:pb-0">
        <p className="wn-kicker t-label text-wolf-bright">Bluff · Stratégie · Immersion · Suspense</p>
        <h1 className="wn-title t-caps mt-5 text-paper">
          <span className="block text-3xl tracking-[0.3em] text-paper-muted sm:text-4xl">Soirée</span>
          <span className="block whitespace-nowrap text-[2.75rem] leading-[0.9] sm:text-8xl lg:text-[8.5rem]">Loup&#8209;Garou</span>
        </h1>
        <p className="wn-sub t-caps mt-3 text-xl tracking-[0.3em] text-paper-muted">chez Jeynnifer</p>
        <p className="wn-sub mt-6 max-w-md leading-relaxed text-paper-muted">
          L&apos;expérience la plus immersive. Petit comité, places limitées : observer, mentir, enquêter, accuser — survivre.
        </p>
        <div className="wn-ctas mt-9 flex flex-col gap-3 sm:flex-row">
          <PassButton href="#billetterie">Prendre mon pass</PassButton>
          <GhostButton href="#roles">Tire ta carte</GhostButton>
        </div>
      </div>

      {/* les trois temps de la nuit (épinglage desktop) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-center px-8 text-center md:flex">
        {BEATS.map((b, i) => (
          <div key={b.k} className={`wn-beat wn-beat-${i} absolute max-w-4xl opacity-0`}>
            <p className="t-label text-wolf-bright">{b.k}</p>
            <p className="t-display mt-4 text-6xl text-paper drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] lg:text-8xl">{b.t}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
