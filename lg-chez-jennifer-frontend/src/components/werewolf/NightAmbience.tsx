"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const EMBERS = Array.from({ length: 30 }, (_, i) => ({ left: (i * 41) % 100, bottom: (i * 17) % 30, size: 2 + (i % 3) }));

/**
 * Décor de la nuit au village — le même que l'ouverture de la page
 * /loup-garou : photo du loup sous la lune, voile rouge, brume, braises.
 * `intensity` assombrit la photo pour laisser la place au contenu.
 */
export function NightAmbience({ intensity = 0.6, photo = true }: { intensity?: number; photo?: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".na-ember").forEach((e, i) => {
          const d = 6 + (i % 6);
          gsap
            .timeline({ repeat: -1, delay: (i * 0.41) % 5 })
            .fromTo(e, { y: 0, x: 0 }, { y: -320 - (i % 4) * 80, x: (i % 2 ? 1 : -1) * (15 + (i % 5) * 10), duration: d, ease: "none" }, 0)
            .fromTo(e, { autoAlpha: 0 }, { autoAlpha: 0.95, duration: d * 0.2 }, 0)
            .to(e, { autoAlpha: 0, duration: d * 0.3 }, d * 0.7);
        });
        gsap.to(".na-photo", { scale: 1.08, duration: 40, ease: "none", repeat: -1, yoyo: true });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-[#070404]">
      {photo && (
        <div className="na-photo absolute inset-0" style={{ opacity: 1 - intensity }}>
          <Image src="/images/lg-scene.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[55%_40%] saturate-[1.15]" />
        </div>
      )}
      <div className="absolute inset-0 mix-blend-multiply bg-[radial-gradient(60%_60%_at_58%_38%,rgba(200,38,47,0.25),rgba(74,11,16,0.85)_70%)]" />
      <div className="absolute -inset-x-1/4 bottom-[-10%] h-1/2">
        <div className="anim-drift absolute inset-0 bg-[radial-gradient(50%_60%_at_40%_70%,rgba(255,235,230,0.10),transparent_70%)] blur-2xl" />
        <div className="anim-drift absolute inset-0 bg-[radial-gradient(45%_50%_at_70%_80%,rgba(200,38,47,0.18),transparent_70%)] blur-3xl [animation-delay:-12s]" />
      </div>
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="na-ember absolute rounded-full opacity-0"
          style={{ left: `${e.left}%`, bottom: `${e.bottom}%`, width: e.size, height: e.size, background: "#ff6b4a", boxShadow: "0 0 8px 2px rgba(255,80,60,0.7)" }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_35%,rgba(7,4,4,0.75)_80%,#070404_100%)]" />
    </div>
  );
}
