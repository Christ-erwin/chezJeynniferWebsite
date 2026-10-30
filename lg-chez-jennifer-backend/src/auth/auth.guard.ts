import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, type Role } from './auth.service.js';

const ROLES_KEY = 'roles';
/** Rôles autorisés sur une route (par défaut : admin uniquement). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; session?: unknown }>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const session = token ? this.auth.verify(token) : null;
    if (!session) throw new UnauthorizedException('Session expirée, reconnecte-toi.');
    const allowed = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]) ?? ['admin'];
    if (!allowed.includes(session.role)) throw new ForbiddenException('Accès réservé à l’administration.');
    req.session = session;
    return true;
  }
}
