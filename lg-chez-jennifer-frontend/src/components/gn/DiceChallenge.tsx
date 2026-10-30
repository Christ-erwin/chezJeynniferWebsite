"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";

const CHALLENGES: Record<number, string> = {
  1: "Fais deviner « girafe » à ta table, sans dire un mot.",
  2: "Trouve trois points communs avec ton voisin de gauche.",
  3: "Change de table et présente-toi en trois mots seulement.",
  4: "Imite un animal jusqu'à ce que quelqu'un trouve lequel.",
  5: "Raconte ta meilleure anecdote de soirée en 30 secondes.",
  6: "Joker ! Offre le prochain défi à la personne de ton choix.",
};

/** Positions des points sur une face 3×3. */
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

/** Orientation de chaque face (où elle est posée sur le cube) et rotation qui l'amène devant. */
const FACES: { n: number; place: string; show: [number, number] }[] = [
  { n: 1, place: "rotateY(0deg)", show: [0, 0] },
  { n: 6, place: "rotateY(180deg)", show: [0, 180] },
  { n: 3, place: "rotateY(90deg)", show: [0, -90] },
  { n: 4, place: "rotateY(-90deg)", show: [0, 90] },
  { n: 5, place: "rotateX(90deg)", show: [-90, 0] },
  { n: 2, place: "rotateX(-90deg)", show: [90, 0] },
];

function Face({ n, place }: { n: number; place: string }) {
  return (
    <div
      className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[6%] rounded-[18%] border border-black/10 bg-[linear-gradient(145deg,#fffaf2,#f0e2cc)] p-[16%] shadow-[inset_0_0_18px_rgba(120,80,40,0.25)]"
      style={{ transform: `${place} translateZ(var(--half))` }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`m-auto h-full w-full rounded-full ${PIPS[n].includes(i) ? "bg-[#2b1a14] shadow-[inset_0_2px_3px_rgba(0,0,0,0.5)]" : ""}`} />
      ))}
    </div>
  );
}

/** "Lance le dé" — un vrai dé 3D en CSS, et un défi pour briser la glace. */
export function DiceChallenge() {
  const root = useRef<HTMLDivElement>(null);
  const spins = useRef(0);
  const [face, setFace] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  // appelé uniquement depuis un clic (hasard + refs autorisés hors rendu)
  function roll() {
    const el = root.current;
    if (rolling || !el) return;
    const dice = el.querySelector(".dc-dice");
    const cube = el.querySelector(".dc-cube");
    const shadow = el.querySelector(".dc-shadow");
    const n = 1 + Math.floor(Math.random() * 6);
    const target = FACES.find((f) => f.n === n)!.show;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    spins.current += 2;
    const turns = spins.current * 360;
    setRolling(true);
    setFace(null);
    if (reduce) {
      gsap.set(cube, { rotationX: target[0], rotationY: target[1] });
      setFace(n);
      setRolling(false);
      return;
    }
    gsap
      .timeline({ onComplete: () => { setFace(n); setRolling(false); } })
      .to(dice, { y: -120, duration: 0.45, ease: "power2.out" })
      .to(dice, { y: 0, duration: 0.6, ease: "bounce.out" })
      .to(cube, { rotationX: target[0] + turns, rotationY: target[1] + turns, rotationZ: 0, duration: 1.05, ease: "power3.out" }, 0)
      .fromTo(shadow, { scale: 1, opacity: 0.5 }, { scale: 0.55, opacity: 0.2, duration: 0.45, yoyo: true, repeat: 1, ease: "power2.out" }, 0);
  }

  return (
    <div ref={root} className="grid items-center gap-14 lg:grid-cols-2">
      <div className="flex flex-col items-center">
        <div className="dc-dice relative h-[140px] w-[140px] [--half:70px] [perspective:900px]">
          <div className="dc-cube relative h-full w-full [transform-style:preserve-3d]" style={{ transform: "rotateX(-22deg) rotateY(32deg)" }}>
            {FACES.map((f) => (
              <Face key={f.n} n={f.n} place={f.place} />
            ))}
          </div>
        </div>
        <span className="dc-shadow mt-8 block h-4 w-32 rounded-[50%] bg-black/50 blur-md" />
        <button
          type="button"
          onClick={roll}
          disabled={rolling}
          className="mt-8 rounded-full bg-game px-8 py-4 font-semibold text-[#2b1a0c] shadow-[0_14px_40px_-12px_rgba(240,160,75,0.7)] transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          {rolling ? "Ça roule…" : face ? "Relancer le dé" : "Lance le dé"}
        </button>
      </div>

      <div>
        <p className="t-label text-game" data-reveal>Brise-glace</p>
        <h2 className="t-display mt-4 text-5xl text-paper sm:text-6xl" data-split>
          Ici, même les inconnus finissent par jouer ensemble.
        </h2>
        <div aria-live="polite" className="mt-8 min-h-[150px] rounded-[1.4rem] border border-game/30 bg-game/[0.07] p-7">
          {face ? (
            <>
              <p className="t-label text-game">Défi n°{face}</p>
              <p className="t-display mt-3 text-3xl text-paper">{CHALLENGES[face]}</p>
            </>
          ) : (
            <p className="text-paper-muted">
              Lance le dé pour découvrir un des petits défis qui circulent entre les tables pendant la soirée.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
