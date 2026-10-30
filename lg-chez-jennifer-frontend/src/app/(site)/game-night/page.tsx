import type { Metadata } from "next";
import Image from "next/image";
import { getConcept, formatPrice } from "@/lib/catalog";
import { fetchUpcomingEvents } from "@/lib/events";
import { GameTable } from "@/components/gn/GameTable";
import { GameFan } from "@/components/gn/GameFan";
import { DiceChallenge } from "@/components/gn/DiceChallenge";
import { ConceptEditions } from "@/components/concept/ConceptEditions";
import { StickyPass } from "@/components/concept/StickyPass";
import { Faq } from "@/components/Faq";
import { StringLights } from "@/components/ui";

const concept = getConcept("game-night")!;

export const metadata: Metadata = {
  title: "Game Night",
  description:
    "Game Night chez Jeynnifer à Abidjan : UNO, mimes, Devine mon dessin, Devine Tête, quiz et défis. Plusieurs tables, cocktails et bonne humeur. Réserve ton pass en ligne.",
  openGraph: { images: ["/images/og/gn-table.jpg"] },
};

export const revalidate = 30;

const ZONES = [
  { title: "Tu arrives", text: "Un cocktail d'accueil, de la musique qui laisse parler, et une première table qui t'attend." },
  { title: "Tu circules", text: "Chaque table, son jeu. Tu restes, tu changes, tu suis l'ambiance — personne ne te demande de choisir." },
  { title: "Tu rencontres", text: "Les équipes se mélangent au fil des parties. Tu repars avec des fous rires… et des numéros." },
];

const FAQ = [
  { q: "Je ne connais personne, je viens quand même ?", a: "Bien sûr. Les tables se forment sur place et changent au fil de la soirée : c'est fait pour rencontrer du monde." },
  { q: "Je ne suis pas fort·e aux jeux…", a: "Personne ne compte les points. Les jeux sont simples, les règles expliquées, et on joue pour rire." },
  { q: "Il y a à boire et à manger ?", a: "Oui : cocktails, boissons et de quoi grignoter. La musique accompagne la soirée sans empêcher de discuter." },
  { q: "Je peux venir à deux ?", a: "Avec le Pass Duo, deux places à prix doux. Idéal entre amis ou en couple." },
];

export default async function GameNightPage() {
  const prices = (await fetchUpcomingEvents("game-night")).flatMap((e) => e.tiers.map((t) => t.price));
  const from = prices.length ? formatPrice(Math.min(...prices)) : undefined;

  return (
    <main id="contenu" className="bg-[#120b06]">
      <GameTable />

      {/* l'ambiance */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-end">
            <div>
              <p className="t-label text-game" data-reveal>{concept.kicker}</p>
              <h2 className="t-display mt-4 text-5xl text-paper sm:text-7xl" data-split>
                Une soirée où l&apos;on ne reste jamais assis bien longtemps.
              </h2>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3" data-stagger>
              {ZONES.map((z, i) => (
                <li key={z.title} className="rounded-[1.2rem] border border-game/20 bg-game/[0.05] p-6">
                  <span className="t-display text-5xl font-light text-game/70">{i + 1}</span>
                  <h3 className="t-display mt-3 text-2xl text-paper">{z.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper-muted">{z.text}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* collage photo */}
          <div className="mt-16 grid h-[70vh] min-h-[460px] grid-cols-6 grid-rows-6 gap-4">
            <div className="relative col-span-6 row-span-3 overflow-hidden rounded-[1.4rem] sm:col-span-4 sm:row-span-6" data-reveal-img>
              <Image src="/images/gn-friends.jpg" alt="Amies qui rient autour d'une table de jeux" fill sizes="(min-width:640px) 66vw, 100vw" className="object-cover" />
            </div>
            <div className="relative col-span-3 row-span-3 overflow-hidden rounded-[1.4rem] sm:col-span-2" data-reveal-img>
              <Image src="/images/gn-drinks.jpg" alt="Cocktails colorés à la lueur des bougies" fill sizes="33vw" className="object-cover" />
            </div>
            <div className="relative col-span-3 row-span-3 overflow-hidden rounded-[1.4rem] sm:col-span-2" data-reveal-img>
              <Image src="/images/gn-jenga.jpg" alt="Tour de bois en équilibre, partie de jeu d'adresse" fill sizes="33vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section id="jeux" className="relative border-y border-line bg-[radial-gradient(70%_60%_at_50%_60%,#2a1709,#120b06_70%)] py-24 lg:py-0">
        <GameFan />
      </section>

      <section className="relative overflow-hidden py-24 sm:py-32">
        <StringLights className="absolute inset-x-0 top-0 h-16 opacity-70" count={22} sag={0.4} color="#ffc979" />
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <DiceChallenge />
        </div>
      </section>

      <ConceptEditions concept={concept} title="Réserve ta place autour de la table." kicker="Prochaines Game Nights" className="bg-[radial-gradient(60%_50%_at_50%_0%,#24140a,#120b06_70%)]" />

      <section className="pb-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="t-label text-game" data-reveal>Questions</p>
            <h2 className="t-display mt-4 text-5xl text-paper" data-split>Avant de t&apos;asseoir à une table.</h2>
          </div>
          <Faq items={FAQ} accent="#f0a04b" />
        </div>
      </section>

      <StickyPass label="Game Night" from={from} accent="#f0a04b" />
    </main>
  );
}
