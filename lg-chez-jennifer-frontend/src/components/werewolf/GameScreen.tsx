"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { adminApi, getSession, mediaUrl } from "@/lib/admin-api";
import { VILLAGE, WINNERS, fetchScreen, type Player, type ScreenGame, type WinnerId } from "@/lib/werewolf";
import { NightAmbience } from "./NightAmbience";
import { RevealOverlay } from "./RevealOverlay";
import { Crown } from "./Crown";
import { EventOverlay } from "./EventOverlay";
import { IntroOverlay } from "./IntroOverlay";
import { RoleChip } from "./RoleCard";
import { sfx } from "./sfx";
import { ArrowLeftIcon, ExpandIcon, FlagIcon, MuteIcon, PlayIcon, RefreshIcon, SoundIcon, UndoIcon } from "@/components/admin/ui";

gsap.registerPlugin(useGSAP);

/** Ce qui s'affiche par-dessus la grille : révélation d'un rôle, carte revue, résurrection, élection du chef. */
type Reveal = { playerId: string; mode: "eliminate" | "show" | "resurrect" | "chief"; origin: DOMRect | null; local: boolean };
type Queued = { kind: "eliminate" | "resurrect" | "chief"; playerId: string };

const POLL_MS = 1500;
const GAP = 14;
const CHIP_ROW = 30;
const SMALL = 110;

/**
 * Colonnes qui donnent les plus grandes vignettes sans défilement — en
 * préférant une grille équilibrée (pas un joueur seul sur la dernière ligne)
 * quand cela ne réduit les photos que de quelques pour cent.
 */
function fit(n: number, W: number, H: number) {
  const options = [];
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const byWidth = (W - GAP * (cols - 1)) / cols;
    const cell = (H - GAP * (rows - 1)) / rows;
    let w = Math.min(byWidth, (cell - CHIP_ROW) * (3 / 4));
    if (w < SMALL) w = Math.min(byWidth, cell * (3 / 4), SMALL - 1);
    options.push({ cols, w: Math.floor(w), empty: rows * cols - n });
  }
  const max = Math.max(...options.map((o) => o.w));
  return options.filter((o) => o.w >= max * 0.9).sort((a, b) => a.empty - b.empty || b.w - a.w)[0];
}

/* rôle de la session admin éventuellement ouverte dans ce navigateur */
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("jey:session", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("jey:session", cb);
  };
};
const sessionRole = () => getSession()?.role ?? "";

/**
 * Écran géant d'une partie (télé / projecteur), aux couleurs de la page
 * /loup-garou. Public : n'affiche que les rôles des joueurs éliminés.
 * Si ce navigateur est connecté à l'admin, on peut aussi éliminer un joueur
 * directement en cliquant sur sa photo ; sinon l'écran suit la régie.
 */
export function GameScreen({ id }: { id: string }) {
  const role = useSyncExternalStore(subscribe, sessionRole, () => "");
  const canControl = role === "admin" || role === "staff";
  const [game, setGame] = useState<ScreenGame | null>(null);
  const [missing, setMissing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [glow, setGlow] = useState<{ id: string; kind: "resurrect" | "chief" } | null>(null);
  const [menu, setMenu] = useState<Player | null>(null);
  const [layout, setLayout] = useState({ cols: 5, w: 160 });
  const [muted, setMuted] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [ending, setEnding] = useState(false);
  const [finale, setFinale] = useState(false);
  const [intro, setIntro] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const known = useRef<Set<string> | null>(null);
  const queue = useRef<Queued[]>([]);
  const knownRevived = useRef<Map<string, string>>(new Map());
  const knownChiefAt = useRef<string | undefined>(undefined);
  const knownIntroAt = useRef<string | undefined>(undefined);
  /** les cartes arrivent juste après l'introduction : distribution sonorisée */
  const dealing = useRef(false);
  const revealRef = useRef<Reveal | null>(null);
  const statusRef = useRef<ScreenGame["status"] | null>(null);

  useEffect(() => {
    revealRef.current = reveal;
  }, [reveal]);

  // bannière de victoire : laisse place aux rôles au bout de 12 s (personne ne touche la télé)
  useEffect(() => {
    if (!finale || reveal) return;
    const t = setTimeout(() => setFinale(false), 12000);
    return () => clearTimeout(t);
  }, [finale, reveal]);

  /* ---------------- chargement + suivi de la partie (régie) ---------------- */
  function apply(g: ScreenGame) {
    setGame(g);
    const out = g.players.filter((p) => p.eliminatedAt).map((p) => p.id);
    if (!known.current) {
      // à l'ouverture : on ne rejoue pas ce qui s'est passé avant
      known.current = new Set(out);
      knownRevived.current = new Map(g.players.filter((p) => p.revivedAt).map((p) => [p.id, p.revivedAt!]));
      knownChiefAt.current = g.chiefAt;
      knownIntroAt.current = g.introAt;
    } else {
      // lancement de la partie (ou introduction rejouée depuis la régie)
      if (g.introAt !== knownIntroAt.current) {
        knownIntroAt.current = g.introAt;
        if (g.introAt) setIntro(true);
      }
      for (const pid of out) {
        if (!known.current.has(pid)) {
          known.current.add(pid);
          queue.current.push({ kind: "eliminate", playerId: pid });
        }
      }
      for (const k of [...known.current]) if (!out.includes(k)) known.current.delete(k);
      // résurrections annoncées
      for (const p of g.players) {
        if (p.revivedAt && knownRevived.current.get(p.id) !== p.revivedAt) {
          knownRevived.current.set(p.id, p.revivedAt);
          if (!p.eliminatedAt) queue.current.push({ kind: "resurrect", playerId: p.id });
        }
      }
      // nouveau chef du village
      if (g.chiefAt !== knownChiefAt.current) {
        knownChiefAt.current = g.chiefAt;
        if (g.chiefId && g.chiefAt) queue.current.push({ kind: "chief", playerId: g.chiefId });
      }
    }
    if (g.status === "ended" && statusRef.current && statusRef.current !== "ended") setFinale(true);
    statusRef.current = g.status;
    nextFromQueue();
  }

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const g = await fetchScreen(id);
        if (stop) return;
        if (!g) return setMissing(true);
        setOffline(false);
        apply(g);
      } catch {
        if (!stop) setOffline(true);
      }
    };
    void tick();
    const t = setInterval(tick, POLL_MS);
    return () => {
      stop = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function nextFromQueue() {
    if (revealRef.current) return;
    const next = queue.current.shift();
    if (next) setReveal({ playerId: next.playerId, mode: next.kind, origin: tileRect(next.playerId), local: false });
  }

  /* --------------------------- grille plein écran --------------------------- */
  const count = game?.players.length ?? 0;
  // avant le lancement, l'écran attend (salle d'attente) : les cartes n'apparaissent qu'après l'introduction
  const showGrid = !!game && game.status !== "setup" && !intro;
  useEffect(() => {
    const el = gridRef.current;
    if (!el || !count) return;
    const ro = new ResizeObserver(([entry]) => setLayout(fit(count, entry.contentRect.width, entry.contentRect.height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [count, showGrid]);

  // entrée en scène des joueurs (distribution des cartes après l'introduction)
  useGSAP(
    () => {
      if (!count || !showGrid) return;
      const dealt = dealing.current;
      dealing.current = false;
      gsap.from(".gs-head > *", { autoAlpha: 0, y: 20, duration: 1, ease: "expo.out", stagger: 0.1 });
      gsap.utils.toArray<HTMLElement>(".gs-tile").forEach((el, i) =>
        gsap.from(el, {
          autoAlpha: 0,
          y: dealt ? 90 : 40,
          rotateX: dealt ? -65 : 0,
          scale: dealt ? 0.7 : 0.94,
          transformPerspective: 900,
          duration: dealt ? 1.2 : 1,
          ease: "expo.out",
          delay: 0.2 + i * (dealt ? Math.min(0.12, 3 / count) : 0.04),
          onStart: dealt ? () => sfx.pluck(i) : undefined,
        }),
      );
    },
    { scope: root, dependencies: [count > 0, showGrid] },
  );

  /* ------------------------ barre d'outils discrète ------------------------ */
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      setChrome(true);
      clearTimeout(t);
      t = setTimeout(() => setChrome(false), 3500);
    };
    wake();
    window.addEventListener("pointermove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (revealRef.current) return;
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "m" || e.key === "M") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // toggleFullscreen / toggleMute n'utilisent que des setters stables
  }, []);

  // Échap ferme le menu d'actions et le choix du camp gagnant
  useEffect(() => {
    if (!menu && !ending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setEnding(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, ending]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  /* -------------------------------- actions -------------------------------- */
  function tileRect(pid: string) {
    return document.querySelector(`[data-player="${pid}"] .tile-photo`)?.getBoundingClientRect() ?? null;
  }

  async function eliminate(p: Player, el: HTMLElement) {
    sfx.unlock();
    known.current?.add(p.id);
    setReveal({ playerId: p.id, mode: "eliminate", origin: el.querySelector(".tile-photo")!.getBoundingClientRect(), local: true });
    try {
      await adminApi.eliminate(id, p.id);
      const g = await fetchScreen(id); // le rôle n'est publié qu'une fois le joueur éliminé
      if (g) apply(g);
    } catch (e) {
      known.current?.delete(p.id);
      setReveal(null);
      flash((e as Error).message);
    }
  }

  /** `resurrect` : résurrection annoncée (l'animation arrive via la synchro) ; sinon correction silencieuse. */
  async function revive(pid: string, resurrect = false) {
    try {
      known.current?.delete(pid);
      await adminApi.revive(id, pid, resurrect);
      setFresh((f) => {
        const n = new Set(f);
        n.delete(pid);
        return n;
      });
      const g = await fetchScreen(id);
      if (g) apply(g);
    } catch (e) {
      flash((e as Error).message);
    }
  }

  async function elect(pid: string | null) {
    sfx.unlock();
    try {
      await adminApi.setChief(id, pid);
      const g = await fetchScreen(id);
      if (g) apply(g);
    } catch (e) {
      flash((e as Error).message);
    }
  }

  function clearReveal() {
    setReveal(null);
    revealRef.current = null;
  }

  function closeReveal(r: Reveal) {
    if (r.mode === "eliminate") setFresh((f) => new Set(f).add(r.playerId));
    if (r.mode === "resurrect" || r.mode === "chief") {
      setGlow({ id: r.playerId, kind: r.mode });
      setTimeout(() => setGlow(null), 5200);
    }
    clearReveal();
    setTimeout(nextFromQueue, 300);
  }

  function undoLast() {
    const last = game?.players.filter((p) => p.eliminatedAt).sort((a, b) => b.eliminatedAt!.localeCompare(a.eliminatedAt!))[0];
    if (!last) return flash("Aucune élimination à annuler.");
    if (confirm(`Ramener ${last.name || "le dernier joueur éliminé"} en jeu ?`)) void revive(last.id);
  }

  async function start() {
    sfx.unlock();
    try {
      await adminApi.startGame(id);
      const g = await fetchScreen(id);
      if (g) apply(g);
    } catch (e) {
      flash((e as Error).message);
    }
  }

  async function finish(w: WinnerId) {
    try {
      await adminApi.finishGame(id, w);
      setEnding(false);
      const g = await fetchScreen(id);
      if (g) apply(g);
    } catch (e) {
      flash((e as Error).message);
    }
  }

  async function restart() {
    if (!confirm("Rejouer une partie avec les mêmes joueurs ? Toutes les éliminations seront effacées.")) return;
    try {
      await adminApi.resetGame(id);
      known.current = null;
      setFresh(new Set());
      setFinale(false);
      const g = await fetchScreen(id);
      if (g) apply(g);
    } catch (e) {
      flash((e as Error).message);
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }
  function toggleMute() {
    setMuted((m) => {
      sfx.setMuted(!m);
      return !m;
    });
  }

  if (missing) {
    return (
      <Shell>
        <div className="grid h-full place-items-center p-6 text-center">
          <div>
            <p className="t-label text-wolf-bright">Soirée Loup-Garou</p>
            <p className="t-display mt-4 text-5xl text-paper">Cette partie n&apos;existe pas (ou plus).</p>
          </div>
        </div>
      </Shell>
    );
  }
  if (!game) {
    return (
      <Shell>
        <div className="grid h-full place-items-center">
          <p className="t-label animate-pulse text-wolf-bright">La nuit tombe sur le village…</p>
        </div>
      </Shell>
    );
  }

  const alive = game.players.filter((p) => !p.eliminatedAt).length;
  const out = game.players.length - alive;
  const ended = game.status === "ended";
  const winner = WINNERS.find((w) => w.id === game.winner);
  const revealed = reveal && game.players.find((p) => p.id === reveal.playerId);

  return (
    <Shell ref={root} hideCursor={!chrome}>
      {!showGrid && !intro && (
        <Lobby title={game.title} count={game.players.length} canControl={canControl} onStart={start} />
      )}

      {showGrid && (
        <>
      {/* en-tête */}
      <header className="gs-head relative z-10 flex flex-col gap-3 px-[3.5vw] pb-[2vh] pt-[3vh] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="t-label text-[clamp(0.65rem,1.5vh,1rem)]! text-wolf-bright">{game.title}</p>
          <h1 className="t-caps mt-[1vh] flex items-baseline gap-[1.2vh] text-paper">
            <span className="text-[clamp(0.9rem,2.4vh,1.8rem)] tracking-[0.3em] text-paper-muted">Soirée</span>
            <span className="whitespace-nowrap text-[clamp(1.8rem,6vh,4.6rem)] leading-[0.9]">Loup&#8209;Garou</span>
          </h1>
        </div>
        <div className="flex items-end gap-[3vh]" aria-live="polite">
          <Counter value={alive} label="En vie" />
          <span className="mb-[1vh] h-[5vh] w-px bg-line-strong" aria-hidden />
          <Counter value={out} label={out > 1 ? "Éliminés" : "Éliminé"} red />
        </div>
      </header>

      {/* grille */}
      <main className="relative z-10 min-h-0 flex-1 px-[3.5vw] pb-[3.5vh]">
        <div ref={gridRef} className="flex h-full w-full items-center justify-center">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${layout.cols}, ${layout.w}px)`, gap: GAP }}>
            {game.players.map((p, i) => (
              <Tile
                key={p.id}
                n={i + 1}
                player={p}
                width={layout.w}
                fresh={fresh.has(p.id)}
                ended={ended}
                interactive={canControl ? !ended || !!p.eliminatedAt : !!p.eliminatedAt}
                chief={game.chiefId === p.id}
                glow={glow?.id === p.id ? glow.kind : undefined}
                onClick={(el) => {
                  if (reveal) return;
                  if (p.eliminatedAt) setReveal({ playerId: p.id, mode: "show", origin: el.querySelector(".tile-photo")!.getBoundingClientRect(), local: true });
                  else if (canControl && !ended) setMenu(p);
                }}
              />
            ))}
          </ul>
        </div>
      </main>
        </>
      )}

      {/* barre d'outils (apparaît au mouvement de la souris) */}
      <nav
        aria-label="Commandes de l'écran"
        className={`absolute bottom-4 right-4 z-20 flex flex-wrap items-center gap-1 rounded-full border border-line bg-[#070404]/80 p-1.5 backdrop-blur transition-opacity duration-500 ${chrome ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        {canControl && (
          <>
            <ToolButton label="Régie de la partie" href={`/admin/loup-garou/${id}/regie`}>
              <ArrowLeftIcon />
            </ToolButton>
            <ToolButton label="Annuler la dernière élimination" onClick={undoLast}>
              <UndoIcon />
            </ToolButton>
            {!ended && game.status !== "setup" && (
              <ToolButton label="Rejouer l'introduction" onClick={() => confirm("Rejouer la cinématique d'introduction sur l'écran ?") && void start()}>
                <PlayIcon />
              </ToolButton>
            )}
            {ended ? (
              <ToolButton label="Rejouer avec les mêmes joueurs" onClick={restart}>
                <RefreshIcon />
              </ToolButton>
            ) : (
              <ToolButton label="Fin de partie" onClick={() => setEnding(true)}>
                <FlagIcon />
              </ToolButton>
            )}
          </>
        )}
        <ToolButton label={muted ? "Activer le son (M)" : "Couper le son (M)"} onClick={toggleMute}>
          {muted ? <MuteIcon /> : <SoundIcon />}
        </ToolButton>
        <ToolButton label="Plein écran (F)" onClick={toggleFullscreen}>
          <ExpandIcon />
        </ToolButton>
      </nav>

      {offline && <p className="absolute bottom-5 left-5 z-20 rounded-full border border-line bg-[#070404]/85 px-4 py-2 text-xs text-paper-muted">Connexion perdue… nouvel essai</p>}
      {toast && (
        <p role="alert" className="absolute left-1/2 top-6 z-30 -translate-x-1/2 rounded-full bg-wolf px-5 py-2.5 text-sm font-semibold text-white shadow-xl">
          {toast}
        </p>
      )}

      {/* révélation */}
      {reveal && revealed && (reveal.mode === "resurrect" || reveal.mode === "chief") && (
        <EventOverlay
          key={reveal.playerId + reveal.mode}
          kind={reveal.mode}
          player={revealed}
          number={game.players.indexOf(revealed) + 1}
          onClose={() => closeReveal(reveal)}
          autoCloseMs={canControl ? undefined : 6000}
        />
      )}
      {reveal && revealed && (reveal.mode === "eliminate" || reveal.mode === "show") && (
        <RevealOverlay
          key={reveal.playerId + reveal.mode}
          player={revealed}
          number={game.players.indexOf(revealed) + 1}
          mode={reveal.mode}
          origin={reveal.origin}
          onCancel={reveal.local && reveal.mode === "eliminate" ? () => (clearReveal(), void revive(reveal.playerId)) : undefined}
          onClose={() => closeReveal(reveal)}
          onRevive={canControl && !ended ? () => (clearReveal(), void revive(reveal.playerId)) : undefined}
          onResurrect={canControl && !ended ? () => (clearReveal(), void revive(reveal.playerId, true)) : undefined}
          autoCloseMs={reveal.local ? undefined : 7000}
        />
      )}

      {/* actions sur un joueur en vie (écran piloté) */}
      {menu && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#070404]/80 p-6 backdrop-blur" onClick={() => setMenu(null)}>
          <div role="dialog" aria-modal="true" aria-label={`Actions pour ${menu.name}`} className="w-full max-w-md rounded-[1.4rem] border border-line bg-[#0d0707] p-7 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="t-label text-wolf-bright">Joueur {game.players.findIndex((p) => p.id === menu.id) + 1}</p>
            <p className="t-caps mt-2 text-4xl text-paper">{menu.name || "Sans nom"}</p>
            <div className="mt-7 grid gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  const p = menu;
                  setMenu(null);
                  const el = document.querySelector<HTMLElement>(`[data-player="${p.id}"] button`);
                  if (el) void eliminate(p, el);
                }}
                className="cursor-pointer rounded-full bg-wolf px-6 py-3.5 font-semibold text-white hover:bg-wolf-bright"
              >
                Éliminer et révéler son rôle
              </button>
              {game.chiefId === menu.id ? (
                <button type="button" onClick={() => (setMenu(null), void elect(null))} className="cursor-pointer rounded-full border border-[#f2c86b]/50 px-6 py-3.5 font-semibold text-[#f2c86b] hover:bg-[#f2c86b]/10">
                  Retirer le titre de chef
                </button>
              ) : (
                <button type="button" onClick={() => (setMenu(null), void elect(menu.id))} className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f2c86b] px-6 py-3.5 font-semibold text-[#2b1a14] hover:bg-[#ffd98a]">
                  <Crown className="h-5 w-6" /> Élire chef du village
                </button>
              )}
              <button type="button" onClick={() => setMenu(null)} className="cursor-pointer text-sm text-paper-muted underline underline-offset-4">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* choix du camp gagnant */}
      {ending && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#070404]/85 p-6 backdrop-blur" onClick={() => setEnding(false)}>
          <div role="dialog" aria-modal="true" aria-label="Fin de partie" className="w-full max-w-2xl rounded-[1.4rem] border border-line bg-[#0d0707] p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="t-label text-wolf-bright">Fin de partie</p>
            <h2 className="t-display mt-3 text-5xl text-paper">Qui l&apos;emporte ?</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {WINNERS.map((w) => (
                <button key={w.id} type="button" onClick={() => finish(w.id)} className="cursor-pointer rounded-[1.2rem] border px-5 py-5 text-left transition-colors hover:bg-white/5" style={{ borderColor: `${w.color}55` }}>
                  <span className="t-caps block text-2xl" style={{ color: w.color }}>{w.label}</span>
                  <span className="mt-1 block text-sm text-paper-muted">{w.line}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setEnding(false)} className="mt-6 cursor-pointer text-sm text-paper-muted underline decoration-wolf-bright/50 underline-offset-4">
              Continuer la partie
            </button>
          </div>
        </div>
      )}

      {/* cinématique d'introduction */}
      {intro && (
        <IntroOverlay
          players={game.players}
          canSkip={canControl}
          onDone={() => {
            dealing.current = true;
            setIntro(false);
          }}
        />
      )}

      {/* bannière de victoire */}
      {finale && ended && winner && !reveal && (
        <div className="anim-card-in absolute inset-0 z-30 flex cursor-pointer items-center justify-center p-6 text-center" onClick={() => setFinale(false)}>
          <div className="absolute inset-0 bg-[#070404]/90 backdrop-blur-sm" />
          <div className="relative">
            <p className="t-label text-[2vh]! text-wolf-bright">Fin de la partie</p>
            <p className="t-display mt-[2vh] text-[9vh] leading-none text-paper">Victoire</p>
            <p className="t-caps mt-[2vh] text-[11vh] leading-none" style={{ color: winner.color, textShadow: `0 0 60px ${winner.color}88` }}>
              {winner.label}
            </p>
            <p className="mx-auto mt-[4vh] max-w-2xl text-[2.6vh] text-paper-muted">{winner.line}</p>
            <p className="t-label mt-[6vh] animate-pulse text-paper-dim">Les rôles de tous les joueurs vont être révélés…</p>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, hideCursor, ref }: { children: React.ReactNode; hideCursor?: boolean; ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={`fixed inset-0 flex select-none flex-col overflow-hidden bg-[#070404] text-paper ${hideCursor ? "cursor-none" : ""}`}>
      <NightAmbience intensity={0.55} />
      <div className="pointer-events-none absolute inset-0 bg-[#070404]/35" />
      {children}
    </div>
  );
}

/** Salle d'attente, avant que la régie ne lance la partie. */
function Lobby({ title, count, canControl, onStart }: { title: string; count: number; canControl: boolean; onStart: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => gsap.from(".lb > *", { autoAlpha: 0, y: 24, duration: 1.4, ease: "expo.out", stagger: 0.15 }), { scope: ref });
  return (
    // un clic sur la télé suffit à autoriser le son de l'introduction
    <div ref={ref} className="relative z-10 flex flex-1 items-center justify-center p-6 text-center" onPointerDown={() => sfx.unlock()}>
      <div className="lb flex flex-col items-center">
        <p className="t-label text-[clamp(0.7rem,1.8vh,1.2rem)]! text-wolf-bright">{title}</p>
        <p className="t-label mt-[5vh] text-[clamp(0.8rem,2.2vh,1.4rem)]! tracking-[0.5em]! text-paper-muted">Bienvenue à</p>
        <h1 className="t-caps mt-[2vh] whitespace-nowrap text-[clamp(2.6rem,13vh,11rem)] leading-none text-paper [text-shadow:0_0_80px_rgba(200,38,47,0.55)]">{VILLAGE}</h1>
        <span className="mt-[4vh] block h-px w-[36vw] bg-linear-to-r from-transparent via-wolf-bright to-transparent" />
        <p className="t-display mt-[4vh] text-[clamp(1.2rem,4vh,3rem)] text-paper">{count} habitants sont attendus au village.</p>
        {canControl ? (
          <button type="button" onClick={onStart} className="mt-[6vh] flex cursor-pointer items-center gap-3 rounded-full bg-wolf px-8 py-4 text-lg font-semibold text-white shadow-[0_0_60px_-10px_rgba(200,38,47,0.9)] hover:bg-wolf-bright">
            <PlayIcon className="h-5 w-5" /> Lancer la partie
          </button>
        ) : (
          <p className="t-label mt-[6vh] animate-pulse text-paper-dim">La partie va bientôt commencer…</p>
        )}
      </div>
    </div>
  );
}

function Counter({ value, label, red }: { value: number; label: string; red?: boolean }) {
  return (
    <div className="text-right">
      <p className={`text-[clamp(2rem,6.5vh,5rem)] font-extralight leading-[0.9] tabular-nums ${red ? "text-wolf-bright" : "text-paper"}`}>{value}</p>
      <p className="t-label mt-[0.8vh] text-[clamp(0.6rem,1.4vh,0.95rem)]!">{label}</p>
    </div>
  );
}

function Tile({
  n,
  player: p,
  width,
  fresh,
  ended,
  interactive,
  chief,
  glow,
  onClick,
}: {
  n: number;
  player: Player;
  width: number;
  fresh: boolean;
  ended: boolean;
  interactive: boolean;
  chief: boolean;
  glow?: "resurrect" | "chief";
  onClick: (el: HTMLElement) => void;
}) {
  const out = !!p.eliminatedAt;
  const small = width < SMALL;
  const label = `${p.name || `Joueur ${n}`}${chief ? ", chef du village" : ""}${out ? `, éliminé${p.feminine ? "e" : ""}` : ""}`;
  return (
    <li data-player={p.id} className="gs-tile" style={{ width }}>
      <button
        type="button"
        onClick={(e) => onClick(e.currentTarget)}
        disabled={!interactive}
        aria-label={label}
        className={`group relative block w-full text-left outline-none ${interactive ? "cursor-pointer" : "cursor-default"}`}
      >
        <div
          className={`tile-photo relative aspect-[3/4] overflow-hidden border bg-[#0d0707] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] transition-[border-color,box-shadow,transform] duration-500 ease-(--ease-soft) ${
            out
              ? "border-wolf-deep"
              : `${chief ? "border-[#f2c86b] shadow-[0_0_40px_-10px_rgba(242,200,107,0.7)]" : "border-line-strong"} ${glow ? "anim-revive" : ""} ${interactive ? "group-hover:-translate-y-1 group-hover:border-wolf-bright group-hover:shadow-[0_0_50px_-8px_rgba(200,38,47,0.8)] group-focus-visible:border-wolf-bright" : ""}`
          }`}
          style={{ borderRadius: Math.max(10, width * 0.09) }}
        >
          {p.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- photo servie par l'API
            <img src={mediaUrl(p.photo)} alt="" draggable={false} className={`h-full w-full object-cover transition-[filter] duration-700 ${out ? "brightness-[0.35] grayscale" : ""}`} />
          ) : (
            <span className="flex h-full items-center justify-center font-extralight text-paper/25" style={{ fontSize: width * 0.4 }}>
              {n}
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-[#070404] via-[#070404]/60 to-transparent" />
          {/* barré */}
          {out && (
            <svg viewBox="0 0 100 133" preserveAspectRatio="none" className={`absolute inset-0 h-full w-full ${fresh ? "anim-strike" : ""}`} aria-hidden>
              <path d="M10 10 90 123" pathLength={1} stroke="#ff4552" strokeWidth="3.5" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px #c8262f)" }} />
              <path d="M90 10 10 123" pathLength={1} stroke="#ff4552" strokeWidth="3.5" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px #c8262f)" }} />
            </svg>
          )}
          <span
            className="absolute right-[7%] top-[5%] flex items-center justify-center rounded-full border border-wolf/60 bg-[#070404]/80 px-[0.4em] font-semibold tabular-nums text-paper"
            style={{ minWidth: width * 0.2, height: width * 0.2, fontSize: width * 0.095 }}
          >
            {n}
          </span>
          <span className={`t-caps absolute inset-x-[6%] bottom-[6%] truncate text-center tracking-[0.12em] ${out ? "text-paper-muted" : "text-paper"}`} style={{ fontSize: Math.max(11, width * 0.105) }}>
            {p.name || `Joueur ${n}`}
          </span>
        </div>
        {/* couronne du chef du village, posée en haut à gauche de la carte */}
        {chief && (
          <Crown
            className={`pointer-events-none absolute z-10 ${glow === "chief" ? "anim-crown-in" : ""}`}
            style={{ width: width * 0.36, left: -width * 0.1, top: -width * 0.13, transform: "rotate(-18deg)" }}
          />
        )}
        {!small && (
          <div className="mt-2 flex h-6 justify-center">
            {p.role && (out || ended) && <RoleChip role={p.role} feminine={p.feminine} className={ended && !out ? "anim-card-in" : ""} />}
          </div>
        )}
      </button>
    </li>
  );
}

function ToolButton({ label, onClick, href, children }: { label: string; onClick?: () => void; href?: string; children: React.ReactNode }) {
  const cls = "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-paper/80 transition-colors hover:bg-wolf/20 hover:text-paper";
  return href ? (
    <Link href={href} aria-label={label} title={label} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={cls}>
      {children}
    </button>
  );
}
