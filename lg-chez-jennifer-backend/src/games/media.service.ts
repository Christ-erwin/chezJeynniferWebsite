import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 1.5 * 1024 * 1024;

/**
 * Photos des joueurs, stockées sur disque sous un nom aléatoire (non devinable).
 * ⚠️ Comme le reste du stockage fichier : à passer sur un stockage objet
 * (Supabase Storage, S3…) avant la production.
 */
@Injectable()
export class MediaService {
  readonly dir = resolve(process.env.MEDIA_DIR ?? 'data/media');

  save(dataUrl: unknown): { path: string } {
    const m = typeof dataUrl === 'string' ? /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl) : null;
    if (!m) throw new BadRequestException('Image attendue (JPEG, PNG ou WebP).');
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_BYTES) throw new BadRequestException('Image trop lourde (1,5 Mo max).');
    mkdirSync(this.dir, { recursive: true });
    const name = `${randomBytes(16).toString('hex')}.${TYPES[m[1]]}`;
    writeFileSync(join(this.dir, name), buf);
    return { path: `media/${name}` };
  }

  file(name: string): string {
    if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(name)) throw new NotFoundException();
    const full = join(this.dir, name);
    if (!existsSync(full)) throw new NotFoundException();
    return full;
  }
}
