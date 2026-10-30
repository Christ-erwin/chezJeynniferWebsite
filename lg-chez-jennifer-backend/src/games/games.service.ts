import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { JsonCollection } from '../common/json-collection.js';
import { ROLE_IDS, WINNERS, type Game, type GameState, type Player, type RoleId, type ScreenGame, type Winner } from './game.types.js';

const MAX_PLAYERS = 40;
const newId = () => randomBytes(6).toString('hex');

function cleanPhoto(v: unknown): string | undefined {
  if (typeof v !== 'string' || !v) return undefined;
  if (/^media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(v) || /^\/images\/[\w.-]+$/.test(v) || (v.startsWith('https://') && v.length < 500)) return v;
  throw new BadRequestException('Photo invalide.');
}

@Injectable()
export class GamesService {
  private readonly store = new JsonCollection<Game>(process.env.GAMES_FILE ?? 'data/games.json');

  list() {
    return this.store
      .all()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((g) => ({
        id: g.id,
        title: g.title,
        eventId: g.eventId,
        status: g.status,
        winner: g.winner,
        players: g.players.length,
        alive: g.players.filter((p) => !p.eliminatedAt).length,
        ready: g.players.filter((p) => p.name.trim() && p.role).length,
        updatedAt: g.updatedAt,
      }));
  }

  get(id: string): Game {
    const g = this.store.get(id);
    if (!g) throw new NotFoundException('Partie introuvable.');
    return g;
  }

  state(id: string): GameState {
    const g = this.get(id);
    return {
      id: g.id,
      rev: g.rev,
      status: g.status,
      winner: g.winner,
      updatedAt: g.updatedAt,
      chiefId: g.chiefId,
      chiefAt: g.chiefAt,
      introAt: g.introAt,
      eliminated: g.players.filter((p) => p.eliminatedAt).map((p) => ({ id: p.id, at: p.eliminatedAt! })),
      revived: g.players.filter((p) => p.revivedAt).map((p) => ({ id: p.id, at: p.revivedAt! })),
    };
  }

  /** Écran public : jamais le rôle d'un joueur encore en vie. */
  screen(id: string): ScreenGame {
    const g = this.get(id);
    const ended = g.status === 'ended';
    return {
      id: g.id,
      title: g.title,
      status: g.status,
      winner: g.winner,
      rev: g.rev,
      updatedAt: g.updatedAt,
      chiefId: g.chiefId,
      chiefAt: g.chiefAt,
      introAt: g.introAt,
      players: g.players.map((p) => ({
        id: p.id,
        name: p.name,
        photo: p.photo,
        feminine: p.feminine,
        eliminatedAt: p.eliminatedAt,
        revivedAt: p.revivedAt,
        role: p.eliminatedAt || ended ? p.role : null,
      })),
    };
  }

  create(raw: { title?: unknown; eventId?: unknown; count?: unknown }): Promise<Game> {
    const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim().slice(0, 80) : 'Partie de Loup-Garou';
    const count = Number(raw.count ?? 12);
    if (!Number.isInteger(count) || count < 3 || count > MAX_PLAYERS) throw new BadRequestException(`Entre 3 et ${MAX_PLAYERS} joueurs.`);
    const now = new Date().toISOString();
    const game: Game = {
      id: newId(),
      title,
      eventId: typeof raw.eventId === 'string' && raw.eventId ? raw.eventId : undefined,
      status: 'setup',
      players: Array.from({ length: count }, () => ({ id: newId(), name: '', role: null })),
      rev: 1,
      createdAt: now,
      updatedAt: now,
    };
    return this.store.mutate(() => {
      this.store.set(game);
      return game;
    });
  }

  /** Composition (titre, joueurs, photos, rôles). Les éliminations sont conservées. */
  update(id: string, raw: { title?: unknown; eventId?: unknown; players?: unknown }): Promise<Game> {
    if (!Array.isArray(raw.players) || raw.players.length < 1 || raw.players.length > MAX_PLAYERS) {
      throw new BadRequestException(`Entre 1 et ${MAX_PLAYERS} joueurs.`);
    }
    const seen = new Set<string>();
    const incoming = (raw.players as Record<string, unknown>[]).map((p, i): Omit<Player, 'eliminatedAt'> => {
      const pid = typeof p.id === 'string' && /^[a-f0-9]{12}$/.test(p.id) && !seen.has(p.id) ? p.id : newId();
      seen.add(pid);
      const role = p.role === null || p.role === '' || p.role === undefined ? null : (p.role as RoleId);
      if (role && !ROLE_IDS.includes(role)) throw new BadRequestException(`Joueur ${i + 1} : rôle inconnu.`);
      return {
        id: pid,
        name: typeof p.name === 'string' ? p.name.trim().slice(0, 40) : '',
        photo: cleanPhoto(p.photo),
        role,
        feminine: p.feminine === true,
      };
    });
    return this.store.mutate(() => {
      const g = this.get(id);
      const before = new Map(g.players.map((p) => [p.id, p]));
      const next: Game = {
        ...g,
        title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim().slice(0, 80) : g.title,
        eventId: typeof raw.eventId === 'string' ? raw.eventId || undefined : g.eventId,
        players: incoming.map((p) => ({ ...p, eliminatedAt: before.get(p.id)?.eliminatedAt, revivedAt: before.get(p.id)?.revivedAt })),
        // le chef retiré de la partie perd son titre
        ...(g.chiefId && !incoming.some((p) => p.id === g.chiefId) ? { chiefId: undefined, chiefAt: undefined } : {}),
        rev: g.rev + 1,
        updatedAt: new Date().toISOString(),
      };
      this.store.set(next);
      return next;
    });
  }

  private patch(id: string, fn: (g: Game) => Partial<Game>): Promise<GameState> {
    return this.store.mutate(() => {
      const g = this.get(id);
      this.store.set({ ...g, ...fn(g), updatedAt: new Date().toISOString() });
      return this.state(id);
    });
  }

  eliminate(id: string, playerId: unknown): Promise<GameState> {
    return this.patch(id, (g) => {
      const p = g.players.find((x) => x.id === playerId);
      if (!p) throw new NotFoundException('Joueur introuvable.');
      if (!p.role) throw new BadRequestException(`${p.name || 'Ce joueur'} n'a pas de rôle : complète la composition.`);
      if (g.status === 'ended') throw new BadRequestException('La partie est terminée.');
      const at = new Date().toISOString();
      return { status: 'live', players: g.players.map((x) => (x.id === p.id && !x.eliminatedAt ? { ...x, eliminatedAt: at } : x)) };
    });
  }

  /**
   * Retour en jeu. `resurrect` : vraie résurrection annoncée sur l'écran
   * (animation) ; sinon simple correction d'une élimination faite par erreur.
   */
  revive(id: string, playerId: unknown, resurrect = false): Promise<GameState> {
    return this.patch(id, (g) => {
      const p = g.players.find((x) => x.id === playerId);
      if (!p) throw new NotFoundException('Joueur introuvable.');
      if (resurrect && !p.eliminatedAt) throw new BadRequestException(`${p.name || 'Ce joueur'} est déjà en vie.`);
      if (resurrect && g.status === 'ended') throw new BadRequestException('La partie est terminée.');
      const at = new Date().toISOString();
      return {
        players: g.players.map((x) => (x.id === p.id ? { ...x, eliminatedAt: undefined, ...(resurrect ? { revivedAt: at } : {}) } : x)),
      };
    });
  }

  /** Élection du chef du village (null : retirer le titre). */
  chief(id: string, playerId: unknown): Promise<GameState> {
    return this.patch(id, (g) => {
      if (playerId === null || playerId === '') return { chiefId: undefined, chiefAt: undefined };
      const p = g.players.find((x) => x.id === playerId);
      if (!p) throw new NotFoundException('Joueur introuvable.');
      if (p.eliminatedAt) throw new BadRequestException(`${p.name || 'Ce joueur'} est éliminé : il ne peut pas être élu chef.`);
      if (g.status === 'ended') throw new BadRequestException('La partie est terminée.');
      return { chiefId: p.id, chiefAt: new Date().toISOString(), status: g.status === 'setup' ? 'live' : g.status };
    });
  }

  /** Lance la partie : les écrans jouent la cinématique d'introduction (aussi pour la rejouer). */
  start(id: string): Promise<GameState> {
    return this.patch(id, (g) => {
      if (g.status === 'ended') throw new BadRequestException('La partie est terminée : relance-la avec « Rejouer ».');
      if (g.players.some((p) => !p.role)) throw new BadRequestException('Tous les joueurs doivent avoir un rôle avant le lancement.');
      return { status: 'live', introAt: new Date().toISOString() };
    });
  }

  finish(id: string, winner: unknown): Promise<GameState> {
    if (!WINNERS.includes(winner as Winner)) throw new BadRequestException('Camp gagnant invalide.');
    return this.patch(id, () => ({ status: 'ended', winner: winner as Winner }));
  }

  /** Rejouer avec la même composition. */
  reset(id: string): Promise<GameState> {
    return this.patch(id, (g) => ({
      status: 'setup',
      winner: undefined,
      chiefId: undefined,
      chiefAt: undefined,
      introAt: undefined,
      players: g.players.map((p) => ({ ...p, eliminatedAt: undefined, revivedAt: undefined })),
    }));
  }

  remove(id: string): Promise<void> {
    return this.store.mutate(() => {
      this.get(id);
      this.store.delete(id);
    });
  }
}
