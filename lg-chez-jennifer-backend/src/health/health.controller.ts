import { Controller, Get } from '@nestjs/common';

/**
 * Endpoint minimal servant à vérifier que le backend tourne
 * et que le frontend arrive bien à le joindre (test du "lien" front <-> back).
 * Route finale : GET /api/health
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'lg-chez-jennifer-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
