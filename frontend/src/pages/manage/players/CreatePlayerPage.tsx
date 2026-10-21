// Admin-only form for adding a new player. Reachable from ManagePlayersPage

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

import fetchApi, { ApiError, postApi } from '../../../lib/api';
import ClubSearch from './ClubSearch';
import type { ClubOption } from './ClubSearch';

interface CreateForm {
  firstName: string;
  lastName: string;
  clubId: string;
  isFinancialMember: boolean;
  dateOfBirth: string;
  utrId: string;
  tennisAustraliaNumber: string;
  email: string;
  phone: string;
}

const EMPTY_FORM: CreateForm = {
  firstName: '',
  lastName: '',
  clubId: '',
  isFinancialMember: false,
  dateOfBirth: '',
  utrId: '',
  tennisAustraliaNumber: '',
  email: '',
  phone: '',
};

// The API rejects empty strings for the optional fields, so blank inputs
// are left out of the request entirely rather than sent as ''.
function toRequestBody(form: CreateForm): Record<string, unknown> {
  const body: Record<string, unknown> = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    clubId: form.clubId,
    isFinancialMember: form.isFinancialMember,
  };

  const optional = ['dateOfBirth', 'utrId', 'tennisAustraliaNumber', 'email', 'phone'] as const;
  for (const key of optional) {
    const value = form[key].trim();
    if (value) {
      body[key] = value;
    }
  }

  return body;
}

function CreatePlayerPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load the clubs once, to fill the dropdown
  useEffect(() => {
    fetchApi('/clubs')
      .then((data) => setClubs(data))
      .catch((err) => console.error('Failed to load clubs:', err));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); // stops the browser reloading the page on submit
    setSaving(true);
    setError(null);

    try {
      await postApi('/players', toRequestBody(form));
      navigate('/manage-players');
    } catch (err) {
      if (err instanceof ApiError) {
        const message = err.body && typeof err.body === 'object' && 'message' in err.body ? err.body.message : null;
        setError(Array.isArray(message) ? message.join(', ') : String(message ?? 'Could not create player'));
      } else {
        setError('Something went wrong. Please try again.');
      }
      setSaving(false);
    }
  }

  const canSubmit = form.firstName.trim() && form.lastName.trim() && form.clubId;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/manage-players"
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Manage Players
      </Link>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-ink mb-2">Add New Player</h1>
        <p className="text-sm text-ink-subtle mb-6">A player code is assigned automatically when the player is saved.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-ink-muted">
            First name *
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
              className="mt-1 w-full rounded border border-border-strong px-3 py-1.5 text-ink"
            />
          </label>
          <label className="text-sm text-ink-muted">
            Last name *
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
              className="mt-1 w-full rounded border border-border-strong px-3 py-1.5 text-ink"
            />
          </label>
          <div className="text-sm text-ink-muted">
            Club *
            <ClubSearch
              clubs={clubs}
              value={form.clubId}
              onChange={(clubId) => setForm({ ...form, clubId })}
            />
          </div>
          <label className="text-sm text-ink-muted flex items-center gap-2 sm:mt-6">
            <input
              type="checkbox"
              checked={form.isFinancialMember}
              onChange={(e) => setForm({ ...form, isFinancialMember: e.target.checked })}
              className="h-4 w-4 rounded border-border-strong"
            />
            Financial member of this club
          </label>
          <label className="text-sm text-ink-muted">
            Date of birth
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className="mt-1 w-full rounded border border-border-strong px-3 py-1.5 text-ink"
            />
          </label>
          <label className="text-sm text-ink-muted">
            UTR ID
            <input
              type="text"
              value={form.utrId}
              onChange={(e) => setForm({ ...form, utrId: e.target.value })}
              className="mt-1 w-full rounded border border-border-strong px-3 py-1.5 text-ink"
            />
          </label>
          <label className="text-sm text-ink-muted">
            Tennis Australia number
            <input
              type="text"
              value={form.tennisAustraliaNumber}
              onChange={(e) => setForm({ ...form, tennisAustraliaNumber: e.target.value })}
              className="mt-1 w-full rounded border border-border-strong px-3 py-1.5 text-ink"
            />
          </label>
          <label className="text-sm text-ink-muted">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded border border-border-strong px-3 py-1.5 text-ink"
            />
          </label>
          <label className="text-sm text-ink-muted">
            Phone
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded border border-border-strong px-3 py-1.5 text-ink"
            />
          </label>
        </div>

        {error && <p className="text-sm text-danger mt-4">{error}</p>}

        <div className="flex items-center justify-end gap-2 mt-6">
          <Link
            to="/manage-players"
            className="inline-flex items-center gap-1 rounded border border-border-strong px-3 py-1.5 text-sm text-ink-muted hover:bg-canvas"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !canSubmit}
            className="inline-flex items-center gap-1 rounded bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Add player
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePlayerPage;
