#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4d6b64c70bf31530ce98ff85feac808df0206d5cb4004b015f26bee631e73d92/contract';
import startContract from '../../snapshots/4d6b64c70bf31530ce98ff85feac808df0206d5cb4004b015f26bee631e73d92/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ff5b2bfaa57dc3b2a858a000daf1cd1abcc53705da3b89a149de4e82f4ae005d/contract';
import endContract from '../../snapshots/ff5b2bfaa57dc3b2a858a000daf1cd1abcc53705da3b89a149de4e82f4ae005d/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'format', column: 'rubbersPerMatch' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'match',
        constraint: 'match_matchStatus_check_21c8ad8e',
      }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'rubber',
        constraint: 'rubber_outcomeType_check_bd80204a',
      }),
      this.createTable({
        schema: 'public',
        table: 'formatRubber',
        columns: [
          col('formatId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rubberNumber', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rubberType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'formatRubber_rubberType_check_94ac6fcc',
            "\"rubberType\" IN ('singles', 'doubles', 'mixed_doubles')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'matchResultEvent',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('eventType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('matchId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('note', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('personId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('snapshot', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'matchResultEvent_eventType_check_5d6b768b',
            "\"eventType\" IN ('entered', 'confirmed', 'disputed', 'overridden', 'reopened')",
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'match',
        column: col('disputeReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'match',
        column: col('winningTeamId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'rubberSet',
        column: col('isComplete', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'formatRubber',
        constraint: 'formatRubber_formatId_rubberNumber_key',
        columns: ['formatId', 'rubberNumber'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'match',
        constraint: 'match_matchStatus_check_1b41886e',
        expression:
          "\"matchStatus\" IN ('scheduled', 'awaiting_confirmation', 'disputed', 'completed', 'washout', 'forfeit', 'bye')",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'rubber',
        constraint: 'rubber_outcomeType_check_d8de23d9',
        expression:
          "\"outcomeType\" IN ('normal', 'retired', 'walkover', 'incomplete', 'not_played')",
      }),
      this.addUnique({
        schema: 'public',
        table: 'teamPlayer',
        constraint: 'teamPlayer_teamId_personId_key',
        columns: ['teamId', 'personId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'formatRubber',
        index: 'formatRubber_formatId_idx_306abbe2',
        columns: ['formatId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'match',
        index: 'match_winningTeamId_idx_7bdd2d43',
        columns: ['winningTeamId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'matchResultEvent',
        index: 'matchResultEvent_matchId_idx_4caf5ecc',
        columns: ['matchId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'matchResultEvent',
        index: 'matchResultEvent_personId_idx_e5e06b80',
        columns: ['personId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'formatRubber',
        foreignKey: {
          name: 'formatRubber_formatId_fkey',
          columns: ['formatId'],
          references: { schema: 'public', table: 'format', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'match',
        foreignKey: {
          name: 'match_winningTeamId_fkey',
          columns: ['winningTeamId'],
          references: { schema: 'public', table: 'team', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'matchResultEvent',
        foreignKey: {
          name: 'matchResultEvent_matchId_fkey',
          columns: ['matchId'],
          references: { schema: 'public', table: 'match', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'matchResultEvent',
        foreignKey: {
          name: 'matchResultEvent_personId_fkey',
          columns: ['personId'],
          references: { schema: 'public', table: 'person', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
