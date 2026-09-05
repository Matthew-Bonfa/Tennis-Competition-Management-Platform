#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0edc6d6c036f68de17808305b1572c961a12bd6278681104e993c50b9407f037/contract';
import endContract from '../../snapshots/0edc6d6c036f68de17808305b1572c961a12bd6278681104e993c50b9407f037/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract';
import startContract from '../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'post' }),
      this.dropTable({ schema: 'public', table: 'user' }),
      this.createTable({
        schema: 'public',
        table: 'association',
        columns: [
          col('contactPersonId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'associationClub',
        columns: [
          col('associationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('clubId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'club',
        columns: [
          col('contactPersonId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isFinancialMember', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'clubMembership',
        columns: [
          col('clubId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isFinancialMember', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('isPrimaryClub', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('personId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'competition',
        columns: [
          col('associationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'match',
        columns: [
          col('awayTeamId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('confirmedByPersonId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('enteredByPersonId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('homeTeamId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('matchDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('matchStatus', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sectionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'person',
        columns: [
          col('dateOfBirth', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('firstName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lastName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('personCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tennisAustraliaNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('utrId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'personRole',
        columns: [
          col('associationId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('clubId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('personId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'rubber',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('matchId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('outcomeType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('rubberType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('winningTeamId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'rubberPlayer',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('personId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('rubberId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('teamId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'rubberSet',
        columns: [
          col('awayGames', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('homeGames', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rubberId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('setNumber', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'season',
        columns: [
          col('competitionId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('endDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('startDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'section',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('seasonId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'team',
        columns: [
          col('clubId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sectionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'teamPlayer',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('personId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('teamId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'association',
        index: 'association_contactPersonId_idx_964e4eeb',
        columns: ['contactPersonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'associationClub',
        index: 'associationClub_associationId_idx_54f3505c',
        columns: ['associationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'associationClub',
        index: 'associationClub_clubId_idx_7aff947d',
        columns: ['clubId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'club',
        index: 'club_contactPersonId_idx_964e4eeb',
        columns: ['contactPersonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'clubMembership',
        index: 'clubMembership_clubId_idx_7aff947d',
        columns: ['clubId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'clubMembership',
        index: 'clubMembership_personId_idx_e5e06b80',
        columns: ['personId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'competition',
        index: 'competition_associationId_idx_54f3505c',
        columns: ['associationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'match',
        index: 'match_awayTeamId_idx_17f82264',
        columns: ['awayTeamId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'match',
        index: 'match_confirmedByPersonId_idx_5fc3e905',
        columns: ['confirmedByPersonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'match',
        index: 'match_enteredByPersonId_idx_61189899',
        columns: ['enteredByPersonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'match',
        index: 'match_homeTeamId_idx_2a4bf710',
        columns: ['homeTeamId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'match',
        index: 'match_sectionId_idx_5d1ea56b',
        columns: ['sectionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'personRole',
        index: 'personRole_associationId_idx_54f3505c',
        columns: ['associationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'personRole',
        index: 'personRole_clubId_idx_7aff947d',
        columns: ['clubId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'personRole',
        index: 'personRole_personId_idx_e5e06b80',
        columns: ['personId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'rubber',
        index: 'rubber_matchId_idx_4caf5ecc',
        columns: ['matchId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'rubber',
        index: 'rubber_winningTeamId_idx_7bdd2d43',
        columns: ['winningTeamId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'rubberPlayer',
        index: 'rubberPlayer_personId_idx_e5e06b80',
        columns: ['personId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'rubberPlayer',
        index: 'rubberPlayer_rubberId_idx_1e071c92',
        columns: ['rubberId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'rubberPlayer',
        index: 'rubberPlayer_teamId_idx_f2b72ab3',
        columns: ['teamId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'rubberSet',
        index: 'rubberSet_rubberId_idx_1e071c92',
        columns: ['rubberId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'season',
        index: 'season_competitionId_idx_53fccd3b',
        columns: ['competitionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'section',
        index: 'section_seasonId_idx_aa50cbae',
        columns: ['seasonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'team',
        index: 'team_clubId_idx_7aff947d',
        columns: ['clubId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'team',
        index: 'team_sectionId_idx_5d1ea56b',
        columns: ['sectionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'teamPlayer',
        index: 'teamPlayer_personId_idx_e5e06b80',
        columns: ['personId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'teamPlayer',
        index: 'teamPlayer_teamId_idx_f2b72ab3',
        columns: ['teamId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'association',
        foreignKey: {
          name: 'association_contactPersonId_fkey',
          columns: ['contactPersonId'],
          references: { schema: 'public', table: 'person', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'associationClub',
        foreignKey: {
          name: 'associationClub_associationId_fkey',
          columns: ['associationId'],
          references: { schema: 'public', table: 'association', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'associationClub',
        foreignKey: {
          name: 'associationClub_clubId_fkey',
          columns: ['clubId'],
          references: { schema: 'public', table: 'club', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'club',
        foreignKey: {
          name: 'club_contactPersonId_fkey',
          columns: ['contactPersonId'],
          references: { schema: 'public', table: 'person', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'clubMembership',
        foreignKey: {
          name: 'clubMembership_personId_fkey',
          columns: ['personId'],
          references: { schema: 'public', table: 'person', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'clubMembership',
        foreignKey: {
          name: 'clubMembership_clubId_fkey',
          columns: ['clubId'],
          references: { schema: 'public', table: 'club', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'competition',
        foreignKey: {
          name: 'competition_associationId_fkey',
          columns: ['associationId'],
          references: { schema: 'public', table: 'association', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'match',
        foreignKey: {
          name: 'match_sectionId_fkey',
          columns: ['sectionId'],
          references: { schema: 'public', table: 'section', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'match',
        foreignKey: {
          name: 'match_homeTeamId_fkey',
          columns: ['homeTeamId'],
          references: { schema: 'public', table: 'team', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'match',
        foreignKey: {
          name: 'match_awayTeamId_fkey',
          columns: ['awayTeamId'],
          references: { schema: 'public', table: 'team', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'match',
        foreignKey: {
          name: 'match_enteredByPersonId_fkey',
          columns: ['enteredByPersonId'],
          references: { schema: 'public', table: 'person', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'match',
        foreignKey: {
          name: 'match_confirmedByPersonId_fkey',
          columns: ['confirmedByPersonId'],
          references: { schema: 'public', table: 'person', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'personRole',
        foreignKey: {
          name: 'personRole_personId_fkey',
          columns: ['personId'],
          references: { schema: 'public', table: 'person', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'personRole',
        foreignKey: {
          name: 'personRole_clubId_fkey',
          columns: ['clubId'],
          references: { schema: 'public', table: 'club', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'personRole',
        foreignKey: {
          name: 'personRole_associationId_fkey',
          columns: ['associationId'],
          references: { schema: 'public', table: 'association', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'rubber',
        foreignKey: {
          name: 'rubber_matchId_fkey',
          columns: ['matchId'],
          references: { schema: 'public', table: 'match', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'rubber',
        foreignKey: {
          name: 'rubber_winningTeamId_fkey',
          columns: ['winningTeamId'],
          references: { schema: 'public', table: 'team', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'rubberPlayer',
        foreignKey: {
          name: 'rubberPlayer_rubberId_fkey',
          columns: ['rubberId'],
          references: { schema: 'public', table: 'rubber', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'rubberPlayer',
        foreignKey: {
          name: 'rubberPlayer_teamId_fkey',
          columns: ['teamId'],
          references: { schema: 'public', table: 'team', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'rubberPlayer',
        foreignKey: {
          name: 'rubberPlayer_personId_fkey',
          columns: ['personId'],
          references: { schema: 'public', table: 'person', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'rubberSet',
        foreignKey: {
          name: 'rubberSet_rubberId_fkey',
          columns: ['rubberId'],
          references: { schema: 'public', table: 'rubber', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'season',
        foreignKey: {
          name: 'season_competitionId_fkey',
          columns: ['competitionId'],
          references: { schema: 'public', table: 'competition', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'section',
        foreignKey: {
          name: 'section_seasonId_fkey',
          columns: ['seasonId'],
          references: { schema: 'public', table: 'season', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'team',
        foreignKey: {
          name: 'team_clubId_fkey',
          columns: ['clubId'],
          references: { schema: 'public', table: 'club', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'team',
        foreignKey: {
          name: 'team_sectionId_fkey',
          columns: ['sectionId'],
          references: { schema: 'public', table: 'section', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'teamPlayer',
        foreignKey: {
          name: 'teamPlayer_teamId_fkey',
          columns: ['teamId'],
          references: { schema: 'public', table: 'team', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'teamPlayer',
        foreignKey: {
          name: 'teamPlayer_personId_fkey',
          columns: ['personId'],
          references: { schema: 'public', table: 'person', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
