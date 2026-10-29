import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import fetchApi, { postApi } from '../../../lib/api';
import { isAdmin } from '../../../lib/auth';
import PersonPicker from '../../../components/manage/PersonPicker';

interface ClubOption {
  id: string;
  name: string;
}

interface AssociationOption {
  id: string;
  name: string;
}

// One role row in the form. CLUB_ADMIN/PLAYER are scoped to a club,
// ASSOCIATION_ADMIN to an association — the backend re-checks all of this.
interface RoleRow {
  role: 'PLAYER' | 'CLUB_ADMIN' | 'ASSOCIATION_ADMIN';
  clubId: string;
  associationId: string;
}

function ManageAccountsPage() {
  const [person, setPerson] = useState<{ id: string; label: string } | null>(null);
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [associations, setAssociations] = useState<AssociationOption[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const admin = isAdmin();

  useEffect(() => {
    // Both lists are public; they fill the scope dropdowns in the role rows
    fetchApi('/clubs')
      .then((data: any) => setClubs(data))
      .catch(() => setError('Could not load clubs'));
    fetchApi('/associations')
      .then((data: any) => setAssociations(data))
      .catch(() => setError('Could not load associations'));
  }, []);

  const handlePick = async (picked: { id: string; firstName: string; lastName: string }) => {
    setPerson({ id: picked.id, label: `${picked.firstName} ${picked.lastName}`.trim() });
    setError('');
    setSuccess('');

    // Default the first role row to the person's primary club, if they have one
    try {
      const detail: any = await fetchApi(`/players/${picked.id}`);
      const primary = (detail.clubs || []).find((c: any) => c.isPrimaryClub);
      if (primary && roles.length === 0) {
        setRoles([{ role: 'PLAYER', clubId: primary.id, associationId: '' }]);
      }
    } catch {
      // The default row is a convenience only — the picker still works without it
    }
  };

  const updateRow = (index: number, patch: Partial<RoleRow>) => {
    setRoles(roles.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!person) {
      setError('Select the person this account is for');
      return;
    }
    if (!email) {
      setError('Enter the email the invitation should go to');
      return;
    }
    if (roles.length === 0) {
      setError('Add at least one role');
      return;
    }
    for (const row of roles) {
      if (row.role === 'ASSOCIATION_ADMIN' ? !row.associationId : !row.clubId) {
        setError('Every role needs its club or association chosen');
        return;
      }
    }

    setLoading(true);
    try {
      const body = {
        personId: person.id,
        email,
        roles: roles.map((row) =>
          row.role === 'ASSOCIATION_ADMIN'
            ? { role: row.role, associationId: row.associationId }
            : { role: row.role, clubId: row.clubId },
        ),
      };
      const data: any = await postApi('/auth/invites', body);
      setSuccess(data.message || 'Invitation sent');
      setPerson(null);
      setEmail('');
      setRoles([]);
    } catch (err: any) {
      setError(err?.message || 'Could not send the invitation');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: RoleRow['role'][] = admin
    ? ['PLAYER', 'CLUB_ADMIN', 'ASSOCIATION_ADMIN']
    : ['PLAYER', 'CLUB_ADMIN'];

  const inputClass =
    'mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-ink mb-6">Create an Account</h1>

      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm space-y-6">
        <p className="text-sm text-ink-muted">
          Pick an existing person, enter their email and choose their roles. They will
          receive a link valid for 24 hours to set their password and activate the account.
        </p>

        {error && (
          <div role="alert" className="rounded-md border border-danger-border bg-danger-bg p-3 text-sm text-danger">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="rounded-md border border-success-border bg-success-bg p-3 text-sm text-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink-muted">Person</label>
            {person ? (
              <div className="mt-1 flex items-center justify-between rounded-lg border border-border-strong bg-surface px-3 min-h-11">
                <span className="text-ink">{person.label}</span>
                <button
                  type="button"
                  onClick={() => setPerson(null)}
                  className="text-sm text-ink-muted hover:text-ink min-h-11 px-2"
                >
                  Change
                </button>
              </div>
            ) : (
              <PersonPicker onPick={handlePick} placeholder="Search for a person..." />
            )}
          </div>

          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-ink-muted">
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-3">
            <span className="block text-sm font-medium text-ink-muted">Roles</span>
            {roles.map((row, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  aria-label="Role"
                  value={row.role}
                  onChange={(e) => {
                    const role = e.target.value as RoleRow['role'];
                    updateRow(index, { role });
                  }}
                  className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r === 'PLAYER' ? 'Player' : r === 'CLUB_ADMIN' ? 'Club Admin' : 'Association Admin'}
                    </option>
                  ))}
                </select>

                {row.role === 'ASSOCIATION_ADMIN' ? (
                  <select
                    aria-label="Association"
                    value={row.associationId}
                    onChange={(e) => updateRow(index, { associationId: e.target.value })}
                    className="flex-1 rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select an association...</option>
                    {associations.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    aria-label="Club"
                    value={row.clubId}
                    onChange={(e) => updateRow(index, { clubId: e.target.value })}
                    className="flex-1 rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a club...</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setRoles(roles.filter((_, i) => i !== index))}
                  className="text-sm text-ink-muted hover:text-danger min-h-11 px-2"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRoles([...roles, { role: 'PLAYER', clubId: '', associationId: '' }])}
              className="min-h-11 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-canvas"
            >
              Add role
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors duration-150 hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send invitation'}
            </button>
            <Link to="/admin" className="text-sm text-ink-muted hover:text-ink">
              Back
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManageAccountsPage;
