// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchApi, { postApi, ApiError } from '../../../lib/api';

function CreateCompetitionPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [associationId, setAssociationId] = useState('');
  const [associations, setAssociations] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load the associations once, to fill the dropdown
  useEffect(() => {
    fetchApi('/associations')
      .then(data => setAssociations(data))
      .catch(err => console.error('Failed to load associations:', err));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); // stops the browser reloading the page on submit
    setSaving(true);
    setError(null);

    try {
      const created = await postApi('/competitions', {
        name: name.trim(),
        associationId,
      });
      navigate(`/competitions/${created.id}`);
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
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-ink mb-6">Create New Competition</h1>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">Association</label>
          <select
            value={associationId}
            onChange={(e) => setAssociationId(e.target.value)}
            required
            className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select an association...</option>
            {associations.map(assoc => (
              <option key={assoc.id} value={assoc.id}>{assoc.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">Competition name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="block w-full border border-border-strong rounded-lg bg-surface text-ink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim() || !associationId}
          className="bg-primary-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}

export default CreateCompetitionPage;