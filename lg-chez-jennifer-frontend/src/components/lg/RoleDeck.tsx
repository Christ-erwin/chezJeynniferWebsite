"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";

type Role = { id: string; name: string; camp: "Les loups" | "Le village"; text: string; glyph: React.ReactNode };

const G = (d: string) => (
  <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const ROLES: Role[] = [
  {
    id: "loup",
    name: "Loup-Garou",
    camp: "Les loups",
    text: "Chaque nuit, avec ta meute, tu choisis une victime. Le jour, tu mens avec aplomb et tu accuses les autres.",
    glyph: G("M14 48 22 18l8 12 2-14 2 14 8-12 8 30M24 40h0M40 40h0M26 48c4 3 8 3 12 0"),
  },
  {
    id: "villageois",
    name: "Villageois",
    camp: "Le village",
    text: "Aucun pouvoir, sinon ton flair et ta voix. Observe, débats, et démasque les loups avant qu'il ne soit trop tard.",
    glyph: G("M12 30 32 14l20 16M18 26v24h28V26M28 50V38h8v12"),
  },
  {
    id: "voyante",
    name: "Voyante",
    camp: "Le village",
    text: "Chaque nuit, tu découvres la vraie identité d'un joueur. Garde ton secret… ou révèle-le au bon moment.",
    glyph: G("M6 32s10-14 26-14 26 14 26 14-10 14-26 14S6 32 6 32ZM32 25a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z"),
  },
  {
    id: "sorciere",
    name: "Sorcière",
    camp: "Le village",
    text: "Deux potions pour toute la partie : l'une sauve, l'autre tue. Tout est dans le timing.",
    glyph: G("M26 8h12M28 8v12L16 44a8 8 0 0 0 7 12h18a8 8 0 0 0 7-12L36 20V8M20 40h24"),
  },
  {
    id: "chasseur",
    name: "Chasseur",
    camp: "Le village",
    text: "Si tu tombes, tu emportes quelqu'un avec toi. Une seule balle : vise juste.",
    glyph: G("M32 8v12M32 44v12M8 32h12M44 32h12M32 18a14 14 0 1 0 0 28 14 14 0 0 0 0-28ZM32 30v4"),
  },
  {
    id: "cupidon",
    name: "Cupidon",
    camp: "Le village",
    text: "La première nuit, tu lies deux amoureux. Si l'un meurt, l'autre le suit — même s'ils sont ennemis.",
    glyph: G("M10 54 50 14M42 14h8v8M32 46s-12-7-12-16a6 6 0 0 1 12-3 6 6 0 0 1 12 3c0 9-12 16-12 16Z"),
  },
];

function CardBack() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.1rem] border border-[#5a1a1f] bg-[radial-gradient(circle_at_50%_40%,#3a0b10,#140506_70%)] [backface-visibility:hidden]">
      <div className="absolute inset-3 rounded-[0.8rem] border border-[#c8262f]/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="h-16 w-16 rounded-full bg-[radial-gradient(circle_at_40%_35%,#ff8a7a,#c8262f_55%,#4a0b10)] shadow-[0_0_40px_6px_rgba(200,38,47,0.45)]" />
        <span className="t-caps mt-5 text-xs tracking-[0.4em] text-[#e9a6a0]/70">Loup-Garou</span>
      </div>
    </div>
  );
}

function CardFront({ role }: { role: Role }) {
  const wolf = role.camp === "Les loups";
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-[1.1rem] border p-6 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] ${
        wolf ? "border-[#c8262f] bg-[radial-gradient(circle_at_50%_30%,#4a0b10,#140506_75%)] text-[#ffb3ab]" : "border-[#e9cfa8]/60 bg-[radial-gradient(circle_at_50%_30%,#f7ece0,#e6d0b4_80%)] text-cacao"
      }`}
    >
      <span className="t-label" style={{ color: wolf ? "#ff8a7a" : "#6e1f2a" }}>
        {role.camp}
      </span>
      <div className="flex flex-col items-center">
        {role.glyph}
        <p className="t-caps mt-4 text-3xl">{role.name}</p>
      </div>
      <p className={`text-sm leading-relaxed ${wolf ? "text-[#e9c1bc]" : "text-cacao-muted"}`}>{role.text}</p>
    </div>
  );
}

/**
 * "Tire ta carte" — on pioche un rôle au hasard dans le paquet : la carte
 * s'envole, se retourne, et révèle ton camp. Les pastilles en dessous
 * permettent aussi de consulter chaque rôle (clavier compris).
 */
export function RoleDeck() {
  const root = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<Role | null>(null);
  const busy = useRef(false);

  // appelé uniquement depuis des clics : lecture des refs autorisée
  function reveal(next: Role) {
    const el = root.current;
    if (busy.current || !el) return;
    busy.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const card = el.querySelector(".rd-card");
    const glow = el.querySelector(".rd-glow");
    const stack = el.querySelectorAll(".rd-stack > *");
    const tl = gsap.timeline({ onComplete: () => void (busy.current = false) });
    if (reduce) {
      setRole(next);
      gsap.set(card, { rotateY: 180, x: 0, y: 0, autoAlpha: 1 });
      busy.current = false;
      return;
    }
    if (role) tl.to(card, { rotateY: 0, x: -40, y: 20, scale: 0.92, duration: 0.45, ease: "power2.in" });
    tl.add(() => setRole(next))
      .fromTo(card, { autoAlpha: 1, rotateY: 0, x: -200, y: 30, rotate: -8, scale: 0.9 }, { x: 0, y: -10, rotate: 0, scale: 1, duration: 0.7, ease: "expo.out" })
      .to(card, { rotateY: 180, y: 0, duration: 0.9, ease: "back.out(1.4)" }, "-=0.25")
      .fromTo(glow, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1.1, duration: 0.8, ease: "expo.out" }, "<0.2");
    gsap.fromTo(stack, { y: 0 }, { y: -6, duration: 0.15, stagger: 0.03, yoyo: true, repeat: 1 });
  }

  const draw = () => {
    const pool = ROLES.filter((r) => r.id !== role?.id);
    reveal(pool[Math.floor(Math.random() * pool.length)]);
  };

  const wolf = role?.camp === "Les loups";

  return (
    <div ref={root} className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="t-label text-wolf-bright" data-reveal>Les rôles</p>
        <h2 className="t-display mt-4 text-5xl text-paper sm:text-7xl" data-split>
          Ce soir, qui seras-tu ?
        </h2>
        <p className="mt-6 max-w-md leading-relaxed text-paper-muted" data-reveal>
          À ton arrivée, le maître du jeu te glisse une carte, face cachée. Personne ne doit la voir. Entraîne-toi : pioche,
          et découvre ton camp.
        </p>

        <button
          type="button"
          onClick={draw}
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-wolf px-7 py-4 font-semibold text-white shadow-[0_14px_40px_-12px_rgba(200,38,47,0.7)] transition-colors hover:bg-wolf-bright"
          data-reveal
        >
          {role ? "Piocher une autre carte" : "Tire ta carte"}
        </button>

        <div className="mt-10" data-reveal>
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-paper-dim">Ou consulte un rôle</p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => reveal(r)}
                aria-pressed={role?.id === r.id}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  role?.id === r.id ? "border-wolf bg-wolf/20 text-paper" : "border-line-strong text-paper-muted hover:border-wolf/60 hover:text-paper"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* plateau */}
      <div className="relative flex min-h-[460px] items-center justify-center [perspective:1400px] sm:min-h-[520px]">
        <div
          className="rd-glow pointer-events-none absolute h-[min(420px,100vw)] w-[min(420px,100vw)] rounded-full opacity-0 blur-3xl"
          style={{ background: wolf ? "radial-gradient(circle, rgba(200,38,47,0.45), transparent 65%)" : "radial-gradient(circle, rgba(246,201,167,0.35), transparent 65%)" }}
        />

        {/* paquet */}
        <div className="rd-stack absolute left-0 top-1/2 hidden h-[300px] w-[210px] -translate-y-1/2 sm:block lg:-left-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="absolute inset-0" style={{ transform: `translate(${i * 4}px, ${-i * 4}px) rotate(${-6 + i * 2}deg)` }}>
              <CardBack />
            </div>
          ))}
        </div>

        {/* carte piochée */}
        <div aria-live="polite" className="relative h-[400px] w-[280px] sm:h-[440px] sm:w-[310px]">
          <div className="rd-card absolute inset-0 [transform-style:preserve-3d]" style={{ opacity: role ? 1 : 0.0001 }}>
            <CardBack />
            {role && <CardFront role={role} />}
          </div>
          {!role && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[1.1rem] border border-dashed border-wolf/40 text-center text-sm text-paper-dim">
              <span className="max-w-[12rem]">Ta carte apparaîtra ici</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
