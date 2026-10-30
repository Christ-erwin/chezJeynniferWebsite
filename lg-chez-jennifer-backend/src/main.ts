import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // photos des joueurs envoyées en JSON (≈ 100–300 Ko après redimensionnement)
  app.useBodyParser('json', { limit: '2mb' });

  // Préfixe commun pour toutes les routes de l'API -> GET /api/health, etc.
  app.setGlobalPrefix('api');

  // Autorise le site vitrine (frontend Next.js) à appeler l'API.
  // FRONTEND_ORIGIN peut contenir plusieurs origines séparées par des virgules.
  const origins = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`[backend] API prête sur http://localhost:${port}/api`);
  console.log(`[backend] CORS autorisé pour : ${origins.join(', ')}`);
}
await bootstrap();
