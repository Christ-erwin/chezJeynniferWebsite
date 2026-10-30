import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { OrdersService, type CreateOrderInput } from './orders.service.js';

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
  constructor(private readonly orders: OrdersService) {}

  /**
   * Webhook CinetPay (application/x-www-form-urlencoded, champ cpm_trans_id).
   * On ne lit que la référence : le statut est TOUJOURS revérifié auprès de
   * CinetPay avant de valider quoi que ce soit.
   */
  @Post('cinetpay/notify')
  @HttpCode(200)
  async notify(@Body() body: Record<string, string>) {
    const ref = body?.cpm_trans_id;
    if (typeof ref === 'string' && ref) await this.orders.handleNotification(ref);
    return { ok: true };
  }

  /** CinetPay fait aussi un GET de contrôle sur l'URL de notification. */
  @Get('cinetpay/notify')
  ping() {
    return { ok: true };
  }

  /** Simulateur local : valide ou refuse le paiement d'une commande. */
  @Post('mock/:id/confirm')
  @HttpCode(200)
  confirm(@Param('id') id: string, @Body() body: { success?: boolean }) {
    return this.orders.confirmMock(id, body?.success !== false);
  }
}
