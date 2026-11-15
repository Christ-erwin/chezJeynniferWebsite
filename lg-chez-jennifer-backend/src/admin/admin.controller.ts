import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminGuard, Roles } from '../auth/auth.guard.js';
import { EventsService } from '../events/events.service.js';
import type { EventRecord } from '../events/event.types.js';
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
    return this.events.all().map((e) => this.withStock(e));
  }

  @Get('events/:id')
  getEvent(@Param('id') id: string) {
    return this.withStock(this.events.require(id));
  }

  private withStock(e: EventRecord) {
    return {
      ...e,
      seatsTaken: this.orders.seatsTaken(e.id),
      seatsTakenByGender: this.orders.seatsTakenByGender(e.id),
      soldTierIds: [...this.orders.soldTierIds(e.id)],
    };
  }

  @Post('events')
  createEvent(@Body() body: Record<string, unknown>) {
    return this.events.create(body ?? {});
  }

  @Put('events/:id')
  updateEvent(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.events.update(id, body ?? {}, this.orders.soldTierIds(id), this.orders.seatsTaken(id), this.orders.seatsTakenByGender(id));
  }

  /** Avant suppression : commandes payées (à rembourser) et en attente. */
  @Get('events/:id/deletion-impact')
  deletionImpact(@Param('id') id: string) {
    this.events.require(id);
    return this.orders.deletionImpact(id);
  }

  /**
   * Supprime une édition. S'il y a des commandes, il faut confirmer (?force=1) :
   * elles sont annulées et les payées marquées « à rembourser ».
   */
  @Delete('events/:id')
  @HttpCode(204)
  async deleteEvent(@Param('id') id: string, @Query('force') force?: string) {
    this.events.require(id);
    const confirmed = force === '1' || force === 'true';
    if (confirmed) await this.orders.cancelForDeletedEvent(id);
    await this.events.remove(id, !confirmed && this.orders.hasOrders(id));
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

  @Put('orders/:id/packs')
  setPacks(@Param('id') id: string, @Body() body: { packs?: unknown }) {
    return this.orders.setPacks(id, body?.packs);
  }

  /** Corrige un billet : nom du participant ou équipe. */
  @Put('orders/:id/tickets/:code')
  updateTicket(@Param('id') id: string, @Param('code') code: string, @Body() body: { holder?: unknown; team?: unknown }) {
    return this.orders.updateTicket(id, code, body ?? {});
  }

  @Post('orders/:id/email')
  @HttpCode(200)
  resendEmail(@Param('id') id: string) {
    return this.orders.resendEmail(id);
  }

  @Post('orders/:id/refunded')
  @HttpCode(200)
  markRefunded(@Param('id') id: string) {
    return this.orders.markRefunded(id);
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
