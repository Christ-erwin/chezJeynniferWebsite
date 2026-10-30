"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminApi, mediaUrl } from "@/lib/admin-api";
import { CAMPS, ROLES, ROLE_BY_ID, compositionWarnings, type Camp, type Game, type Player, type RoleId } from "@/lib/werewolf";
import { useAdminSession } from "@/components/admin/AdminShell";
import { RoleChip, RoleEmblem } from "@/components/werewolf/RoleCard";
import { Badge, Button, Card, ErrorNote, ImageIcon, Input, PlayIcon, PlusIcon, Select, ShuffleIcon, Skeleton, TrashIcon, XIcon } from "@/components/admin/ui";

type Draft = { title: string; eventId?: string; players: Player[] };
type SaveState = "saved" | "dirty" | "saving" | "error";

const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");
const blankPlayer = (): Player => ({ id: newId(), name: "", role: null });
const CAMP_ORDER: Camp[] = ["loups", "village", "ambigu", "solitaire"];

export default function GameSetupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const session = useAdminSession();
  const [game, setGame] = useState<Game | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [countInput, setCountInput] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  // l'accueil n'a accès qu'à l'écran de jeu
  useEffect(() => {
    if (session?.role === "staff") router.replace(`/admin/loup-garou/${id}/regie`);
  }, [session, id, router]);

  useEffect(() => {
    let live = true;
    adminApi.game(id).then(
      (g) => {
        if (!live) return;
        setGame(g);
        setDraft({ title: g.title, eventId: g.eventId, players: g.players });
        setCountInput(String(g.players.length));
      },
      (e: Error) => live && setLoadError(e.message),
    );
    return () => {
      live = false;
    };
  }, [id]);

  /* ---------------------- sauvegarde automatique ---------------------- */
  const latest = useRef<Draft | null>(null);
  const saving = useRef(false);
  const again = useRef(false);

  async function flush() {
    if (!latest.current) return;
    if (saving.current) {
      again.current = true;
      return;
    }
    saving.current = true;
    setSave("saving");
    try {
      const g = await adminApi.saveGame(id, latest.current);
      setGame(g);
      setSaveError(null);
      setSave(again.current ? "dirty" : "saved");
    } catch (e) {
      setSave("error");
      setSaveError((e as Error).message);
    } finally {
      saving.current = false;
      if (again.current) {
        again.current = false;
        void flush();
      }
    }
  }

  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });

  useEffect(() => {
    if (save !== "dirty") return;
    const t = setTimeout(() => flushRef.current(), 900);
    return () => clearTimeout(t);
  }, [save, draft]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (save === "dirty" || save === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [save]);

  function update(fn: (d: Draft) => Draft) {
    setDraft((d) => {
      if (!d) return d;
      const next = fn(d);
      latest.current = next;
      return next;
    });
    setSave("dirty");
  }
  const setPlayer = (pid: string, patch: Partial<Player>) =>
    update((d) => ({ ...d, players: d.players.map((p) => (p.id === pid ? { ...p, ...patch } : p)) }));

  /* ------------------------------ actions ------------------------------ */
  function applyCount() {
    if (!draft) return;
    const n = Math.max(3, Math.min(40, Number(countInput) || draft.players.length));
    if (n < draft.players.length) {
      const removed = draft.players.slice(n).filter((p) => p.name || p.photo || p.role);
      if (removed.length && !confirm(`Retirer les ${draft.players.length - n} derniers joueurs (dont ${removed.map((p) => p.name || "sans nom").join(", ")}) ?`)) return;
    }
    update((d) => ({ ...d, players: n > d.players.length ? [...d.players, ...Array.from({ length: n - d.players.length }, blankPlayer)] : d.players.slice(0, n) }));
    setCountInput(String(n));
  }

  function shuffleRoles() {
    if (!draft) return;
    if (game?.status !== "setup" && !confirm("La partie a déjà commencé. Redistribuer quand même les rôles ?")) return;
    const roles = draft.players.map((p) => p.role);
    for (let i = roles.length - 1; i > 0; i--) {
      const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    update((d) => ({ ...d, players: d.players.map((p, i) => ({ ...p, role: roles[i] })) }));
  }

  function setRoleCount(role: RoleId, n: number) {
    // ajuste le nombre de cartes d'un rôle : on attribue aux joueurs sans rôle, on retire en partant de la fin
    update((d) => {
      const players = [...d.players];
      let have = players.filter((p) => p.role === role).length;
      for (let i = 0; have < n && i < players.length; i++) {
        if (!players[i].role) {
          players[i] = { ...players[i], role };
          have++;
        }
      }
      for (let i = players.length - 1; have > n && i >= 0; i--) {
        if (players[i].role === role) {
          players[i] = { ...players[i], role: null };
          have--;
        }
      }
      return { ...d, players };
    });
  }

  async function bulkPhotos(files: FileList | null) {
    if (!files?.length || !draft) return;
    setBulkBusy(true);
    setSaveError(null);
    const targets = draft.players.filter((p) => !p.photo);
    const list = [...files].slice(0, targets.length);
    try {
      for (let i = 0; i < list.length; i++) {
        const path = await adminApi.uploadPortrait(list[i]);
        const fromFile = list[i].name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
        setPlayer(targets[i].id, { photo: path, ...(targets[i].name ? {} : { name: fromFile.slice(0, 40) }) });
      }
      if (files.length > targets.length) setSaveError(`${files.length - targets.length} photo(s) ignorée(s) : tous les joueurs ont déjà une photo.`);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  }

  async function remove() {
    if (!game || !confirm(`Supprimer définitivement « ${game.title} » ?`)) return;
    await adminApi.deleteGame(id);
    router.replace("/admin/loup-garou");
  }

  if (loadError) return <ErrorNote>{loadError}</ErrorNote>;
  if (!draft || !game) return <Skeleton className="h-96" />;

  const warnings = compositionWarnings(draft.players);
  const assigned = draft.players.filter((p) => p.role).length;
  const counts = Object.fromEntries(ROLES.map((r) => [r.id, draft.players.filter((p) => p.role === r.id).length])) as Record<RoleId, number>;
  const campCount = (c: Camp) => draft.players.filter((p) => p.role && ROLE_BY_ID[p.role].camp === c).length;

  return (
    <div className="space-y-6">
      <Link href="/admin/loup-garou" className="text-sm text-paper-muted hover:text-peach">← Parties</Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <label htmlFor="game-title" className="sr-only">Nom de la partie</label>
          <input
            id="game-title"
            value={draft.title}
            onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
            maxLength={80}
            className="t-display w-full rounded-lg bg-transparent text-4xl text-paper outline-none focus:ring-2 focus:ring-peach/30 sm:text-5xl"
          />
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-paper-muted" aria-live="polite">
            <Badge tone={game.status === "setup" ? "mute" : game.status === "live" ? "warn" : "ok"}>
              {game.status === "setup" ? "En préparation" : game.status === "live" ? "Partie en cours" : "Terminée"}
            </Badge>
            {save === "saved" && "Tout est enregistré"}
            {save === "dirty" && "Modifications…"}
            {save === "saving" && "Enregistrement…"}
            {save === "error" && <span className="text-rose-300">Non enregistré</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" size="sm" onClick={remove}>
            <TrashIcon /> Supprimer
          </Button>
          <Link href={`/admin/loup-garou/${id}/regie`} className="inline-flex h-9 items-center gap-2 rounded-full bg-wolf px-4 text-sm font-semibold text-white hover:bg-wolf-bright">
            <PlayIcon className="h-4 w-4" /> Régie de la partie
          </Link>
        </div>
      </header>
      {saveError && <ErrorNote>{saveError}</ErrorNote>}

      <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
        {/* joueurs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-paper">
              {draft.players.length} joueurs <span className="text-sm font-normal text-paper-muted">· {assigned} rôle{assigned > 1 ? "s" : ""} attribué{assigned > 1 ? "s" : ""}</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              <label className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-3.5 text-sm font-semibold text-paper hover:border-peach hover:text-peach has-focus-visible:ring-2 has-focus-visible:ring-peach/40 ${bulkBusy ? "pointer-events-none opacity-50" : ""}`}>
                <ImageIcon /> {bulkBusy ? "Import…" : "Importer des photos"}
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => {
                    void bulkPhotos(e.target.files);
                    e.target.value = "";
                  }} />
              </label>
              <Button size="sm" onClick={() => update((d) => ({ ...d, players: [...d.players, blankPlayer()] }))} disabled={draft.players.length >= 40}>
                <PlusIcon /> Joueur
              </Button>
            </div>
          </div>
          <p className="text-xs text-paper-dim">
            Astuce : « Importer des photos » remplit les joueurs sans photo dans l&apos;ordre, et utilise le nom du fichier comme prénom (ex. <span className="font-mono">Awa.jpg</span>).
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {draft.players.map((p, i) => (
              <PlayerCard
                key={p.id}
                n={i + 1}
                player={p}
                onChange={(patch) => setPlayer(p.id, patch)}
                onRemove={
                  draft.players.length > 3
                    ? () => {
                        if ((p.name || p.photo || p.role) && !confirm(`Retirer ${p.name || `le joueur ${i + 1}`} ?`)) return;
                        update((d) => ({ ...d, players: d.players.filter((x) => x.id !== p.id) }));
                      }
                    : undefined
                }
                onError={setSaveError}
              />
            ))}
          </ul>
        </div>

        {/* composition */}
        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <Card className="p-5">
            <div className="flex items-end gap-2">
              <label className="min-w-0 flex-1">
                <span className="mb-1.5 block text-sm font-semibold text-paper">Nombre de joueurs</span>
                <Input type="number" min={3} max={40} value={countInput} onChange={(e) => setCountInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyCount()} />
              </label>
              <Button size="sm" className="h-[46px]" onClick={applyCount} disabled={Number(countInput) === draft.players.length}>
                Appliquer
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-paper">Composition</h2>
              <span className={`text-sm tabular-nums ${assigned === draft.players.length ? "text-emerald-300" : "text-paper-muted"}`}>
                {assigned}/{draft.players.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-paper-dim">
              {CAMP_ORDER.map((c) => campCount(c) > 0 && `${CAMPS[c].label} ${campCount(c)}`).filter(Boolean).join(" · ") || "Choisis combien de cartes de chaque rôle."}
            </p>
            <ul className="mt-4 space-y-1">
              {ROLES.map((r) => (
                <li key={r.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1">
                  <RoleEmblem role={r.id} className="h-6 w-6 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm text-paper" style={{ color: counts[r.id] ? CAMPS[r.camp].color : undefined }}>
                    {r.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <button type="button" aria-label={`Une carte ${r.name} de moins`} disabled={!counts[r.id]} onClick={() => setRoleCount(r.id, counts[r.id] - 1)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line-strong text-paper disabled:cursor-default disabled:opacity-25">
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums text-paper">{counts[r.id]}</span>
                    <button type="button" aria-label={`Une carte ${r.name} de plus`} disabled={assigned >= draft.players.length} onClick={() => setRoleCount(r.id, counts[r.id] + 1)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line-strong text-paper disabled:cursor-default disabled:opacity-25">
                      +
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full" onClick={shuffleRoles} disabled={assigned < 2}>
              <ShuffleIcon /> Distribuer les rôles au hasard
            </Button>
            <p className="mt-2 text-xs text-paper-dim">Les + / − attribuent les cartes aux joueurs sans rôle ; « au hasard » mélange ensuite toutes les cartes entre les joueurs.</p>
          </Card>

          {warnings.length > 0 && (
            <Card className="border-amber-400/30 p-5">
              <h2 className="text-sm font-semibold text-amber-200">À vérifier</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-paper-muted">
                {warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function PlayerCard({
  n,
  player: p,
  onChange,
  onRemove,
  onError,
}: {
  n: number;
  player: Player;
  onChange: (patch: Partial<Player>) => void;
  onRemove?: () => void;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      onChange({ photo: await adminApi.uploadPortrait(file) });
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={`relative overflow-hidden rounded-2xl border bg-night-2 ${p.eliminatedAt ? "border-rose-400/30" : "border-line"}`}>
      <label
        className={`group relative block aspect-[3/4] cursor-pointer overflow-hidden bg-night has-focus-visible:ring-2 has-focus-visible:ring-peach ${over ? "ring-2 ring-peach" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void upload(e.dataTransfer.files[0]);
        }}
      >
        {p.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo servie par l'API
          <img src={mediaUrl(p.photo)} alt="" className={`h-full w-full object-cover ${p.eliminatedAt ? "grayscale" : ""}`} />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 text-paper-dim group-hover:text-peach">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs font-semibold">Ajouter une photo</span>
          </span>
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }} aria-label={`Photo du joueur ${n}`} />
        <span className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-night/80 px-2 text-sm font-bold text-paper">{n}</span>
        {busy && <span className="absolute inset-0 flex items-center justify-center bg-night/70 text-sm text-paper">Envoi…</span>}
        {p.eliminatedAt && <span className="absolute bottom-2 left-2 rounded-full bg-rose-500/90 px-2 py-0.5 text-xs font-bold text-white">Éliminé·e</span>}
        {p.photo && !busy && (
          <span className="absolute bottom-2 right-2 rounded-full bg-night/80 px-2 py-0.5 text-[0.7rem] text-paper opacity-0 transition-opacity group-hover:opacity-100">Changer</span>
        )}
      </label>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Retirer le joueur ${n}`} className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-night/80 text-paper-muted hover:text-rose-300">
          <XIcon className="h-4 w-4" />
        </button>
      )}
      <div className="space-y-2 p-2.5">
        <input
          value={p.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={`Joueur ${n}`}
          maxLength={40}
          aria-label={`Nom du joueur ${n}`}
          className="w-full rounded-lg border border-line-strong bg-night px-2.5 py-2 text-sm text-paper placeholder:text-paper-dim outline-none focus:border-peach"
        />
        <Select
          value={p.role ?? ""}
          onChange={(e) => onChange({ role: (e.target.value || null) as RoleId | null })}
          aria-label={`Rôle du joueur ${n}`}
          className="py-2! text-sm!"
        >
          <option value="">— Rôle —</option>
          {CAMP_ORDER.map((c) => (
            <optgroup key={c} label={CAMPS[c].label}>
              {ROLES.filter((r) => r.camp === c).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </optgroup>
          ))}
        </Select>
        <div className="flex min-h-6 items-center justify-between gap-2">
          {p.role ? <RoleChip role={p.role} feminine={p.feminine} /> : <span className="text-xs text-paper-dim">Pas de rôle</span>}
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-paper-muted" title="Accorde au féminin : « éliminée », « Villageoise »…">
            <input type="checkbox" checked={!!p.feminine} onChange={(e) => onChange({ feminine: e.target.checked })} className="accent-[#ffc4a0]" />
            Elle
          </label>
        </div>
      </div>
    </li>
  );
}
