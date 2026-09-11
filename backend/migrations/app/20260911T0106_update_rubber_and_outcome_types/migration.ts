#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/7db1ff6f979881eb4a3bd4bc8f42313f39939e19194871b949f0003c629f46bf/contract';
import endContract from '../../snapshots/7db1ff6f979881eb4a3bd4bc8f42313f39939e19194871b949f0003c629f46bf/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e970daa1359049bf85d02e068bdb5b15b77d8cf30db57f8d3f3bbdc8c420e5d7/contract';
import startContract from '../../snapshots/e970daa1359049bf85d02e068bdb5b15b77d8cf30db57f8d3f3bbdc8c420e5d7/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'rubber',
        constraint: 'rubber_outcomeType_check_94029dd9',
      }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'rubber',
        constraint: 'rubber_rubberType_check_76b3cfea',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'rubber',
        constraint: 'rubber_outcomeType_check_bd80204a',
        expression: "\"outcomeType\" IN ('normal', 'retired', 'walkover')",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'rubber',
        constraint: 'rubber_rubberType_check_94ac6fcc',
        expression: "\"rubberType\" IN ('singles', 'doubles', 'mixed_doubles')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
