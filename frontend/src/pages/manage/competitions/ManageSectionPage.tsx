// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import fetchApi, { ApiError } from '../../../lib/api';
import FormatForm from './FormatForm';
import { rubberLabel, genderLabel, winnerRuleLabel } from '../../../lib/formatName';
import LoadingState from '../../../components/ui/LoadingState';
import ErrorState from '../../../components/ui/ErrorState';

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
  const [formats, setFormats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [gradeLabel, setGradeLabel] = useState('');
  const [formatId, setFormatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // the full details of the selected format (for the summary and for copying)
  const [selectedFormat, setSelectedFormat] = useState<any>(null);

  // the format panel: open or closed, and which format it starts from
  // (nothing means a brand new format)
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSource, setPanelSource] = useState<any>(null);

  // load the section, its competition and the list of formats together
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchApi(`/sections/${sectionId}`),
      fetchApi(`/competitions/${id}`),
      fetchApi('/formats'),
    ])
      .then(([sectionData, competitionData, formatsData]) => {
        setSection(sectionData);
        setCompetition(competitionData);
        setFormats(formatsData);
        setName(sectionData.name);
        setGradeLabel(sectionData.gradeLabel ?? '');
        setFormatId(sectionData.formatId); // start on the section's current format
        setLoading(false);
      })
      .catch(err => {
        setLoadError(err.message);
        setLoading(false);
      });
  }, [id, sectionId]);

  // load the details of whichever format is selected
  useEffect(() => {
    if (!formatId) {
      setSelectedFormat(null);
      return;
    }
    let cancelled = false;
    fetchApi(`/formats/${formatId}`)
      .then(data => {
        if (!cancelled) setSelectedFormat(data);
      })
      .catch(err => console.error('Failed to load format:', err));
    return () => {
      cancelled = true;
    };
  }, [formatId]);

  // only show the details once they match the dropdown
  const summary = selectedFormat && selectedFormat.id === formatId ? selectedFormat : null;

  function openNewFormat() {
    setPanelSource(null);
    setPanelOpen(true);
  }

  function openCopyOfSelected() {
    setPanelSource(summary);
    setPanelOpen(true);
  }

  // a format was saved in the panel: add it to the dropdown and select it
  // (the section itself is only updated when "Save changes" is clicked)
  function handleFormatSaved(created: any) {
    setFormats(current => [...current, { id: created.id, name: created.name }]);
    setFormatId(created.id);
    setSelectedFormat(created);
    setPanelOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      await patchApi(`/sections/${sectionId}`, {
        name: name.trim(),
        gradeLabel: gradeLabel.trim(),
        formatId,
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

  if (loading) return <LoadingState />;
  if (loadError) return <ErrorState>Error: {loadError}</ErrorState>;
  if (!section) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <p className="text-ink-muted">Section not found.</p>
      </div>
    );
  }

  const season = competition?.seasons?.find((s: any) => s.id === section.seasonId);
  const unchanged =
    name.trim() === section.name &&
    gradeLabel.trim() === (section.gradeLabel ?? '') &&
    formatId === section.formatId;

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to={`/manage-competitions/${id}?season=${section.seasonId}`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Manage Competition
        </Link>

        <h1 className="text-3xl font-bold text-ink mb-1">Manage Section</h1>
        {competition && (
          <p className="text-ink-muted mb-6">
            {competition.association?.name} &middot; {competition.name}
            {season && <> &middot; {season.name}</>}
          </p>
        )}

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Section name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Grade (optional)</label>
            <input
              type="text"
              value={gradeLabel}
              onChange={(e) => setGradeLabel(e.target.value)}
              className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Format</label>
            <div className="flex gap-3">
              <select
                value={formatId}
                onChange={(e) => setFormatId(e.target.value)}
                required
                className="flex-1 min-w-0 border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a format...</option>
                {formats.map(format => (
                  <option key={format.id} value={format.id}>{format.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={openNewFormat}
                className="shrink-0 border border-border-strong bg-muted text-ink font-medium px-4 py-3 rounded-lg hover:bg-border"
              >
                Create new format
              </button>
            </div>

            <button
              type="button"
              onClick={openCopyOfSelected}
              disabled={!summary}
              className="mt-3 w-full border border-border-strong bg-muted text-ink font-medium px-4 py-3 rounded-lg hover:bg-border disabled:opacity-50 disabled:hover:bg-muted"
            >
              Edit format (saves as a new format)
            </button>

            {summary && (
              <div className="mt-3 rounded-lg bg-canvas border border-border p-3 text-sm text-ink-muted space-y-1">
                <p>
                  <span className="font-medium">Rubbers:</span>{' '}
                  {summary.rubbers?.length > 0
                    ? summary.rubbers.map((r: any) => rubberLabel(r.rubberType)).join(', ')
                    : 'None set'}
                </p>
                <p>
                  <span className="font-medium">Genders:</span>{' '}
                  {summary.permittedGenders?.length > 0
                    ? summary.permittedGenders.map((g: string) => genderLabel(g)).join(', ')
                    : 'None set'}
                </p>
                <p>
                  <span className="font-medium">Players:</span> {summary.minPlayers} to{' '}
                  {summary.maxPlayers}
                  {(summary.minAge !== null || summary.maxAge !== null) && (
                    <>
                      {' '}
                      &middot; ages {summary.minAge ?? 'any'} to {summary.maxAge ?? 'any'}
                    </>
                  )}
                </p>
                <p>
                  <span className="font-medium">Sets:</span> {summary.setsToWin} to win,{' '}
                  {summary.gamesPerSet} games per set
                  {summary.tiebreakAtGames !== null
                    ? `, tiebreak at ${summary.tiebreakAtGames}`
                    : ', no tiebreak'}
                  {summary.finalSetMatchTiebreak && ', match tiebreak in the final set'}
                </p>
                <p>
                  <span className="font-medium">Points:</span> {summary.pointsPerRubber} per
                  rubber, {summary.pointsPerMatchWin} per match win
                </p>
                <p>
                  <span className="font-medium">Winner decided by:</span>{' '}
                  {winnerRuleLabel(summary.winnerDeterminedBy)}
                </p>
              </div>
            )}
          </div>

          {saveError && <p className="text-danger text-sm">{saveError}</p>}

          <button
            type="submit"
            disabled={saving || !name.trim() || !formatId || unchanged}
            className="bg-primary-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* The format panel. It sits outside the section form above, because
          a form cannot be placed inside another form. */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 overflow-y-auto p-4">
          <div className="bg-surface rounded-lg shadow-md max-w-2xl mx-auto my-8 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-ink">
                  {panelSource ? 'Edit format (saves as a new format)' : 'Create new format'}
                </h2>
                {panelSource && (
                  <p className="text-sm text-ink-muted">
                    Starting from &ldquo;{panelSource.name}&rdquo;. The original is not changed.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Close"
                className="text-ink-subtle hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <FormatForm
              initial={panelSource}
              onSaved={handleFormatSaved}
              onCancel={() => setPanelOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ManageSectionPage;
