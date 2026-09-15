import { Temporal } from '@js-temporal/polyfill';

// This contract's DateTime columns encode through a Temporal-backed codec
// (pg/timestamptz-temporal@1) and only accept a Temporal.Instant — a plain
// JS Date raises RUNTIME.ENCODE_FAILED. Everything else in the language
// (Date.now(), a parsed request body, a form input) produces a Date, so
// any write path touching a DateTime column needs this conversion.
export function toInstant(date: Date): Temporal.Instant {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime());
}

// The reverse, for reading a stored Instant back out as a Date — useful
// wherever a response needs to serialize to JSON or feed a JS date library.
export function fromInstant(instant: Temporal.Instant): Date {
  return new Date(instant.epochMilliseconds);
}
