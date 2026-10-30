"use client";

import { useRef } from "react";
import type { EventEdition } from "@/lib/catalog";
import { EventCard } from "./EventCard";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

export function EventsCarousel({ events }: { events: EventEdition[] }) {
  const track = useRef<HTMLDivElement>(null);
  const go = (dir: number) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 360) + 20), behavior: "smooth" });
  };

  if (events.length === 0) {
    return (
      <p className="rounded-[1.4rem] border border-line bg-night-2 p-10 text-center text-paper-muted">
        Les prochaines dates arrivent très vite. Suis-nous pour ne rien rater.
      </p>
    );
  }

  return (
    <div className="relative">
      <div
        ref={track}
        data-lenis-prevent-wheel
        className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-5 pb-4 [scrollbar-width:none] sm:-mx-8 sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {events.map((e) => (
          <div key={e.id} data-card className="w-[86%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
            <EventCard event={e} className="h-full" />
          </div>
        ))}
      </div>
      {events.length > 1 && (
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => go(-1)} aria-label="Éditions précédentes" className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong text-paper transition-colors hover:border-peach hover:text-peach">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Éditions suivantes" className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong text-paper transition-colors hover:border-peach hover:text-peach">
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
