"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PassButton, GhostButton, StringLights } from "@/components/ui";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STARS = Array.from({ length: 46 }, (_, i) => ({ x: (i * 53) % 100, y: (i * 31) % 42, s: i % 5 === 0 ? 2 : 1, d: (i * 0.7) % 4 }));
const GLINTS = Array.from({ length: 14 }, (_, i) => ({ y: 4 + i * 6.6, w: 34 - i * 1.6 + (i % 3) * 4, d: (i * 0.37) % 2.6 }));

/** Une palme : nervure courbe, élargie en feuille, qui retombe vers la pointe. */
function frond(cx: number, cy: number, angle: number, len: number, droop: number, width: number) {
  const a = (angle * Math.PI) / 180;
  const tx = cx + Math.cos(a) * len;
  const ty = cy + Math.sin(a) * len + droop;
  const mx = cx + Math.cos(a) * len * 0.5;
  const my = cy + Math.sin(a) * len * 0.5 - len * 0.12;
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  return `M${cx} ${cy}Q${mx + nx * width} ${my + ny * width} ${tx} ${ty}Q${mx - nx * width * 0.35} ${my - ny * width * 0.35} ${cx} ${cy}Z`;
}

function Palm({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  const cx = 128;
  const cy = 92;
  const fronds = [
    [-170, 120, 46, 18],
    [-145, 112, 30, 16],
    [-115, 92, 10, 14],
    [-75, 86, 6, 13],
    [-40, 110, 26, 16],
    [-12, 124, 50, 18],
    [20, 104, 62, 15],
    [160, 100, 64, 15],
  ];
  return (
    <svg viewBox="0 0 260 520" className={className} aria-hidden>
      {/* miroir dans le dessin (une transformation CSS serait réécrite par l'animation) */}
      <g fill="#120a14" transform={flip ? "matrix(-1 0 0 1 260 0)" : undefined}>
        {/* tronc */}
        <path d="M92 520C96 400 104 260 122 96l12 2C122 262 118 404 114 520Z" />
        {fronds.map(([ang, len, droop, w], i) => (
          <path key={i} d={frond(cx, cy, ang, len, droop, w)} />
        ))}
        <circle cx={cx - 4} cy={cy + 8} r="7" />
        <circle cx={cx + 6} cy={cy + 10} r="6" />
      </g>
    </svg>
  );
}

/**
 * Ouverture de la page Beach Party, d'après les affiches : coucher de soleil
 * sur la plage d'Assinie, palmiers, guirlandes. Au scroll, le soleil se
 * couche et la nuit tombe — « Explorez le jour. Vibrez toute la nuit. »
 */
export function SunsetHero({ next }: { next?: { label: string; href: string } }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ delay: 0.6 });
        tl.from(".sh-sun", { yPercent: 40, duration: 2.6, ease: "expo.out" }, 0)
          .from(".sh-sea", { autoAlpha: 0, duration: 1.6 }, 0.2)
          .from(".sh-palm-l", { xPercent: -30, autoAlpha: 0, duration: 1.8, ease: "expo.out" }, 0.3)
          .from(".sh-palm-r", { xPercent: 30, autoAlpha: 0, duration: 1.8, ease: "expo.out" }, 0.4)
          .from(".sh-lights .anim-bulb", { autoAlpha: 0, duration: 0.25, stagger: { each: 0.04 } }, 0.8)
          .from(".sh-copy > *", { autoAlpha: 0, y: 26, stagger: 0.1, duration: 1.1, ease: "expo.out" }, 1);
        gsap.to(".sh-palm-l, .sh-palm-r", { rotate: 1.5, transformOrigin: "50% 100%", duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 });

        // le jour devient nuit pendant qu'on quitte l'écran
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 } })
          .to(".sh-sun", { yPercent: 85, ease: "none" }, 0)
          .to(".sh-night", { autoAlpha: 1, ease: "none" }, 0)
          .to(".sh-stars", { autoAlpha: 1, ease: "none" }, 0.2)
          .to(".sh-copy", { y: 80, autoAlpha: 0, ease: "none" }, 0);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[100svh] min-h-[680px] overflow-hidden bg-dusk">
      {/* ciel du crépuscule, comme sur les affiches */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#1c1036_0%,#3b1d4d_22%,#7a2d4a_40%,#d4543a_54%,#ff9a52_61%,#ffc477_64%)]" />
      <div className="sh-stars pointer-events-none absolute inset-0 opacity-0" aria-hidden>
        {STARS.map((s, i) => (
          <span key={i} className="anim-bulb absolute rounded-full bg-white/85" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `-${s.d}s` }} />
        ))}
      </div>

      {/* soleil qui se couche sur l'horizon */}
      <div className="absolute inset-x-0 top-0 h-[64%] overflow-hidden" aria-hidden>
        <div className="sh-sun absolute bottom-[-12vmin] left-1/2 aspect-square w-[28vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_40%,#fff6d8,#ffd27a_45%,#ff9a52_80%)] shadow-[0_0_120px_50px_rgba(255,170,90,0.55),0_0_300px_120px_rgba(255,120,60,0.3)]" />
      </div>

      {/* mer : reflet du soleil, houle, écume */}
      <div className="sh-sea absolute inset-x-0 bottom-0 top-[64%] overflow-hidden bg-[linear-gradient(180deg,#5a2b4a_0%,#2c1838_45%,#170c1f_100%)]">
        <div className="absolute left-1/2 top-0 h-full w-[40vmin] -translate-x-1/2" aria-hidden>
          {GLINTS.map((g, i) => (
            <span
              key={i}
              className="anim-glint absolute left-1/2 h-[3px] -translate-x-1/2 rounded-full bg-[#ffc477]"
              style={{ top: `${g.y}%`, width: `${g.w}vmin`, animationDelay: `-${g.d}s`, opacity: 0.6, filter: "blur(0.5px)" }}
            />
          ))}
        </div>
        {[
          { bottom: "38%", o: 0.35, d: "18s" },
          { bottom: "20%", o: 0.55, d: "12s" },
          { bottom: "4%", o: 0.8, d: "9s" },
        ].map((w, i) => (
          <svg key={i} viewBox="0 0 1200 40" preserveAspectRatio="none" className="anim-wave absolute left-0 h-[6vh] w-[200%]" style={{ bottom: w.bottom, opacity: w.o, animationDuration: w.d }} aria-hidden>
            <path d="M0 20Q75 4 150 20T300 20T450 20T600 20T750 20T900 20T1050 20T1200 20V40H0Z" fill="#ffffff" fillOpacity="0.12" />
            <path d="M0 20Q75 4 150 20T300 20T450 20T600 20T750 20T900 20T1050 20T1200 20" fill="none" stroke="#ffe7c4" strokeOpacity="0.55" strokeWidth="1.5" />
          </svg>
        ))}
      </div>

      {/* la nuit qui tombe (au scroll) */}
      <div className="sh-night pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#0b0716_0%,#160c24_60%,#0e0815_100%)] opacity-0 mix-blend-multiply" />

      <Palm className="sh-palm-l pointer-events-none absolute -left-[24vmin] bottom-[-2vh] h-[58vh] origin-bottom sm:-left-[6vmin] sm:h-[92vh]" />
      <Palm className="sh-palm-r pointer-events-none absolute -right-[8vmin] bottom-[-4vh] hidden h-[78vh] origin-bottom sm:block" flip />

      <div className="sh-lights pointer-events-none absolute inset-x-0 top-0">
        <StringLights className="h-24 w-full" count={22} sag={0.55} color="#ffd59a" />
      </div>

      {/* texte */}
      <div className="sh-copy absolute inset-x-0 top-[15%] z-10 flex flex-col items-center px-5 text-center">
        <p className="t-label text-sand">Édition 01 · Assinie</p>
        <h1 className="t-caps mt-4 text-[clamp(3.2rem,13vw,8.5rem)] leading-[0.9] text-paper [text-shadow:0_6px_50px_rgba(90,20,40,0.55)]">
          Beach Party
        </h1>
        <p className="t-caps mt-2 text-lg tracking-[0.3em] text-paper/80">chez Jeynnifer</p>
        <p className="t-script mt-5 text-[clamp(1.6rem,4.6vw,2.8rem)] text-sand [text-shadow:0_2px_6px_rgba(60,15,35,0.85),0_2px_30px_rgba(90,20,40,0.7)]">
          Explorez le jour. Vibrez toute la nuit.
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 px-5 pb-10 sm:pb-14">
        {next && (
          <a href={next.href} className="rounded-full border border-sand/30 bg-dusk/60 px-4 py-2 text-sm text-sand backdrop-blur transition-colors hover:border-sunset">
            Prochaine édition · <span className="font-semibold text-paper">{next.label}</span>
          </a>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <PassButton href="#billetterie">Prendre mon pass</PassButton>
          <GhostButton href="#parcours">Le programme</GhostButton>
        </div>
      </div>
    </section>
  );
}
