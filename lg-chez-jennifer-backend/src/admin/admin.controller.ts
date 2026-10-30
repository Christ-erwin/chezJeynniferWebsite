import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminGuard, Roles } from '../auth/auth.guard.js';
import { EventsService } from '../events/events.service.js';
import { OrdersService, type CreateOrderInput } from '../orders/orders.service.js';

/** Espace admin — toutes les routes exigent une session (admin par défaut). */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly events: EventsService,
    private readonly orders: OrdersService,
  ) {}

  /* --------------------------- tableau de bord --------------------------- */
  @Get('stats')
  stats() {
    return this.orders.stats();
  }

  /* ------------------------------ éditions ------------------------------- */
  @Get('events')
  @Roles('admin', 'staff')
  listEvents() {
    return this.events.all().map((e) => ({ ...e, seatsTaken: this.orders.seatsTaken(e.id), soldTierIds: [...this.orders.soldTierIds(e.id)] }));
  }

  @Get('events/:id')
  getEvent(@Param('id') id: string) {
    const e = this.events.require(id);
    return { ...e, seatsTaken: this.orders.seatsTaken(id), soldTierIds: [...this.orders.soldTierIds(id)] };
  }

  @Post('events')
  createEvent(@Body() body: Record<string, unknown>) {
    return this.events.create(body ?? {});
  }

  @Put('events/:id')
  updateEvent(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.events.update(id, body ?? {}, this.orders.soldTierIds(id), this.orders.seatsTaken(id));
  }

  @Delete('events/:id')
  @HttpCode(204)
  async deleteEvent(@Param('id') id: string) {
    await this.events.remove(id, this.orders.hasOrders(id));
  }

  /* ------------------------------ commandes ------------------------------ */
  @Get('orders')
  listOrders(@Query('eventId') eventId?: string, @Query('status') status?: string, @Query('q') q?: string) {
    return this.orders.list({ eventId, status, q });
  }

  @Get('orders/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="commandes-chez-jeynnifer.csv"')
  exportOrders(@Query('eventId') eventId?: string, @Query('status') status?: string, @Query('q') q?: string) {
    return this.orders.toCsv(this.orders.list({ eventId, status, q }));
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.orders.getAdmin(id);
  }

  @Post('orders')
  createManualOrder(@Body() body: CreateOrderInput & { method?: unknown }) {
    return this.orders.createManual(body ?? {});
  }

  @Post('orders/:id/mark-paid')
  @HttpCode(200)
  markPaid(@Param('id') id: string) {
    return this.orders.markPaid(id);
  }

  @Post('orders/:id/cancel')
  @HttpCode(200)
  cancel(@Param('id') id: string) {
    return this.orders.cancel(id);
  }

  /* ------------------------- contrôle à l'entrée ------------------------- */
  @Post('checkin')
  @HttpCode(200)
  @Roles('admin', 'staff')
  checkin(@Body() body: { code?: unknown; eventId?: string }) {
    return this.orders.checkin(body?.code, body?.eventId || undefined);
  }
}
