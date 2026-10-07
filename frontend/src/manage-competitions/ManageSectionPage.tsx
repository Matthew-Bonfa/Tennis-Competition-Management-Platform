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

function ManageSectionPage() {
  const { id, sectionId } = useParams(); // competition id and section id, from the URL
  const navigate = useNavigate();

  const [competition, setCompetition] = useState<any>(null);
  const [section, setSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [gradeLabel, setGradeLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchApi(`/sections/${sectionId}`),
      fetchApi(`/competitions/${id}`),
    ])
      .then(([sectionData, competitionData]) => {
        setSection(sectionData);
        setCompetition(competitionData);
        setName(sectionData.name);
        setGradeLabel(sectionData.gradeLabel ?? '');
        setLoading(false);
      })
      .catch(err => {
        setLoadError(err.message);
        setLoading(false);
      });
  }, [id, sectionId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      await patchApi(`/sections/${sectionId}`, {
        name: name.trim(),
        gradeLabel: gradeLabel.trim(),
      });
      // per the wireframe: save goes back to Manage Competition with this section's season selected
      navigate(`/manage-competitions/${id}?season=${section.seasonId}`);
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
  if (!section) return <div className="text-center py-12">Section not found.</div>;

  const season = competition?.seasons?.find((s: any) => s.id === section.seasonId);
  const unchanged =
    name.trim() === section.name && gradeLabel.trim() === (section.gradeLabel ?? '');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to={`/manage-competitions/${id}?season=${section.seasonId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Manage Competition
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-1">Manage Section</h1>
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
            className="block w-full border border-gray-300 rounded-lg bg-white text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {saveError && <p className="text-red-600 text-sm">{saveError}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim() || unchanged}
          className="bg-sky-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

export default ManageSectionPage;