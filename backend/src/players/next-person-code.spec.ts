import { describe, it, expect } from 'vitest';
import { nextPersonCode } from './next-person-code.js';

describe('nextPersonCode', () => {
  it('starts at P001 when there are no players', () => {
    expect(nextPersonCode([])).toBe('P001');
  });

  it('returns one past the highest existing code', () => {
    expect(nextPersonCode(['P001', 'P002', 'P012'])).toBe('P013');
  });

  it('does not depend on the order the codes come back in', () => {
    expect(nextPersonCode(['P012', 'P001', 'P007'])).toBe('P013');
  });

  it('does not reuse a gap left by a deleted player', () => {
    expect(nextPersonCode(['P001', 'P003'])).toBe('P004');
  });

  it('ignores codes that do not match the P### pattern', () => {
    expect(nextPersonCode(['P002', 'LEGACY-9', 'X100'])).toBe('P003');
  });

  it('keeps counting past three digits', () => {
    expect(nextPersonCode(['P999'])).toBe('P1000');
  });
});
