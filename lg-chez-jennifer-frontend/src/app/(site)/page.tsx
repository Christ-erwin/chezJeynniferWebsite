import { HomeHero } from "@/components/home/HomeHero";
import { Manifesto } from "@/components/home/Manifesto";
import { Concepts } from "@/components/home/Concepts";
import { Worlds } from "@/components/home/Worlds";
import { Upcoming } from "@/components/home/Upcoming";
import { HowToBook } from "@/components/home/HowToBook";
import { Faq, GENERAL_FAQ } from "@/components/Faq";

// la liste "à venir" dépend de la date du jour : on la régénère toutes les heures
export const revalidate = 3600;

export default function Home() {
  return (
    <main id="contenu">
      <HomeHero />
      <Manifesto />
      <Concepts />
      <Worlds />
      <Upcoming />
      <HowToBook />
      <section id="faq" className="bg-night py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="t-label text-peach" data-reveal>Questions fréquentes</p>
            <h2 className="t-display mt-4 text-5xl text-paper sm:text-6xl" data-split>
              Tout ce qu&apos;on nous demande avant de venir.
            </h2>
          </div>
          <Faq items={GENERAL_FAQ} />
        </div>
      </section>
    </main>
  );
}
