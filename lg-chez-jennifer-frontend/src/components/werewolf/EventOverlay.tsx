"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { mediaUrl } from "@/lib/admin-api";
import type { Player } from "@/lib/werewolf";
import { Crown } from "./Crown";
import { NightAmbience } from "./NightAmbience";
import { sfx } from "./sfx";

gsap.registerPlugin(useGSAP);

const SPARKS = Array.from({ length: 28 }, (_, i) => ({ x: ((i * 37) % 100) - 50, d: 1.4 + (i % 5) * 0.25, s: 2 + (i % 3) }));

/**
 * Annonces sur l'écran géant :
 * - « resurrect » : la croix s'efface, la couleur revient, la lumière monte ;
 * - « chief »     : la couronne descend et se pose sur le nouveau chef du village.
 */
export function EventOverlay({
  kind,
  player,
  number,
  onClose,
  autoCloseMs,
}: {
  kind: "resurrect" | "chief";
  player: Player;
  number: number;
  onClose: () => void;
  autoCloseMs?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const closing = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  const name = player.name || `Joueur ${number}`;
  const e = player.feminine ? "e" : "";
  const gold = "#f2c86b";

  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.fromTo(".eo-bg", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0);
      tl.from(".eo-photo", { autoAlpha: 0, scale: 0.85, y: 30, duration: 0.9, ease: "expo.out" }, 0.1);
      tl.from(".eo-kicker", { autoAlpha: 0, y: 16, duration: 0.7, ease: "expo.out" }, 0.4);

      if (kind === "resurrect") {
        tl.call(() => sfx.heartbeat(0.2), [], 0.8);
        tl.call(() => sfx.resurrect(), [], 1.3);
        // la croix rouge s'efface, trait après trait
        tl.fromTo(".eo-x path", { strokeDashoffset: 0 }, { strokeDashoffset: 100, duration: 0.8, stagger: 0.25, ease: "power2.inOut", autoRound: false }, 1.2);
        // la couleur et la vie reviennent
        tl.fromTo(".eo-img", { filter: "grayscale(1) brightness(0.35)" }, { filter: "grayscale(0) brightness(1)", duration: 1.8, ease: "power2.out" }, 1.6);
        tl.fromTo(".eo-light", { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1.25, duration: 1.6, ease: "expo.out" }, 1.5);
        tl.to(".eo-light", { autoAlpha: 0.35, duration: 1.4 }, 3.1);
        tl.fromTo(".eo-frame", { borderColor: "rgba(200,38,47,0.8)" }, { borderColor: "rgba(255,226,160,0.9)", duration: 1.2 }, 1.8);
      } else {
        // la couronne descend du ciel et se pose
        tl.fromTo(".eo-crown", { y: "-70vh", rotate: -50, scale: 1.8, autoAlpha: 0 }, { y: 0, rotate: -18, scale: 1, autoAlpha: 1, duration: 1.3, ease: "back.out(1.3)" }, 0.9);
        tl.call(() => sfx.coronation(), [], 2.05);
        tl.fromTo(".eo-light", { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1.3, duration: 1.2, ease: "expo.out" }, 2);
        tl.fromTo(".eo-frame", { borderColor: "rgba(200,38,47,0.6)" }, { borderColor: "rgba(242,200,107,0.95)", duration: 0.8 }, 2);
        tl.to(".eo-light", { autoAlpha: 0.4, duration: 1.4 }, 3.2);
      }

      // étincelles qui montent
      gsap.utils.toArray<HTMLElement>(".eo-spark").forEach((el, i) => {
        tl.fromTo(el, { y: 0, x: 0, autoAlpha: 0 }, { y: "-55vh", x: SPARKS[i].x * 3, autoAlpha: 1, duration: SPARKS[i].d, ease: "power1.out" }, (kind === "resurrect" ? 1.7 : 2.1) + (i % 7) * 0.08);
        tl.to(el, { autoAlpha: 0, duration: 0.5 }, (kind === "resurrect" ? 1.7 : 2.1) + (i % 7) * 0.08 + SPARKS[i].d - 0.4);
      });

      tl.from(".eo-text > *", { autoAlpha: 0, y: 26, stagger: 0.14, duration: 0.8, ease: "expo.out" }, kind === "resurrect" ? 2.4 : 2.3);
      tl.call(() => setDone(true), [], 3.8);
    },
    { scope: root },
  );

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    gsap.to(root.current, { autoAlpha: 0, duration: 0.5, ease: "power2.in", onComplete: () => onCloseRef.current() });
  }, []);

  useEffect(() => {
    if (!done || !autoCloseMs) return;
    const t = setTimeout(close, autoCloseMs);
    return () => clearTimeout(t);
  }, [done, autoCloseMs, close]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" || ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={kind === "resurrect" ? `${name} ressuscité${e}` : `${name}, chef du village`}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-hidden"
      onClick={() => done && close()}
    >
      <div className="eo-bg absolute inset-0">
        <NightAmbience intensity={0.82} />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,rgba(26,6,8,0.45),rgba(7,4,4,0.92)_75%)]" />
      </div>

      <p className="eo-kicker t-label relative mb-[3vh] text-[2vh]!" style={{ color: kind === "resurrect" ? "#ffe2a0" : gold }}>
        {kind === "resurrect" ? "Retour d'entre les morts" : "Le village a choisi"}
      </p>

      {/* photo */}
      <div className="eo-photo relative">
        {/* halo / rayons */}
        <div
          className="eo-light pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
          style={{
            background:
              kind === "resurrect"
                ? "radial-gradient(circle, rgba(255,240,200,0.55), rgba(255,200,120,0.15) 45%, transparent 68%)"
                : "repeating-conic-gradient(from 0deg, rgba(242,200,107,0.22) 0deg 6deg, transparent 6deg 18deg), radial-gradient(circle, rgba(242,200,107,0.5), transparent 65%)",
            maskImage: "radial-gradient(circle, black 30%, transparent 70%)",
          }}
        />
        <div className="eo-frame relative aspect-[3/4] h-[52vh] overflow-hidden rounded-[1.4rem] border-2 border-[#c8262f] bg-[#0d0707] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]">
          {player.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(player.photo)} alt="" className="eo-img h-full w-full object-cover" />
          ) : (
            <span className="eo-img flex h-full items-center justify-center text-[12vh] font-extralight text-paper/30">{number}</span>
          )}
          {kind === "resurrect" && (
            <svg viewBox="0 0 100 133" preserveAspectRatio="none" className="eo-x absolute inset-0 h-full w-full" aria-hidden>
              <path d="M10 10 90 123" pathLength={100} strokeDasharray="100" stroke="#ff4552" strokeWidth="3.5" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px #c8262f)" }} />
              <path d="M90 10 10 123" pathLength={100} strokeDasharray="100" stroke="#ff4552" strokeWidth="3.5" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px #c8262f)" }} />
            </svg>
          )}
        </div>
        {kind === "chief" && <Crown className="eo-crown absolute -left-[9vh] -top-[8vh] z-10 w-[17vh] opacity-0" />}
        {/* étincelles */}
        <div className="pointer-events-none absolute bottom-[10%] left-1/2" aria-hidden>
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="eo-spark absolute rounded-full opacity-0"
              style={{ width: s.s, height: s.s, background: kind === "resurrect" ? "#fff1c4" : gold, boxShadow: `0 0 8px 2px ${kind === "resurrect" ? "rgba(255,241,196,0.8)" : "rgba(242,200,107,0.8)"}` }}
            />
          ))}
        </div>
      </div>

      <div className="eo-text relative mt-[4vh] text-center">
        <p className="t-caps text-[6vh] leading-none text-paper">{name}</p>
        <p className="t-display mt-[1.5vh] text-[4.4vh] leading-tight" style={{ color: kind === "resurrect" ? "#ffe2a0" : gold, textShadow: `0 0 40px ${kind === "resurrect" ? "#ffe2a088" : "#f2c86b88"}` }}>
          {kind === "resurrect" ? `est ressuscité${e} et revient dans la partie` : `est élu${e} chef du village`}
        </p>
      </div>

      <p className={`t-label absolute bottom-[4vh] text-paper-dim transition-opacity duration-500 ${done ? "animate-pulse opacity-100" : "opacity-0"}`}>
        {autoCloseMs ? "La partie reprend…" : "Clique ou appuie sur Entrée pour continuer"}
      </p>
    </div>
  );
}
