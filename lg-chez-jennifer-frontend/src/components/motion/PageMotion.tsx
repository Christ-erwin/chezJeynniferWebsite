"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Moteur d'animation déclaratif, monté par app/template.tsx (donc rejoué à
 * chaque navigation). N'importe quel composant — serveur compris — se
 * contente de poser des attributs :
 *
 *   data-split            titre révélé ligne par ligne (masque)
 *   data-reveal           fondu + montée au scroll
 *   data-reveal="scale"   variante zoom doux
 *   data-reveal-img       image dévoilée par un rideau (clip-path)
 *   data-parallax="0.15"  parallaxe verticale (fraction de la hauteur)
 *   data-stagger          les enfants directs apparaissent en cascade
 *
 * + un rideau d'entrée de page aux couleurs de la marque.
 */
export function PageMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(curtain.current, { autoAlpha: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", (context) => {
        // rideau d'entrée
        gsap
          .timeline()
          .to(curtain.current, {
            yPercent: -100,
            duration: 0.9,
            ease: "expo.inOut",
            delay: 0.15,
          })
          .set(curtain.current, { autoAlpha: 0 });

        const run = () => {
          // titres ligne par ligne
          gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
            const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "u-line" });
            gsap.from(split.lines, {
              yPercent: 110,
              duration: 1.1,
              ease: "expo.out",
              stagger: 0.09,
              scrollTrigger: { trigger: el, start: "top 88%" },
            });
          });

          // fondus
          gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
            const kind = el.dataset.reveal;
            gsap.fromTo(
              el,
              kind === "scale"
                ? { autoAlpha: 0, scale: 0.94, y: 20 }
                : kind === "left"
                  ? { autoAlpha: 0, x: -40 }
                  : { autoAlpha: 0, y: 36 },
              {
                autoAlpha: 1,
                scale: 1,
                x: 0,
                y: 0,
                duration: 1.1,
                ease: "expo.out",
                delay: Number(el.dataset.delay ?? 0),
                scrollTrigger: { trigger: el, start: "top 90%" },
              },
            );
          });

          // cascades
          gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((el) => {
            // fromTo (et non from) : l'état final est toujours « visible »,
            // même si l'élément a déjà été masqué par un passage précédent
            gsap.fromTo(
              el.children,
              { autoAlpha: 0, y: 40 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 1,
                ease: "expo.out",
                stagger: 0.12,
                scrollTrigger: { trigger: el, start: "top 85%" },
              },
            );
          });

          // images dévoilées
          gsap.utils.toArray<HTMLElement>("[data-reveal-img]").forEach((el) => {
            const img = el.querySelector("img");
            gsap.fromTo(
              el,
              { clipPath: "inset(100% 0% 0% 0%)" },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 1.4,
                ease: "expo.inOut",
                scrollTrigger: { trigger: el, start: "top 85%" },
              },
            );
            if (img)
              gsap.fromTo(
                img,
                { scale: 1.3 },
                { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } },
              );
          });

          // parallaxe
          gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
            const amount = Number(el.dataset.parallax || 0.15);
            gsap.fromTo(
              el,
              { yPercent: -amount * 50 },
              {
                yPercent: amount * 50,
                ease: "none",
                scrollTrigger: {
                  trigger: el.parentElement ?? el,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              },
            );
          });

          ScrollTrigger.refresh();
        };

        // on attend les polices pour que SplitText coupe les bonnes lignes.
        // context.add : les animations créées plus tard restent rattachées au
        // contexte, donc nettoyées au démontage (navigation, double montage en dev).
        let cancelled = false;
        (document.fonts?.ready ?? Promise.resolve()).then(() => {
          if (!cancelled) context.add(run);
        });
        return () => {
          cancelled = true;
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <div
        ref={curtain}
        aria-hidden
        className="js-curtain pointer-events-none fixed inset-0 z-90 items-center justify-center bg-night"
      >
        <span className="t-script text-5xl text-peach">Les Soirées</span>
      </div>
      {children}
    </div>
  );
}
