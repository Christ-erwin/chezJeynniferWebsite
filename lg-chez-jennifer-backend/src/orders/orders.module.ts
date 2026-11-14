import { Logger, Module } from '@nestjs/common';
import { OrdersController, PaymentsController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { OrdersStore } from './orders.store.js';
import { PAYMENT_PROVIDER, type PaymentProvider } from '../payments/payment.provider.js';
import { EventsModule } from '../events/events.module.js';
import { PublicEventsController } from '../events/events.controller.js';
import { GeniusPayProvider } from '../payments/geniuspay.provider.js';
import { MockProvider } from '../payments/mock.provider.js';
import { MailService } from '../mail/mail.service.js';

/**
 * Choix de l'agrégateur au démarrage :
 *  - GENIUSPAY_PUBLIC_KEY + GENIUSPAY_SECRET_KEY renseignés → vrais paiements Wave / Orange Money
 *  - sinon → simulateur local (interdit en production sauf ALLOW_MOCK_PAYMENTS=true)
 */
function providerFactory(): PaymentProvider {
  const log = new Logger('Payments');
  const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const publicKey = process.env.GENIUSPAY_PUBLIC_KEY;
  const secretKey = process.env.GENIUSPAY_SECRET_KEY;
  if (publicKey && secretKey) {
    log.log('agrégateur : GeniusPay (Wave, Orange Money)');
    if (!process.env.GENIUSPAY_WEBHOOK_SECRET) log.warn('GENIUSPAY_WEBHOOK_SECRET absent : signature des webhooks non vérifiée (le statut reste relu via l’API).');
    return new GeniusPayProvider(publicKey, secretKey, frontendUrl);
  }
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
    throw new Error('GENIUSPAY_PUBLIC_KEY / GENIUSPAY_SECRET_KEY manquants : impossible d’encaisser en production.');
  }
  log.warn('agrégateur : SIMULATEUR (aucun argent réel). Renseigne GENIUSPAY_* pour encaisser.');
  return new MockProvider(frontendUrl);
}

@Module({
  imports: [EventsModule],
  controllers: [OrdersController, PaymentsController, PublicEventsController],
  providers: [OrdersStore, OrdersService, MailService, { provide: PAYMENT_PROVIDER, useFactory: providerFactory }],
  exports: [OrdersService],
})
export class OrdersModule {}
