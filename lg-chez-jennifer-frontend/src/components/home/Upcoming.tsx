import Image from "next/image";
import { fetchUpcomingEvents } from "@/lib/events";
import { EventsCarousel } from "@/components/events/EventsCarousel";
import { GhostButton, Heart } from "@/components/ui";

export async function Upcoming() {
  const events = await fetchUpcomingEvents();
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0" data-parallax="0.2">
        <Image src="/images/lg-scene.jpg" alt="" fill sizes="100vw" className="object-cover blur-[6px] brightness-[0.28] saturate-[1.2]" />
      </div>
      <div className="absolute inset-0 bg-linear-to-b from-night via-night/60 to-night" />

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="t-label text-peach" data-reveal>Prochains événements</p>
            <h2 className="t-display mt-4 max-w-2xl text-5xl text-paper sm:text-6xl" data-split>
              Ne manque pas nos prochaines soirées
            </h2>
            <Heart className="mt-4 text-peach" />
          </div>
          <div data-reveal>
            <GhostButton href="/evenements">Voir tous les événements</GhostButton>
          </div>
        </div>
        <div className="mt-12" data-reveal>
          <EventsCarousel events={events} />
        </div>
      </div>
    </section>
  );
}
