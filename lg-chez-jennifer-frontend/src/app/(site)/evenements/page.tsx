import type { Metadata } from "next";
import Image from "next/image";
import { getConcept, type ConceptSlug } from "@/lib/catalog";
import { fetchUpcomingEvents } from "@/lib/events";
import { EventsBrowser } from "@/components/events/EventsBrowser";
import { PaymentBadges } from "@/components/PaymentBadges";
import { StringLights } from "@/components/ui";

export const metadata: Metadata = {
  title: "Événements",
  description: "Toutes les prochaines soirées chez Jeynnifer : Game Night, Loup-Garou et CinéLune. Réserve ton pass, paiement Wave ou Orange Money.",
};

export const revalidate = 30;

export default async function EvenementsPage({ searchParams }: PageProps<"/evenements">) {
  const sp = await searchParams;
  const raw = typeof sp.soiree === "string" ? sp.soiree : undefined;
  const initial = raw && getConcept(raw) ? (raw as ConceptSlug) : undefined;
  const events = await fetchUpcomingEvents();

  return (
    <main id="contenu">
      <section className="relative overflow-hidden pb-16 pt-36 sm:pt-44">
        <div className="absolute inset-0" data-parallax="0.25">
          <Image src="/images/cine-wide.jpg" alt="" fill priority sizes="100vw" className="object-cover blur-[2px] brightness-[0.4]" />
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-night/40 via-night/70 to-night" />
        <StringLights className="absolute inset-x-0 top-0 h-20" count={24} sag={0.5} />
        <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
          <p className="t-label text-peach" data-reveal>Le calendrier</p>
          <h1 className="t-display mt-4 max-w-3xl text-6xl text-paper sm:text-8xl" data-split>
            Choisis ta prochaine soirée.
          </h1>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-paper-muted" data-reveal>
            <span>Réservation en ligne, places limitées.</span>
            <PaymentBadges />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8">
        <EventsBrowser events={events} initial={initial} />
      </section>
    </main>
  );
}
