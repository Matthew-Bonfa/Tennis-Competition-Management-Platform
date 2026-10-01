export function csvFilename(parts: (string | number | undefined | false)[]): string {
    const slug = parts
        .filter((part): part is string | number => part !== undefined && part !== false && part !== '')
        .map((part) => String(part)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
        )
        .filter((part) => part.length > 0)
        .join('-');

    return `${slug}.csv`;
}
