import { HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type Role = 'admin' | 'staff';
export type Session = { role: Role; exp: number };

const TTL_MS = 12 * 60 * 60 * 1000; // une session dure 12 h
const MAX_ATTEMPTS = 5; // par IP et par fenêtre
const WINDOW_MS = 10 * 60 * 1000;

function b64url(buf: Buffer | string) {
  return Buffer.from(buf).toString('base64url');
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Accès à l'espace admin par mot de passe.
 *  - ADMIN_PASSWORD : accès complet (éditions, commandes, stats, contrôle)
 *  - STAFF_PASSWORD : équipe d'accueil, contrôle des billets uniquement
 * Les sessions sont des jetons signés (HMAC-SHA256, ADMIN_SECRET), valables 12 h.
 */
@Injectable()
export class AuthService {
  private readonly log = new Logger('Auth');
  private readonly secret: string;
  private attempts = new Map<string, { count: number; since: number }>();

  constructor() {
    const prod = process.env.NODE_ENV === 'production';
    const secret = process.env.ADMIN_SECRET;
    if (!secret || secret.length < 32) {
      if (prod) throw new Error('ADMIN_SECRET manquant ou trop court (32 caractères minimum).');
      this.log.warn('ADMIN_SECRET absent : secret temporaire (les sessions sautent au redémarrage).');
    }
    this.secret = secret && secret.length >= 32 ? secret : randomBytes(32).toString('hex');
    if (!process.env.ADMIN_PASSWORD) this.log.warn('ADMIN_PASSWORD absent : espace admin inaccessible.');
  }

  login(password: unknown, ip: string): { token: string; role: Role; expiresAt: string } {
    this.throttle(ip);
    const pwd = typeof password === 'string' ? password : '';
    const admin = process.env.ADMIN_PASSWORD;
    const staff = process.env.STAFF_PASSWORD;
    let role: Role | null = null;
    if (admin && safeEqual(pwd, admin)) role = 'admin';
    else if (staff && safeEqual(pwd, staff)) role = 'staff';
    if (!role) {
      this.log.warn(`échec de connexion depuis ${ip}`);
      throw new UnauthorizedException('Mot de passe incorrect.');
    }
    this.attempts.delete(ip);
    const session: Session = { role, exp: Date.now() + TTL_MS };
    return { token: this.sign(session), role, expiresAt: new Date(session.exp).toISOString() };
  }

  verify(token: string): Session | null {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    if (!safeEqual(sig, this.hmac(payload))) return null;
    try {
      const s = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session;
      if ((s.role !== 'admin' && s.role !== 'staff') || typeof s.exp !== 'number' || s.exp < Date.now()) return null;
      return s;
    } catch {
      return null;
    }
  }

  private sign(s: Session) {
    const payload = b64url(JSON.stringify(s));
    return `${payload}.${this.hmac(payload)}`;
  }

  private hmac(payload: string) {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }

  private throttle(ip: string) {
    const now = Date.now();
    const a = this.attempts.get(ip);
    if (!a || now - a.since > WINDOW_MS) {
      this.attempts.set(ip, { count: 1, since: now });
      return;
    }
    a.count++;
    if (a.count > MAX_ATTEMPTS) {
      throw new HttpException('Trop de tentatives. Réessaie dans quelques minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
