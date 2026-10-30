"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi, type CheckinResult } from "@/lib/admin-api";
import { useLoad } from "@/components/admin/useLoad";
import {
  Button,
  CameraIcon,
  Card,
  CheckIcon,
  ErrorNote,
  Input,
  PageHead,
  Select,
  XIcon,
} from "@/components/admin/ui";

type BarcodeDetectorLike = {
  detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
type Log = { at: number; code: string; result: CheckinResult };

const REASON_TITLE: Record<string, string> = {
  unknown: "Billet inconnu",
  "not-paid": "Non payé",
  "already-used": "Déjà entré",
  "wrong-event": "Mauvaise soirée",
};

export default function CheckinPage() {
  const events = useLoad(adminApi.events);
  const [picked, setPicked] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<Log | null>(null);
  const [log, setLog] = useState<Log[]>([]);
  const [count, setCount] = useState<{
    checkedIn: number;
    total: number;
  } | null>(null);
  const [camera, setCamera] = useState<"off" | "on" | "unsupported">("off");
  const videoRef = useRef<HTMLVideoElement>(null);
  const recent = useRef(new Map<string, number>());

  // soirée par défaut : la prochaine en ligne (ou la plus récente)
  const open = (events.data ?? []).filter((e) => e.status === "published");
  const fallback =
    open.find((e) => Date.parse(e.startISO) > events.at - 12 * 3600_000) ??
    open.at(-1);
  const eventId = picked ?? fallback?.id ?? "";

  async function check(raw: string) {
    const c = raw.trim().toUpperCase();
    if (!c) return;
    // un même QR lu plusieurs fois par la caméra : on ignore pendant 4 s
    const seen = recent.current.get(c);
    if (seen && Date.now() - seen < 4000) return;
    recent.current.set(c, Date.now());
    setBusy(true);
    setError(null);
    try {
      const result = await adminApi.checkin(c, eventId || undefined);
      const entry = { at: Date.now(), code: c, result };
      setLast(entry);
      setLog((l) => [entry, ...l].slice(0, 30));
      if (result.ok)
        setCount({ checkedIn: result.checkedIn, total: result.total });
      navigator.vibrate?.(result.ok ? 80 : [60, 60, 60]);
      setCode("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  // la boucle caméra appelle toujours la version à jour (soirée choisie)
  const checkRef = useRef(check);
  useEffect(() => {
    checkRef.current = check;
  });

  // caméra + BarcodeDetector (Chrome Android, Edge…) ; sinon saisie manuelle
  useEffect(() => {
    if (camera !== "on") return;
    const Detector = (
      window as unknown as {
        BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike;
      }
    ).BarcodeDetector;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let stopped = false;
    (async () => {
      if (!Detector || !navigator.mediaDevices?.getUserMedia) {
        setCamera("unsupported");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        const detector = new Detector({ formats: ["qr_code"] });
        timer = setInterval(async () => {
          if (video.readyState < 2) return;
          try {
            const [hit] = await detector.detect(video);
            if (hit?.rawValue) checkRef.current(hit.rawValue);
          } catch {
            /* image illisible : on réessaie */
          }
        }, 250);
      } catch {
        setError(
          "Impossible d'ouvrir la caméra (autorisation refusée ?). Utilise la saisie du code.",
        );
        setCamera("off");
      }
    })();
    return () => {
      stopped = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camera]);

  const ok = last?.result.ok;
  const r = last?.result;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHead
        title="Contrôle à l'entrée"
        sub="Scanne le QR code du billet ou tape son code. Chaque billet n'entre qu'une fois."
      />

      <Card className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end sm:p-6">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-paper">
            Soirée contrôlée
          </span>
          <Select
            value={eventId}
            onChange={(e) => {
              setPicked(e.target.value);
              setCount(null);
            }}
          >
            {open.length === 0 && (
              <option value="">Aucune soirée en ligne</option>
            )}
            {open.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {e.startISO.slice(0, 10)}
              </option>
            ))}
          </Select>
        </label>
        {count && (
          <p className="text-right text-paper-muted" aria-live="polite">
            <span className="block text-3xl font-bold tabular-nums text-paper">
              {count.checkedIn}
              <span className="text-lg text-paper-dim"> / {count.total}</span>
            </span>
            entrés
          </p>
        )}
      </Card>

      {/* résultat */}
      <div aria-live="assertive" role="status">
        {last && r && (
          <Card
            className={`flex items-center gap-5 p-6 sm:p-8 ${ok ? "border-emerald-400/50 bg-emerald-500/12" : "border-rose-400/50 bg-rose-500/12"}`}
          >
            <span
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${ok ? "bg-emerald-400 text-night" : "bg-rose-400 text-night"}`}
            >
              {ok ? (
                <CheckIcon width={34} height={34} strokeWidth={2.4} />
              ) : (
                <XIcon width={34} height={34} strokeWidth={2.4} />
              )}
            </span>
            <div className="min-w-0">
              <p
                className={`text-3xl font-bold ${ok ? "text-emerald-200" : "text-rose-200"}`}
              >
                {r.ok ? "Bienvenue !" : REASON_TITLE[r.reason]}
              </p>
              <p className="mt-1 text-paper">
                {r.ticket ? (
                  <>
                    {r.ticket.label} · <strong>{r.order?.buyer.name}</strong>
                  </>
                ) : (
                  <span className="font-mono">{last.code}</span>
                )}
              </p>
              {!r.ok && (
                <p className="mt-1 text-sm text-paper-muted">
                  {r.message}
                  {r.ticket?.usedAt &&
                    ` (${new Date(r.ticket.usedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})`}
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* scan */}
      <Card className="space-y-4 p-5 sm:p-6">
        {camera === "on" ? (
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-peach/80" />
            <Button
              size="sm"
              className="absolute right-3 top-3 bg-night/70"
              onClick={() => setCamera("off")}
            >
              Fermer
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setCamera("on")}
          >
            <CameraIcon /> Scanner avec la caméra
          </Button>
        )}
        {camera === "unsupported" && (
          <p className="text-sm text-amber-200">
            Ce navigateur ne lit pas les QR codes. Utilise Chrome sur Android,
            ou tape le code ci-dessous.
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            recent.current.delete(code.trim().toUpperCase());
            check(code);
          }}
          className="flex gap-2"
        >
          <label className="sr-only" htmlFor="ticket-code">
            Code du billet
          </label>
          <Input
            id="ticket-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="JEY-XXXXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono"
          />
          <Button type="submit" variant="ghost" disabled={busy || !code.trim()}>
            Valider
          </Button>
        </form>
        {error && <ErrorNote>{error}</ErrorNote>}
      </Card>

      {log.length > 0 && (
        <Card className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-paper-dim">
            Derniers passages
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {log.map((l) => (
              <li key={l.at} className="flex items-center gap-3 py-2 text-sm">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${l.result.ok ? "bg-emerald-400" : "bg-rose-400"}`}
                />
                <span className="font-mono text-paper-muted">{l.code}</span>
                <span className="min-w-0 flex-1 truncate text-paper">
                  {l.result.order?.buyer.name ?? "—"}
                </span>
                <span className="text-xs text-paper-dim">
                  {l.result.ok ? "entré" : REASON_TITLE[l.result.reason]}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
