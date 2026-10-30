/** Rôles de la partie (l'ordre sert à l'affichage de la composition). */
export const ROLE_IDS = [
  'loup-garou',
  'loup-garou-infect',
  'grand-mechant-loup',
  'loup-blanc',
  'villageois',
  'voyante',
  'sorciere',
  'chasseur',
  'cupidon',
  'petite-fille',
  'deux-soeurs',
  'enfant-sauvage',
  'chien-loup',
] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export const WINNERS = ['village', 'loups', 'loup-blanc', 'amoureux'] as const;
export type Winner = (typeof WINNERS)[number];

export type GameStatus = 'setup' | 'live' | 'ended';

export type Player = {
  id: string;
  name: string;
  /** "media/<id>.jpg" (photo envoyée), "/images/…" ou URL https */
  photo?: string;
  role: RoleId | null;
  /** accorde le nom du rôle au féminin (Villageoise, Chasseuse) */
  feminine?: boolean;
  eliminatedAt?: string;
  /** dernière résurrection annoncée (l'écran joue l'animation quand elle change) */
  revivedAt?: string;
};

export type Game = {
  id: string;
  title: string;
  /** édition de la billetterie liée (facultatif) */
  eventId?: string;
  status: GameStatus;
  winner?: Winner;
  players: Player[];
  /** chef du village élu, et date de l'élection (l'écran joue l'animation quand elle change) */
  chiefId?: string;
  chiefAt?: string;
  /** lancement de la partie : l'écran joue la cinématique d'introduction quand cette date change */
  introAt?: string;
  /** incrémenté à chaque modification de la composition (les écrans rechargent) */
  rev: number;
  createdAt: string;
  updatedAt: string;
};

/** État léger, interrogé en continu par les écrans de jeu. */
export type GameState = Pick<Game, 'id' | 'rev' | 'status' | 'winner' | 'updatedAt' | 'chiefId' | 'chiefAt' | 'introAt'> & {
  eliminated: { id: string; at: string }[];
  revived: { id: string; at: string }[];
};

/** Vue publique (écran géant) : le rôle n'est transmis que pour les joueurs éliminés, ou en fin de partie. */
export type ScreenGame = Pick<Game, 'id' | 'title' | 'status' | 'winner' | 'rev' | 'updatedAt' | 'chiefId' | 'chiefAt' | 'introAt'> & {
  players: (Omit<Player, 'role'> & { role: RoleId | null })[];
};
