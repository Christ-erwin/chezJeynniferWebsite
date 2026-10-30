"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { adminApi, mediaUrl } from "@/lib/admin-api";
import { WINNERS, roleName, type Game, type GameState, type Player, type WinnerId } from "@/lib/werewolf";
import { useAdminSession } from "@/components/admin/AdminShell";
import { Crown } from "@/components/werewolf/Crown";
import { RoleChip } from "@/components/werewolf/RoleCard";
import { Badge, Button, Card, ErrorNote, ExternalIcon, FlagIcon, Overlay, PlayIcon, RefreshIcon, Skeleton, UndoIcon } from "@/components/admin/ui";

/**
 * Régie d'une partie : on élimine les joueurs d'ici (téléphone, ordinateur),
 * et l'écran public affiché sur la télé joue la révélation.
 */
export default function GameControlPage() {
  const { id } = useParams<{ id: string }>();
  const session = useAdminSession();
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [target, setTarget] = useState<Player | null>(null);
  const [ending, setEnding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  // la régie ne s'affiche qu'après la connexion, donc toujours côté navigateur
  const screenUrl = typeof window === "undefined" ? "" : `${window.location.origin}/ecran/loup-garou/${id}`;

  useEffect(() => {
    let live = true;
    adminApi.game(id).then(
      (g) => live && setGame(g),
      (e: Error) => live && setError(e.message),
    );
    return () => {
      live = false;
    };
  }, [id]);

  function applyState(s: GameState) {
    const at = new Map(s.eliminated.map((e) => [e.id, e.at]));
    const rev = new Map(s.revived.map((e) => [e.id, e.at]));
    setGame((g) =>
      g
        ? {
            ...g,
            status: s.status,
            winner: s.winner,
            chiefId: s.chiefId,
            chiefAt: s.chiefAt,
            introAt: s.introAt,
            players: g.players.map((p) => ({ ...p, eliminatedAt: at.get(p.id), revivedAt: rev.get(p.id) })),
          }
        : g,
    );
  }

  // synchro : éliminations faites depuis l'écran ou une autre régie
  useEffect(() => {
    if (!game) return;
    const t = setInterval(async () => {
      try {
        const s = await adminApi.gameState(id);
        if (s.rev !== game.rev) setGame(await adminApi.game(id)); // composition modifiée entre-temps
        else applyState(s);
      } catch {
        /* nouvel essai au prochain tour */
      }
    }, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, game?.rev]);

  async function run(fn: () => Promise<GameState>, msg?: string) {
    setBusy(true);
    setError(null);
    try {
      applyState(await fn());
      if (msg) {
        setNotice(msg);
        setTimeout(() => setNotice(null), 9000);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(screenUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible : le lien reste affiché */
    }
  }

  if (!game) return error ? <ErrorNote>{error}</ErrorNote> : <Skeleton className="h-96" />;

  const alive = game.players.filter((p) => !p.eliminatedAt);
  const last = game.players.filter((p) => p.eliminatedAt).sort((a, b) => b.eliminatedAt!.localeCompare(a.eliminatedAt!))[0];
  const ended = game.status === "ended";
  const winner = WINNERS.find((w) => w.id === game.winner);

  return (
    <div className="space-y-6">
      <Link href="/admin/loup-garou" className="text-sm text-paper-muted hover:text-peach">← Parties</Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wolf-bright">Régie</p>
          <h1 className="t-display mt-1 text-4xl text-paper sm:text-5xl">{game.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-paper-muted">
            <Badge tone={ended ? "ok" : game.status === "live" ? "warn" : "mute"}>{ended ? "Terminée" : game.status === "live" ? "En cours" : "Pas commencée"}</Badge>
            {alive.length} en vie · {game.players.length - alive.length} éliminé{game.players.length - alive.length > 1 ? "s" : ""}
            {winner && <Badge tone="info">Victoire : {winner.label}</Badge>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {session?.role === "admin" && (
            <Link href={`/admin/loup-garou/${id}`} className="inline-flex h-9 items-center rounded-full border border-line-strong px-3.5 text-sm font-semibold text-paper hover:border-peach hover:text-peach">
              Modifier les joueurs
            </Link>
          )}
          <Button size="sm" onClick={() => last && confirm(`Ramener ${last.name || "le dernier joueur éliminé"} en jeu ?`) && run(() => adminApi.revive(id, last.id))} disabled={!last || busy}>
            <UndoIcon /> Annuler la dernière
          </Button>
          {game.status === "live" && (
            <Button size="sm" onClick={() => confirm("Rejouer la cinématique d'introduction sur l'écran public ?") && run(() => adminApi.startGame(id), "L'introduction est rejouée sur l'écran.")} disabled={busy}>
              <PlayIcon /> Rejouer l&apos;intro
            </Button>
          )}
          {ended ? (
            <Button size="sm" onClick={() => confirm("Rejouer avec les mêmes joueurs ? Les éliminations seront effacées.") && run(() => adminApi.resetGame(id))} disabled={busy}>
              <RefreshIcon /> Rejouer
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={() => setEnding(true)} disabled={busy}>
              <FlagIcon /> Fin de partie
            </Button>
          )}
        </div>
      </header>

      {game.status === "setup" && (
        <Card className="flex flex-col gap-4 border-wolf/50 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-semibold text-paper">La partie n&apos;a pas commencé</p>
            <p className="mt-1 text-sm text-paper-muted">
              L&apos;écran public affiche la salle d&apos;attente. « Lancer » joue la cinématique d&apos;introduction (environ 1 min 40), puis distribue les cartes des joueurs.
            </p>
          </div>
          <Button variant="primary" onClick={() => run(() => adminApi.startGame(id), "Cinématique lancée sur l'écran public.")} disabled={busy}>
            <PlayIcon /> Lancer la partie
          </Button>
        </Card>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
      {notice && (
        <p role="status" className="rounded-xl border border-wolf/40 bg-wolf/10 px-4 py-3 text-sm text-paper">
          {notice}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        {/* joueurs */}
        <section aria-label="Joueurs">
          <p className="mb-3 text-sm text-paper-muted">Touche un joueur pour l&apos;éliminer, l&apos;élire chef du village ou le ressusciter : l&apos;écran public joue l&apos;animation.</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
            {game.players.map((p, i) => {
              const out = !!p.eliminatedAt;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={busy || (ended && !out)}
                    onClick={() => setTarget(p)}
                    className={`group relative block w-full cursor-pointer overflow-hidden rounded-2xl border text-left transition-colors disabled:cursor-default ${out ? "border-line opacity-60" : game.chiefId === p.id ? "border-[#f2c86b] hover:border-[#ffd98a]" : "border-line-strong hover:border-wolf-bright"}`}
                  >
                    {game.chiefId === p.id && <Crown className="absolute left-1 top-1 z-10 w-10 -rotate-[18deg]" />}
                    <div className="relative aspect-[3/4] bg-night">
                      {p.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(p.photo)} alt="" className={`h-full w-full object-cover ${out ? "grayscale" : ""}`} />
                      ) : (
                        <span className="flex h-full items-center justify-center text-3xl font-bold text-paper/30">{i + 1}</span>
                      )}
                      <span className="absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-night/85 px-1.5 text-xs font-bold text-paper">{i + 1}</span>
                      {out && (
                        <svg viewBox="0 0 100 133" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
                          <path d="M10 10 90 123M90 10 10 123" stroke="#ff4552" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <div className="space-y-1 p-2">
                      <p className="truncate text-sm font-semibold text-paper">{p.name || `Joueur ${i + 1}`}</p>
                      {p.role ? <RoleChip role={p.role} feminine={p.feminine} /> : <span className="text-xs text-rose-300">Sans rôle</span>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* écran public */}
        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-paper">Écran public</h2>
            <p className="mt-1 text-sm text-paper-muted">À ouvrir sur l&apos;ordinateur branché à la télé ou au projecteur, en plein écran (touche F). Aucune connexion nécessaire ; seuls les rôles des joueurs éliminés y apparaissent.</p>
            <a href={`/ecran/loup-garou/${id}`} target="_blank" rel="noopener" className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-wolf px-4 text-sm font-semibold text-white hover:bg-wolf-bright">
              <ExternalIcon /> Ouvrir l&apos;écran public
            </a>
            {screenUrl && (
              <>
                <button type="button" onClick={copy} className="mt-3 w-full cursor-pointer break-all rounded-xl border border-line bg-night px-3 py-2.5 text-left font-mono text-xs text-paper-muted hover:border-peach">
                  {copied ? "Lien copié ✓" : screenUrl}
                </button>
                <div className="mt-4 flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2">
                    <QRCodeSVG value={screenUrl} size={88} level="M" />
                  </div>
                  <p className="text-xs text-paper-dim">Scanne ce code pour ouvrir l&apos;écran sur un autre appareil (tablette, télé connectée…).</p>
                </div>
              </>
            )}
          </Card>
        </aside>
      </div>

      {/* actions sur un joueur */}
      {target && (() => {
        const out = !!target.eliminatedAt;
        const isChief = game.chiefId === target.id;
        const n = game.players.findIndex((x) => x.id === target.id) + 1;
        const e = target.feminine ? "e" : "";
        const act = (fn: () => Promise<GameState>, msg: string) => {
          setTarget(null);
          void run(fn, msg);
        };
        return (
          <Overlay title={`Joueur ${n}`} onClose={() => setTarget(null)}>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-18 shrink-0 overflow-hidden rounded-xl bg-night">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {target.photo && <img src={mediaUrl(target.photo)} alt="" className={`h-full w-full object-cover ${out ? "grayscale" : ""}`} />}
              </div>
              <div className="min-w-0">
                <p className="t-display flex items-center gap-2 text-3xl text-paper">
                  {isChief && <Crown className="h-6 w-7 shrink-0" />}
                  <span className="truncate">{target.name || "Joueur sans nom"}</span>
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-paper-muted">
                  {target.role ? <RoleChip role={target.role} feminine={target.feminine} /> : <span className="text-rose-300">Sans rôle</span>}
                  {out ? `Éliminé${e}` : isChief ? "Chef du village" : "En vie"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-2.5">
              {!out ? (
                <>
                  <Button
                    variant="primary"
                    disabled={!target.role || busy || ended}
                    onClick={() => act(() => adminApi.eliminate(id, target.id), `${target.name || "Le joueur"} est éliminé${e} : la révélation se joue sur l'écran.`)}
                  >
                    Éliminer{target.role ? ` — révèle « ${roleName(target.role, target.feminine)} »` : ""}
                  </Button>
                  {isChief ? (
                    <Button disabled={busy} onClick={() => act(() => adminApi.setChief(id, null), "Le village n'a plus de chef.")}>
                      Retirer le titre de chef
                    </Button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy || ended}
                      onClick={() => act(() => adminApi.setChief(id, target.id), `${target.name || "Le joueur"} est élu${e} chef du village : la couronne se pose sur l'écran.`)}
                      className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f2c86b] px-5 text-sm font-semibold text-[#2b1a14] hover:bg-[#ffd98a] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Crown className="h-5 w-6" /> Élire chef du village
                    </button>
                  )}
                  {!target.role && <p className="text-xs text-rose-300">Ce joueur n&apos;a pas de rôle : complète d&apos;abord la composition pour pouvoir l&apos;éliminer.</p>}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={busy || ended}
                    onClick={() => act(() => adminApi.revive(id, target.id, true), `${target.name || "Le joueur"} est ressuscité${e} : l'annonce se joue sur l'écran.`)}
                    className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-[#f2c86b] px-5 text-sm font-semibold text-[#2b1a14] hover:bg-[#ffd98a] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Ressusciter (annoncé sur l&apos;écran)
                  </button>
                  <Button disabled={busy} onClick={() => act(() => adminApi.revive(id, target.id), `Élimination de ${target.name || "ce joueur"} annulée.`)}>
                    Annuler l&apos;élimination (erreur, sans annonce)
                  </Button>
                </>
              )}
              <button type="button" onClick={() => setTarget(null)} className="mt-1 cursor-pointer text-sm text-paper-muted underline underline-offset-4">
                Fermer
              </button>
            </div>
          </Overlay>
        );
      })()}

      {/* camp gagnant */}
      {ending && (
        <Overlay title="Fin de partie : qui l'emporte ?" onClose={() => setEnding(false)}>
          <div className="grid gap-3 sm:grid-cols-2">
            {WINNERS.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setEnding(false);
                  void run(() => adminApi.finishGame(id, w.id as WinnerId), "Partie terminée : la victoire s'affiche sur l'écran.");
                }}
                className="cursor-pointer rounded-2xl border px-4 py-4 text-left hover:bg-white/5"
                style={{ borderColor: `${w.color}55` }}
              >
                <span className="t-caps block text-xl" style={{ color: w.color }}>{w.label}</span>
                <span className="mt-1 block text-xs text-paper-muted">{w.line}</span>
              </button>
            ))}
          </div>
        </Overlay>
      )}
    </div>
  );
}
