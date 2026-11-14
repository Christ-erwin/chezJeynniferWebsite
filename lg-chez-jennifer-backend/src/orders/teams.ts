import { randomInt } from 'node:crypto';
import type { EventRecord, Gender, TeamDef } from '../events/event.types.js';
import type { Ticket } from './order.types.js';

type Key = Gender | 'tous';

/**
 * Places par équipe et par sexe : quota du sexe ÷ nombre d'équipes, arrondi
 * au-dessus (ex. 16 filles / 4 équipes → 4 filles par équipe).
 * Sans quotas par sexe : capacité ÷ nombre d'équipes, tous sexes confondus.
 */
export function teamSlots(event: EventRecord): Record<Key, number> {
  const n = event.teams?.length ?? 1;
  return {
    fille: Math.ceil((event.genders?.fille ?? 0) / n),
    garcon: Math.ceil((event.genders?.garcon ?? 0) / n),
    tous: Math.ceil(event.capacity / n),
  };
}

/**
 * Tire au sort l'équipe de chaque nouveau billet parmi les équipes qui ont
 * encore de la place pour ce sexe. `existing` = billets déjà émis pour
 * l'édition (commandes payées). Les billets sont modifiés sur place.
 */
export function assignTeams(event: EventRecord, existing: Ticket[], fresh: Ticket[], rand: (n: number) => number = randomInt): void {
  const teams = event.teams;
  if (!teams?.length) return;
  const slots = teamSlots(event);
  const keyOf = (t: Ticket): Key => (event.genders && t.gender ? t.gender : 'tous');
  const count = new Map<string, number>();
  const bump = (team: TeamDef, key: Key) => count.set(`${team.name}|${key}`, (count.get(`${team.name}|${key}`) ?? 0) + 1);
  const used = (team: TeamDef, key: Key) => count.get(`${team.name}|${key}`) ?? 0;
  for (const t of existing) {
    const team = t.team && teams.find((x) => x.name === t.team!.name);
    if (team) bump(team, keyOf(t));
  }
  for (const t of fresh) {
    const key = keyOf(t);
    let pool = teams.filter((team) => used(team, key) < slots[key]);
    // complet (vente forcée par l'admin) : on vise les équipes les moins remplies
    if (pool.length === 0) {
      const min = Math.min(...teams.map((team) => used(team, key)));
      pool = teams.filter((team) => used(team, key) === min);
    }
    const team = pool[rand(pool.length)];
    t.team = { name: team.name, color: team.color };
    bump(team, key);
  }
}
