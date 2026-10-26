import 'dotenv/config';
import { Temporal } from '@js-temporal/polyfill';
if (!('Temporal' in globalThis)) {
  (globalThis as { Temporal?: typeof Temporal }).Temporal = Temporal;
}

import postgres from '@prisma/orm-postgres/runtime';
import type { Contract as End } from '../../snapshots/fd901b2ef0de3174f9df3f4a04a972ba587c85d84eca8f3fc149d31d0343eeef/contract';
import endContract from '../../snapshots/fd901b2ef0de3174f9df3f4a04a972ba587c85d84eca8f3fc149d31d0343eeef/contract.json' with { type: 'json' };

// @ts-ignore - Prisma 8 RC nested dependency type mismatch workaround
export const db = postgres<End>({
  contractJson: endContract,
  url: process.env['DATABASE_URL']!,
});
