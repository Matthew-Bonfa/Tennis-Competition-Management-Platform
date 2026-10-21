// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import fetchApi, { postApi, ApiError } from '../../../lib/api';
import FormatForm from './FormatForm';
import { rubberLabel, genderLabel, winnerRuleLabel } from '../../../lib/formatName';

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

  // the full details of the selected format (for the summary and for copying)
  const [selectedFormat, setSelectedFormat] = useState<any>(null);

  // the format panel: open or closed, and which format it starts from
  // (nothing means a brand new format)
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSource, setPanelSource] = useState<any>(null);

  // load the competition (for the heading and its association)
  useEffect(() => {
    fetchApi(`/competitions/${id}`)
      .then(data => setCompetition(data))
      .catch(err => console.error('Failed to load competition:', err));
  }, [id]);

  // load the formats once, to fill the dropdown
  useEffect(() => {
    fetchApi('/formats')
      .then(data => setFormats(data))
      .catch(err => console.error('Failed to load formats:', err));
  }, []);

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

  const season = competition?.seasons?.find((s: any) => s.id === seasonId);

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
  function handleFormatSaved(created: any) {
    setFormats(current => [...current, { id: created.id, name: created.name }]);
    setFormatId(created.id);
    setSelectedFormat(created);
    setPanelOpen(false);
  }

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
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <p className="text-ink-muted mb-4">Choose a season on the Manage Competition page first.</p>
        <Link to={`/manage-competitions/${id}`} className="text-primary-600 hover:underline">
          Back to Manage Competition
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to={`/manage-competitions/${id}?season=${seasonId}`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Manage Competition
        </Link>

        <h1 className="text-3xl font-bold text-ink mb-1">Create New Section</h1>
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
              placeholder="e.g. A Grade"
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

          {error && <p className="text-danger text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving || !name.trim() || !formatId}
            className="bg-primary-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
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

export default CreateSectionPage;
