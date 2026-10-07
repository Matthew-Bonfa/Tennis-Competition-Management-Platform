// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import fetchApi, { postApi, ApiError } from '../api';

function CreateSectionPage() {
  const { id } = useParams(); // the competition's id
  const [searchParams] = useSearchParams();
  const seasonId = Number(searchParams.get('season')); // which season, from ?season=
  const navigate = useNavigate();

  const [competition, setCompetition] = useState<any>(null);
  const [formats, setFormats] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [gradeLabel, setGradeLabel] = useState('');
  const [formatId, setFormatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load the competition (for the heading and its association)
  useEffect(() => {
    fetchApi(`/competitions/${id}`)
      .then(data => setCompetition(data))
      .catch(err => console.error('Failed to load competition:', err));
  }, [id]);

  // once we know the association, load only its formats
  useEffect(() => {
    const associationId = competition?.association?.id;
    if (!associationId) return;
    fetchApi(`/formats?associationId=${associationId}`)
      .then(data => setFormats(data))
      .catch(err => console.error('Failed to load formats:', err));
  }, [competition]);

  const season = competition?.seasons?.find((s: any) => s.id === seasonId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        seasonId,
        formatId,
      };
      // gradeLabel is optional, so only send it if something was typed
      if (gradeLabel.trim()) body.gradeLabel = gradeLabel.trim();

      await postApi('/sections', body);
      // per the wireframe: back to Manage Competition with this season selected
      navigate(`/manage-competitions/${id}?season=${seasonId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const errBody = err.body as { message?: string | string[] } | null;
        const msg = errBody?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg ?? err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setSaving(false);
    }
  }

  // no season in the URL means we don't know where to put the section
  if (!seasonId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">Choose a season on the Manage Competition page first.</p>
        <Link to={`/manage-competitions/${id}`} className="text-sky-600 hover:underline">
          Back to Manage Competition
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to={`/manage-competitions/${id}?season=${seasonId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Manage Competition
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Section</h1>
      {competition && (
        <p className="text-gray-600 mb-6">
          {competition.association?.name} &middot; {competition.name}
          {season && <> &middot; {season.name}</>}
        </p>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="block w-full border border-gray-300 rounded-lg bg-white text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grade (optional)</label>
          <input
            type="text"
            value={gradeLabel}
            onChange={(e) => setGradeLabel(e.target.value)}
            placeholder="e.g. A Grade"
            className="block w-full border border-gray-300 rounded-lg bg-white text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
          <select
            value={formatId}
            onChange={(e) => setFormatId(e.target.value)}
            required
            className="block w-full border border-gray-300 rounded-lg bg-white text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Select a format...</option>
            {formats.map(format => (
              <option key={format.id} value={format.id}>{format.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim() || !formatId}
          className="bg-sky-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}

export default CreateSectionPage;