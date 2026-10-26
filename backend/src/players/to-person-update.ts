import { BadRequestException } from '@nestjs/common';
import { toInstant } from '../common/temporal.js';
import type { UpdatePlayerDto } from './dto/update-player.dto.js';

const NON_NULLABLE = ['firstName', 'lastName'] as const;

// Turns a validated UpdatePlayerDto into the partial object Person.update()
// expects: undefined keys (fields the caller didn't send) are dropped so
// they don't overwrite existing data, dateOfBirth is converted to the
// Temporal.Instant the contract's DateTime codec requires (see
// common/temporal.ts), and an explicit null against a non-nullable column
// is rejected up front rather than left for Postgres to reject as a 500.
export function toPersonUpdate(dto: UpdatePlayerDto): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(dto)) {
        if (value === undefined) {
            continue; // absent, not a clear
        }

        if (value === null && (NON_NULLABLE as readonly string[]).includes(key)) {
            throw new BadRequestException(`Field ${key} cannot be null`);
        }

        data[key] = key === 'dateOfBirth' && value !== null ? toInstant(new Date(value as string)) : value;
    }

    // A whitelisted-away body ({}, or only unknown keys) would otherwise
    // issue an UPDATE with no SET clause.
    if (Object.keys(data).length === 0) {
        throw new BadRequestException('No valid fields to update');
    }

    return data;
}
