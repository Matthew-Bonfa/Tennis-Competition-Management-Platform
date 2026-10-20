// file created by Ella Goodwin
// AI was used in writing this file (Claude)

// These mirror the enums in the backend (contract.prisma). The value is what
// the API stores and expects; the label is what people see.

export const RUBBER_OPTIONS = [
  { value: 'singles', label: 'Single' },
  { value: 'doubles', label: 'Double' },
  { value: 'mixed_doubles', label: 'Mixed Double' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'boys', label: 'Boys' },
  { value: 'girls', label: 'Girls' },
  { value: 'open', label: 'Open' },
] as const;

export const WINNER_RULE_OPTIONS = [
  { value: 'sets_then_games', label: 'Most sets, then most games' },
  { value: 'rubbers_then_sets', label: 'Most rubbers, then sets, then games' },
  { value: 'ladder_position', label: 'Highest team on the ladder' },
] as const;

function labelFor(options: readonly { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export const rubberLabel = (value: string) => labelFor(RUBBER_OPTIONS, value);
export const genderLabel = (value: string) => labelFor(GENDER_OPTIONS, value);
export const winnerRuleLabel = (value: string) => labelFor(WINNER_RULE_OPTIONS, value);

// ['singles', 'singles', 'doubles'] -> "Single, Single, Double"
// This is only a preview: the backend generates the name that gets saved,
// using the same three labels.
export function formatNameFromRubbers(rubbers: string[]) {
  return rubbers.map(rubberLabel).join(', ');
}