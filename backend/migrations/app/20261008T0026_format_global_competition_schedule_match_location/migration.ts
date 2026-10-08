#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/f288487c576aad4c449fb63ac35d382bf1f0a142154eb60b3d1a73c1b9f2a4a0/contract';
import endContract from '../../snapshots/f288487c576aad4c449fb63ac35d382bf1f0a142154eb60b3d1a73c1b9f2a4a0/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fd901b2ef0de3174f9df3f4a04a972ba587c85d84eca8f3fc149d31d0343eeef/contract';
import startContract from '../../snapshots/fd901b2ef0de3174f9df3f4a04a972ba587c85d84eca8f3fc149d31d0343eeef/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'format',
        constraint: 'format_dayOfWeek_check_96b6ba98',
      }),
      this.dropColumn({ schema: 'public', table: 'format', column: 'dayOfWeek' }),
      this.dropConstraint({
        schema: 'public',
        table: 'format',
        constraint: 'format_associationId_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'public',
        table: 'format',
        index: 'format_associationId_idx_54f3505c',
      }),
      this.dropColumn({ schema: 'public', table: 'format', column: 'associationId' }),
      this.addColumn({
        schema: 'public',
        table: 'competition',
        column: col('dayOfWeek', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'competition',
        column: col('startTime', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'match',
        column: col('location', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'competition',
        constraint: 'competition_dayOfWeek_check_96b6ba98',
        expression:
          "\"dayOfWeek\" IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
