import { describe, it, expect } from 'vitest';
import { csvFilename } from './csv-filename.js';

describe('csvFilename', () => {
    it('joins parts with dashes and appends .csv', () => {
        expect(csvFilename(['fixtures', 'section', 1])).toBe('fixtures-section-1.csv');
    });

    it('skips undefined and false parts', () => {
        expect(csvFilename(['fixtures', undefined, 'team-2', false])).toBe('fixtures-team-2.csv');
    });

    it('lowercases and slugifies non-alphanumeric characters', () => {
        expect(csvFilename(['Saturday AM – Div 1'])).toBe('saturday-am-div-1.csv');
    });

    it('collapses runs of separators and trims leading/trailing dashes', () => {
        expect(csvFilename(['  --weird///name--  '])).toBe('weird-name.csv');
    });

    it('drops an empty string part entirely', () => {
        expect(csvFilename(['fixtures', '', 'all'])).toBe('fixtures-all.csv');
    });
});
