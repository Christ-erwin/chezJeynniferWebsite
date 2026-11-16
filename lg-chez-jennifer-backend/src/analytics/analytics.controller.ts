import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AnalyticsService } from './analytics.service.js';

/** Compteur de pages vues du site public (appelé par le navigateur, sans cookie). */
@Controller('track')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post()
  @HttpCode(204)
  track(@Body() body: { path?: unknown; ref?: unknown; src?: unknown; entry?: unknown }, @Req() req: Request, @Headers('user-agent') ua?: string) {
    this.analytics.track(body ?? {}, req.ip ?? '', ua ?? '');
  }
}
