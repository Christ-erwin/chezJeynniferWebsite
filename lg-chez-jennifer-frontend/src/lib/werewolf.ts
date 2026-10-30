import { API_BASE_URL } from "@/lib/api";

/**
 * Rôles de la Soirée Loup-Garou (mêmes identifiants que le backend :
 * lg-chez-jennifer-backend/src/games/game.types.ts).
 */
export type Camp = "loups" | "village" | "solitaire" | "ambigu";

export type RoleId =
  | "loup-garou"
  | "loup-garou-infect"
  | "grand-mechant-loup"
  | "loup-blanc"
  | "villageois"
  | "voyante"
  | "sorciere"
  | "chasseur"
  | "cupidon"
  | "petite-fille"
  | "deux-soeurs"
  | "enfant-sauvage"
  | "chien-loup";

export type WerewolfRole = {
  id: RoleId;
  name: string;
  /** forme féminine quand elle existe (Villageoise, Chasseuse) */
  feminine?: string;
  camp: Camp;
  text: string;
  /** rôle unique dans une partie (avertissement si plusieurs) */
  unique?: boolean;
};

export const ROLES: WerewolfRole[] = [
  { id: "loup-garou", name: "Loup-Garou", camp: "loups", text: "Chaque nuit, la meute choisit une victime." },
  { id: "loup-garou-infect", name: "Loup-Garou Infect", camp: "loups", unique: true, text: "Une fois par partie, il change la victime des loups en loup." },
  { id: "grand-mechant-loup", name: "Grand Méchant Loup", camp: "loups", unique: true, text: "Tant qu'aucun loup n'est mort, il dévore une victime de plus." },
  { id: "loup-blanc", name: "Loup Blanc", camp: "solitaire", unique: true, text: "Il chasse avec la meute… mais veut gagner seul." },
  { id: "villageois", name: "Villageois", feminine: "Villageoise", camp: "village", text: "Aucun pouvoir, sinon son flair et sa voix." },
  { id: "voyante", name: "Voyante", camp: "village", unique: true, text: "Chaque nuit, elle découvre le rôle d'un joueur." },
  { id: "sorciere", name: "Sorcière", camp: "village", unique: true, text: "Une potion de vie, une potion de mort." },
  { id: "chasseur", name: "Chasseur", feminine: "Chasseuse", camp: "village", unique: true, text: "En tombant, tire une dernière balle." },
  { id: "cupidon", name: "Cupidon", camp: "village", unique: true, text: "Lie deux amoureux, pour la vie et pour la mort." },
  { id: "petite-fille", name: "Petite Fille", camp: "village", unique: true, text: "Elle espionne les loups pendant la nuit." },
  { id: "deux-soeurs", name: "Deux Sœurs", camp: "village", text: "Elles se reconnaissent et complotent ensemble." },
  { id: "enfant-sauvage", name: "Enfant Sauvage", camp: "ambigu", unique: true, text: "S'il perd son modèle, il rejoint la meute." },
  { id: "chien-loup", name: "Chien-Loup", camp: "ambigu", unique: true, text: "Au premier soir, il choisit : chien fidèle ou loup." },
];

export const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<RoleId, WerewolfRole>;

export const CAMPS: Record<Camp, { label: string; color: string }> = {
  loups: { label: "Les Loups", color: "#ff4552" },
  village: { label: "Le Village", color: "#e9c48f" },
  solitaire: { label: "Solitaire", color: "#dfe6f2" },
  ambigu: { label: "Camp incertain", color: "#c8b3ff" },
};

export function roleName(id: RoleId, feminine?: boolean) {
  const r = ROLE_BY_ID[id];
  return feminine && r.feminine ? r.feminine : r.name;
}

export const WINNERS = [
  { id: "village", label: "Le Village", line: "Les loups sont démasqués. Le village peut enfin dormir.", color: "#e9c48f" },
  { id: "loups", label: "Les Loups-Garous", line: "La meute a dévoré le village. Personne n'a rien vu venir.", color: "#ff4552" },
  { id: "loup-blanc", label: "Le Loup Blanc", line: "Seul contre tous… et dernier debout.", color: "#dfe6f2" },
  { id: "amoureux", label: "Les Amoureux", line: "L'amour a triomphé de la nuit.", color: "#ff8fb1" },
] as const;
export type WinnerId = (typeof WINNERS)[number]["id"];

export type Player = {
  id: string;
  name: string;
  photo?: string;
  role: RoleId | null;
  feminine?: boolean;
  eliminatedAt?: string;
  revivedAt?: string;
};

export type Game = {
  id: string;
  title: string;
  eventId?: string;
  status: "setup" | "live" | "ended";
  winner?: WinnerId;
  players: Player[];
  chiefId?: string;
  chiefAt?: string;
  /** lancement : l'écran joue l'introduction quand cette date change */
  introAt?: string;
  rev: number;
  createdAt: string;
  updatedAt: string;
};

export type GameSummary = Pick<Game, "id" | "title" | "eventId" | "status" | "winner" | "updatedAt"> & {
  players: number;
  alive: number;
  ready: number;
};

export type GameState = Pick<Game, "id" | "rev" | "status" | "winner" | "updatedAt" | "chiefId" | "chiefAt" | "introAt"> & {
  eliminated: { id: string; at: string }[];
  revived: { id: string; at: string }[];
};

/** Points à vérifier dans une composition (avertissements, jamais bloquants). */
export function compositionWarnings(players: Player[]): string[] {
  const w: string[] = [];
  const count = (id: RoleId) => players.filter((p) => p.role === id).length;
  const missingName = players.filter((p) => !p.name.trim()).length;
  const missingRole = players.filter((p) => !p.role).length;
  const missingPhoto = players.filter((p) => !p.photo).length;
  if (missingName) w.push(`${missingName} joueur${missingName > 1 ? "s" : ""} sans nom.`);
  if (missingRole) w.push(`${missingRole} joueur${missingRole > 1 ? "s" : ""} sans rôle.`);
  if (missingPhoto) w.push(`${missingPhoto} joueur${missingPhoto > 1 ? "s" : ""} sans photo.`);
  const wolves = players.filter((p) => p.role && ROLE_BY_ID[p.role].camp === "loups").length;
  if (players.some((p) => p.role) && wolves === 0) w.push("Aucun loup dans la partie.");
  const sisters = count("deux-soeurs");
  if (sisters && sisters !== 2) w.push(`Les Deux Sœurs vont par deux (actuellement ${sisters}).`);
  for (const r of ROLES) if (r.unique && count(r.id) > 1) w.push(`${r.name} est attribué ${count(r.id)} fois.`);
  return w;
}

/** Nom du village de nos parties (cinématique d'introduction). */
export const VILLAGE = "Pkapkatokro";

/** Écran géant (public) : le rôle n'est fourni que pour les joueurs éliminés, ou en fin de partie. */
export type ScreenGame = Pick<Game, "id" | "title" | "status" | "winner" | "rev" | "updatedAt" | "chiefId" | "chiefAt" | "introAt"> & { players: Player[] };

export async function fetchScreen(id: string): Promise<ScreenGame | null> {
  const res = await fetch(`${API_BASE_URL}/games/${encodeURIComponent(id)}/screen`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return (await res.json()) as ScreenGame;
}
