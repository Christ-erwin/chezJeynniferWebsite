import type { Metadata } from "next";
import Image from "next/image";
import { getConcept, formatPrice } from "@/lib/catalog";
import { fetchUpcomingEvents } from "@/lib/events";
import { OpenAirScreen } from "@/components/cine/OpenAirScreen";
import { FilmStrip } from "@/components/cine/FilmStrip";
import { ConceptEditions } from "@/components/concept/ConceptEditions";
import { StickyPass } from "@/components/concept/StickyPass";
import { Faq } from "@/components/Faq";
import { StringLights } from "@/components/ui";

const concept = getConcept("cine-lune")!;

export const metadata: Metadata = {
  title: "CinéLune — cinéma en plein air",
  description:
    "CinéLune chez Jeynnifer : cinéma en plein air à Abidjan. Un film choisi avec soin, poufs, plaids, popcorn et guirlandes lumineuses. Réserve ta place, paiement Wave ou Orange Money.",
  openGraph: { images: ["/images/og/cine-garden.jpg"] },
};

export const revalidate = 30;

const COZY = [
  { title: "Poufs, plaids & coussins", text: "Tu t'installes comme dans ton salon — en mieux, et sous les étoiles.", icon: "M8 30c0-6 7-10 16-10s16 4 16 10v6H8v-6ZM12 36v4M36 36v4M14 20c0-4 4-8 10-8s10 4 10 8" },
  { title: "Popcorn & boissons", text: "Le popcorn est chaud, les boissons sont fraîches. Le reste, c'est le film.", icon: "M14 16h20l-3 26H17L14 16ZM19 16l1 26M29 16l-1 26M14 16a4 4 0 0 1 4-6 5 5 0 0 1 6-2 5 5 0 0 1 6 2 4 4 0 0 1 4 6" },
  { title: "En plein air", text: "Selon les éditions, un jardin, des arbres, des guirlandes… et la lune au-dessus de l'écran.", icon: "M30 8a12 12 0 1 0 8 21A10 10 0 0 1 30 8ZM8 42h32M14 42V30M34 42V32" },
  { title: "Un film choisi avec soin", text: "Grands classiques, films cultes, animés : annoncé une semaine avant chaque séance.", icon: "M8 14h32v22H8V14ZM8 20h32M8 30h32M14 14v22M34 14v22" },
];

const FAQ = [
  { q: "Quel film sera projeté ?", a: "Le film de chaque séance est annoncé environ une semaine avant sur nos réseaux et par WhatsApp aux personnes qui ont réservé." },
  { q: "Et s'il pleut ?", a: "Pour les séances en plein air, un plan B couvert est prévu. En cas d'annulation de notre part, tu es remboursé·e ou reporté·e." },
  { q: "Je peux venir seul·e ou en couple ?", a: "Les deux ! Le Pass Duo est pensé pour venir à deux. Et seul·e, tu seras vite entouré·e : on se parle beaucoup avant et après le film." },
  { q: "Le popcorn est inclus ?", a: "Oui, un popcorn est offert avec chaque pass. Boissons et snacks supplémentaires sont disponibles sur place." },
];

export default async function CineLunePage() {
  const prices = (await fetchUpcomingEvents("cine-lune")).flatMap((e) => e.tiers.map((t) => t.price));
  const from = prices.length ? formatPrice(Math.min(...prices)) : undefined;

  return (
    <main id="contenu" className="bg-[#0b0a10]">
      <OpenAirScreen />

      <section id="seance" className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,192,255,0.12),transparent_65%)] blur-2xl" />
        <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
          <p className="t-label text-moon" data-reveal>{concept.kicker}</p>
          <h2 className="t-display mt-4 max-w-4xl text-5xl text-paper sm:text-7xl" data-split>
            Une séance de cinéma transformée en moment partagé.
          </h2>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-paper-muted" data-reveal>{concept.description}</p>
        </div>
        <div className="mt-16">
          <FilmStrip />
        </div>
      </section>

      <section className="relative py-24 sm:py-32">
        <StringLights className="absolute inset-x-0 top-0 h-16 opacity-80" count={26} sag={0.5} />
        <div className="mx-auto grid max-w-[1400px] gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem]" data-reveal-img>
            <Image src="/images/cine-garden.jpg" alt="Cinéma en plein air dans un jardin, poufs et guirlandes lumineuses" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover object-[35%_50%]" />
            <div className="absolute inset-0 bg-linear-to-t from-[#0b0a10]/80 via-transparent to-transparent" />
            <p className="t-script absolute bottom-6 left-6 text-4xl text-paper">sous les étoiles…</p>
          </div>
          <div>
            <p className="t-label text-moon" data-reveal>L&apos;ambiance cozy</p>
            <h2 className="t-display mt-4 text-5xl text-paper sm:text-6xl" data-split>Tout est pensé pour que tu sois bien.</h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2" data-stagger>
              {COZY.map((c) => (
                <li key={c.title} className="rounded-[1.2rem] border border-moon/15 bg-moon/[0.04] p-6">
                  <svg viewBox="0 0 48 48" className="h-10 w-10 text-moon" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={c.icon} />
                  </svg>
                  <h3 className="t-display mt-4 text-2xl text-paper">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper-muted">{c.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <ConceptEditions concept={concept} title="Ta prochaine séance sous les étoiles." kicker="Prochaines séances" className="bg-[radial-gradient(60%_50%_at_50%_0%,#17142a,#0b0a10_70%)]" />

      <section className="pb-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="t-label text-moon" data-reveal>Questions</p>
            <h2 className="t-display mt-4 text-5xl text-paper" data-split>Avant que les lumières s&apos;éteignent.</h2>
          </div>
          <Faq items={FAQ} accent="#c8c0ff" />
        </div>
      </section>

      <StickyPass label="CinéLune" from={from} accent="#c8c0ff" />
    </main>
  );
}
