"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { mediaUrl } from "@/lib/admin-api";
import { CAMPS, ROLE_BY_ID, roleName, type Player } from "@/lib/werewolf";
import { NightAmbience } from "./NightAmbience";
import { RoleCardBack, RoleCardFront } from "./RoleCard";
import { sfx } from "./sfx";

gsap.registerPlugin(useGSAP);

const COUNT = 5;

/**
 * Révélation d'un joueur éliminé, en 3 temps (comme sur l'affiche) :
 * 1. sa photo s'envole de la grille et s'affiche en grand,
 * 2. compte à rebours de 5 secondes,
 * 3. sa carte se retourne et dévoile son rôle.
 * En mode « show », on revoit directement la carte d'un joueur déjà éliminé.
 */
export function RevealOverlay({
  player,
  number,
  mode,
  origin,
  onCancel,
  onClose,
  onRevive,
  onResurrect,
  autoCloseMs,
}: {
  player: Player;
  number: number;
  mode: "eliminate" | "show";
  origin?: DOMRect | null;
  onCancel?: () => void;
  onClose: () => void;
  /** annuler une élimination faite par erreur (sans annonce) */
  onRevive?: () => void;
  /** résurrection annoncée sur l'écran */
  onResurrect?: () => void;
  /** écran sans opérateur : la partie reprend seule après la révélation */
  autoCloseMs?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(COUNT);
  const [phase, setPhase] = useState<"countdown" | "card" | "done">(mode === "show" ? "done" : "countdown");
  const role = player.role ? ROLE_BY_ID[player.role] : null;
  const wolf = role?.camp === "loups";
  const color = role ? CAMPS[role.camp].color : "#ffffff";
  const closing = useRef(false);

  useGSAP(
    () => {
      const photo = root.current!.querySelector<HTMLElement>(".ro-photo")!;
      const tl = gsap.timeline();
      tl.fromTo(".ro-bg", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 0);

      // la photo part de sa vignette dans la grille
      if (origin) {
        const r = photo.getBoundingClientRect();
        tl.from(photo, { x: origin.left - r.left, y: origin.top - r.top, scaleX: origin.width / r.width, scaleY: origin.height / r.height, transformOrigin: "0 0", duration: 0.9, ease: "expo.inOut" }, 0);
      } else {
        tl.from(photo, { autoAlpha: 0, scale: 0.85, duration: 0.8, ease: "expo.out" }, 0);
      }
      tl.from(".ro-name", { autoAlpha: 0, y: 20, duration: 0.6, ease: "expo.out" }, 0.6);

      if (mode === "show") {
        gsap.set(".ro-flip", { rotateY: 180 });
        tl.from(".ro-card", { autoAlpha: 0, x: 60, duration: 0.8, ease: "expo.out" }, 0.3).fromTo(".ro-role", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.6);
        return;
      }

      // compte à rebours
      tl.from(".ro-count", { autoAlpha: 0, scale: 0.6, duration: 0.6, ease: "back.out(1.6)" }, 0.7);
      // l'anneau se vide en continu (autoRound: false, sinon GSAP arrondit au pixel et l'anneau saute)
      tl.fromTo(".ro-ring-arc", { strokeDashoffset: 0 }, { strokeDashoffset: 100, duration: COUNT, ease: "none", autoRound: false }, 1);
      for (let i = 0; i < COUNT; i++) {
        const at = 1 + i;
        tl.call(() => {
          setN(COUNT - i);
          sfx.heartbeat(i / (COUNT - 1));
        }, [], at);
        tl.fromTo(".ro-num", { scale: 1.5, autoAlpha: 0.2 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "expo.out", immediateRender: false }, at);
        tl.fromTo(".ro-pulse", { scale: 1, autoAlpha: 0.55 }, { scale: 1.35, autoAlpha: 0, duration: 0.9, ease: "power2.out", immediateRender: false }, at);
      }

      // la carte arrive, puis se retourne
      const flipAt = 1 + COUNT;
      tl.call(() => setPhase("card"), [], flipAt);
      tl.to(".ro-count", { autoAlpha: 0, scale: 0.8, duration: 0.35 }, flipAt);
      tl.fromTo(".ro-card", { autoAlpha: 0, scale: 0.75, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "expo.out" }, flipAt + 0.15);
      tl.to(".ro-card", { y: -10, duration: 0.25, ease: "power2.out" }, flipAt + 0.9);
      tl.to(".ro-flip", { rotateY: 180, duration: 1, ease: "power3.inOut" }, flipAt + 1);
      tl.call(() => sfx.reveal(wolf), [], flipAt + 1.45);
      tl.to(".ro-card", { y: 0, duration: 0.6, ease: "bounce.out" }, flipAt + 1.5);
      // immediateRender: false — sinon l'éclair (couleur du camp) s'allume dès l'ouverture et trahit le rôle
      tl.fromTo(".ro-flash", { autoAlpha: 0.75 }, { autoAlpha: 0, duration: 1.4, ease: "power2.out", immediateRender: false }, flipAt + 1.45);
      tl.fromTo(".ro-role", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out" }, flipAt + 1.6);
      tl.to(photo, { filter: "grayscale(1) brightness(0.55)", duration: 1.2 }, flipAt + 1.6);
      tl.call(() => setPhase("done"), [], flipAt + 2.2);
    },
    { scope: root },
  );

  const close = useCallback((after: () => void) => {
    if (closing.current) return;
    closing.current = true;
    gsap.to(root.current, { autoAlpha: 0, duration: 0.45, ease: "power2.in", onComplete: after });
  }, []);

  // clavier : Échap annule (pendant le décompte) ou ferme ; Entrée / Espace continuent.
  // Écouteur posé une seule fois (lit l'état courant via une ref) : s'il était
  // reposé à chaque rendu, une touche qui provoque un rendu serait perdue.
  const keys = useRef({ phase, onCancel, onClose });
  useEffect(() => {
    keys.current = { phase, onCancel, onClose };
  });
  // l'écran se synchronise toutes les 1,5 s : on lit onClose via la ref pour ne pas relancer le minuteur
  useEffect(() => {
    if (phase !== "done" || mode !== "eliminate" || !autoCloseMs) return;
    const t = setTimeout(() => close(keys.current.onClose), autoCloseMs);
    return () => clearTimeout(t);
  }, [phase, mode, autoCloseMs, close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { phase, onCancel, onClose } = keys.current;
      if (e.key === "Escape") {
        if (phase === "countdown" && onCancel) close(onCancel);
        else if (phase === "done") close(onClose);
      } else if ((e.key === "Enter" || e.key === " ") && phase === "done") {
        e.preventDefault();
        close(onClose);
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
      aria-label={`${player.name || `Joueur ${number}`} éliminé${player.feminine ? "e" : ""}`}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      onClick={() => phase === "done" && mode === "eliminate" && close(onClose)}
    >
      <div className="ro-bg absolute inset-0">
        <NightAmbience intensity={0.82} />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,rgba(26,6,8,0.55),rgba(7,4,4,0.9)_75%)]" />
      </div>
      <div className="ro-flash pointer-events-none absolute inset-0 opacity-0" style={{ background: phase === "countdown" ? "none" : `radial-gradient(circle at 62% 50%, ${color}, transparent 60%)` }} />

      <div className="relative flex flex-col items-center gap-[3vh] px-6 pb-[8vh] landscape:flex-row landscape:items-start landscape:gap-[6vw]">
        {/* photo + nom */}
        <figure className="flex flex-col items-center">
          <div className="ro-photo relative aspect-[3/4] h-[30vh] overflow-hidden rounded-[1.4rem] border border-[#c8262f] bg-[#0d0707] shadow-[0_0_90px_-10px_rgba(200,38,47,0.7)] landscape:h-[56vh]">
            {player.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(player.photo)} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-[10vh] font-bold text-paper/40">{number}</span>
            )}
            <span className="absolute left-3 top-3 flex h-[5.5vh] min-w-[5.5vh] items-center justify-center rounded-full border border-[#c8262f]/60 bg-[#070404]/85 px-3 text-[2.4vh] font-semibold tabular-nums text-paper">{number}</span>
          </div>
          <figcaption className="ro-name mt-[2.5vh] w-[calc(100%+6vw)] text-center">
            <span className="t-caps block text-[4.6vh] leading-none text-paper">{player.name || `Joueur ${number}`}</span>
            <span className="t-label mt-[1.4vh] block text-[1.8vh]! text-wolf-bright">
              {mode === "show" ? "Éliminé" : "Est éliminé"}
              {player.feminine ? "e" : ""}
            </span>
          </figcaption>
        </figure>

        {/* compte à rebours puis carte + rôle */}
        <div className="flex flex-col items-center">
          <div className="relative flex aspect-[5/7] h-[30vh] items-center justify-center landscape:h-[56vh]">
            {mode === "eliminate" && (
              <div className="ro-count absolute inset-0 flex items-center justify-center" aria-live="assertive">
                <span className="ro-pulse absolute aspect-square w-[78%] rounded-full border-2 border-[#ff4552]" />
                <svg viewBox="0 0 100 100" className="absolute aspect-square w-[78%] -rotate-90" aria-hidden>
                  <circle cx="50" cy="50" r="44" fill="rgba(13,7,7,0.75)" stroke="rgba(200,38,47,0.22)" strokeWidth="4" />
                  <circle className="ro-ring-arc" cx="50" cy="50" r="44" fill="none" stroke="#ff4552" strokeWidth="4" strokeLinecap="round" pathLength={100} strokeDasharray="100" style={{ filter: "drop-shadow(0 0 10px #c8262f)" }} />
                </svg>
                <span className="ro-num t-display relative text-[15vh] leading-none text-paper drop-shadow-[0_0_30px_rgba(255,69,82,0.6)] landscape:text-[20vh]">{n}</span>
              </div>
            )}
            <div className={`ro-card absolute inset-0 [perspective:1600px] ${mode === "eliminate" ? "invisible opacity-0" : ""}`}>
              <div className="ro-flip relative h-full w-full [transform-style:preserve-3d]">
                <div className="absolute inset-0 [backface-visibility:hidden]">
                  <RoleCardBack className="h-full w-full" />
                </div>
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  {player.role && <RoleCardFront role={player.role} feminine={player.feminine} className="h-full w-full" />}
                </div>
              </div>
            </div>
          </div>
          {/* Toujours présent (masqué) dès l'ouverture : le rôle peut arriver pendant le
              décompte, il ne doit apparaître qu'une fois la carte retournée. */}
          <div className="ro-role invisible mt-[2.5vh] min-h-[9vh] w-[calc(100%+6vw)] text-center opacity-0">
            {role && phase !== "countdown" && (
              <>
                <p className="t-display text-[4.2vh] leading-[1.05]" style={{ color, textShadow: `0 0 40px ${color}88` }}>
                  {player.feminine ? "Elle" : "Il"} était {role.id === "deux-soeurs" ? `l'${player.feminine ? "une" : "un"} des Deux Sœurs` : roleName(role.id, player.feminine)}
                </p>
                <p className="t-label mt-[1.4vh] text-[1.8vh]!" style={{ color }}>
                  {CAMPS[role.camp].label}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="absolute inset-x-0 bottom-[4vh] flex flex-col items-center gap-4 px-6 text-center">
        {phase === "countdown" && onCancel && (
          <button type="button" onClick={(e) => (e.stopPropagation(), close(onCancel))} className="cursor-pointer rounded-full border border-line-strong px-5 py-2 text-sm text-paper-muted hover:border-wolf-bright hover:text-paper">
            Annuler (Échap)
          </button>
        )}
        {phase === "done" &&
          (mode === "eliminate" ? (
            <p className="t-label animate-pulse text-paper-dim">{autoCloseMs ? "La partie reprend…" : "Clique ou appuie sur Entrée pour continuer"}</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {onResurrect && (
                <button type="button" onClick={(e) => (e.stopPropagation(), close(onResurrect))} className="cursor-pointer rounded-full bg-[#f2c86b] px-6 py-2.5 text-sm font-semibold text-[#2b1a14] shadow-[0_0_30px_-4px_rgba(242,200,107,0.7)] hover:bg-[#ffd98a]">
                  Ressusciter
                </button>
              )}
              <button type="button" onClick={(e) => (e.stopPropagation(), close(onClose))} className="cursor-pointer rounded-full bg-paper px-6 py-2.5 text-sm font-semibold text-night">
                Fermer
              </button>
              {onRevive && (
                <button type="button" onClick={(e) => (e.stopPropagation(), close(onRevive))} className="cursor-pointer rounded-full border border-paper/30 px-6 py-2.5 text-sm text-paper-muted hover:border-paper hover:text-paper">
                  Annuler l&apos;élimination (erreur)
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
