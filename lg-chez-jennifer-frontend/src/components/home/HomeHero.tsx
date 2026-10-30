"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { PassButton, GhostButton, StringLights, Heart } from "@/components/ui";
import { ArrowDownIcon } from "@/components/icons";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const WORDS = ["Jeux", "Rencontres", "Cinéma", "Expériences", "Bonne humeur"];

/** Braises/lucioles qui montent doucement dans la nuit (positions fixes = pas de mismatch SSR). */
const EMBERS = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37) % 100,
  bottom: (i * 13) % 30,
  size: 2 + (i % 3),
}));

export function HomeHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(".hh-title", { type: "lines", mask: "lines", linesClass: "u-line" });

        const tl = gsap.timeline({ delay: 0.75, defaults: { ease: "expo.out" } });
        tl.from(".hh-bg", { scale: 1.18, duration: 2.6, ease: "power3.out" }, 0)
          .from(".hh-lights > *", { autoAlpha: 0, y: -30, duration: 1.4, stagger: 0.15 }, 0.1)
          .from(".hh-eyebrow", { autoAlpha: 0, y: 20, duration: 1 }, 0.25)
          .from(split.lines, { yPercent: 110, duration: 1.3, stagger: 0.12 }, 0.35)
          .from(".hh-copy, .hh-ctas", { autoAlpha: 0, y: 26, duration: 1.1, stagger: 0.12 }, 0.75)
          .from(".hh-screen", { autoAlpha: 0, scale: 0.9, y: 30, duration: 1.6 }, 0.5)
          .from(".hh-word", { autoAlpha: 0, x: 40, rotate: -4, duration: 1.1, stagger: 0.12 }, 0.9)
          .from(".hh-scroll", { autoAlpha: 0, duration: 1 }, 1.4);

        // les mots manuscrits flottent légèrement
        gsap.utils.toArray<HTMLElement>(".hh-word").forEach((w, i) => {
          gsap.to(w, { y: i % 2 ? 6 : -6, duration: 3 + i * 0.4, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2 });
        });

        // braises
        gsap.utils.toArray<HTMLElement>(".hh-ember").forEach((e, i) => {
          const d = 7 + (i % 5);
          gsap
            .timeline({ repeat: -1, delay: (i * 0.53) % 6 })
            .fromTo(
              e,
              { y: 0, x: 0 },
              { y: -260 - (i % 5) * 60, x: (i % 2 ? 1 : -1) * (20 + (i % 4) * 12), duration: d, ease: "none" },
              0,
            )
            .fromTo(e, { autoAlpha: 0 }, { autoAlpha: 0.9, duration: d * 0.2 }, 0)
            .to(e, { autoAlpha: 0, duration: d * 0.25 }, d * 0.75);
        });

        // au scroll : la scène s'éloigne, le texte s'efface
        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to(".hh-bg", { scale: 1.12, yPercent: 8, ease: "none", scrollTrigger: st });
        gsap.to(".hh-content", { yPercent: -18, autoAlpha: 0, ease: "none", scrollTrigger: { ...st, end: "70% top" } });
        gsap.to(".hh-screen", { yPercent: -30, ease: "none", scrollTrigger: st });
        gsap.to(".hh-words", { yPercent: -45, ease: "none", scrollTrigger: st });

        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="relative flex min-h-[100svh] items-end overflow-hidden pb-16 pt-32 sm:items-center sm:pb-24">
      {/* décor */}
      <div className="hh-bg absolute inset-0 will-change-transform">
        <Image
          src="/images/cine-garden.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover object-[60%_50%] blur-[3px] brightness-[0.55] saturate-[1.15]"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_70%_40%,transparent_10%,rgba(13,9,7,0.55)_60%,#0d0907_100%)]" />
      <div className="absolute inset-0 bg-linear-to-r from-night via-night/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-night to-transparent" />

      {/* guirlandes */}
      <div className="hh-lights pointer-events-none absolute inset-x-0 top-0">
        <StringLights className="-mt-1 h-24 w-full" count={22} sag={0.55} />
        <StringLights className="-mt-14 ml-[18%] h-20 w-[82%] opacity-70" count={14} sag={0.6} />
      </div>

      {/* braises */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className="hh-ember absolute rounded-full bg-[#ffcf8a] opacity-0"
            style={{
              left: `${e.left}%`,
              bottom: `${e.bottom}%`,
              width: e.size,
              height: e.size,
              boxShadow: "0 0 8px 2px rgba(255,190,110,0.6)",
            }}
          />
        ))}
      </div>

      {/* écran de projection (net, par-dessus la photo floutée) */}
      <div className="hh-screen pointer-events-none absolute right-[13%] top-[24%] hidden w-[30vw] max-w-[440px] lg:block">
        <div className="relative aspect-[16/10] rounded-sm bg-[linear-gradient(160deg,#fbeee2,#f1d9c3)] shadow-[0_0_80px_10px_rgba(255,214,170,0.35),0_0_220px_40px_rgba(255,190,130,0.18)]">
          <div className="absolute inset-[6px] flex flex-col items-center justify-center border border-cacao/10">
            <span className="t-script text-5xl text-cacao/80 xl:text-6xl">Les Soirées</span>
            <span className="t-caps mt-1 text-lg tracking-[0.18em] text-cacao/70 xl:text-xl">chez Jeynnifer</span>
            <Heart className="mt-3 h-4 w-4 text-wine/60" />
          </div>
        </div>
        <div className="mx-auto h-[18vh] w-[3px] bg-linear-to-b from-[#2a1d16] to-transparent" />
      </div>

      {/* mots manuscrits */}
      <ul className="hh-words pointer-events-none absolute right-[3%] top-[30%] hidden -rotate-6 flex-col items-end gap-1 xl:flex">
        {WORDS.map((w, i) => (
          <li key={w} className="hh-word t-script text-4xl text-paper/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]" style={{ marginRight: `${(i % 3) * 1.2}rem` }}>
            {w}
          </li>
        ))}
      </ul>

      {/* contenu */}
      <div className="hh-content relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="hh-eyebrow t-label mb-6 flex items-center gap-3 text-peach">
            <span className="h-px w-10 bg-peach/60" /> Abidjan · Jeux · Cinéma · Rencontres
          </p>
          <h1 className="hh-title t-display text-[3.1rem] leading-[0.98] text-paper sm:text-7xl xl:text-[5.6rem]">
            Plus que des soirées, ce sont des{" "}
            <em className="whitespace-nowrap font-light italic text-peach">expériences.</em>
          </h1>
          <p className="hh-copy mt-7 max-w-lg text-[1.05rem] leading-relaxed text-paper-muted sm:text-lg">
            Les Soirées chez Jeynnifer, ce sont des rendez-vous pensés pour se divertir, créer du lien et vivre
            des moments uniques, dans une ambiance chaleureuse et immersive.
          </p>
          <div className="hh-ctas mt-10 flex flex-col gap-3 sm:flex-row">
            <PassButton href="#univers">Découvrir nos soirées</PassButton>
            <GhostButton href="/evenements">Prendre mon pass</GhostButton>
          </div>
        </div>
      </div>

      <a href="#a-propos" className="hh-scroll absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-paper-dim transition-colors hover:text-paper sm:flex">
        <span className="t-label text-[0.6rem]">Entrer</span>
        <ArrowDownIcon className="h-4 w-4 animate-bounce" />
      </a>
    </section>
  );
}
