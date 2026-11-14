import { describe, expect, it } from 'vitest';
import { assignTeams, teamSlots } from './teams.js';
import type { EventRecord, Gender } from '../events/event.types.js';
import type { Ticket } from './order.types.js';

const TEAMS = [
  { name: 'Rouge', color: '#e3092b' },
  { name: 'Bleu', color: '#2f6fed' },
  { name: 'Vert', color: '#1fae5b' },
  { name: 'Jaune', color: '#f5c518' },
];
const event = { capacity: 32, genders: { fille: 16, garcon: 16 }, teams: TEAMS } as unknown as EventRecord;
const ticket = (gender: Gender, i: number): Ticket => ({ code: `T${i}`, label: 'Pass', holder: `P${i}`, gender });

describe('équipes', () => {
  it('4 filles et 4 garçons par équipe', () => {
    expect(teamSlots(event)).toMatchObject({ fille: 4, garcon: 4 });
  });

  it('32 participants vendus un par un → 4 équipes de 4 filles + 4 garçons', () => {
    const sold: Ticket[] = [];
    // 16 filles + 16 garçons, vendus dans un ordre mélangé
    const genders = [...Array(16).fill('fille'), ...Array(16).fill('garcon')] as Gender[];
    genders.sort(() => Math.random() - 0.5);
    for (const t of genders.map((g, i) => ticket(g, i))) {
      assignTeams(event, sold, [t]);
      sold.push(t);
    }
    for (const team of TEAMS) {
      const inTeam = sold.filter((t) => t.team?.name === team.name);
      expect(inTeam.filter((t) => t.gender === 'fille')).toHaveLength(4);
      expect(inTeam.filter((t) => t.gender === 'garcon')).toHaveLength(4);
    }
  });

  it('commande de plusieurs places : chaque place est tirée séparément, quotas respectés', () => {
    const sold: Ticket[] = [];
    for (let k = 0; k < 4; k++) {
      const batch = [0, 1, 2, 3].map((i) => ticket('fille', k * 4 + i));
      assignTeams(event, sold, batch);
      sold.push(...batch);
    }
    for (const team of TEAMS) expect(sold.filter((t) => t.team?.name === team.name)).toHaveLength(4);
  });

  it('le tirage est aléatoire (pas toujours la même équipe)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const t = ticket('fille', i);
      assignTeams(event, [], [t]);
      seen.add(t.team!.name);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('équipe pleine pour un sexe → jamais choisie', () => {
    const full = [0, 1, 2, 3].map((i) => ({ ...ticket('garcon', i), team: TEAMS[0] }));
    for (let i = 0; i < 30; i++) {
      const t = ticket('garcon', 100 + i);
      assignTeams(event, full, [t]);
      expect(t.team!.name).not.toBe('Rouge');
    }
  });
});
