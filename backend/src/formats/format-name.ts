// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import type { RubberType } from './dto/create-format.dto.js';

const RUBBER_LABELS: Record<RubberType, string> = {
  singles: 'Single',
  doubles: 'Double',
  mixed_doubles: 'Mixed Double',
};

// ['singles', 'singles', 'doubles'] -> "Single, Single, Double"
export function formatNameFromRubbers(rubbers: RubberType[]): string {
  return rubbers.map((rubber) => RUBBER_LABELS[rubber]).join(', ');
}