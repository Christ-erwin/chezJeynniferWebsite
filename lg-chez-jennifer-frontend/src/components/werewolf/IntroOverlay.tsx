"use client";

import Image from "next/image";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { mediaUrl } from "@/lib/admin-api";
import { VILLAGE, type Player, type RoleId } from "@/lib/werewolf";
import { NightAmbience } from "./NightAmbience";
import { RoleEmblem } from "./RoleCard";
import { sfx } from "./sfx";

gsap.registerPlugin(useGSAP);

const POWERS: { role: RoleId; text: string }[] = [
  { role: "voyante", text: "Certains voient l’avenir," },
  { role: "sorciere", text: "d’autres préparent des potions." },
  { role: "chien-loup", text: "Certains protègent," },
  { role: "chasseur", text: "d’autres chassent." },
  { role: "cupidon", text: "Certains unissent les cœurs," },
  { role: "enfant-sauvage", text: "tandis que d’autres changent de camp." },
];

/* yeux rouges dans les fourrés (x, y en %, taille relative) */
const EYES = [
  { x: 9, y: 62, s: 1 },
  { x: 21, y: 76, s: 0.7 },
  { x: 33, y: 85, s: 0.55 },
  { x: 67, y: 82, s: 0.65 },
  { x: 79, y: 66, s: 1.1 },
  { x: 90, y: 78, s: 0.8 },
  { x: 52, y: 90, s: 0.45 },
];

const GAP = 12;

/** Taille des portraits pour que tout le village tienne dans le cadre. */
function wall(n: number) {
  const W = window.innerWidth * 0.86;
  const H = window.innerHeight * 0.52;
  let best = { cols: 1, w: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const w = Math.min((W - GAP * (cols - 1)) / cols, ((H - GAP * (rows - 1)) / rows) * 0.75);
    if (w > best.w) best = { cols, w };
  }
  return { cols: best.cols, w: Math.floor(Math.min(best.w, 200)) };
}

/** Phrase découpée en mots ; `*mot*` = mot en rouge. */
function Words({ text, className = "" }: { text: string; className?: string }) {
  return text.split(" ").map((raw, i) => {
    const accent = raw.startsWith("*") && raw.endsWith("*");
    return (
      <Fragment key={i}>
        <span className={`w inline-block ${accent ? "text-wolf-bright [text-shadow:0_0_30px_rgba(255,69,82,0.55)]" : ""} ${className}`}>{accent ? raw.slice(1, -1) : raw}</span>{" "}
      </Fragment>
    );
  });
}

const NARRATION = "t-display mx-auto max-w-[min(84vw,38ch)] text-center text-[clamp(1.6rem,6vh,5rem)] leading-[1.22] text-paper [text-shadow:0_2px_30px_rgba(0,0,0,0.9)]";

/**
 * Cinématique d'ouverture d'une partie, sur l'écran géant : l'histoire de
 * Pkapkatokro, puis le village entier (les photos des joueurs) avant que les
 * cartes ne soient distribuées. Échap / Entrée pour passer.
 */
export function IntroOverlay({ players, onDone, canSkip }: { players: Player[]; onDone: () => void; canSkip?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const stopDrone = useRef<() => void>(() => {});
  const closing = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  const [grid] = useState(() => wall(players.length));
  const n = players.length;

  const finish = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    stopDrone.current();
    gsap.to(root.current, { autoAlpha: 0, duration: 0.9, ease: "power2.inOut", onComplete: () => onDoneRef.current() });
  }, []);

  useGSAP(
    () => {
      const tl = gsap.timeline({ onComplete: finish });
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const blur = (px: number) => (reduced ? "blur(0px)" : `blur(${px}px)`);

      tl.call(() => (stopDrone.current = sfx.drone()), [], 0.05);
      tl.fromTo(".io-bar", { scaleY: 0 }, { scaleY: 1, duration: 1.6, ease: "expo.inOut" }, 0);
      tl.fromTo(".io-bg", { autoAlpha: 0 }, { autoAlpha: 1, duration: 2.5 }, 0);

      let t = 1;
      const leave = (sel: string, at: number) => tl.to(sel, { autoAlpha: 0, filter: blur(8), duration: 0.9, ease: "power2.in" }, at);
      /** fait apparaître une phrase mot à mot, la laisse le temps d'être lue, puis l'efface */
      const narrate = (sel: string, extra = 0) => {
        const words = gsap.utils.toArray(`${sel} .w`).length;
        tl.set(sel, { autoAlpha: 1 }, t);
        tl.from(`${sel} .w`, { autoAlpha: 0, y: reduced ? 0 : "0.35em", filter: blur(12), duration: 1.1, stagger: 0.085, ease: "power3.out" }, t);
        const hold = 2 + words * 0.33 + extra;
        leave(sel, t + hold);
        const start = t;
        t += hold + 1;
        return start;
      };

      /* 1. Bienvenue à Pkapkatokro */
      tl.set(".sc-title", { autoAlpha: 1 }, t);
      tl.from(".sc-title .io-kicker", { autoAlpha: 0, y: 20, duration: 1.4, ease: "expo.out" }, t);
      tl.from(".sc-title .ch", { autoAlpha: 0, scale: reduced ? 1 : 1.9, filter: blur(22), duration: 1.5, stagger: 0.07, ease: "expo.out" }, t + 0.9);
      tl.call(() => sfx.impact(0.8), [], t + 1);
      tl.fromTo(".sc-title .io-rule", { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: "expo.inOut" }, t + 2);
      leave(".sc-title", t + 6.2);
      t += 7.2;

      /* 2. Le village paisible : lumière chaude */
      tl.to(".io-dawn", { autoAlpha: 1, duration: 3 }, t - 0.8);
      narrate(".sc-2");

      /* 3. Les créatures : la lumière s'éteint, des yeux s'allument */
      tl.to(".io-dawn", { autoAlpha: 0, duration: 2.2 }, t - 0.6);
      tl.fromTo(".io-eye", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: { each: 0.45, from: "random" } }, t + 0.8);
      tl.call(() => sfx.heartbeat(0.2), [], t + 1.4);
      tl.call(() => sfx.heartbeat(0.4), [], t + 2.6);
      narrate(".sc-3");

      /* 4. La lune se lève, un loup hurle */
      tl.fromTo(".io-moon", { yPercent: 22, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 0.45, duration: 6, ease: "power2.out" }, t - 0.6);
      tl.call(() => sfx.howl(), [], t + 2.8);
      narrate(".sc-4");

      /* 5. Personne n'est innocent */
      tl.to(".io-eye", { autoAlpha: 0, duration: 1.5 }, t - 0.4);
      tl.to(".io-red", { autoAlpha: 0.7, duration: 2 }, t);
      narrate(".sc-5");
      tl.to(".io-red", { autoAlpha: 0, duration: 2 }, t - 1);

      /* 6. Les pouvoirs */
      tl.to(".io-moon", { autoAlpha: 0.22, duration: 1.5 }, t - 0.5);
      tl.set(".sc-powers", { autoAlpha: 1 }, t);
      POWERS.forEach((_, i) => {
        const at = t + i * 1.7;
        tl.from(`.sc-powers .pw-${i}`, { autoAlpha: 0, y: reduced ? 0 : 30, filter: blur(10), duration: 1.1, ease: "expo.out" }, at);
        tl.from(`.sc-powers .pw-${i} svg`, { scale: reduced ? 1 : 0.4, rotate: reduced ? 0 : -25, duration: 1.2, ease: "back.out(1.8)" }, at);
      });
      leave(".sc-powers", t + POWERS.length * 1.7 + 3);
      t += POWERS.length * 1.7 + 4;

      /* 7. Le jour : la lune se couche */
      tl.to(".io-moon", { yPercent: 22, autoAlpha: 0, duration: 3, ease: "power2.in" }, t - 1);
      tl.to(".io-dawn", { autoAlpha: 1, duration: 2.5 }, t - 0.5);
      narrate(".sc-7");

      /* 8. La nuit revient */
      tl.to(".io-dawn", { autoAlpha: 0, duration: 2 }, t - 0.8);
      tl.to(".io-moon", { yPercent: 0, autoAlpha: 0.45, duration: 3.5, ease: "power2.out" }, t - 0.8);
      narrate(".sc-8");

      /* 9. Les habitants : chaque joueur entre en scène, le compteur monte */
      tl.to(".io-moon", { autoAlpha: 0.25, duration: 1.5 }, t - 0.5);
      tl.set(".sc-people", { autoAlpha: 1 }, t);
      tl.from(".sc-people .io-head", { autoAlpha: 0, y: reduced ? 0 : 20, duration: 1.2, ease: "expo.out" }, t);
      const each = Math.min(0.42, Math.max(0.16, 10 / n));
      gsap.utils.toArray<HTMLElement>(".io-face").forEach((el, i) => {
        const at = t + 1 + i * each;
        tl.fromTo(el, { autoAlpha: 0, scale: reduced ? 1 : 1.5, filter: `${blur(14)} brightness(2)` }, { autoAlpha: 1, scale: 1, filter: "blur(0px) brightness(1)", duration: 0.8, ease: "expo.out" }, at);
        tl.call(
          () => {
            if (countRef.current) countRef.current.textContent = String(i + 1);
            sfx.pluck(i);
          },
          [],
          at,
        );
      });
      let at9 = t + 1 + n * each + 1.4;
      tl.to(".io-wall", { autoAlpha: 0.16, scale: reduced ? 1 : 0.97, filter: blur(3), duration: 1.2 }, at9);
      ["pu-0", "pu-1", "pu-2"].forEach((cls, i) => {
        const p = at9 + 0.5 + i * 1.35;
        tl.from(`.sc-people .${cls}`, { autoAlpha: 0, scale: reduced ? 1 : 1.5, filter: blur(16), duration: 0.8, ease: "expo.out" }, p);
        tl.call(() => sfx.impact(0.45), [], p);
      });
      at9 += 0.5 + 3 * 1.35 + 1.8;
      leave(".sc-people", at9);
      t = at9 + 1;

      /* 10. La règle */
      tl.to(".io-red", { autoAlpha: 0.45, duration: 2 }, t);
      narrate(".sc-10", 0.6);

      /* 11. L'ennemi qui sourit : le cœur s'emballe */
      const s11 = narrate(".sc-11", 0.6);
      [0.2, 0.45, 0.7, 1].forEach((lvl, i) => tl.call(() => sfx.heartbeat(lvl), [], s11 + 1.5 + i * 1.05));

      /* 12. Que le massacre commence ! */
      tl.set(".sc-final", { autoAlpha: 1 }, t);
      tl.from(".sc-final .fl", { autoAlpha: 0, scale: reduced ? 1 : 2.4, filter: blur(24), duration: 0.9, stagger: 0.22, ease: "expo.out" }, t);
      tl.call(() => sfx.impact(1), [], t + 0.45);
      tl.call(() => sfx.howl(), [], t + 1.4);
      tl.fromTo(".io-flash", { autoAlpha: 0 }, { autoAlpha: 0.75, duration: 0.08 }, t + 0.45);
      tl.to(".io-flash", { autoAlpha: 0, duration: 1.4, ease: "power2.out" }, t + 0.55);
      tl.to(".io-red", { autoAlpha: 0.9, duration: 0.3 }, t + 0.45);
      if (!reduced) tl.to(".io-shake", { keyframes: { x: [-16, 14, -10, 8, -5, 2, 0], y: [6, -8, 5, -4, 2, 0, 0] }, duration: 0.7, ease: "none" }, t + 0.45);
      tl.call(() => stopDrone.current(), [], t + 4.6);
      tl.to(".io-content", { autoAlpha: 0, duration: 1.2 }, t + 5);
      tl.to(".io-bar", { scaleY: 0, duration: 1.2, ease: "expo.inOut" }, t + 5);

      return () => stopDrone.current();
    },
    { scope: root },
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  const scene = "absolute inset-0 flex flex-col items-center justify-center px-[6vw] invisible opacity-0";

  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label={`Bienvenue à ${VILLAGE}`} className="fixed inset-0 z-[60] overflow-hidden bg-[#070404] text-paper">
      {/* décor */}
      <div className="io-bg invisible absolute inset-0 opacity-0">
        <NightAmbience photo={false} />
      </div>
      <div
        className="io-dawn pointer-events-none invisible absolute inset-0 opacity-0 mix-blend-screen"
        style={{ background: "radial-gradient(90% 60% at 50% 105%, rgba(255,170,90,0.42), transparent 70%), linear-gradient(to top, rgba(140,60,25,0.45), transparent 60%)" }}
      />
      <div className="io-red pointer-events-none invisible absolute inset-0 opacity-0 bg-[radial-gradient(80%_70%_at_50%_50%,rgba(200,38,47,0.32),rgba(74,11,16,0.6)_80%)] mix-blend-multiply" />
      {/* la lune (le loup sous la lune de la page /loup-garou) se lève derrière le texte */}
      <div className="io-moon pointer-events-none invisible absolute inset-0 opacity-0 mix-blend-screen">
        <Image src="/images/lg-scene.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[55%_40%] saturate-[1.15]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_35%,#070404_85%)]" />
      </div>
      {EYES.map((e, i) => (
        <span key={i} className="io-eye pointer-events-none invisible absolute flex opacity-0" style={{ left: `${e.x}%`, top: `${e.y}%`, gap: `${1.6 * e.s}vh` }} aria-hidden>
          {[0, 1].map((k) => (
            <span
              key={k}
              className="anim-blink block rounded-[50%] bg-[#ff3b2f]"
              style={{ width: `${1.7 * e.s}vh`, height: `${0.75 * e.s}vh`, boxShadow: "0 0 14px 4px rgba(255,40,30,0.75)", transform: `rotate(${k ? -12 : 12}deg)`, animationDelay: `${(i * 0.9) % 4}s` }}
            />
          ))}
        </span>
      ))}

      <div className="io-shake absolute inset-0">
        <div className="io-content absolute inset-0">
          {/* 1 */}
          <section className={`sc-title ${scene}`}>
            <p className="io-kicker t-label text-[clamp(0.8rem,2.4vh,1.6rem)]! tracking-[0.5em]! text-wolf-bright">Bienvenue à</p>
            <h2 className="t-caps mt-[3vh] whitespace-nowrap text-[clamp(3rem,15vh,13rem)] leading-none text-paper [text-shadow:0_0_80px_rgba(200,38,47,0.6)]" aria-label={VILLAGE}>
              {VILLAGE.toUpperCase()
                .split("")
                .map((c, i) => (
                  <span key={i} className="ch inline-block">
                    {c}
                  </span>
                ))}
            </h2>
            <span className="io-rule mt-[4vh] block h-px w-[40vw] bg-linear-to-r from-transparent via-wolf-bright to-transparent" />
          </section>

          <section className={`sc-2 ${scene}`}>
            <p className={NARRATION}>
              <Words text="Il était une fois, un village autrefois paisible, où les habitants vivaient en parfaite harmonie." />
            </p>
          </section>
          <section className={`sc-3 ${scene}`}>
            <p className={NARRATION}>
              <Words text="Jusqu’au jour où d’étranges *créatures* firent leur apparition…" />
            </p>
          </section>
          <section className={`sc-4 ${scene}`}>
            <p className={NARRATION}>
              <Words text="Depuis, chaque nuit, lorsque la lune se lève, les *loups-garous* sortent de l’ombre pour *dévorer* les habitants." />
            </p>
          </section>
          <section className={`sc-5 ${scene}`}>
            <p className={NARRATION}>
              <Words text={`Mais à ${VILLAGE}, tout le monde n’est pas aussi *innocent* qu’il le prétend…`} />
            </p>
          </section>

          {/* 6 : les pouvoirs */}
          <section className={`sc-powers ${scene}`}>
            <ul className="grid w-full max-w-[min(90vw,150vh)] grid-cols-2 gap-x-[5vw] gap-y-[5vh]">
              {POWERS.map((p, i) => (
                <li key={p.role} className={`pw-${i} flex items-center gap-[2.2vh] ${i % 2 ? "" : "justify-end text-right"}`}>
                  {i % 2 === 0 && <span className="t-display text-[clamp(1.2rem,4.4vh,3.6rem)] leading-tight text-paper">{p.text}</span>}
                  <span className="grid aspect-square h-[11vh] shrink-0 place-items-center rounded-full border border-wolf/50 bg-[#0d0707]/70 text-[#f2d7b0] shadow-[0_0_40px_-6px_rgba(200,38,47,0.6)]">
                    <RoleEmblem role={p.role} className="h-[65%] w-[65%]" />
                  </span>
                  {i % 2 === 1 && <span className="t-display text-[clamp(1.2rem,4.4vh,3.6rem)] leading-tight text-paper">{p.text}</span>}
                </li>
              ))}
            </ul>
          </section>

          <section className={`sc-7 ${scene}`}>
            <p className={NARRATION}>
              <Words text="Le jour, les habitants s’accusent, se défendent, mentent et votent pour *éliminer* les suspects." />
            </p>
          </section>
          <section className={`sc-8 ${scene}`}>
            <p className={NARRATION}>
              <Words text="La nuit, les secrets prennent vie et les *masques* *tombent.*" />
            </p>
          </section>

          {/* 9 : le village au complet */}
          <section className={`sc-people ${scene}`}>
            <p className="io-head flex items-baseline gap-[2vh]">
              <span ref={countRef} className="text-[clamp(3rem,12vh,10rem)] font-extralight leading-none tabular-nums text-wolf-bright [text-shadow:0_0_50px_rgba(255,69,82,0.5)]">
                0
              </span>
              <span className="t-caps text-[clamp(1.6rem,6vh,5rem)] text-paper">habitants.</span>
            </p>
            <div className="relative mt-[3.5vh]">
              <ul className="io-wall grid justify-center" style={{ gridTemplateColumns: `repeat(${grid.cols}, ${grid.w}px)`, gap: GAP }}>
                {players.map((p, i) => (
                  <li key={p.id} className="io-face relative aspect-[3/4] overflow-hidden border border-line-strong bg-[#0d0707]" style={{ borderRadius: Math.max(8, grid.w * 0.08) }}>
                    {p.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- photo servie par l'API
                      <img src={mediaUrl(p.photo)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center font-extralight text-paper/25" style={{ fontSize: grid.w * 0.4 }}>
                        {i + 1}
                      </span>
                    )}
                    {grid.w >= 70 && (
                      <>
                        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-[#070404] to-transparent" />
                        <span className="t-caps absolute inset-x-[5%] bottom-[6%] truncate text-center text-paper" style={{ fontSize: Math.max(10, grid.w * 0.1) }}>
                          {p.name || `Joueur ${i + 1}`}
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.5vh]">
                {["Des pouvoirs.", "Des secrets.", "Des traîtres."].map((s, i) => (
                  <p key={s} className={`pu-${i} t-caps text-[clamp(2rem,9vh,8rem)] leading-none ${i === 2 ? "text-wolf-bright [text-shadow:0_0_60px_rgba(255,69,82,0.6)]" : "text-paper"}`}>
                    {s}
                  </p>
                ))}
              </div>
            </div>
          </section>

          <section className={`sc-10 ${scene}`}>
            <p className={NARRATION}>
              <Words text={`À ${VILLAGE}, une seule règle :`} />
              <span className="t-caps mt-[3vh] block text-[clamp(1.6rem,6.6vh,6rem)] leading-[1.1]">
                <Words text="*Ne* *faites* *confiance* *à* *personne.*" />
              </span>
            </p>
          </section>
          <section className={`sc-11 ${scene}`}>
            <p className={NARRATION}>
              <Words text="Car votre plus grand ennemi pourrait bien être celui qui vous *sourit* depuis le début…" />
            </p>
          </section>

          {/* 12 */}
          <section className={`sc-final ${scene}`}>
            <p className="t-caps text-center leading-[0.9] text-wolf-bright [text-shadow:0_0_90px_rgba(255,69,82,0.75)]">
              <span className="fl block text-[clamp(2rem,9vh,8rem)] text-paper">Que le</span>
              <span className="fl block text-[clamp(3.5rem,20vh,17rem)]">massacre</span>
              <span className="fl block text-[clamp(2rem,9vh,8rem)] text-paper">commence&nbsp;!</span>
            </p>
          </section>
        </div>
      </div>

      {/* bandes cinéma */}
      <span className="io-bar pointer-events-none absolute inset-x-0 top-0 h-[8vh] origin-top bg-black" aria-hidden />
      <span className="io-bar pointer-events-none absolute inset-x-0 bottom-0 h-[8vh] origin-bottom bg-black" aria-hidden />
      <div className="io-flash pointer-events-none invisible absolute inset-0 bg-[#ff4552] opacity-0 mix-blend-screen" aria-hidden />

      {canSkip && (
        <button type="button" onClick={finish} className="absolute bottom-[2.2vh] right-5 z-10 cursor-pointer rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-paper/60 transition-colors hover:border-wolf-bright hover:text-paper">
          Passer l&apos;introduction (Échap)
        </button>
      )}
    </div>
  );
}
