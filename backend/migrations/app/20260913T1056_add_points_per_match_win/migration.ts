#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/7db1ff6f979881eb4a3bd4bc8f42313f39939e19194871b949f0003c629f46bf/contract';
import startContract from '../../snapshots/7db1ff6f979881eb4a3bd4bc8f42313f39939e19194871b949f0003c629f46bf/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d3b3d7d11b086a715a075571a491a8739d9d316c9f32e40f4616c82c8958dabf/contract';
import endContract from '../../snapshots/d3b3d7d11b086a715a075571a491a8739d9d316c9f32e40f4616c82c8958dabf/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'section',
        column: col('pointsPerMatchWin', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
