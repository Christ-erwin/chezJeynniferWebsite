import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthController } from './health/health.controller.js';
import { OrdersModule } from './orders/orders.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AdminModule } from './admin/admin.module.js';
import { GamesModule } from './games/games.module.js';

@Module({
  imports: [
    // Charge le fichier .env et le rend disponible partout via process.env / ConfigService.
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    OrdersModule,
    AdminModule,
    GamesModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
