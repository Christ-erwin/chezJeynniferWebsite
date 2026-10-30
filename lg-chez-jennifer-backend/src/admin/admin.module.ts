import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { EventsModule } from '../events/events.module.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({ imports: [EventsModule, OrdersModule], controllers: [AdminController] })
export class AdminModule {}
