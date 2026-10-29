#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/877ed903f404b2883aee05d34d802d622e7cdbaca629caacc19e5ba8cba91443/contract';
import startContract from '../../snapshots/877ed903f404b2883aee05d34d802d622e7cdbaca629caacc19e5ba8cba91443/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8dc3de077107725a65d0119316742dd1eee8a25f9e44884cdb4fbe0f1630ac6e/contract';
import endContract from '../../snapshots/8dc3de077107725a65d0119316742dd1eee8a25f9e44884cdb4fbe0f1630ac6e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'accountToken',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('personId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('rolesJson', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tokenHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('usedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'accountToken',
        constraint: 'accountToken_tokenHash_key',
        columns: ['tokenHash'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
