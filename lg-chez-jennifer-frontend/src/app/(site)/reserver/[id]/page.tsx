import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { conceptNames, dateParts, imageAlt } from "@/lib/catalog";
import { fetchEvent } from "@/lib/events";
import { BookingForm } from "@/components/booking/BookingForm";
import { SalesSoon } from "@/components/booking/SalesSoon";
import { ArrowLeftIcon, CalendarIcon, ClockIcon, PinIcon } from "@/components/icons";

export const revalidate = 30;

export async function generateMetadata({ params }: PageProps<"/reserver/[id]">): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);
  return { title: event ? `Réserver — ${event.title}` : "Réserver" };
}

export default async function ReserverPage({ params }: PageProps<"/reserver/[id]">) {
  const { id } = await params;
  const event = await fetchEvent(id);
  if (!event) notFound();
  const { day, month, long } = dateParts(event.startISO);
  // données structurées (schema.org/Event) : lisibles par les moteurs de recherche et les agents IA
  const SITE_URL = "https://www.chezjeynnifer.online";
  const prices = event.tiers.map((t) => t.price);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${event.title} — Les Soirées chez Jeynnifer`,
    ...(event.subtitle ? { description: event.subtitle } : {}),
    startDate: event.startISO,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue.name,
      address: { "@type": "PostalAddress", addressLocality: event.venue.city, addressCountry: "CI" },
    },
    image: [event.cover.startsWith("http") ? event.cover : `${SITE_URL}${event.cover}`],
    organizer: { "@type": "Organization", name: "Les Soirées chez Jeynnifer", url: SITE_URL },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "XOF",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      availability: event.remaining > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `${SITE_URL}/reserver/${event.id}`,
    },
  };

  return (
    <main id="contenu" className="relative pb-24 pt-28 sm:pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        <Image src={event.cover} unoptimized={event.cover.startsWith("http")} alt="" fill priority sizes="100vw" className="object-cover blur-2xl brightness-[0.35] saturate-150" />
        <div className="absolute inset-0 bg-linear-to-b from-night/40 via-night/80 to-night" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <Link href="/evenements" className="inline-flex items-center gap-2 text-sm text-paper-muted transition-colors hover:text-peach">
          <ArrowLeftIcon className="h-4 w-4" /> Tous les événements
        </Link>

        <header className="mt-8 grid items-center gap-8 md:grid-cols-[auto_1fr] [&>*]:min-w-0">
          <div className="relative aspect-square w-32 overflow-hidden rounded-[1.4rem] border border-line sm:w-40" data-reveal="scale">
            <Image src={event.cover} unoptimized={event.cover.startsWith("http")} alt={imageAlt(event.cover, `Visuel de la soirée ${event.title}`)} fill loading="eager" sizes="160px" className="object-cover" />
            <div className="absolute left-2.5 top-2.5 flex flex-col items-center rounded-lg bg-cream px-2.5 py-1 text-cacao">
              <span className="t-display text-xl font-semibold leading-none">{day}</span>
              <span className="text-[0.55rem] font-bold tracking-[0.16em]">{month}</span>
            </div>
          </div>
          <div>
            <p className="t-label text-peach" data-reveal>Réservation · {conceptNames(event.concepts)}</p>
            <h1 className="t-caps mt-3 text-[clamp(2.25rem,11vw,3rem)] text-paper [overflow-wrap:anywhere] sm:text-6xl" data-split>
              {event.title}
            </h1>
            <p className="t-caps mt-1 text-lg tracking-[0.22em] text-paper-muted">chez Jeynnifer</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-paper-muted" data-reveal>
              <li className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-peach" /> {long}</li>
              <li className="flex items-center gap-2"><ClockIcon className="h-4 w-4 text-peach" /> {event.doors} → {event.endLabel}</li>
              <li className="flex items-center gap-2"><PinIcon className="h-4 w-4 text-peach" /> {event.venue.name}{event.venue.revealedAfterBooking ? " · adresse après paiement" : ""}</li>
            </ul>
            {event.note && <p className="mt-3 max-w-2xl text-sm text-paper-dim">{event.note}</p>}
          </div>
        </header>

        <div className="mt-12">
          {!event.salesOpen && event.salesOpenAt ? (
            <SalesSoon event={event} opensAt={event.salesOpenAt} />
          ) : event.remaining <= 0 ? (
            <p className="rounded-[1.4rem] border border-line bg-night-2 p-10 text-center text-paper-muted">
              Cette soirée affiche complet. <Link href="/evenements" className="text-peach underline">Voir les prochaines</Link>
            </p>
          ) : (
            <BookingForm event={event} />
          )}
        </div>
      </div>
    </main>
  );
}
