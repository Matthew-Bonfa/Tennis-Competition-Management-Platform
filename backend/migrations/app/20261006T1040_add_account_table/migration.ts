#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/fc23e6aed70f1f7dd4641513190671f7444e467d34175a15d3d8149db7e452eb/contract';
import endContract from '../../snapshots/fc23e6aed70f1f7dd4641513190671f7444e467d34175a15d3d8149db7e452eb/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fd901b2ef0de3174f9df3f4a04a972ba587c85d84eca8f3fc149d31d0343eeef/contract';
import startContract from '../../snapshots/fd901b2ef0de3174f9df3f4a04a972ba587c85d84eca8f3fc149d31d0343eeef/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'account',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('personId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'account',
        constraint: 'account_personId_key',
        columns: ['personId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'account',
        constraint: 'account_email_key',
        columns: ['email'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'account',
        foreignKey: {
          name: 'account_personId_fkey',
          columns: ['personId'],
          references: { schema: 'public', table: 'person', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
