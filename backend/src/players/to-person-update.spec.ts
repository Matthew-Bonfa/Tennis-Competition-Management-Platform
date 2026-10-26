import { Temporal } from '@js-temporal/polyfill';
import { BadRequestException } from '@nestjs/common';
import { describe, it, expect } from 'vitest';
import { toPersonUpdate } from './to-person-update.js';

describe('toPersonUpdate', () => {
  it('passes through a single changed field', () => {
    expect(toPersonUpdate({ phone: '0400 000 999' })).toEqual({ phone: '0400 000 999' });
  });

  it('drops undefined fields rather than overwriting them', () => {
    expect(toPersonUpdate({ firstName: 'Jack', lastName: undefined })).toEqual({ firstName: 'Jack' });
  });

  it('passes an explicit null through for a nullable field', () => {
    expect(toPersonUpdate({ utrId: null })).toEqual({ utrId: null });
  });

  it('rejects an explicit null for a non-nullable field', () => {
    expect(() => toPersonUpdate({ firstName: null as unknown as string })).toThrow(BadRequestException);
  });

  it('rejects an explicit null for the other non-nullable field', () => {
    expect(() => toPersonUpdate({ lastName: null as unknown as string })).toThrow(BadRequestException);
  });

  it('converts dateOfBirth to a Temporal.Instant', () => {
    const data = toPersonUpdate({ dateOfBirth: '2001-03-15T00:00:00.000Z' });
    expect(data.dateOfBirth).toBeInstanceOf(Temporal.Instant);
    expect((data.dateOfBirth as Temporal.Instant).epochMilliseconds).toBe(
      Temporal.Instant.from('2001-03-15T00:00:00Z').epochMilliseconds,
    );
  });

  it('passes a null dateOfBirth through unconverted', () => {
    expect(toPersonUpdate({ dateOfBirth: null })).toEqual({ dateOfBirth: null });
  });

  it('combines several fields into one update payload', () => {
    expect(toPersonUpdate({ firstName: 'Jack', email: 'jack@example.com' })).toEqual({
      firstName: 'Jack',
      email: 'jack@example.com',
    });
  });

  it('throws when no editable fields are supplied', () => {
    expect(() => toPersonUpdate({})).toThrow(BadRequestException);
  });
});
