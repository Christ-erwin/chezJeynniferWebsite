import type { EventEdition } from "@/lib/catalog";

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/**
 * Places restantes, bien en vue en haut de la page de réservation :
 * gros chiffre, jauge de remplissage, et détail filles / garçons s'il y a des quotas.
 */
export function SeatsLeft({ event }: { event: EventEdition }) {
  const left = Math.max(event.remaining, 0);
  const sold = Math.min(Math.max(event.capacity - left, 0), event.capacity);
  const pct = event.capacity ? Math.round((sold / event.capacity) * 100) : 0;
  const hot = left > 0 && left <= 10;
  const byGender = event.remainingByGender;

  return (
    <div
      className={`mt-6 inline-flex w-full max-w-md flex-col gap-3 rounded-2xl border px-5 py-4 ${hot ? "border-ember/60 bg-ember/10" : "border-line-strong bg-night-2/80"}`}
      role="status"
      aria-label={left > 0 ? `${plural(left, "place")} restante${left > 1 ? "s" : ""} sur ${event.capacity}` : "Complet"}
    >
      <div className="flex items-baseline gap-3">
        {left > 0 ? (
          <>
            <span className={`t-display text-5xl font-semibold leading-none tabular-nums ${hot ? "text-ember" : "text-paper"}`}>{left}</span>
            <span className="text-sm text-paper-muted">
              place{left > 1 ? "s" : ""} restante{left > 1 ? "s" : ""} <span className="text-paper-dim">sur {event.capacity}</span>
              {hot && <span className="block font-semibold text-ember">Dépêche-toi, c&apos;est bientôt complet !</span>}
            </span>
          </>
        ) : (
          <span className="t-display text-3xl font-semibold text-ember">Complet</span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper/10" aria-hidden>
        <div className={`h-full rounded-full ${hot || left === 0 ? "bg-ember" : "bg-peach"}`} style={{ width: `${pct}%` }} />
      </div>
      {byGender && (
        <p className="flex flex-wrap gap-2 text-sm">
          <span className={`rounded-full px-3 py-1 font-semibold ${byGender.fille ? "bg-paper/10 text-paper" : "bg-paper/5 text-paper-dim line-through"}`}>
            {byGender.fille ? plural(byGender.fille, "place") : "Plus de place"} fille{byGender.fille > 1 ? "s" : ""}
          </span>
          <span className={`rounded-full px-3 py-1 font-semibold ${byGender.garcon ? "bg-paper/10 text-paper" : "bg-paper/5 text-paper-dim line-through"}`}>
            {byGender.garcon ? plural(byGender.garcon, "place") : "Plus de place"} garçon{byGender.garcon > 1 ? "s" : ""}
          </span>
        </p>
      )}
    </div>
  );
}
