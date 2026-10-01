import { describe, it, expect } from 'vitest';
import { toCsv } from './csv.js';

describe('toCsv', () => {
    it('renders a header row and one row per item', () => {
        const csv = toCsv(
            [{ id: 1, name: 'Kilsyth' }, { id: 2, name: 'Ringwood' }],
            [{ key: 'id', header: 'ID' }, { key: 'name', header: 'Name' }],
        );

        expect(csv).toBe('ID,Name\r\n1,Kilsyth\r\n2,Ringwood');
    });

    it('quotes a field containing a comma', () => {
        const csv = toCsv([{ name: 'Smith, Jones' }], [{ key: 'name', header: 'Name' }]);
        expect(csv).toBe('Name\r\n"Smith, Jones"');
    });

    it('doubles an embedded quote', () => {
        const csv = toCsv([{ name: 'The "Aces"' }], [{ key: 'name', header: 'Name' }]);
        expect(csv).toBe('Name\r\n"The ""Aces"""');
    });

    it('renders null/undefined as an empty field', () => {
        const csv = toCsv([{ value: null }], [{ key: 'value', header: 'Value' }]);
        expect(csv).toBe('Value\r\n');
    });

    it('neutralises a field starting with = to prevent formula injection', () => {
        const csv = toCsv([{ name: '=HYPERLINK("http://evil.com")' }], [{ key: 'name', header: 'Name' }]);
        expect(csv).toBe('Name\r\n"\'=HYPERLINK(""http://evil.com"")"');
    });

    it('neutralises fields starting with +, -, @ or a tab', () => {
        const csv = toCsv(
            [{ name: '+1' }, { name: '-1' }, { name: '@cmd' }, { name: '\tcmd' }],
            [{ key: 'name', header: 'Name' }],
        );
        expect(csv).toBe('Name\r\n\'+1\r\n\'-1\r\n\'@cmd\r\n\'\tcmd');
    });

    it('leaves a field not starting with a formula character untouched', () => {
        const csv = toCsv([{ name: 'A=B' }], [{ key: 'name', header: 'Name' }]);
        expect(csv).toBe('Name\r\nA=B');
    });
});
