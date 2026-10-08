// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import fetchApi, { postApi, ApiError } from '../api';

function CreateSeasonPage() {
  const { id } = useParams(); // the competition's id, from the URL
  const navigate = useNavigate();

  const [competition, setCompetition] = useState<any>(null);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load the competition so the page can show its name and association
  useEffect(() => {
    fetchApi(`/competitions/${id}`)
      .then(data => setCompetition(data))
      .catch(err => console.error('Failed to load competition:', err));
  }, [id]);

  const datesInvalid = startDate !== '' && endDate !== '' && endDate < startDate;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const created = await postApi('/seasons', {
        name: name.trim(),
        competitionId: id,
        startDate,
        endDate,
      });
      // per the wireframe: go back to Manage Competition with the new season selected
      navigate(`/manage-competitions/${id}?season=${created.id}`);
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to={`/manage-competitions/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Manage Competition
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Season</h1>
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
            placeholder="e.g. Summer 2027"
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
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim() || !startDate || !endDate || datesInvalid}
          className="bg-sky-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}

export default CreateSeasonPage;