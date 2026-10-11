// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import fetchApi, { ApiError } from '../api';

// local helper: fetchApi accepts any method, so PATCH doesn't need a shared helper
function patchApi(endpoint: string, data: unknown) {
  return fetchApi(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// the backend sends dates like "2027-01-10T00:00:00Z"; a date input wants "2027-01-10"
function toDateInput(value: unknown) {
  return String(value ?? '').slice(0, 10);
}

function ManageSeasonPage() {
  const { id, seasonId } = useParams(); // competition id and season id, from the URL
  const navigate = useNavigate();

  const [competition, setCompetition] = useState<any>(null);
  const [season, setSeason] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // the competition's data already includes its seasons, so one request covers both
  useEffect(() => {
    setLoading(true);
    fetchApi(`/competitions/${id}`)
      .then(data => {
        const found = data.seasons?.find((s: any) => s.id === Number(seasonId));
        setCompetition(data);
        if (found) {
          setSeason(found);
          setName(found.name);
          setStartDate(toDateInput(found.startDate));
          setEndDate(toDateInput(found.endDate));
        }
        setLoading(false);
      })
      .catch(err => {
        setLoadError(err.message);
        setLoading(false);
      });
  }, [id, seasonId]);

  const datesInvalid = startDate !== '' && endDate !== '' && endDate < startDate;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      await patchApi(`/seasons/${seasonId}`, {
        name: name.trim(),
        startDate,
        endDate,
      });
      // per the wireframe: back to Manage Competition with this season selected
      navigate(`/manage-competitions/${id}?season=${seasonId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string | string[] } | null;
        const msg = body?.message;
        setSaveError(Array.isArray(msg) ? msg.join(', ') : msg ?? err.message);
      } else {
        setSaveError('Something went wrong. Please try again.');
      }
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (loadError) return <div className="text-center py-12 text-red-600">Error: {loadError}</div>;
  if (!season) return <div className="text-center py-12">Season not found.</div>;

  const unchanged =
    name.trim() === season.name &&
    startDate === toDateInput(season.startDate) &&
    endDate === toDateInput(season.endDate);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to={`/manage-competitions/${id}?season=${seasonId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Manage Competition
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-1">Manage Season</h1>
      {competition && (
        <p className="text-gray-600 mb-6">
          {competition.association?.name} &middot; {competition.name}
        </p>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Season name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="block w-full border border-gray-300 rounded-lg bg-white text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="block w-full border border-gray-300 rounded-lg bg-white text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="block w-full border border-gray-300 rounded-lg bg-white text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {datesInvalid && (
          <p className="text-red-600 text-sm">The end date can't be before the start date.</p>
        )}
        {saveError && <p className="text-red-600 text-sm">{saveError}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim() || !startDate || !endDate || datesInvalid || unchanged}
          className="bg-sky-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

export default ManageSeasonPage;