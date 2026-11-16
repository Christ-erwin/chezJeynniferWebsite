import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { dataPath } from '../common/data-path.js';
import { classifyDevice, classifySource, cleanPath, isBot, type Device } from './analytics.util.js';

/**
 * Statistiques de visite maison, sans cookies et sans identifiant stocké chez
 * le visiteur : un visiteur unique est reconnu dans la journée par une
 * empreinte (IP + navigateur + sel aléatoire du jour), jetée le lendemain.
 * Seuls des compteurs par jour sont conservés (pages, sources, appareils).
 */
export type DayStats = {
  /** date AAAA-MM-JJ (heure d'Abidjan = UTC) */
  date: string;
  views: number;
  visitors: number;
  /** arrivées sur le site (première page d'une visite) */
  entries: number;
  pages: Record<string, number>;
  sources: Record<string, number>;
  devices: Record<Device, number>;
  /** jour en cours seulement : sel et empreintes des visiteurs déjà comptés */
  salt?: string;
  seen?: string[];
};

const KEEP_DAYS = 400;
const MAX_KEYS = 300; // pages ou sources différentes par jour, au-delà : « autres »
const FLUSH_MS = 5000;

const today = () => new Date().toISOString().slice(0, 10);

@Injectable()
export class AnalyticsService implements OnApplicationShutdown {
  private readonly log = new Logger('Analytics');
  private readonly file = resolve(process.env.ANALYTICS_FILE ?? dataPath('analytics.json'));
  private days = new Map<string, DayStats>();
  private timer: NodeJS.Timeout | null = null;
  /** anti-abus : nombre de requêtes par empreinte sur la minute en cours */
  private rate = new Map<string, number>();
  private rateMinute = 0;
  private readonly ownHosts = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => {
      try {
        return new URL(o.trim()).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    })
    .filter(Boolean);

  constructor() {
    try {
      if (existsSync(this.file)) for (const d of JSON.parse(readFileSync(this.file, 'utf8')) as DayStats[]) this.days.set(d.date, d);
    } catch (e) {
      this.log.error(`lecture impossible de ${this.file} : ${(e as Error).message}`);
    }
  }

  /** Une page vue sur le site public. */
  track(input: { path?: unknown; ref?: unknown; src?: unknown; entry?: unknown }, ip: string, ua: string): void {
    if (isBot(ua)) return;
    const path = cleanPath(input.path);
    if (!path) return;

    const minute = Math.floor(Date.now() / 60000);
    if (minute !== this.rateMinute) {
      this.rate.clear();
      this.rateMinute = minute;
    }
    const who = `${ip}|${ua}`;
    const n = (this.rate.get(who) ?? 0) + 1;
    this.rate.set(who, n);
    if (n > 60) return;

    const day = this.day(today());
    day.views++;
    bump(day.pages, path);

    const fp = createHash('sha256').update(`${day.salt}|${who}`).digest('base64url').slice(0, 16);
    if (!day.seen!.includes(fp) && day.seen!.length < 100_000) {
      day.seen!.push(fp);
      day.visitors++;
      day.devices[classifyDevice(ua)]++;
    }

    // première page d'une visite : on note d'où vient le visiteur
    if (input.entry === true) {
      const source = classifySource({
        src: typeof input.src === 'string' ? input.src : undefined,
        ref: typeof input.ref === 'string' ? input.ref : undefined,
        ua,
        ownHosts: this.ownHosts,
      });
      if (source) {
        day.entries++;
        bump(day.sources, source);
      }
    }
    this.scheduleFlush();
  }

  /** Les N derniers jours (le plus ancien d'abord), jours vides compris. */
  range(nDays: number): DayStats[] {
    const out: DayStats[] = [];
    for (let i = nDays - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const d = this.days.get(date);
      out.push(d ? { ...d, salt: undefined, seen: undefined } : empty(date));
    }
    return out;
  }

  /** Date de la première visite enregistrée (début des statistiques). */
  since(): string | undefined {
    return [...this.days.keys()].sort()[0];
  }

  onApplicationShutdown() {
    this.flush();
  }

  private day(date: string): DayStats {
    let d = this.days.get(date);
    if (!d) {
      d = { ...empty(date), salt: randomBytes(16).toString('hex'), seen: [] };
      this.days.set(date, d);
      // jours passés : on jette sel et empreintes, on ne garde que KEEP_DAYS jours
      for (const [k, old] of this.days) {
        if (k !== date) {
          delete old.salt;
          delete old.seen;
        }
      }
      const keys = [...this.days.keys()].sort();
      for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) this.days.delete(k);
    }
    d.salt ??= randomBytes(16).toString('hex');
    d.seen ??= [];
    return d;
  }

  private scheduleFlush() {
    this.timer ??= setTimeout(() => {
      this.timer = null;
      this.flush();
    }, FLUSH_MS);
  }

  private flush() {
    try {
      mkdirSync(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      writeFileSync(tmp, JSON.stringify([...this.days.values()]));
      renameSync(tmp, this.file);
    } catch (e) {
      this.log.error(`écriture impossible de ${this.file} : ${(e as Error).message}`);
    }
  }
}

function empty(date: string): DayStats {
  return { date, views: 0, visitors: 0, entries: 0, pages: {}, sources: {}, devices: { mobile: 0, tablet: 0, desktop: 0 } };
}

function bump(map: Record<string, number>, key: string) {
  const k = key in map || Object.keys(map).length < MAX_KEYS ? key : 'autres';
  map[k] = (map[k] ?? 0) + 1;
}
