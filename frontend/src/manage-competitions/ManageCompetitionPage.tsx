// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
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

function ManageCompetitionPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // name editing
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // seasons and sections
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // seasons sorted by start date, most recent first (ISO date text sorts correctly as text)
  const sortedSeasons: any[] = competition?.seasons
    ? [...competition.seasons].sort((a: any, b: any) => b.startDate.localeCompare(a.startDate))
    : [];

  useEffect(() => {
    setLoading(true);
    fetchApi(`/competitions/${id}`)
      .then(data => {
        setCompetition(data);
        setName(data.name);
        setLoading(false);
      })
      .catch(err => {
        setLoadError(err.message);
        setLoading(false);
      });
  }, [id]);

  // choose which season is selected once the competition has loaded:
  // the one named in the URL (?season=3) if there is one, otherwise the most recent.
  // Depends on competition?.seasons so saving a new name doesn't reset the dropdown.
  useEffect(() => {
    if (sortedSeasons.length === 0) {
      setSelectedSeasonId(null);
      return;
    }
    const fromUrl = Number(searchParams.get('season'));
    const match = sortedSeasons.find((s: any) => s.id === fromUrl);
    setSelectedSeasonId(match ? match.id : sortedSeasons[0].id);
  }, [competition?.seasons]);

  // load the sections whenever the selected season changes
  useEffect(() => {
    if (selectedSeasonId === null) {
      setSections([]);
      return;
    }
    setSectionsLoading(true);
    fetchApi(`/sections?seasonId=${selectedSeasonId}`)
      .then(data => {
        setSections(data);
        setSectionsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load sections:', err);
        setSectionsLoading(false);
      });
  }, [selectedSeasonId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const updated = await patchApi(`/competitions/${id}`, { name: name.trim() });
      setCompetition({ ...competition, name: updated.name });
      setName(updated.name);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string | string[] } | null;
        const msg = body?.message;
        setSaveError(Array.isArray(msg) ? msg.join(', ') : msg ?? err.message);
      } else {
        setSaveError('Something went wrong. Please try again.');
      }
    }
    setSaving(false);
  }

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (loadError) return <div className="text-center py-12 text-red-600">Error: {loadError}</div>;
  if (!competition) return <div className="text-center py-12">Competition not found.</div>;

  const unchanged = name.trim() === competition.name;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/manage-competitions"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Manage Competitions
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-1">Manage Competition</h1>
      {competition.association?.name && (
        <p className="text-gray-600 mb-6">{competition.association.name}</p>
      )}

      {/* Competition name */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Competition name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            required
            className="block w-full border border-gray-300 rounded-lg bg-white text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
        {saved && <p className="text-green-600 text-sm">Saved.</p>}

        <button
          type="submit"
          disabled={saving || !name.trim() || unchanged}
          className="bg-sky-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      {/* Seasons and sections */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        {sortedSeasons.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              This competition doesn't have any seasons yet. Please create a new season.
            </p>
            <Link
              to={`/manage-competitions/${id}/create-new-season`}
              className="inline-block bg-sky-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-sky-700"
            >
              + Create new season
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <select
                value={selectedSeasonId ?? ''}
                onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
                className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {sortedSeasons.map((season: any) => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>

              <Link
                to={`/manage-competitions/${id}/create-new-season`}
                className="bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-sky-700"
              >
                + Create new season
              </Link>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">Sections</h2>
              <Link
                to={`/manage-competitions/${id}/create-new-section?season=${selectedSeasonId}`}
                className="bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-sky-700"
              >
                + Create new section
              </Link>
            </div>

            {sectionsLoading && <p className="text-gray-500 text-sm">Loading sections...</p>}
            {!sectionsLoading && sections.length === 0 && (
              <p className="text-gray-500 text-sm">
                The selected season doesn't have any sections. Try adding some.
              </p>
            )}
            {!sectionsLoading && sections.length > 0 && (
              <ul className="space-y-2">
                {sections.map((section: any) => (
                  <li key={section.id} className="flex items-center justify-between">
                    <Link
                      to={`/sections/${section.id}`}
                      className="text-sky-600 hover:underline text-sm font-medium"
                    >
                      {section.name}
                    </Link>
                    <Link
                      to={`/manage-competitions/${id}/sections/${section.id}`}
                      className="text-sm text-gray-600 hover:text-sky-600"
                    >
                      Edit
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ManageCompetitionPage;