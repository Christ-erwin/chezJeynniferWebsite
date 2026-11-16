import { Module } from '@nestjs/common';
import { GamesController, MediaController, PublicGamesController } from './games.controller.js';
import { GamesService } from './games.service.js';
import { MediaService } from './media.service.js';
import { GamesRetentionService } from './games-retention.service.js';

@Module({ controllers: [GamesController, PublicGamesController, MediaController], providers: [GamesService, MediaService, GamesRetentionService] })
export class GamesModule {}
