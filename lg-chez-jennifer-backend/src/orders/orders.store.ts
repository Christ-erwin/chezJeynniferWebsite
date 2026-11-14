import { Injectable } from '@nestjs/common';
import { JsonCollection } from '../common/json-collection.js';
import { dataPath } from '../common/data-path.js';
import type { Order } from './order.types.js';

/** Commandes — stockage fichier (voir JsonCollection : à passer sur PostgreSQL). */
@Injectable()
export class OrdersStore extends JsonCollection<Order> {
  constructor() {
    super(process.env.ORDERS_FILE ?? dataPath('orders.json'));
  }

  findByReference(reference: string): Order | undefined {
    return this.all().find((o) => o.reference === reference);
  }
}
