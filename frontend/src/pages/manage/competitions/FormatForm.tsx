// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { useState } from 'react';
import type { FormEvent } from 'react';
import { postApi, ApiError } from '../../../lib/api';
import {
  RUBBER_OPTIONS,
  GENDER_OPTIONS,
  WINNER_RULE_OPTIONS,
  formatNameFromRubbers,
} from '../../../lib/formatName';

// What the form keeps in state. Numbers are kept as text, so a box can be
// empty while someone is typing.
interface FormValues {
  minPlayers: string;
  maxPlayers: string;
  minAge: string;
  maxAge: string;
  setsToWin: string;
  gamesPerSet: string;
  tiebreakAtGames: string;
  finalSetMatchTiebreak: boolean;
  pointsPerRubber: string;
  pointsPerMatchWin: string;
  forfeitScoreline: string;
  winnerDeterminedBy: string;
  minCourts: string;
  permittedGenders: string[];
  rubbers: string[];
}

// Starting values for a brand new format (points and forfeit match the
// database defaults)
const DEFAULT_VALUES: FormValues = {
  minPlayers: '',
  maxPlayers: '',
  minAge: '',
  maxAge: '',
  setsToWin: '2',
  gamesPerSet: '6',
  tiebreakAtGames: '6',
  finalSetMatchTiebreak: false,
  pointsPerRubber: '1',
  pointsPerMatchWin: '0',
  forfeitScoreline: '6-0 6-0',
  winnerDeterminedBy: 'sets_then_games',
  minCourts: '1',
  permittedGenders: [],
  rubbers: ['singles'],
};

// Turns a format from the API into form values. A format with no rubbers
// (the seeded ones) gets one blank-ish card so the form is never empty.
function valuesFromFormat(format: any, ensureRubber: boolean): FormValues {
  const text = (n: number | null | undefined) =>
    n === null || n === undefined ? '' : String(n);
  const rubbers: string[] = (format.rubbers ?? []).map((r: any) => r.rubberType);

  return {
    minPlayers: text(format.minPlayers),
    maxPlayers: text(format.maxPlayers),
    minAge: text(format.minAge),
    maxAge: text(format.maxAge),
    setsToWin: text(format.setsToWin),
    gamesPerSet: text(format.gamesPerSet),
    tiebreakAtGames: text(format.tiebreakAtGames),
    finalSetMatchTiebreak: !!format.finalSetMatchTiebreak,
    pointsPerRubber: text(format.pointsPerRubber),
    pointsPerMatchWin: text(format.pointsPerMatchWin),
    forfeitScoreline: format.forfeitScoreline ?? '6-0 6-0',
    winnerDeterminedBy: format.winnerDeterminedBy,
    minCourts: text(format.minCourts),
    permittedGenders: [...(format.permittedGenders ?? [])],
    rubbers: rubbers.length === 0 && ensureRubber ? ['singles'] : rubbers,
  };
}

function optionalNumber(text: string) {
  return text.trim() === '' ? null : Number(text);
}

// The request body for POST /formats. There is no name: the backend
// generates it from the rubbers.
function payloadFromValues(v: FormValues) {
  return {
    minPlayers: Number(v.minPlayers),
    maxPlayers: Number(v.maxPlayers),
    minAge: optionalNumber(v.minAge),
    maxAge: optionalNumber(v.maxAge),
    setsToWin: Number(v.setsToWin),
    gamesPerSet: Number(v.gamesPerSet),
    tiebreakAtGames: optionalNumber(v.tiebreakAtGames),
    finalSetMatchTiebreak: v.finalSetMatchTiebreak,
    pointsPerRubber: Number(v.pointsPerRubber),
    pointsPerMatchWin: Number(v.pointsPerMatchWin),
    forfeitScoreline: v.forfeitScoreline.trim() || undefined,
    winnerDeterminedBy: v.winnerDeterminedBy,
    minCourts: Number(v.minCourts),
    // always in the same order, so two copies can be compared
    permittedGenders: GENDER_OPTIONS.map((option) => option.value).filter((g) =>
      v.permittedGenders.includes(g),
    ),
    rubbers: v.rubbers,
  };
}

function isWholeNumber(text: string, min: number) {
  return text.trim() !== '' && Number.isInteger(Number(text)) && Number(text) >= min;
}

function isOptionalWholeNumber(text: string, min: number) {
  return text.trim() === '' || isWholeNumber(text, min);
}

// The first thing wrong with the form, or null if it is ready to save
function problemWith(v: FormValues): string | null {
  if (!isWholeNumber(v.minPlayers, 1) || !isWholeNumber(v.maxPlayers, 1)) {
    return 'Enter the minimum and maximum number of players.';
  }
  if (Number(v.maxPlayers) < Number(v.minPlayers)) {
    return 'The maximum players cannot be less than the minimum.';
  }
  if (!isOptionalWholeNumber(v.minAge, 0) || !isOptionalWholeNumber(v.maxAge, 0)) {
    return 'Ages must be whole numbers.';
  }
  if (
    v.minAge.trim() !== '' &&
    v.maxAge.trim() !== '' &&
    Number(v.maxAge) < Number(v.minAge)
  ) {
    return 'The maximum age cannot be less than the minimum.';
  }
  if (!isWholeNumber(v.setsToWin, 1) || !isWholeNumber(v.gamesPerSet, 1)) {
    return 'Enter the sets to win and the games per set.';
  }
  if (!isOptionalWholeNumber(v.tiebreakAtGames, 1)) {
    return 'The tiebreak must be a whole number, or left blank.';
  }
  if (!isWholeNumber(v.pointsPerRubber, 0) || !isWholeNumber(v.pointsPerMatchWin, 0)) {
    return 'Points must be whole numbers.';
  }
  if (!isWholeNumber(v.minCourts, 1)) {
    return 'Enter the minimum number of courts.';
  }
  if (v.permittedGenders.length === 0) {
    return 'Choose at least one gender.';
  }
  if (v.rubbers.length === 0) {
    return 'Add at least one rubber.';
  }
  return null;
}

const inputClass =
  'block w-full border border-border-strong rounded-lg bg-surface text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500';

function NumberField({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-muted mb-1">
        {label}
        {optional && <span className="text-ink-subtle"> (optional)</span>}
      </label>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

interface FormatFormProps {
  // a format to copy and change, or nothing to start from the defaults
  initial?: any | null;
  // called with the new format once it has been saved
  onSaved: (format: any) => void;
  onCancel: () => void;
}

function FormatForm({ initial = null, onSaved, onCancel }: FormatFormProps) {
  const [values, setValues] = useState<FormValues>(() =>
    initial ? valuesFromFormat(initial, true) : DEFAULT_VALUES,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = payloadFromValues(values);

  // When copying, saving an identical format would just add a duplicate,
  // so Save stays disabled until something is different from the original.
  const baseline = initial
    ? JSON.stringify(payloadFromValues(valuesFromFormat(initial, false)))
    : null;
  const unchanged = baseline !== null && JSON.stringify(payload) === baseline;

  const problem = problemWith(values);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleGender(gender: string) {
    setField(
      'permittedGenders',
      values.permittedGenders.includes(gender)
        ? values.permittedGenders.filter((g) => g !== gender)
        : [...values.permittedGenders, gender],
    );
  }

  function changeRubber(index: number, type: string) {
    setField(
      'rubbers',
      values.rubbers.map((current, i) => (i === index ? type : current)),
    );
  }

  function addRubber() {
    setField('rubbers', [...values.rubbers, 'singles']);
  }

  function removeRubber(index: number) {
    setField(
      'rubbers',
      values.rubbers.filter((_, i) => i !== index),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (problem || unchanged) return;
    setSaving(true);
    setError(null);

    try {
      const created = await postApi('/formats', payload);
      onSaved(created);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string | string[] } | null;
        const msg = body?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg ?? err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* The name is generated from the rubbers */}
      <div className="rounded-lg bg-primary-50 border border-primary-200 p-3">
        <p className="text-xs text-primary-700">Name (generated from the rubbers)</p>
        <p className="font-semibold text-primary-900">
          {values.rubbers.length > 0 ? formatNameFromRubbers(values.rubbers) : 'Add a rubber'}
        </p>
      </div>

      {/* Rubbers */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">Rubbers (in score sheet order)</h3>
        <div className="space-y-2">
          {values.rubbers.map((type, index) => (
            <div
              key={index}
              className="flex items-center gap-3 border border-border rounded-lg p-3 bg-canvas"
            >
              <span className="text-sm font-medium text-ink-muted w-20 shrink-0">
                Rubber {index + 1}
              </span>
              <select
                value={type}
                onChange={(e) => changeRubber(index, e.target.value)}
                className={`${inputClass} flex-1 min-w-0`}
              >
                {RUBBER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeRubber(index)}
                disabled={values.rubbers.length === 1}
                className="text-sm text-danger hover:underline disabled:opacity-40 disabled:no-underline shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRubber}
          className="mt-2 text-sm font-medium text-primary-600 hover:underline"
        >
          + Add rubber
        </button>
      </div>

      {/* Teams */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">Teams</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Minimum players"
            value={values.minPlayers}
            onChange={(v) => setField('minPlayers', v)}
          />
          <NumberField
            label="Maximum players"
            value={values.maxPlayers}
            onChange={(v) => setField('maxPlayers', v)}
          />
          <NumberField
            label="Minimum age"
            optional
            value={values.minAge}
            onChange={(v) => setField('minAge', v)}
          />
          <NumberField
            label="Maximum age"
            optional
            value={values.maxAge}
            onChange={(v) => setField('maxAge', v)}
          />
        </div>
        <div className="mt-3">
          <p className="block text-sm font-medium text-ink-muted mb-1">Genders allowed</p>
          <div className="flex gap-4">
            {GENDER_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  checked={values.permittedGenders.includes(option.value)}
                  onChange={() => toggleGender(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Scoring */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">Scoring</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Sets to win"
            value={values.setsToWin}
            onChange={(v) => setField('setsToWin', v)}
          />
          <NumberField
            label="Games per set"
            value={values.gamesPerSet}
            onChange={(v) => setField('gamesPerSet', v)}
          />
          <NumberField
            label="Tiebreak at (games)"
            optional
            value={values.tiebreakAtGames}
            onChange={(v) => setField('tiebreakAtGames', v)}
          />
          <NumberField
            label="Minimum courts"
            value={values.minCourts}
            onChange={(v) => setField('minCourts', v)}
          />
          <NumberField
            label="Points per rubber"
            value={values.pointsPerRubber}
            onChange={(v) => setField('pointsPerRubber', v)}
          />
          <NumberField
            label="Points per match win"
            value={values.pointsPerMatchWin}
            onChange={(v) => setField('pointsPerMatchWin', v)}
          />
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Forfeit scoreline</label>
            <input
              type="text"
              value={values.forfeitScoreline}
              onChange={(e) => setField('forfeitScoreline', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Winner decided by</label>
            <select
              value={values.winnerDeterminedBy}
              onChange={(e) => setField('winnerDeterminedBy', e.target.value)}
              className={inputClass}
            >
              {WINNER_RULE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={values.finalSetMatchTiebreak}
            onChange={(e) => setField('finalSetMatchTiebreak', e.target.checked)}
          />
          Play a match tiebreak instead of the final set
        </label>
      </div>

      {/* Messages */}
      {unchanged && (
        <p className="text-sm text-ink-subtle">Change at least one setting to save a new format.</p>
      )}
      {!unchanged && problem && <p className="text-sm text-ink-subtle">{problem}</p>}
      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-ink-muted border border-border-strong font-medium px-5 py-2 rounded-lg hover:bg-canvas"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !!problem || unchanged}
          className="bg-primary-600 text-white font-medium px-5 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : initial ? 'Save as new format' : 'Save format'}
        </button>
      </div>
    </form>
  );
}

export default FormatForm;
