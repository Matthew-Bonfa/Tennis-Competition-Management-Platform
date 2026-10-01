export interface CsvColumn<T> {
    key: keyof T;
    header: string;
}

function escapeCsvField(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    let stringValue = String(value);

    if (/^[=+\-@\t\r]/.test(stringValue)) {
        stringValue = `'${stringValue}`;
    }

    if (/[",\r\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
    const headerLine = columns.map((column) => escapeCsvField(column.header)).join(',');
    const dataLines = rows.map((row) => columns.map((column) => escapeCsvField(row[column.key])).join(','));

    return [headerLine, ...dataLines].join('\r\n');
}