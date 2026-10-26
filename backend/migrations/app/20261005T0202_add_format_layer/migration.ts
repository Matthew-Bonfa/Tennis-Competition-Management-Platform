#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/c7f06c9080279cb55c92c6d28954168a5448f6810582a1dba37577db832c4623/contract';
import startContract from '../../snapshots/c7f06c9080279cb55c92c6d28954168a5448f6810582a1dba37577db832c4623/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/fd901b2ef0de3174f9df3f4a04a972ba587c85d84eca8f3fc149d31d0343eeef/contract';
import endContract from '../../snapshots/fd901b2ef0de3174f9df3f4a04a972ba587c85d84eca8f3fc149d31d0343eeef/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';
import { db } from './db.ts';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'section', column: 'finalSetMatchTiebreak' }),
      this.dropColumn({ schema: 'public', table: 'section', column: 'forfeitScoreline' }),
      this.dropColumn({ schema: 'public', table: 'section', column: 'gamesPerSet' }),
      this.dropColumn({ schema: 'public', table: 'section', column: 'pointsPerMatchWin' }),
      this.dropColumn({ schema: 'public', table: 'section', column: 'pointsPerRubber' }),
      this.dropColumn({ schema: 'public', table: 'section', column: 'rubbersPerMatch' }),
      this.dropColumn({ schema: 'public', table: 'section', column: 'setsToWin' }),
      this.dropColumn({ schema: 'public', table: 'section', column: 'tiebreakAtGames' }),
      this.createTable({
        schema: 'public',
        table: 'competitionFormat',
        columns: [
          col('competitionId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('formatId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'format',
        columns: [
          col('associationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('dayOfWeek', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('finalSetMatchTiebreak', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('forfeitScoreline', 'text', {
            notNull: true,
            default: lit('6-0 6-0'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('gamesPerSet', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('maxAge', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('maxPlayers', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('minAge', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('minCourts', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('minPlayers', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('pointsPerMatchWin', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('pointsPerRubber', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('rubbersPerMatch', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('setsToWin', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tiebreakAtGames', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('winnerDeterminedBy', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'format_dayOfWeek_check_96b6ba98',
            "\"dayOfWeek\" IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')",
          ),
          checkExpression(
            'format_winnerDeterminedBy_check_6967c1aa',
            "\"winnerDeterminedBy\" IN ('sets_then_games', 'rubbers_then_sets', 'ladder_position')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'formatTeamGender',
        columns: [
          col('formatId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('gender', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'formatTeamGender_gender_check_03a0b75b',
            "\"gender\" IN ('boys', 'girls', 'open')",
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'section',
        column: col('gradeLabel', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'team',
        column: col('teamGender', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'section',
        column: col('formatId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(this.endContract, 'backfill-section-formatId', {
        check: () => db.sql.public.section.select('id').where((f, fns) => fns.eq(f.formatId, null)).limit(1),
        run: () => db.sql.public.section
          .update({ formatId: '00000000-0000-0000-0000-000000000000' })
          .where((f, fns) => fns.eq(f.formatId, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'section', column: 'formatId' }),
      this.addUnique({
        schema: 'public',
        table: 'competitionFormat',
        constraint: 'competitionFormat_competitionId_formatId_key',
        columns: ['competitionId', 'formatId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'formatTeamGender',
        constraint: 'formatTeamGender_formatId_gender_key',
        columns: ['formatId', 'gender'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'team',
        constraint: 'team_teamGender_check_94975ab4',
        expression: "\"teamGender\" IN ('boys', 'girls', 'open')",
      }),
      this.createIndex({
        schema: 'public',
        table: 'competitionFormat',
        index: 'competitionFormat_competitionId_idx_53fccd3b',
        columns: ['competitionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'competitionFormat',
        index: 'competitionFormat_formatId_idx_306abbe2',
        columns: ['formatId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'format',
        index: 'format_associationId_idx_54f3505c',
        columns: ['associationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'formatTeamGender',
        index: 'formatTeamGender_formatId_idx_306abbe2',
        columns: ['formatId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'section',
        index: 'section_formatId_idx_306abbe2',
        columns: ['formatId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'competitionFormat',
        foreignKey: {
          name: 'competitionFormat_competitionId_fkey',
          columns: ['competitionId'],
          references: { schema: 'public', table: 'competition', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'competitionFormat',
        foreignKey: {
          name: 'competitionFormat_formatId_fkey',
          columns: ['formatId'],
          references: { schema: 'public', table: 'format', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'format',
        foreignKey: {
          name: 'format_associationId_fkey',
          columns: ['associationId'],
          references: { schema: 'public', table: 'association', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'formatTeamGender',
        foreignKey: {
          name: 'formatTeamGender_formatId_fkey',
          columns: ['formatId'],
          references: { schema: 'public', table: 'format', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'section',
        foreignKey: {
          name: 'section_formatId_fkey',
          columns: ['formatId'],
          references: { schema: 'public', table: 'format', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
