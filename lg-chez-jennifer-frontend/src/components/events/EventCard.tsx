import Image from "next/image";
import Link from "next/link";
import { type EventEdition, conceptNames, dateParts, formatPrice } from "@/lib/catalog";
import { PinIcon, ClockIcon } from "@/components/icons";

/**
 * Carte d'édition — date en pastille, photo, nom en capitales fines,
 * et l'action de réservation toujours visible.
 */
export function EventCard({ event, className = "" }: { event: EventEdition; className?: string }) {
  const { day, month } = dateParts(event.startISO);
  const from = Math.min(...event.tiers.map((t) => t.price));
  const soldOut = event.remaining <= 0;
  const few = !soldOut && event.remaining <= Math.max(5, Math.ceil(event.capacity * 0.15));

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-[1.4rem] border border-line bg-night-2 transition-[border-color,transform] duration-500 ease-(--ease-soft) hover:-translate-y-1 hover:border-peach/40 ${className}`}
    >
      <Link href={`/reserver/${event.id}`} className="absolute inset-0 z-10" aria-label={`Réserver — ${event.title}, ${day} ${month}`} />

      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={event.cover}
          unoptimized={event.cover.startsWith("http")}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1.4s] ease-(--ease-soft) group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-night-2 via-night-2/10 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-col items-center rounded-lg bg-cream px-3 py-1.5 text-cacao shadow-lg">
          <span className="t-display text-2xl font-semibold leading-none">{day}</span>
          <span className="text-[0.62rem] font-bold tracking-[0.16em]">{month}</span>
        </div>
        {(soldOut || few) && (
          <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${soldOut ? "bg-night/85 text-paper" : "bg-ember text-cacao"}`}>
            {soldOut ? "Complet" : `Plus que ${event.remaining} place${event.remaining > 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col gap-3 px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
        <div>
          <h3 className="t-caps text-[1.7rem] text-paper">{event.title}</h3>
          <p className="t-caps mt-1 text-[0.8rem] tracking-[0.2em] text-paper-muted">chez Jeynnifer</p>
        </div>
        <p className="text-sm text-peach/90">{conceptNames(event.concepts)}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.82rem] text-paper-dim">
          <li className="flex items-center gap-1.5">
            <PinIcon className="h-3.5 w-3.5" /> {event.venue.revealedAfterBooking && event.venue.name === "Lieu secret" ? "Lieu à venir" : event.venue.city}
          </li>
          <li className="flex items-center gap-1.5">
            <ClockIcon className="h-3.5 w-3.5" /> {event.doors}
          </li>
        </ul>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="text-sm text-paper-muted">
            dès <span className="font-semibold text-paper">{formatPrice(from)}</span>
          </p>
          <span aria-hidden className="pointer-events-none relative inline-flex items-center rounded-full bg-peach px-5 py-2.5 text-sm font-semibold text-cacao transition-colors group-hover:bg-[#ffd9bd]">
            {soldOut ? "Complet" : "Prendre mon pass"}
          </span>
        </div>
      </div>
    </article>
  );
}
