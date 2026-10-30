"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { PassButton, GhostButton, StringLights } from "@/components/ui";
import { PlayingCard, type CardColor } from "./PlayingCard";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/** Cartes qui flottent au-dessus de la table : position (%), taille (rem), rotation, profondeur. */
const CARDS: { color: CardColor; value: string; x: number; y: number; w: number; r: number; z: number }[] = [
  { color: "red", value: "7", x: 64, y: 18, w: 6.5, r: -14, z: 0.9 },
  { color: "yellow", value: "+2", x: 80, y: 30, w: 7.5, r: 12, z: 1.3 },
  { color: "blue", value: "4", x: 70, y: 58, w: 5.5, r: -6, z: 0.6 },
  { color: "green", value: "↺", x: 88, y: 64, w: 6, r: 18, z: 1 },
  { color: "black", value: "+4", x: 60, y: 70, w: 7, r: -20, z: 1.5 },
  { color: "red", value: "9", x: 92, y: 10, w: 5, r: 24, z: 0.5 },
  { color: "blue", value: "⊘", x: 76, y: 46, w: 4.5, r: 8, z: 0.4 },
];

/**
 * La table de jeux : la photo chaude de la soirée, des cartes qui flottent,
 * suivent le pointeur et s'envolent quand on descend.
 */
export function GameTable() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".gt-card");
        const split = SplitText.create(".gt-title", { type: "words,chars", mask: "chars" });

        gsap
          .timeline({ delay: 0.75, defaults: { ease: "expo.out" } })
          .from(".gt-bg", { scale: 1.2, duration: 2.4, ease: "power3.out" }, 0)
          .from(split.chars, { yPercent: 110, duration: 1, stagger: 0.04 }, 0.3)
          .from(".gt-fade", { autoAlpha: 0, y: 24, duration: 1, stagger: 0.1 }, 0.8)
          .from(".gt-in", { autoAlpha: 0, y: 260, rotate: () => gsap.utils.random(-90, 90), scale: 0.6, duration: 1.4, stagger: 0.08, ease: "back.out(1.3)" }, 0.5);

        // flottement continu
        gsap.utils.toArray<HTMLElement>(".gt-float").forEach((c, i) =>
          gsap.to(c, { y: i % 2 ? 14 : -14, rotate: i % 2 ? 4 : -4, duration: 2.6 + (i % 3) * 0.7, repeat: -1, yoyo: true, ease: "sine.inOut" }),
        );

        // les cartes s'envolent au scroll
        cards.forEach((c, i) => {
          const z = Number(c.dataset.z);
          gsap.to(c, {
            yPercent: -260 * z,
            xPercent: (i % 2 ? 1 : -1) * 120 * z,
            rotate: (i % 2 ? 1 : -1) * 90,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 },
          });
        });
        gsap.to(".gt-copy", { yPercent: -30, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "80% top", scrub: true } });

        return () => split.revert();
      });

      // profondeur au pointeur (desktop)
      mm.add("(hover: hover) and (prefers-reduced-motion: no-preference)", () => {
        const movers = gsap.utils.toArray<HTMLElement>(".gt-depth").map((el) => ({
          z: Number(el.dataset.z),
          x: gsap.quickTo(el, "x", { duration: 1, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 1, ease: "power3.out" }),
        }));
        const onMove = (e: PointerEvent) => {
          const px = e.clientX / window.innerWidth - 0.5;
          const py = e.clientY / window.innerHeight - 0.5;
          movers.forEach((m) => {
            m.x(px * 60 * m.z);
            m.y(py * 40 * m.z);
          });
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative flex min-h-[100svh] items-end overflow-hidden pb-16 pt-32 sm:items-center sm:pb-0">
      <div className="gt-bg absolute inset-0">
        <Image src="/images/gn-table.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[70%_50%] brightness-[0.55] saturate-[1.2]" />
      </div>
      <div className="absolute inset-0 bg-linear-to-r from-[#120b06] via-[#120b06]/75 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-[#120b06] to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_75%_40%,rgba(240,160,75,0.22),transparent_70%)]" />
      <StringLights className="absolute inset-x-0 top-0 h-20 opacity-90" count={20} sag={0.45} color="#ffc979" />

      {/* cartes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
        {CARDS.map((c, i) => (
          <div key={i} className="gt-card absolute" data-z={c.z} style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}rem`, transform: `rotate(${c.r}deg)` }}>
            <div className="gt-depth" data-z={c.z}>
              <div className="gt-in">
                <div className="gt-float">
                  <PlayingCard color={c.color} value={c.value} className="text-[1.2rem]" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="gt-copy relative z-10 mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <p className="gt-fade t-label text-game">Jeux · Fun · Rencontres · Bonne humeur</p>
        <h1 className="gt-title t-caps mt-5 text-[2.9rem] leading-[0.95] text-paper sm:text-8xl lg:text-[9rem]">Game Night</h1>
        <p className="gt-fade t-caps mt-3 text-xl tracking-[0.3em] text-paper-muted">chez Jeynnifer</p>
        <p className="gt-fade mt-6 max-w-md text-lg leading-relaxed text-paper-muted">
          Des jeux, des rires, des défis et une ambiance de folie. Plusieurs tables, plusieurs jeux : tu circules, tu joues,
          tu rencontres. L&apos;objectif n&apos;est pas de gagner — c&apos;est de passer une bonne soirée.
        </p>
        <div className="gt-fade mt-9 flex flex-col gap-3 sm:flex-row">
          <PassButton href="#billetterie">Prendre mon pass</PassButton>
          <GhostButton href="#jeux">Voir les jeux</GhostButton>
        </div>
      </div>
    </section>
  );
}
