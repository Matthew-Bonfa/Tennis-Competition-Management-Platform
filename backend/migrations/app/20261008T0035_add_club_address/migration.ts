#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/55f74d948d8ecc9f0614a6ea35a8d23664ae3829ba3a104523da6f54ae8be3cf/contract';
import endContract from '../../snapshots/55f74d948d8ecc9f0614a6ea35a8d23664ae3829ba3a104523da6f54ae8be3cf/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f288487c576aad4c449fb63ac35d382bf1f0a142154eb60b3d1a73c1b9f2a4a0/contract';
import startContract from '../../snapshots/f288487c576aad4c449fb63ac35d382bf1f0a142154eb60b3d1a73c1b9f2a4a0/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'club',
        column: col('address', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
