#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/877ed903f404b2883aee05d34d802d622e7cdbaca629caacc19e5ba8cba91443/contract';
import endContract from '../../snapshots/877ed903f404b2883aee05d34d802d622e7cdbaca629caacc19e5ba8cba91443/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ff5b2bfaa57dc3b2a858a000daf1cd1abcc53705da3b89a149de4e82f4ae005d/contract';
import startContract from '../../snapshots/ff5b2bfaa57dc3b2a858a000daf1cd1abcc53705da3b89a149de4e82f4ae005d/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'teamRequest',
        columns: [
          col('clubId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('formatId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('pending', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('seasonId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('sectionComment', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('teamGender', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('teamId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'teamRequest_teamGender_check_94975ab4',
            "\"teamGender\" IN ('boys', 'girls', 'open')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'teamRequestPlayer',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('personId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('teamRequestId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'teamRequest',
        index: 'teamRequest_clubId_idx_7aff947d',
        columns: ['clubId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'teamRequest',
        index: 'teamRequest_formatId_idx_306abbe2',
        columns: ['formatId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'teamRequest',
        index: 'teamRequest_seasonId_idx_aa50cbae',
        columns: ['seasonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'teamRequest',
        index: 'teamRequest_teamId_idx_f2b72ab3',
        columns: ['teamId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'teamRequestPlayer',
        index: 'teamRequestPlayer_personId_idx_e5e06b80',
        columns: ['personId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'teamRequestPlayer',
        index: 'teamRequestPlayer_teamRequestId_idx_c7c0eaeb',
        columns: ['teamRequestId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'teamRequest',
        foreignKey: {
          name: 'teamRequest_clubId_fkey',
          columns: ['clubId'],
          references: { schema: 'public', table: 'club', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'teamRequest',
        foreignKey: {
          name: 'teamRequest_seasonId_fkey',
          columns: ['seasonId'],
          references: { schema: 'public', table: 'season', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'teamRequest',
        foreignKey: {
          name: 'teamRequest_formatId_fkey',
          columns: ['formatId'],
          references: { schema: 'public', table: 'format', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'teamRequest',
        foreignKey: {
          name: 'teamRequest_teamId_fkey',
          columns: ['teamId'],
          references: { schema: 'public', table: 'team', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'teamRequestPlayer',
        foreignKey: {
          name: 'teamRequestPlayer_teamRequestId_fkey',
          columns: ['teamRequestId'],
          references: { schema: 'public', table: 'teamRequest', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'teamRequestPlayer',
        foreignKey: {
          name: 'teamRequestPlayer_personId_fkey',
          columns: ['personId'],
          references: { schema: 'public', table: 'person', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
