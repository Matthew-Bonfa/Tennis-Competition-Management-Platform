// Player codes are "P" plus a zero-padded number (P001, P002, ...). The next
// code is one past the highest number already in use, so gaps left by
// deleted players are never reused. Codes that don't match the pattern
// (hand-entered or legacy) are ignored rather than breaking the sequence.
export function nextPersonCode(existingCodes: string[]): string {
  let highest = 0;

  for (const code of existingCodes) {
    const match = /^P(\d+)$/.exec(code);
    if (match) {
      highest = Math.max(highest, Number(match[1]));
    }
  }

  return `P${String(highest + 1).padStart(3, '0')}`;
}
