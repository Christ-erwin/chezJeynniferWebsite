import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminGuard, Roles } from '../auth/auth.guard.js';
import { GamesService } from './games.service.js';
import { MediaService } from './media.service.js';

/** Parties de Loup-Garou : composition (admin) et écran de jeu (admin + accueil). */
@Controller('admin/games')
@UseGuards(AdminGuard)
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get()
  @Roles('admin', 'staff')
  list() {
    return this.games.list();
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.games.create(body ?? {});
  }

  @Get(':id')
  @Roles('admin', 'staff')
  get(@Param('id') id: string) {
    return this.games.get(id);
  }

  @Get(':id/state')
  @Roles('admin', 'staff')
  state(@Param('id') id: string) {
    return this.games.state(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.games.update(id, body ?? {});
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.games.remove(id);
  }

  @Post(':id/eliminate')
  @HttpCode(200)
  @Roles('admin', 'staff')
  eliminate(@Param('id') id: string, @Body() body: { playerId?: unknown }) {
    return this.games.eliminate(id, body?.playerId);
  }

  @Post(':id/revive')
  @HttpCode(200)
  @Roles('admin', 'staff')
  revive(@Param('id') id: string, @Body() body: { playerId?: unknown; resurrect?: unknown }) {
    return this.games.revive(id, body?.playerId, body?.resurrect === true);
  }

  @Post(':id/chief')
  @HttpCode(200)
  @Roles('admin', 'staff')
  chief(@Param('id') id: string, @Body() body: { playerId?: unknown }) {
    return this.games.chief(id, body?.playerId ?? null);
  }

  @Post(':id/start')
  @HttpCode(200)
  @Roles('admin', 'staff')
  start(@Param('id') id: string) {
    return this.games.start(id);
  }

  @Post(':id/finish')
  @HttpCode(200)
  @Roles('admin', 'staff')
  finish(@Param('id') id: string, @Body() body: { winner?: unknown }) {
    return this.games.finish(id, body?.winner);
  }

  @Post(':id/reset')
  @HttpCode(200)
  @Roles('admin', 'staff')
  reset(@Param('id') id: string) {
    return this.games.reset(id);
  }
}

/** Écran géant (public, sans connexion) : l'identifiant de partie sert de lien d'accès. */
@Controller('games')
export class PublicGamesController {
  constructor(private readonly games: GamesService) {}

  @Get(':id/screen')
  screen(@Param('id') id: string) {
    return this.games.screen(id);
  }
}

@Controller()
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** Envoi d'une photo (déjà redimensionnée par le navigateur). */
  @Post('admin/media')
  @UseGuards(AdminGuard)
  upload(@Body() body: { data?: unknown }) {
    return this.media.save(body?.data);
  }

  /** Lecture publique : nom aléatoire de 128 bits, mis en cache longtemps. */
  @Get('media/:name')
  serve(@Param('name') name: string, @Res() res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(this.media.file(name));
  }
}
