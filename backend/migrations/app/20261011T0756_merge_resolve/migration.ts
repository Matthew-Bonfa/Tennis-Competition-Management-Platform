#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4d6b64c70bf31530ce98ff85feac808df0206d5cb4004b015f26bee631e73d92/contract';
import endContract from '../../snapshots/4d6b64c70bf31530ce98ff85feac808df0206d5cb4004b015f26bee631e73d92/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/55f74d948d8ecc9f0614a6ea35a8d23664ae3829ba3a104523da6f54ae8be3cf/contract';
import startContract from '../../snapshots/55f74d948d8ecc9f0614a6ea35a8d23664ae3829ba3a104523da6f54ae8be3cf/contract.json' with { type: 'json' };
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
