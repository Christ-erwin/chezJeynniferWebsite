import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminGuard, Roles } from '../auth/auth.guard.js';
import { EventsService } from '../events/events.service.js';
import type { EventRecord } from '../events/event.types.js';
import { OrdersService, type CreateOrderInput } from '../orders/orders.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';

/** Espace admin — toutes les routes exigent une session (admin par défaut). */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly events: EventsService,
    private readonly orders: OrdersService,
    private readonly analytics: AnalyticsService,
  ) {}

  /* --------------------------- tableau de bord --------------------------- */
  @Get('stats')
  stats() {
    return this.orders.stats();
  }

  /**
   * Statistiques de visite sur N jours (7 à 365) : visites, pages, sources,
   * appareils, et tunnel par édition (page concept → réservation → paiement → payé).
   */
  @Get('analytics')
  analyticsReport(@Query('days') rawDays?: string) {
    const n = Math.min(Math.max(Number(rawDays) || 30, 7), 365);
    const days = this.analytics.range(n);
    const from = days[0].date;
    const sum = (pick: (d: (typeof days)[number]) => Record<string, number>) => {
      const acc: Record<string, number> = {};
      for (const d of days) for (const [k, v] of Object.entries(pick(d))) acc[k] = (acc[k] ?? 0) + v;
      return acc;
    };
    const pages = sum((d) => d.pages);
    const top = (m: Record<string, number>, k: number) =>
      Object.entries(m)
        .sort((a, b) => b[1] - a[1])
        .slice(0, k)
        .map(([name, count]) => ({ name, count }));

    // tunnel par édition (commandes en ligne créées sur la période)
    const online = this.orders.list({}).filter((o) => o.provider !== 'manual' && o.createdAt.slice(0, 10) >= from);
    const funnel = this.events
      .all()
      .filter((e) => e.status === 'published' && Date.parse(e.startISO) >= Date.now() - 2 * 86400000)
      .sort((a, b) => a.startISO.localeCompare(b.startISO))
      .map((e) => {
        const eo = online.filter((o) => o.eventId === e.id);
        return {
          id: e.id,
          title: e.title,
          startISO: e.startISO,
          conceptViews: e.concepts.reduce((s, c) => s + (pages[`/${c}`] ?? 0), 0),
          bookingViews: pages[`/reserver/${e.id}`] ?? 0,
          checkouts: eo.length,
          paid: eo.filter((o) => o.status === 'paid').length,
        };
      });

    return {
      days: n,
      since: this.analytics.since() ?? null,
      totals: {
        views: days.reduce((s, d) => s + d.views, 0),
        visitors: days.reduce((s, d) => s + d.visitors, 0),
        entries: days.reduce((s, d) => s + d.entries, 0),
      },
      series: days.map((d) => ({ date: d.date, views: d.views, visitors: d.visitors })),
      pages: top(pages, 12),
      sources: top(sum((d) => d.sources), 10),
      devices: sum((d) => d.devices),
      funnel,
    };
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
  /** Masquer / remettre en ligne une édition (ou tout autre statut) en un clic. */
  @Put('events/:id/status')
  async setEventStatus(@Param('id') id: string, @Body() body: { status?: unknown }) {
    return this.withStock(await this.events.setStatus(id, body?.status));
  }

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
