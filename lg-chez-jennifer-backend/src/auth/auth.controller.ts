import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService, type Session } from './auth.service.js';
import { AdminGuard, Roles } from './auth.guard.js';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: { password?: unknown }, @Req() req: { ip?: string; headers: Record<string, string | undefined> }) {
    const ip = (req.headers['x-forwarded-for']?.split(',')[0] ?? req.ip ?? 'inconnue').trim();
    return this.auth.login(body?.password, ip);
  }

  @Get('me')
  @UseGuards(AdminGuard)
  @Roles('admin', 'staff')
  me(@Req() req: { session: Session }) {
    return { role: req.session.role, expiresAt: new Date(req.session.exp).toISOString() };
  }
}
