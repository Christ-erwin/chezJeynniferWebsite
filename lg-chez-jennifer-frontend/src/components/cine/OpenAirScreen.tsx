"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PassButton, GhostButton, StringLights, Heart } from "@/components/ui";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STARS = Array.from({ length: 40 }, (_, i) => ({ x: (i * 53) % 100, y: (i * 29) % 38, s: i % 4 === 0 ? 2 : 1, d: (i * 0.7) % 4 }));
const DUST = Array.from({ length: 30 }, (_, i) => ({ x: 30 + ((i * 37) % 40), y: 20 + ((i * 23) % 60), s: 1 + (i % 3) }));

/**
 * Le cinéma en plein air de la maquette : la nuit sur le jardin, les
 * guirlandes qui s'allument une à une, le projecteur qui s'éveille et
 * l'écran qui affiche CinéLune. Sur grand écran, on "entre dans le film" :
 * l'écran grandit jusqu'à remplir la vue.
 */
export function OpenAirScreen() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ delay: 0.75 });
        tl.from(".oa-garden", { autoAlpha: 0, scale: 1.08, duration: 2.4, ease: "power2.out" }, 0)
          .from(".oa-lights .anim-bulb", { autoAlpha: 0, duration: 0.25, stagger: { each: 0.035, from: "start" } }, 0.3)
          .from(".oa-moon", { y: 80, autoAlpha: 0, duration: 2.2, ease: "expo.out" }, 0.2)
          .from(".oa-screen-in", { autoAlpha: 0, y: 40, scale: 0.94, duration: 1.4, ease: "expo.out" }, 0.6)
          .fromTo(".oa-beam", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, repeat: 3, yoyo: true, ease: "none" }, 1.4)
          .to(".oa-beam", { autoAlpha: 1, duration: 0.6 }, 2)
          .fromTo(".oa-picture", { autoAlpha: 0, filter: "brightness(3)" }, { autoAlpha: 1, filter: "brightness(1)", duration: 1.2, ease: "power2.out" }, 1.6)
          .from(".oa-copy > *", { autoAlpha: 0, y: 24, stagger: 0.1, duration: 1, ease: "expo.out" }, 2);

        gsap.utils.toArray<HTMLElement>(".oa-dust").forEach((d, i) =>
          gsap.to(d, { y: -40 - (i % 5) * 12, x: (i % 2 ? 1 : -1) * 18, opacity: 0, duration: 4 + (i % 4), repeat: -1, delay: (i * 0.3) % 3, ease: "sine.inOut" }),
        );
        gsap.to(".oa-flicker", { opacity: 0.88, duration: 0.08, repeat: -1, yoyo: true, repeatDelay: 2.8, ease: "steps(1)" });
      });

      // entrer dans le film — grand écran
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "+=150%", scrub: 0.8, pin: true } })
          .to(".oa-copy", { autoAlpha: 0, y: 60, duration: 0.4 }, 0)
          .to(".oa-dim", { autoAlpha: 0.85, duration: 0.8 }, 0)
          .to(".oa-screen", { scale: () => (window.innerWidth / document.querySelector<HTMLElement>(".oa-screen")!.offsetWidth) * 1.06, y: () => window.innerHeight * 0.1, duration: 1, ease: "power2.in" }, 0.1)
          .to(".oa-picture-a", { autoAlpha: 0, duration: 0.18 }, 0.5)
          .to(".oa-picture-b", { autoAlpha: 1, duration: 0.3 }, 0.72)
          .to({}, { duration: 0.3 });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[100svh] min-h-[680px] overflow-hidden bg-[#08070d]">
      {/* ciel */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b0b1a_0%,#141127_45%,#1b1210_100%)]" />
      <div aria-hidden className="absolute inset-0">
        {STARS.map((s, i) => (
          <span key={i} className="anim-bulb absolute rounded-full bg-white/80" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `-${s.d}s` }} />
        ))}
      </div>
      <div className="oa-moon absolute right-[12%] top-[9%] h-20 w-20 rounded-full bg-[radial-gradient(circle_at_38%_35%,#fffdf6,#e9e4ff_55%,#bdb3f0)] shadow-[0_0_60px_18px_rgba(200,192,255,0.35)] sm:h-24 sm:w-24" />

      {/* jardin */}
      <div className="oa-garden absolute inset-x-0 bottom-0 h-[62%]">
        <Image src="/images/cine-garden.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[50%_70%] blur-[2px] brightness-[0.55] saturate-[1.2] [mask-image:linear-gradient(to_bottom,transparent,black_35%)]" />
      </div>

      {/* guirlandes */}
      <div className="oa-lights pointer-events-none absolute inset-x-0 top-0">
        <StringLights className="h-24 w-full" count={24} sag={0.6} />
        <StringLights className="-mt-10 h-28 w-full opacity-80" count={20} sag={0.75} color="#ffd59a" />
      </div>

      {/* faisceau du projecteur */}
      <div aria-hidden className="oa-beam pointer-events-none absolute bottom-0 left-1/2 h-[78%] w-[110vw] -translate-x-1/2 opacity-0">
        <div className="anim-beam absolute inset-0 [clip-path:polygon(47%_100%,53%_100%,78%_8%,22%_8%)] bg-[linear-gradient(to_top,rgba(233,228,255,0.35),rgba(233,228,255,0.06)_70%,transparent)] blur-[2px]" />
        {DUST.map((d, i) => (
          <span key={i} className="oa-dust absolute rounded-full bg-white/70" style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s }} />
        ))}
      </div>

      <div className="oa-dim pointer-events-none absolute inset-0 bg-[#05040a] opacity-0" />

      {/* écran */}
      <div className="absolute inset-x-0 top-[16%] flex justify-center px-5 sm:top-[14%]">
        <div className="oa-screen relative w-[min(86vw,640px)] origin-center">
          <div className="oa-screen-in">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[4px] border-[6px] border-[#16131c] bg-[#e9e4ff] shadow-[0_0_120px_30px_rgba(200,192,255,0.28)]">
            <div className="oa-picture absolute inset-0">
              <div className="oa-flicker absolute inset-0">
              <div className="oa-picture-a absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#6a5fb8,#2a2452_70%)] text-center">
                <svg viewBox="0 0 40 40" className="h-8 w-8 text-white/80" fill="currentColor" aria-hidden>
                  <path d="M26 6a14 14 0 1 0 8 25A12 12 0 0 1 26 6Z" />
                </svg>
                <p className="t-script mt-1 text-5xl text-white sm:text-6xl">CinéLune</p>
                <p className="t-caps mt-1 text-xs tracking-[0.4em] text-white/75 sm:text-sm">chez Jeynnifer</p>
              </div>
              <div className="oa-picture-b absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_45%,#f7ece0,#d9c9b6_80%)] text-center opacity-0">
                <p className="t-label text-cacao-muted">Ce soir, à l&apos;affiche</p>
                <p className="t-display mt-2 px-6 text-3xl text-cacao sm:text-5xl">Un film, des plaids, et vous.</p>
                <Heart className="mt-3 text-wine" />
              </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.04)_0_1px,transparent_1px_3px)]" />
          </div>
          <div className="mx-auto flex w-[70%] justify-between">
            <span className="h-[14vh] w-[4px] bg-linear-to-b from-[#16131c] to-transparent" />
            <span className="h-[14vh] w-[4px] bg-linear-to-b from-[#16131c] to-transparent" />
          </div>
          </div>
        </div>
      </div>

      {/* texte */}
      <div className="oa-copy absolute inset-x-0 bottom-0 z-10 px-5 pb-10 text-center sm:pb-14">
        <p className="t-label text-moon">Cinéma · Détente · Plein air · Expérience</p>
        <h1 className="t-display mx-auto mt-3 max-w-3xl text-5xl text-paper sm:text-7xl">
          Le cinéma, <em className="font-light italic text-moon">autrement.</em>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-paper-muted">
          Des films en plein air, une ambiance cozy et une expérience cinéma comme tu ne l&apos;as jamais vécue.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <PassButton href="#billetterie">Prendre mon pass</PassButton>
          <GhostButton href="#seance">Comment ça se passe</GhostButton>
        </div>
      </div>
    </section>
  );
}
