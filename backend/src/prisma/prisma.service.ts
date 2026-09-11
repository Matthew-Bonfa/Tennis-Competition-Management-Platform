import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { db } from './db.js';

// Wraps the Prisma Next runtime client as an injectable so exactly one
// place in the app owns the connection pool's lifecycle. Anything that
// needs the database injects PrismaService instead of importing `db`
// directly, so a second consumer can never race this shutdown hook.
@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client = db;

  async onModuleDestroy() {
    await db.close();
  }
}
