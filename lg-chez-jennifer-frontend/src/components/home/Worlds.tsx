"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CONCEPTS } from "@/lib/catalog";
import { GhostButton } from "@/components/ui";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const GLOW: Record<string, string> = {
  "game-night": "rgba(240,160,75,0.22)",
  "loup-garou": "rgba(200,38,47,0.26)",
  "cine-lune": "rgba(200,192,255,0.2)",
};

/**
 * "Entre dans chaque univers" — sur grand écran, la section s'épingle et les
 * trois mondes défilent à l'horizontale au rythme du scroll, comme on
 * passerait d'une pièce à l'autre. Sur mobile : simple empilement.
 */
export function Worlds() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const track = root.current!.querySelector<HTMLElement>(".wd-track")!;
        const panels = gsap.utils.toArray<HTMLElement>(".wd-panel");
        const distance = () => track.scrollWidth - window.innerWidth;

        const scroll = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: ".wd-pin",
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 0.8,
            pin: true,
            invalidateOnRefresh: true,
          },
        });

        // chaque panneau s'anime quand il entre dans le cadre
        panels.forEach((p, i) => {
          // le 1er panneau est déjà dans le cadre au début de l'épinglage : on le déclenche à l'arrivée de la section
          const st =
            i === 0
              ? { trigger: ".wd-pin", start: "top 65%", toggleActions: "play none none reverse" }
              : { trigger: p, containerAnimation: scroll, start: "left 75%", toggleActions: "play none none reverse" };
          gsap.from(p.querySelectorAll(".wd-in"), { autoAlpha: 0, y: 40, stagger: 0.08, duration: 1, ease: "expo.out", scrollTrigger: st });
          gsap.fromTo(p.querySelector(".wd-photo"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "expo.inOut", scrollTrigger: st });
          gsap.fromTo(
            p.querySelector(".wd-photo img"),
            { xPercent: -8, scale: 1.15 },
            { xPercent: 8, scale: 1.05, ease: "none", scrollTrigger: { trigger: p, containerAnimation: scroll, start: "left right", end: "right left", scrub: true } },
          );
          gsap.from(p.querySelectorAll(".wd-thumb"), { autoAlpha: 0, scale: 0.85, rotate: 4, stagger: 0.1, duration: 1, ease: "back.out(1.6)", scrollTrigger: st });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative bg-night">
      <div className="mx-auto max-w-[1400px] px-5 pt-24 sm:px-8 lg:pt-28">
        <p className="t-label text-peach" data-reveal>Entre dans chaque univers</p>
        <h2 className="t-display mt-4 max-w-3xl text-5xl text-paper sm:text-6xl" data-split>
          Une soirée, une atmosphère. À toi de choisir la tienne.
        </h2>
      </div>

      <div className="wd-pin overflow-hidden lg:h-[100svh]">
        <div className="wd-track flex flex-col gap-6 px-5 py-14 sm:px-8 lg:h-full lg:w-max lg:flex-row lg:items-center lg:gap-10 lg:py-0 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] lg:pr-[10vw]">
          {CONCEPTS.map((c) => (
            <article
              key={c.slug}
              className="wd-panel relative grid w-full gap-8 overflow-hidden rounded-[1.6rem] border border-line bg-night-2 p-6 sm:p-8 lg:h-[76svh] lg:w-[min(82vw,1180px)] lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:p-10"
            >
              <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full blur-3xl" style={{ background: GLOW[c.slug] }} />

              <div className="wd-photo relative min-h-[240px] overflow-hidden rounded-[1.1rem] lg:min-h-0">
                <Image src={c.cover} alt="" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-night-2/70" />
                <span className="t-display absolute bottom-3 left-5 text-[7rem] font-light leading-none text-paper/15 lg:text-[10rem]">{c.number}</span>
              </div>

              <div className="relative flex flex-col justify-center">
                <ul className="wd-in mb-6 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-paper-muted">
                  {c.tags.map((t, i) => (
                    <li key={t} className="flex items-center gap-3">
                      {i > 0 && <span className="h-1 w-1 rounded-full" style={{ background: c.accent }} />} {t}
                    </li>
                  ))}
                </ul>
                <h3 className="wd-in t-caps text-5xl text-paper sm:text-6xl">{c.displayName}</h3>
                <p className="wd-in t-caps mt-2 text-lg tracking-[0.22em] text-paper-muted">chez Jeynnifer</p>
                <p className="wd-in t-label mt-6" style={{ color: c.accent }}>{c.kicker}</p>
                <p className="wd-in mt-4 max-w-md leading-relaxed text-paper-muted">{c.description}</p>

                <div className="wd-in mt-7 grid grid-cols-3 gap-3">
                  {c.gallery.map((g) => (
                    <div key={g} className="wd-thumb relative aspect-[4/3] overflow-hidden rounded-lg border border-line">
                      <Image src={g} alt="" fill sizes="160px" className="object-cover" />
                    </div>
                  ))}
                </div>

                <div className="wd-in mt-8 flex flex-wrap items-center gap-5">
                  <GhostButton href={c.href}>Découvrir l&apos;univers</GhostButton>
                  <Link href={`/evenements?soiree=${c.slug}`} className="text-sm font-semibold text-paper underline decoration-peach/50 underline-offset-[6px] transition-colors hover:text-peach">
                    Voir les prochaines dates
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
