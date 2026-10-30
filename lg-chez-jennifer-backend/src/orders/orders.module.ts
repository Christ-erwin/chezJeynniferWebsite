import { Logger, Module } from '@nestjs/common';
import { OrdersController, PaymentsController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { OrdersStore } from './orders.store.js';
import { PAYMENT_PROVIDER, type PaymentProvider } from '../payments/payment.provider.js';
import { EventsModule } from '../events/events.module.js';
import { PublicEventsController } from '../events/events.controller.js';
import { CinetPayProvider } from '../payments/cinetpay.provider.js';
import { MockProvider } from '../payments/mock.provider.js';

/**
 * Choix de l'agrégateur au démarrage :
 *  - CINETPAY_API_KEY + CINETPAY_SITE_ID renseignés → vrais paiements Wave / Orange Money
 *  - sinon → simulateur local (interdit en production sauf ALLOW_MOCK_PAYMENTS=true)
 */
function providerFactory(): PaymentProvider {
  const log = new Logger('Payments');
  const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (apiKey && siteId) {
    const publicApi = (process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}/api`).replace(/\/$/, '');
    log.log('agrégateur : CinetPay (Wave, Orange Money)');
    return new CinetPayProvider(apiKey, siteId, publicApi, frontendUrl);
  }
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
    throw new Error('CINETPAY_API_KEY / CINETPAY_SITE_ID manquants : impossible d’encaisser en production.');
  }
  log.warn('agrégateur : SIMULATEUR (aucun argent réel). Renseigne CINETPAY_* pour encaisser.');
  return new MockProvider(frontendUrl);
}

@Module({
  imports: [EventsModule],
  controllers: [OrdersController, PaymentsController, PublicEventsController],
  providers: [OrdersStore, OrdersService, { provide: PAYMENT_PROVIDER, useFactory: providerFactory }],
  exports: [OrdersService],
})
export class OrdersModule {}
