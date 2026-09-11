#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0edc6d6c036f68de17808305b1572c961a12bd6278681104e993c50b9407f037/contract';
import startContract from '../../snapshots/0edc6d6c036f68de17808305b1572c961a12bd6278681104e993c50b9407f037/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e970daa1359049bf85d02e068bdb5b15b77d8cf30db57f8d3f3bbdc8c420e5d7/contract';
import endContract from '../../snapshots/e970daa1359049bf85d02e068bdb5b15b77d8cf30db57f8d3f3bbdc8c420e5d7/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'match',
        column: col('confirmedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'match',
        column: col('enteredAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'rubberSet',
        column: col('awayTiebreakPoints', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'rubberSet',
        column: col('homeTiebreakPoints', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'rubberSet',
        column: col('isMatchTiebreak', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'section',
        column: col('finalSetMatchTiebreak', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'section',
        column: col('forfeitScoreline', 'text', {
          notNull: true,
          default: lit('6-0 6-0'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'section',
        column: col('pointsPerRubber', 'int4', {
          notNull: true,
          default: lit(1),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'section',
        column: col('tiebreakAtGames', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      // Added with a transient default so the empty table materialises the
      // column instantly via DDL, then the default is dropped since the
      // contract has none — every future insert must supply roundNumber.
      this.addColumn({
        schema: 'public',
        table: 'match',
        column: col('roundNumber', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.dropDefault({ schema: 'public', table: 'match', column: 'roundNumber' }),
      // Added with a transient default so the empty table materialises the
      // column instantly via DDL, then the default is dropped since the
      // contract has none — every future insert must supply rubberNumber.
      this.addColumn({
        schema: 'public',
        table: 'rubber',
        column: col('rubberNumber', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.dropDefault({ schema: 'public', table: 'rubber', column: 'rubberNumber' }),
      // Added with a transient default so the empty table materialises the
      // column instantly via DDL, then the default is dropped since the
      // contract has none — every future insert must supply gamesPerSet.
      this.addColumn({
        schema: 'public',
        table: 'section',
        column: col('gamesPerSet', 'int4', {
          notNull: true,
          default: lit(6),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.dropDefault({ schema: 'public', table: 'section', column: 'gamesPerSet' }),
      // Added with a transient default so the empty table materialises the
      // column instantly via DDL, then the default is dropped since the
      // contract has none — every future insert must supply rubbersPerMatch.
      this.addColumn({
        schema: 'public',
        table: 'section',
        column: col('rubbersPerMatch', 'int4', {
          notNull: true,
          default: lit(8),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.dropDefault({ schema: 'public', table: 'section', column: 'rubbersPerMatch' }),
      // Added with a transient default so the empty table materialises the
      // column instantly via DDL, then the default is dropped since the
      // contract has none — every future insert must supply setsToWin.
      this.addColumn({
        schema: 'public',
        table: 'section',
        column: col('setsToWin', 'int4', {
          notNull: true,
          default: lit(2),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.dropDefault({ schema: 'public', table: 'section', column: 'setsToWin' }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'match',
        constraint: 'match_distinct_teams_ac4c3213',
        expression: '"homeTeamId" <> "awayTeamId"',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'match',
        constraint: 'match_matchStatus_check_21c8ad8e',
        expression: "\"matchStatus\" IN ('scheduled', 'completed', 'washout', 'forfeit', 'bye')",
      }),
      this.addUnique({
        schema: 'public',
        table: 'match',
        constraint: 'match_sectionId_roundNumber_homeTeamId_key',
        columns: ['sectionId', 'roundNumber', 'homeTeamId'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'rubber',
        constraint: 'rubber_outcomeType_check_94029dd9',
        expression: "\"outcomeType\" IN ('normal', 'retired', 'walkover', 'defaulted')",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'rubber',
        constraint: 'rubber_rubberType_check_76b3cfea',
        expression: "\"rubberType\" IN ('singles', 'doubles')",
      }),
      this.addUnique({
        schema: 'public',
        table: 'rubber',
        constraint: 'rubber_matchId_rubberNumber_key',
        columns: ['matchId', 'rubberNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'rubberPlayer',
        constraint: 'rubberPlayer_rubberId_personId_key',
        columns: ['rubberId', 'personId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'rubberSet',
        constraint: 'rubberSet_rubberId_setNumber_key',
        columns: ['rubberId', 'setNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'match',
        index: 'match_sectionId_matchDate_idx_6d5b940c',
        columns: ['sectionId', 'matchDate'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
