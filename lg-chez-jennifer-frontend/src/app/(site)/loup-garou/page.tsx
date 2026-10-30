import type { Metadata } from "next";
import Image from "next/image";
import { getConcept, formatPrice } from "@/lib/catalog";
import { fetchUpcomingEvents } from "@/lib/events";
import { WolfNight } from "@/components/lg/WolfNight";
import { RoleDeck } from "@/components/lg/RoleDeck";
import { NightCycle } from "@/components/lg/NightCycle";
import { ConceptEditions } from "@/components/concept/ConceptEditions";
import { StickyPass } from "@/components/concept/StickyPass";
import { Faq } from "@/components/Faq";

const concept = getConcept("loup-garou")!;

export const metadata: Metadata = {
  title: "Soirée Loup-Garou",
  description:
    "Soirée Loup-Garou chez Jeynnifer à Abidjan : petit comité, maître du jeu, rôles secrets. Bluff, stratégie et suspense. Réserve ta place, paiement Wave ou Orange Money.",
  openGraph: { images: ["/images/og/lg-scene.jpg"] },
};

export const revalidate = 30;

const FACTS = [
  { k: "Petit comité", v: "10 à 16 joueurs par table" },
  { k: "Un maître du jeu", v: "qui mène la nuit" },
  { k: "≈ 3 heures", v: "de parties enchaînées" },
  { k: "Zéro prérequis", v: "les règles sont expliquées" },
];

const FAQ = [
  { q: "Je n'ai jamais joué. C'est grave ?", a: "Pas du tout. Le maître du jeu explique tout au début, et la première partie sert d'échauffement. Beaucoup de nos joueurs découvrent le jeu chez nous." },
  { q: "On joue à combien ?", a: "Par tables de 10 à 16 joueurs, chacune avec son maître du jeu. C'est ce qui garde l'intensité : tout le monde joue vraiment." },
  { q: "Je viens seul·e, je vais jouer avec des inconnus ?", a: "Oui — et c'est le meilleur moyen de jouer : personne ne connaît les tics de personne. À la fin de la soirée, ce ne sont plus des inconnus." },
  { q: "C'est une soirée qui fait peur ?", a: "L'ambiance est immersive (lanternes, lumières tamisées, sons) mais on rit beaucoup. C'est un jeu de bluff, pas un film d'horreur." },
  { q: "Faut-il venir déguisé ?", a: "Pas obligatoire. Certaines éditions ont un thème (Halloween, pyjama…) : il est indiqué sur la date." },
];

export default async function LoupGarouPage() {
  const prices = (await fetchUpcomingEvents("loup-garou")).flatMap((e) => e.tiers.map((t) => t.price));
  const from = prices.length ? formatPrice(Math.min(...prices)) : undefined;

  return (
    <main id="contenu" className="bg-[#070404]">
      <WolfNight />

      {/* le jeu */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(200,38,47,0.18),transparent_65%)] blur-2xl" />
        <div className="relative mx-auto grid max-w-[1400px] gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="t-label text-wolf-bright" data-reveal>{concept.kicker}</p>
            <h2 className="t-display mt-4 text-5xl text-paper sm:text-7xl" data-split>
              Un village. Des loups cachés parmi vous. Une seule nuit pour les démasquer.
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-paper-muted" data-reveal>{concept.description}</p>
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[1.2rem] border border-line bg-line" data-stagger>
              {FACTS.map((f) => (
                <div key={f.k} className="bg-[#0d0707] p-5">
                  <dt className="t-display text-2xl text-paper">{f.k}</dt>
                  <dd className="mt-1 text-sm text-paper-dim">{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="grid h-[520px] grid-cols-5 grid-rows-6 gap-4 sm:h-[640px]">
            <div className="relative col-span-3 row-span-6 overflow-hidden rounded-[1.4rem]" data-reveal-img>
              <Image src="/images/lg-moon.jpg" alt="Loup hurlant devant la lune, lanterne allumée" fill sizes="(min-width:1024px) 30vw, 60vw" className="object-cover" />
            </div>
            <div className="relative col-span-2 row-span-3 overflow-hidden rounded-[1.4rem]" data-reveal-img>
              <Image src="/images/lg-cards.png" alt="Cartes du jeu Loup-Garou à la lueur d'une lanterne" fill sizes="25vw" className="object-cover" />
            </div>
            <div className="relative col-span-2 row-span-3 overflow-hidden rounded-[1.4rem]" data-reveal-img>
              <Image src="/images/lg-group.png" alt="Joueurs autour d'une table pendant une partie" fill sizes="25vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* tire ta carte */}
      <section id="roles" className="relative border-y border-line bg-[radial-gradient(70%_60%_at_70%_50%,#1a0608,#070404_70%)] py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <RoleDeck />
        </div>
      </section>

      {/* une nuit */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <p className="t-label text-wolf-bright" data-reveal>Le déroulé</p>
          <h2 className="t-display mt-4 max-w-3xl text-5xl text-paper sm:text-6xl" data-split>
            Une manche, quatre temps. Et ça recommence.
          </h2>
          <div className="mt-16">
            <NightCycle />
          </div>
        </div>
      </section>

      <ConceptEditions concept={concept} title="Rejoins la prochaine nuit au village." kicker="Places limitées" className="bg-[radial-gradient(60%_50%_at_50%_0%,#1f070a,#070404_70%)]" />

      <section className="pb-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="t-label text-wolf-bright" data-reveal>Questions</p>
            <h2 className="t-display mt-4 text-5xl text-paper" data-split>Avant d&apos;entrer dans le village.</h2>
          </div>
          <Faq items={FAQ} accent="#ff4552" />
        </div>
      </section>

      <StickyPass label="Soirée Loup-Garou" from={from} accent="#ff4552" />
    </main>
  );
}
