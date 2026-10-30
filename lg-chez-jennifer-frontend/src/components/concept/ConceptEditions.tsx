import Link from "next/link";
import type { Concept } from "@/lib/catalog";
import { fetchUpcomingEvents } from "@/lib/events";
import { EventCard } from "@/components/events/EventCard";
import { PaymentBadges } from "@/components/PaymentBadges";
import { whatsappLink } from "@/lib/site";

/** Les prochaines éditions d'un univers + l'appel à réserver. */
export async function ConceptEditions({
  concept,
  title,
  kicker = "Prochaines dates",
  className = "",
}: {
  concept: Concept;
  title: string;
  kicker?: string;
  className?: string;
}) {
  const events = await fetchUpcomingEvents(concept.slug);
  return (
    <section id="billetterie" className={`relative py-24 sm:py-32 ${className}`}>
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="t-label" style={{ color: concept.accent }} data-reveal>
              {kicker}
            </p>
            <h2 className="t-display mt-4 max-w-2xl text-5xl text-paper sm:text-6xl" data-split>
              {title}
            </h2>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-paper-muted sm:items-end" data-reveal>
            <span>Paiement en ligne, sur ton téléphone</span>
            <PaymentBadges />
          </div>
        </div>

        {events.length > 0 ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-stagger>
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-[1.4rem] border border-line bg-night-2/80 p-10 text-center" data-reveal>
            <p className="t-display text-3xl text-paper">La prochaine date se prépare.</p>
            <p className="mx-auto mt-3 max-w-md text-paper-muted">
              Laisse-nous ton numéro sur WhatsApp : tu seras parmi les premiers prévenus.
            </p>
            <a
              href={whatsappLink(`Bonjour ! Préviens-moi de la prochaine ${concept.displayName} chez Jeynnifer.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-full bg-peach px-7 py-3.5 font-semibold text-cacao"
            >
              Me prévenir
            </a>
          </div>
        )}

        <p className="mt-8 text-sm text-paper-dim">
          Une autre envie ?{" "}
          <Link href="/evenements" className="text-paper underline decoration-peach/50 underline-offset-4 hover:text-peach">
            Voir tout le calendrier
          </Link>
        </p>
      </div>
    </section>
  );
}
