/**
 * Catalogue « Les Soirées chez Jeynnifer » — concepts, éditions, passes.
 *
 * Reflète le schéma backend (lg-chez-jennifer-backend/sql/schema.sql) :
 *   concept (products) → édition (event_instances) → pass (ticket_tiers)
 * Une édition peut réunir plusieurs concepts (ex. Halloween = Game Night,
 * Loup-Garou et CinéLune ; la Beach Party de Noël = plage, Loup-Garou et ciné).
 *
 * Les concepts (identité des 4 univers) sont fixes et vivent ici.
 * Les éditions (dates, lieux, tarifs, capacités) sont gérées dans l'espace
 * admin et lues via l'API : voir src/lib/events.ts.
 */

export type ConceptSlug = "game-night" | "loup-garou" | "cine-lune" | "beach-party";

export type Concept = {
  slug: ConceptSlug;
  number: string;
  name: string;
  /** Nom tel qu'affiché sur les visuels : "Soirée Loup-Garou" */
  displayName: string;
  kicker: string;
  tags: string[];
  pitch: string;
  description: string;
  accent: string;
  href: string;
  cover: string;
  gallery: string[];
};

export const CONCEPTS: Concept[] = [
  {
    slug: "game-night",
    number: "01",
    name: "Game Night",
    displayName: "Game Night",
    kicker: "Des jeux, des rires et des rencontres",
    tags: ["Jeux", "Fun", "Rencontres", "Bonne humeur"],
    pitch:
      "Des jeux, des rires, des défis et une ambiance de folie. La soirée parfaite pour s'amuser, rencontrer du monde et partager de bons moments.",
    description:
      "Plusieurs espaces, plusieurs jeux, plusieurs groupes : UNO, mimes, Devine mon dessin, Devine Tête, défis et jeux d'ambiance. On joue librement, on change de table, on rencontre du monde. L'objectif n'est pas de gagner — c'est de passer une bonne soirée.",
    accent: "#f0a04b",
    href: "/game-night",
    cover: "/images/gn-table.jpg",
    gallery: ["/images/gn-friends.jpg", "/images/gn-drinks.jpg", "/images/gn-jenga.jpg"],
  },
  {
    slug: "loup-garou",
    number: "02",
    name: "Loup-Garou",
    displayName: "Soirée Loup‑Garou",
    kicker: "Bluff, stratégie et suspense",
    tags: ["Stratégie", "Bluff", "Immersion", "Suspense"],
    pitch:
      "Plonge dans l'univers du célèbre jeu de rôle et fais preuve de stratégie, de persuasion et de beaucoup de sang-froid.",
    description:
      "L'expérience la plus immersive. Éditions en petit comité, places limitées, pour retrouver l'intensité du jeu : observer, mentir, enquêter, accuser, défendre son rôle, survivre. Qui est loup ? Qui dit la vérité ?",
    accent: "#b3141f",
    href: "/loup-garou",
    cover: "/images/lg-scene.jpg",
    gallery: ["/images/lg-cards.png", "/images/lg-group.png", "/images/lg-moon.jpg"],
  },
  {
    slug: "cine-lune",
    number: "03",
    name: "Ciné Lune",
    displayName: "CinéLune",
    kicker: "Des films, une ambiance cozy",
    tags: ["Cinéma", "Détente", "Plein air", "Expérience"],
    pitch:
      "Des films en plein air, une ambiance cozy et une expérience cinéma comme tu ne l'as jamais vécue.",
    description:
      "Un film ou un dessin animé soigneusement choisi, un cadre chaleureux — souvent en plein air —, des snacks, des lumières tamisées et un public réuni pour regarder ensemble et réagir ensemble. Le cinéma, autrement.",
    accent: "#c8c0ff",
    href: "/cine-lune",
    cover: "/images/cine-garden.jpg",
    gallery: ["/images/cine-popcorn.jpg", "/images/cine-small.jpg", "/images/cine-wide.jpg"],
  },
  {
    slug: "beach-party",
    number: "04",
    name: "Beach Party",
    displayName: "Beach Party",
    kicker: "Explorez le jour. Vibrez toute la nuit.",
    tags: ["Plage", "Aventure", "Jeux", "Nuit sur place"],
    pitch:
      "24 heures d'aventure à la plage : excursion en bateau, jeux d'enfance, barbecue, DJ, feu de camp, cinéma sous les étoiles et nuit sur place.",
    description:
      "On part ensemble d'Abidjan le samedi matin, on revient le dimanche. Entre les deux : balade en bateau et découverte des îles, jeux et défis en équipes, sunset, DJ, barbecue, Loup-Garou autour du feu de camp et cinéma en plein air. Et un confessionnal, façon téléréalité, pour raconter l'aventure de l'intérieur.",
    accent: "#ff9a52",
    href: "/beach-party",
    cover: "/images/bp-sunset.jpg",
    gallery: ["/images/bp-feu.jpg", "/images/bp-billets.jpg", "/images/bp-affiche-enfance.jpg"],
  },
];

export function getConcept(slug: string): Concept | undefined {
  return CONCEPTS.find((c) => c.slug === slug);
}

export type PassTier = {
  id: string;
  label: string;
  /** en FCFA (XOF) */
  price: number;
  /** nombre de places couvertes par un pass */
  seats: number;
  description: string;
  perks: string[];
};

export type EventPack = { label: string; styles: string[]; sizes: string[] };
export type PackChoice = { style: string; size: string };

/**
 * Une édition telle que publiée par l'API (GET /api/events).
 * Les éditions se gèrent dans l'espace admin (/admin/evenements).
 */
export type EventEdition = {
  id: string;
  title: string;
  subtitle: string;
  concepts: ConceptSlug[];
  /** ISO, heure d'Abidjan (UTC+0) */
  startISO: string;
  doors: string;
  endLabel: string;
  venue: { name: string; city: string; revealedAfterBooking: boolean };
  cover: string;
  capacity: number;
  /** places encore disponibles */
  remaining: number;
  tiers: PassTier[];
  note?: string;
  /** ouverture de la billetterie en ligne (ISO) — avant, l'édition est annoncée mais pas encore en vente */
  salesOpenAt?: string;
  /** pack offert : modèle et taille à choisir pour chaque place */
  pack?: EventPack;
  /** calculé à la lecture (lib/events.ts) : la billetterie est-elle ouverte ? */
  salesOpen: boolean;
};

/* -------------------------------------------------------------------------- */
/*  Formatage                                                                 */
/* -------------------------------------------------------------------------- */
const TZ = "Africa/Abidjan";

export function formatPrice(xof: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(xof).replace(/ | /g, " ")} FCFA`;
}

export function dateParts(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: TZ }).format(d);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: TZ })
    .format(d)
    .replace(".", "")
    .toUpperCase();
  const long = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
  return { day, month, long: long.charAt(0).toUpperCase() + long.slice(1) };
}

/** « lundi 16 novembre à 10h » */
export function salesOpenLabel(iso: string): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(d);
  const [h, m] = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(d).split(":");
  return `${day} à ${Number(h)}h${m === "00" ? "" : m}`;
}

export function conceptNames(slugs: ConceptSlug[]): string {
  return slugs.map((s) => getConcept(s)?.name ?? s).join(" · ");
}
