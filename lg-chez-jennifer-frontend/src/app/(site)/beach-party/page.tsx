import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getConcept, formatPrice, dateParts, IMAGE_ALT } from "@/lib/catalog";
import { fetchUpcomingEvents } from "@/lib/events";
import { SunsetHero } from "@/components/beach/SunsetHero";
import { DayTimeline } from "@/components/beach/DayTimeline";
import { Confessional } from "@/components/beach/Confessional";
import { ConceptEditions } from "@/components/concept/ConceptEditions";
import { StickyPass } from "@/components/concept/StickyPass";
import { Faq } from "@/components/Faq";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

const concept = getConcept("beach-party")!;

export const metadata: Metadata = {
  title: "Beach Party — 24 h d'aventure à la plage",
  description:
    "Jeynnifer Beach Party : départ d'Abidjan le samedi, balade en bateau, jeux d'enfance, barbecue, DJ, Loup-Garou au feu de camp, cinéma en plein air et nuit sur place à Assinie. Réserve ta place, paiement Wave ou Orange Money.",
  openGraph: { images: ["/images/bp-sunset.jpg"] },
};

export const revalidate = 30;

const GAMES = [
  "La balle au prisonnier",
  "Course en sac",
  "Course à l'œuf et à la cuillère",
  "Solé molé",
  "Bataille d'eau",
  "Bicici",
  "Course à trois jambes",
  "Attention numéro",
  "Tir à la corde",
  "Course de relais",
  "Beach-volley",
  "Le jeu de la bouteille",
];

const NIGHT = [
  { title: "Sunset Party", text: "Le soleil plonge dans la mer, le DJ prend le relais. On danse les pieds dans le sable." },
  { title: "Barbecue du soir", text: "Grillades, rires et assiettes partagées autour des tables, à la lumière des guirlandes." },
  { title: "Loup-Garou au feu de camp", text: "Le fameux Loup-Garou de Jeynnifer, version plage : les flammes, la nuit, et des loups parmi nous.", href: "/loup-garou" },
  { title: "Cinéma sous les étoiles", text: "Un film de notre enfance qui a marqué toute une génération, projeté face à la mer.", href: "/cine-lune" },
];

const RUBRIQUES = ["Le Journal de l'aventure", "Les Confidences", "La Minute Vérité", "Le Bêtisier", "Le Réveil", "Le Montage final"];

const INCLUDED = [
  "Transport aller-retour en car",
  "Balade et visite en bateau",
  "Accès au site et espace de repos",
  "Buffet du midi",
  "Jeux et activités toute la journée",
  "Ambiance DJ",
  "Barbecue du soir",
  "Loup-Garou autour du feu de camp",
  "Cinéma en plein air",
  "Pack personnalisé offert",
];

const POSTERS = [
  { src: "/images/bp-affiche-noel.jpg", alt: "Affiche : Les Soirées chez Jeynnifer, Spéciale Noël à Assinie" },
  { src: "/images/bp-affiche-infos.jpg", alt: IMAGE_ALT["/images/bp-affiche-infos.jpg"] },
  { src: "/images/bp-affiche-enfance.jpg", alt: "Affiche : Retour en enfance, les jeux de notre enfance" },
  { src: "/images/bp-affiche-feu.jpg", alt: "Affiche : le fameux Loup-Garou et le cinéma en plein air" },
  { src: "/images/bp-affiche-pack.jpg", alt: "Affiche : le pack personnalisé, t-shirt et crop top" },
];

const FAQ = [
  {
    q: "Comment se passent le départ et le retour ?",
    a: "On part ensemble en car depuis Abidjan le samedi à 10h ; le point de rendez-vous exact est envoyé par WhatsApp aux participants. Le dimanche, départ du site vers 10h, puis retour en car et dépose à Abidjan.",
  },
  { q: "Où dort-on ?", a: "Sur place : des chambres et espaces de couchage adaptés sont prévus pour la nuit, et un espace de repos reste accessible pendant toute la soirée." },
  { q: "Je peux venir seul·e ?", a: "Oui ! À ta réservation, tu es tiré·e au sort dans l'une des 4 équipes (rouge, bleue, verte, jaune) de 4 filles et 4 garçons. Tu arrives seul·e, tu repars avec une équipe." },
  { q: "Comment sont faites les équipes ?", a: "32 places : 16 filles et 16 garçons. Dès que ton paiement est confirmé, le site te place au hasard dans une équipe qui a encore de la place. Ta couleur s'affiche sur ton billet et dans l'e-mail de confirmation." },
  { q: "Peut-on se baigner ?", a: "En journée, oui, en suivant les consignes de l'équipe sur place. Les baignades de nuit sont interdites sans encadrement." },
  {
    q: "Est-ce que je serai filmé·e ?",
    a: "L'aventure est filmée pour TikTok, Instagram et YouTube, et tu en es informé·e avant. Les interviews et les portraits ne sont utilisés qu'avec ton accord explicite, et si tu préfères rester hors champ, une solution est prévue.",
  },
  { q: "C'est quoi, le pack personnalisé ?", a: "Chaque participant qui achète son billet en ligne reçoit un pack Les Soirées chez Jeynnifer : t-shirt noir pour les garçons ; t-shirt noir ou crop top noir, au choix, pour les filles." },
];

export default async function BeachPartyPage() {
  const events = await fetchUpcomingEvents("beach-party");
  const prices = events.flatMap((e) => e.tiers.map((t) => t.price));
  const from = prices.length ? formatPrice(Math.min(...prices)) : undefined;
  const nextEvent = events[0];
  const next = nextEvent
    ? { label: `${nextEvent.title.replace(/^Beach Party\s*·\s*/, "")} — ${dateParts(nextEvent.startISO).long}`, href: "#billetterie" }
    : undefined;

  return (
    <main id="contenu" className="bg-dusk">
      <SunsetHero next={next} />

      {/* l'idée */}
      <section id="concept" className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,154,82,0.14),transparent_65%)] blur-2xl" />
        <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
          <p className="t-label text-sunset" data-reveal>Une aventure de 24 heures</p>
          <h2 className="t-display mt-4 max-w-4xl text-5xl text-paper sm:text-7xl" data-split>
            On part ensemble. On vit tout ensemble. On rentre avec des souvenirs.
          </h2>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-paper-muted" data-reveal>{concept.description}</p>
          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[1.4rem] border border-line bg-line lg:grid-cols-4" data-stagger>
            {[
              ["24 h", "d'aventure, du samedi au dimanche"],
              ["1 nuit", "sur place, face à la mer"],
              ["Assinie", "pour la première édition"],
              ["0 souci", "transport, repas et activités compris"],
            ].map(([n, l]) => (
              <div key={n} className="bg-dusk-2 p-6 sm:p-8">
                <dt className="t-display text-4xl text-sunset sm:text-5xl">{n}</dt>
                <dd className="mt-2 text-sm text-paper-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* le parcours */}
      <section id="parcours" className="relative py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.15fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="t-label text-sunset" data-reveal>Le parcours</p>
            <h2 className="t-display mt-4 text-5xl text-paper sm:text-6xl" data-split>Du lever au coucher du soleil… et jusqu&apos;au lendemain.</h2>
            <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-[1.4rem]" data-reveal-img>
              <Image src="/images/bp-sunset.jpg" alt="Coucher de soleil sur la plage, les vagues sur le sable" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-dusk/70 via-transparent to-transparent" />
              <p className="t-script absolute bottom-5 left-6 text-4xl text-paper">Assinie</p>
            </div>
          </div>
          <DayTimeline />
        </div>
      </section>

      {/* retour en enfance — la séquence de jour, lumineuse comme l'affiche */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#8fd0ec_0%,#c9ebf3_38%,#f3dcb0_78%,#e8cb96_100%)] py-24 text-cacao sm:py-32">
        <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="t-label text-cacao-muted" data-reveal>Le jour : jeux et défis</p>
            <h2 className="t-caps mt-4 text-[clamp(3rem,9vw,6rem)] leading-[0.92] text-cacao" data-split>
              Retour en <span className="text-[#c8262f]">enfance</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-cacao-muted" data-reveal>
              Et si, le temps d&apos;un week-end, on redevenait des enfants ? Une journée 100 % jeux, rires, défis et esprit de récréation, face à la mer.
            </p>
            <p className="t-script mt-6 -rotate-2 text-4xl text-[#c8262f]" data-reveal>Tous en équipe !</p>
          </div>

          {/* le tableau en bois des affiches */}
          <div className="rounded-[1.2rem] border-[10px] border-[#7a4a24] bg-[repeating-linear-gradient(180deg,#a36a3a_0_34px,#94602f_34px_36px)] p-4 shadow-[0_30px_60px_-25px_rgba(60,30,10,0.7)] sm:p-6" data-reveal="scale">
            <p className="t-caps mb-4 text-center text-xl tracking-[0.12em] text-[#ffe08a] [text-shadow:0_2px_0_rgba(60,30,10,0.6)]">Les jeux de notre enfance</p>
            <ol className="grid gap-2.5 sm:grid-cols-2" data-stagger>
              {GAMES.map((g, i) => (
                <li key={g} className="flex items-center gap-3 rounded-md bg-[#fbf3e4] px-3 py-2.5 shadow-[0_2px_0_rgba(60,30,10,0.35)]" style={{ rotate: `${((i % 3) - 1) * 0.6}deg` }}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c8262f] text-xs font-bold text-white">{i + 1}</span>
                  <span className="font-semibold italic text-cacao">{g}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* la nuit */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,120,60,0.18),transparent_65%)] blur-2xl" />
        <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
          <p className="t-label text-sunset" data-reveal>La nuit</p>
          <h2 className="t-display mt-4 max-w-3xl text-5xl text-paper sm:text-6xl" data-split>Quand le soleil se couche, la fête commence.</h2>
          <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="relative min-h-[360px] overflow-hidden rounded-[1.4rem]" data-reveal-img>
              <Image src="/images/bp-feu.jpg" alt="Feu de camp sur la plage, lanternes et poufs" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
              <div className="anim-flicker pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_40%,rgba(255,150,60,0.25),transparent_70%)]" />
              <div className="absolute inset-0 bg-linear-to-t from-dusk/80 via-transparent to-transparent" />
              <p className="t-script absolute bottom-5 left-6 text-4xl text-paper">autour du feu…</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2" data-stagger>
              {NIGHT.map((n) => {
                const body = (
                  <>
                    <h3 className="t-display text-2xl text-paper">{n.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-paper-muted">{n.text}</p>
                    {n.href && (
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sunset">
                        Découvrir l&apos;univers <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={n.title}>
                    {n.href ? (
                      <Link href={n.href} className="group block h-full rounded-[1.2rem] border border-sunset/20 bg-sunset/[0.05] p-6 transition-colors hover:border-sunset/50">
                        {body}
                      </Link>
                    ) : (
                      <div className="h-full rounded-[1.2rem] border border-sunset/20 bg-sunset/[0.05] p-6">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* le confessionnal */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="t-label text-sunset" data-reveal>Notre signature</p>
            <h2 className="t-display mt-4 text-5xl text-paper sm:text-6xl" data-split>Le Confessionnal.</h2>
            <p className="mt-6 max-w-lg leading-relaxed text-paper-muted" data-reveal>
              Comme dans les téléréalités : un fauteuil, une caméra, une lumière, et toi. À chaque étape, tu viens raconter une rencontre, une surprise, une
              stratégie de jeu, une victoire ou un fou rire. Des prises de parole spontanées et bienveillantes, qui deviennent le fil de l&apos;histoire.
            </p>
            <ul className="mt-8 flex flex-wrap gap-2" data-stagger>
              {RUBRIQUES.map((r) => (
                <li key={r} className="rounded-full border border-line-strong px-4 py-2 text-sm text-paper-muted">{r}</li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-paper-dim" data-reveal>
              À retrouver ensuite sur TikTok, Instagram et YouTube. Ton image n&apos;est utilisée qu&apos;avec ton accord, et tu peux choisir de rester hors champ.
            </p>
          </div>
          <div data-reveal="scale">
            <Confessional />
          </div>
        </div>
      </section>

      {/* ce que comprend le pass */}
      <section className="relative overflow-hidden bg-[radial-gradient(70%_60%_at_80%_20%,#3a1a2c,#150c1f_70%)] py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="t-label text-sunset" data-reveal>Tout est compris</p>
            <h2 className="t-display mt-4 text-5xl text-paper sm:text-6xl" data-split>Tu viens. On s&apos;occupe du reste.</h2>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2" data-stagger>
              {INCLUDED.map((i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-line bg-dusk/60 px-4 py-3 text-paper">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-sunset" /> {i}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-lg text-sm text-paper-muted" data-reveal>
              Le pack personnalisé Les Soirées chez Jeynnifer : un t-shirt noir pour les garçons, un t-shirt ou un crop top noir au choix pour les filles, offert à chaque participant qui réserve en ligne.
            </p>
          </div>
          <div className="relative mx-auto aspect-[9/16] w-full max-w-[380px] rotate-2 overflow-hidden rounded-[1.4rem] border border-line-strong shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]" data-reveal="scale">
            <Image src="/images/bp-affiche-pack.jpg" alt="Le pack personnalisé : t-shirt noir, et crop top noir au choix pour les filles" fill sizes="380px" className="object-cover" />
          </div>
        </div>
      </section>

      {/* les affiches de l'édition */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <p className="t-label text-sunset" data-reveal>Spéciale Noël</p>
          <h2 className="t-display mt-4 text-5xl text-paper" data-split>Les affiches de l&apos;édition.</h2>
        </div>
        <ul tabIndex={0} aria-label="Galerie des affiches, faire défiler horizontalement" className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto focus-visible:outline-2 focus-visible:outline-peach px-5 pb-4 sm:px-8 lg:px-[max(2rem,calc((100vw-1400px)/2+2rem))]" data-stagger>
          {POSTERS.map((p) => (
            <li key={p.src} className="relative aspect-[9/16] w-[68vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-[1.2rem] border border-line">
              <Image src={p.src} alt={p.alt} fill sizes="300px" className="object-cover" />
            </li>
          ))}
        </ul>
      </section>

      <ConceptEditions concept={concept} title="Ta place pour la prochaine aventure." kicker="Prochaine édition" className="bg-[radial-gradient(60%_50%_at_50%_0%,#2a1430,#150c1f_70%)]" />

      <section className="pb-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="t-label text-sunset" data-reveal>Questions</p>
            <h2 className="t-display mt-4 text-5xl text-paper" data-split>Avant de faire ton sac.</h2>
          </div>
          <Faq items={FAQ} accent="#ff9a52" />
        </div>
      </section>

      <StickyPass label="Beach Party" from={from} accent="#ff9a52" />
    </main>
  );
}
