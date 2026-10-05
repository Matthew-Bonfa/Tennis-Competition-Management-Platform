#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/bb0c1d04b30671c579b6145f68d3061fda55d5f7839ba0f1b02f568ac4b161a2/contract';
import startContract from '../../snapshots/bb0c1d04b30671c579b6145f68d3061fda55d5f7839ba0f1b02f568ac4b161a2/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c7f06c9080279cb55c92c6d28954168a5448f6810582a1dba37577db832c4623/contract';
import endContract from '../../snapshots/c7f06c9080279cb55c92c6d28954168a5448f6810582a1dba37577db832c4623/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'person',
        column: col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'person',
        column: col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
