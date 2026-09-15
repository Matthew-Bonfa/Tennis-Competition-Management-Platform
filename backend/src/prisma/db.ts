import 'dotenv/config';

// The contract's DateTime columns encode through a Temporal-backed codec
// (pg/timestamptz-temporal@1). Node has no global Temporal implementation
// yet, so every consumer of `db` needs the polyfill registered before any
// row with a DateTime field is read or written. Doing it here, in the one
// place `db` is constructed, means every consumer gets it for free.
import { Temporal } from '@js-temporal/polyfill';
if (!('Temporal' in globalThis)) {
  (globalThis as { Temporal?: typeof Temporal }).Temporal = Temporal;
}

import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
