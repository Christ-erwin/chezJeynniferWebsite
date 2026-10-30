import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Petite collection persistée dans un fichier JSON (développement / MVP).
 * Toutes les écritures passent par `mutate`, qui les sérialise dans ce
 * processus et réécrit le fichier de façon atomique.
 *
 * ⚠️ À remplacer par PostgreSQL avant la production (voir sql/schema.sql) :
 * un disque local n'est ni partagé entre instances ni persistant sur Vercel.
 */
export class JsonCollection<T extends { id: string }> {
  private readonly file: string;
  private items = new Map<string, T>();
  private queue: Promise<unknown> = Promise.resolve();

  constructor(path: string, seed?: () => T[]) {
    this.file = resolve(path);
    if (existsSync(this.file)) {
      (JSON.parse(readFileSync(this.file, 'utf8')) as T[]).forEach((i) => this.items.set(i.id, i));
    } else if (seed) {
      seed().forEach((i) => this.items.set(i.id, i));
      this.flush();
    }
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  all(): T[] {
    return [...this.items.values()];
  }

  /** À n'appeler qu'à l'intérieur de `mutate`. */
  set(item: T) {
    this.items.set(item.id, item);
  }

  /** À n'appeler qu'à l'intérieur de `mutate`. */
  delete(id: string) {
    this.items.delete(id);
  }

  mutate<R>(fn: () => R): Promise<R> {
    const run = this.queue.then(() => {
      const result = fn();
      this.flush();
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private flush() {
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.all(), null, 2));
    renameSync(tmp, this.file);
  }
}
