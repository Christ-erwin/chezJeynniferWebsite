import { Injectable, Logger, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { GamesService } from './games.service.js';
import { MediaService } from './media.service.js';

const DAY = 86_400_000;
/** parties Loup-Garou (prénoms + photos des joueurs) : effacées 12 mois après la dernière modification */
const KEEP_GAMES_MS = 365 * DAY;

/**
 * Durée de conservation des parties Loup-Garou (politique de confidentialité) :
 * suppression des parties de plus de 12 mois, puis des photos qui ne sont plus
 * utilisées par aucune partie (y compris après une suppression manuelle).
 */
@Injectable()
export class GamesRetentionService implements OnModuleInit, OnApplicationShutdown {
  private readonly log = new Logger('Conservation');
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly games: GamesService,
    private readonly media: MediaService,
  ) {}

  onModuleInit() {
    void this.run();
    this.timer = setInterval(() => void this.run(), DAY);
    this.timer.unref();
  }

  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
  }

  async run(now = Date.now()) {
    try {
      const old = this.games.list().filter((g) => Date.parse(g.updatedAt) < now - KEEP_GAMES_MS);
      for (const g of old) await this.games.remove(g.id);
      if (old.length) this.log.log(`${old.length} partie(s) Loup-Garou de plus de 12 mois supprimée(s)`);

      // photos orphelines (plus utilisées par aucune partie), après 24 h pour ne pas toucher un envoi en cours
      if (!existsSync(this.media.dir)) return;
      const used = new Set(this.games.photoPaths().map((p) => p.replace(/^media\//, '')));
      let n = 0;
      for (const name of readdirSync(this.media.dir)) {
        const full = join(this.media.dir, name);
        if (!used.has(name) && statSync(full).mtimeMs < now - DAY) {
          unlinkSync(full);
          n++;
        }
      }
      if (n) this.log.log(`${n} photo(s) de joueurs inutilisée(s) supprimée(s)`);
    } catch (e) {
      this.log.error(`nettoyage des parties : ${(e as Error).message}`);
    }
  }
}
