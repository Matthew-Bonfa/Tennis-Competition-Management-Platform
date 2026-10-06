// Admin-only edit form for a player's own identity fields. Reachable only
// from ManagePlayersPage (Admin -> Manage Players -> pick a player) — the
// public player profile (PlayerProfile.tsx) is view-only.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

import fetchApi, { ApiError, patchApi } from '../api';

interface PlayerDetail {
  id: string;
  personCode: string;
  firstName: string;
  lastName: string;
  primaryClubName: string | null;
  dateOfBirth: string | null;
  utrId: string | null;
  tennisAustraliaNumber: string | null;
  email: string | null;
  phone: string | null;
}

interface EditForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  utrId: string | null;
  tennisAustraliaNumber: string | null;
  email: string | null;
  phone: string | null;
}

function toForm(player: PlayerDetail): EditForm {
  return {
    firstName: player.firstName,
    lastName: player.lastName,
    dateOfBirth: player.dateOfBirth?.slice(0, 10) ?? '',
    utrId: player.utrId ?? '',
    tennisAustraliaNumber: player.tennisAustraliaNumber ?? '',
    email: player.email ?? '',
    phone: player.phone ?? '',
  };
}

function EditPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        const data = await fetchApi('/players/' + id);
        setPlayer(data);
        setForm(toForm(data));
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          throw err;
        }
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await patchApi('/players/' + id, form);
      setPlayer(updated);
      setForm(toForm(updated));
      navigate('/manage-players');
    } catch (err) {
      if (err instanceof ApiError) {
        const message = err.body && typeof err.body === 'object' && 'message' in err.body ? err.body.message : null;
        setError(Array.isArray(message) ? message.join(', ') : String(message ?? 'Update failed'));
      } else {
        throw err;
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="max-w-3xl mx-auto px-4 py-12 text-gray-500">Loading...</p>;
  }

  if (notFound || !player || !form) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">Player not found.</p>
        <Link to="/manage-players" className="text-sky-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Manage Players
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/manage-players"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Manage Players
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Edit {player.firstName} {player.lastName}
        </h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-gray-600">
            First name
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-gray-900"
            />
          </label>
          <label className="text-sm text-gray-600">
            Last name
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-gray-900"
            />
          </label>
          <label className="text-sm text-gray-600">
            Date of birth
            <input
              type="date"
              value={form.dateOfBirth ?? ''}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value || null })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-gray-900"
            />
          </label>
          <label className="text-sm text-gray-600">
            UTR ID
            <input
              type="text"
              value={form.utrId ?? ''}
              onChange={(e) => setForm({ ...form, utrId: e.target.value || null })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-gray-900"
            />
          </label>
          <label className="text-sm text-gray-600">
            Tennis Australia number
            <input
              type="text"
              value={form.tennisAustraliaNumber ?? ''}
              onChange={(e) => setForm({ ...form, tennisAustraliaNumber: e.target.value || null })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-gray-900"
            />
          </label>
          <label className="text-sm text-gray-600">
            Email
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm({ ...form, email: e.target.value || null })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-gray-900"
            />
          </label>
          <label className="text-sm text-gray-600">
            Phone
            <input
              type="text"
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value || null })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-gray-900"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <div className="flex items-center justify-end gap-2 mt-6">
          <Link
            to="/manage-players"
            className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditPlayerPage;
