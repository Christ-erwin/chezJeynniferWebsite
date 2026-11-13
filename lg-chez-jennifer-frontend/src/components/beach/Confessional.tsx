"use client";

import { useEffect, useRef, useState } from "react";

const QUESTIONS = [
  "Qu'est-ce qui t'a le plus surpris pendant la visite ?",
  "Qui est la personne la plus compétitive de ton équipe ?",
  "Raconte-nous ce qui s'est vraiment passé pendant ce jeu.",
  "Qui t'a fait le plus rire aujourd'hui ?",
  "Quel est ton meilleur souvenir de la soirée jusqu'ici ?",
  "Est-ce que tu reviendrais à une prochaine édition ?",
];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Le viseur du confessionnal : REC qui clignote, timecode qui tourne, et les
 * questions de l'interviewer qui s'écrivent une à une. Démarre quand il
 * entre à l'écran ; immobile (première question) si les animations sont réduites.
 */
export function Confessional() {
  const ref = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState(0);
  const [typed, setTyped] = useState(QUESTIONS[0].length);
  const [frames, setFrames] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    let clock: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      timers.forEach(clearTimeout);
      timers = [];
      clearInterval(clock);
    };
    const play = (i: number) => {
      const text = QUESTIONS[i % QUESTIONS.length];
      setQ(i % QUESTIONS.length);
      setTyped(0);
      for (let c = 1; c <= text.length; c++) timers.push(setTimeout(() => setTyped(c), c * 38));
      timers.push(setTimeout(() => play(i + 1), text.length * 38 + 3200));
    };
    const io = new IntersectionObserver(([e]) => {
      stop();
      if (e.isIntersecting) {
        play(0);
        clock = setInterval(() => setFrames((f) => f + 1), 1000 / 25);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, []);

  const s = Math.floor(frames / 25);
  const timecode = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(frames % 25)}`;

  return (
    <div ref={ref} className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border border-line-strong bg-[radial-gradient(80%_70%_at_50%_35%,#3a1a2c,#120914_75%)] sm:aspect-[4/3]">
      {/* le fauteuil, éclairé par la lumière du confessionnal */}
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(45%_55%_at_50%_70%,rgba(255,154,82,0.35),transparent_70%)]" aria-hidden />
      <svg viewBox="0 0 200 140" className="absolute bottom-[8%] left-1/2 w-[46%] -translate-x-1/2 text-[#2a1220]" fill="currentColor" aria-hidden>
        <path d="M40 40q0-36 60-36t60 36v50H40Z" />
        <path d="M22 70q0-14 14-14h128q14 0 14 14v34H22Z" opacity="0.9" />
        <rect x="34" y="104" width="10" height="34" rx="3" />
        <rect x="156" y="104" width="10" height="34" rx="3" />
      </svg>
      <span className="t-script absolute left-1/2 top-[30%] -translate-x-1/2 whitespace-nowrap text-[clamp(1.4rem,4vw,2.4rem)] text-sunset/90">Le Confessionnal</span>

      {/* habillage de la caméra */}
      <div className="pointer-events-none absolute inset-4 sm:inset-6" aria-hidden>
        {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map((c) => (
          <span key={c} className={`absolute h-7 w-7 border-paper/70 ${c}`} />
        ))}
        <span className="absolute left-3 top-3 flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-paper">
          <span className="anim-rec h-2.5 w-2.5 rounded-full bg-[#ff3b3b] shadow-[0_0_10px_#ff3b3b]" /> REC
        </span>
        <span className="absolute right-3 top-3 font-mono text-xs tabular-nums text-paper/80">{timecode}</span>
        <span className="absolute bottom-3 right-3 font-mono text-[0.65rem] tracking-[0.15em] text-paper/60">CAM 01 · ASSINIE</span>
      </div>

      {/* sous-titre : la question de l'interviewer */}
      <div className="absolute inset-x-6 bottom-[11%] text-center sm:inset-x-14" aria-live="off">
        <p className="mx-auto inline rounded bg-black/65 box-decoration-clone px-2 py-1 text-[clamp(0.95rem,2.2vw,1.25rem)] leading-[1.7] text-paper">
          {QUESTIONS[q].slice(0, typed)}
          <span className="anim-rec ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-sunset" aria-hidden />
        </p>
      </div>
    </div>
  );
}
