import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { OrdersService } from '../orders/orders.service.js';

/** API publique lue par le site : éditions publiées et à venir. */
@Controller('events')
export class PublicEventsController {
  constructor(
    private readonly events: EventsService,
    private readonly orders: OrdersService,
  ) {}

  @Get()
  list() {
    return this.events.published().map((e) => this.orders.toPublicEvent(e));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const e = this.events.get(id);
    if (!e || e.status !== 'published') throw new NotFoundException('Soirée introuvable.');
    return this.orders.toPublicEvent(e);
  }
}
