import { Body, Controller, Get, Headers, HttpCode, Logger, Param, Post, Req, UnauthorizedException, type RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService, type CreateOrderInput } from './orders.service.js';
import { verifyGeniusWebhook } from '../payments/geniuspay.provider.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** Crée une commande en attente et renvoie l'URL de paiement (Wave / Orange Money). */
  @Post()
  create(@Body() body: CreateOrderInput) {
    return this.orders.create(body ?? {});
  }

  /** Statut d'une commande (interrogé par la page de confirmation). */
  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.get(id);
  }
}

@Controller('payments')
export class PaymentsController {
  private readonly log = new Logger('Payments');
  constructor(private readonly orders: OrdersService) {}

  /**
   * Webhook GeniusPay (JSON : { event, data: { reference, metadata } }).
   * On ne lit que les identifiants : le statut est TOUJOURS revérifié auprès
   * de GeniusPay (montant compris) avant de valider quoi que ce soit.
   */
  @Post('geniuspay/webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: { event?: string; data?: { reference?: unknown; metadata?: { order_id?: unknown } } },
    @Headers('x-webhook-signature') signature?: string,
    @Headers('x-webhook-timestamp') timestamp?: string,
  ) {
    const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
    if (secret) {
      const raw = req.rawBody?.toString('utf8') ?? JSON.stringify(body);
      if (!verifyGeniusWebhook(secret, signature, timestamp, raw) && !verifyGeniusWebhook(secret, signature, timestamp, JSON.stringify(body))) {
        this.log.warn(`webhook rejeté (signature invalide) : ${body?.event ?? '?'}`);
        throw new UnauthorizedException('Signature invalide.');
      }
    }
    const orderId = body?.data?.metadata?.order_id;
    const ref = body?.data?.reference;
    await this.orders.handleNotification({
      orderId: typeof orderId === 'string' ? orderId : undefined,
      providerRef: typeof ref === 'string' ? ref : undefined,
    });
    return { ok: true };
  }

  /** Simulateur local : valide ou refuse le paiement d'une commande. */
  @Post('mock/:id/confirm')
  @HttpCode(200)
  confirm(@Param('id') id: string, @Body() body: { success?: boolean }) {
    return this.orders.confirmMock(id, body?.success !== false);
  }
}
