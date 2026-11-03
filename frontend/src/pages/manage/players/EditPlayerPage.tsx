// Admin-only edit form for a player's own identity fields. Reachable only
// from ManagePlayersPage (Admin -> Manage Players -> pick a player) — the
// public player profile (PlayerProfile.tsx) is view-only.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

import fetchApi, { ApiError, patchApi } from '../../../lib/api';
import LoadingState from '../../../components/ui/LoadingState';

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
  clubs: { id: string; name: string; isPrimaryClub: boolean; isFinancialMember: boolean }[];
}

// One editable membership row: the financial flag comes from the server,
// "added" marks rows the admin added on this visit (not yet saved).
interface MembershipRow {
  clubId: string;
  clubName: string;
  isPrimaryClub: boolean;
  isFinancialMember: boolean;
  added: boolean;
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

/*
  Reduce the object to these keys
  Also trim whitespace, and replace with null if it was all just whitespace
  Note that the component fields below all display '' in case of null
*/
function toForm(player: PlayerDetail): EditForm {
  return {
    firstName: player.firstName?.trim() || null,
    lastName: player.lastName?.trim() || null,
    dateOfBirth: player.dateOfBirth?.slice(0, 10),
    utrId: player.utrId?.trim() || null,
    tennisAustraliaNumber: player.tennisAustraliaNumber?.trim() ?? null,
    email: player.email?.trim() || null,
    phone: player.phone?.trim() || null,
  };
}




function EditPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [allClubs, setAllClubs] = useState<{ id: string; name: string }[]>([]);
  const [clubToAdd, setClubToAdd] = useState('');
  // Two-step membership removal: first click arms the row, second click
  // takes it out of the list — the delete itself happens on Save
  const [removeArmed, setRemoveArmed] = useState<string | null>(null);
  const [originalForm, setOriginalForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        // The club list fills the "add club" dropdown; both are public reads
        const [data, clubs] = await Promise.all([
          fetchApi('/players/' + id),
          fetchApi('/clubs'),
        ]);
        setPlayer(data);
        // reduce the object to only the required keys
        setForm(toForm(data));
        setMemberships(
          (data.clubs ?? []).map((c: PlayerDetail['clubs'][number]) => ({
            clubId: c.id,
            clubName: c.name,
            isPrimaryClub: c.isPrimaryClub,
            isFinancialMember: c.isFinancialMember,
            added: false,
          })),
        );
        setAllClubs(clubs);
        setOriginalForm(toForm(data));
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

  const clubsNotJoined = allClubs.filter(
    (club) => !memberships.some((m) => m.clubId === club.id),
  );

  function addClub() {
    const club = clubsNotJoined.find((c) => c.id === clubToAdd);
    if (!club) return;
    setMemberships((rows) => [
      ...rows,
      { clubId: club.id, clubName: club.name, isPrimaryClub: false, isFinancialMember: true, added: true },
    ]);
    setClubToAdd('');
  }

  function toggleFinancial(clubId: string) {
    setMemberships((rows) =>
      rows.map((m) => (m.clubId === clubId ? { ...m, isFinancialMember: !m.isFinancialMember } : m)),
    );
  }

  function removeMembership(clubId: string) {
    setMemberships((rows) => rows.filter((m) => m.clubId !== clubId));
    setRemoveArmed(null);

  function changesOnly(currentForm: EditForm){
    currentForm = toForm(currentForm);
    const payload = {};
    for (const key in originalForm){
      if (originalForm[key] !== currentForm[key]){
        payload[key] = currentForm[key];
      }
    }
    return payload;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await patchApi('/players/' + id, {
        ...form,
        // The full desired list; the backend upserts each row
        memberships: memberships.map((m) => ({
          clubId: m.clubId,
          isFinancialMember: m.isFinancialMember,
        })),
      });
      setForm(toForm(form)); // clean the fields in case of failure
      const updated = await patchApi('/players/' + id, changesOnly(form)); // only send changed fields
      setPlayer(updated);
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
    return <LoadingState />;
  }

  if (notFound || !player || !form) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <p className="text-ink-muted mb-4">Player not found.</p>
        <Link to="/manage-players" className="text-primary-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Manage Players
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/manage-players"
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Manage Players
      </Link>

      <div className="bg-surface border border-border rounded-lg p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-ink mb-6">
          Edit {player.firstName} {player.lastName}
        </h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-ink-muted">
            First name
            <input
              type="text"
              value={form.firstName ?? ''}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <label className="text-sm text-ink-muted">
            Last name
            <input
              type="text"
              value={form.lastName ?? ''}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <label className="text-sm text-ink-muted">
            Date of birth
            <input
              type="date"
              value={form.dateOfBirth ?? ''}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <label className="text-sm text-ink-muted">
            UTR ID
            <input
              type="text"
              value={form.utrId ?? ''}
              onChange={(e) => setForm({ ...form, utrId: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <label className="text-sm text-ink-muted">
            Tennis Australia number
            <input
              type="text"
              value={form.tennisAustraliaNumber ?? ''}
              onChange={(e) => setForm({ ...form, tennisAustraliaNumber: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <label className="text-sm text-ink-muted">
            Email
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm({ ...form, email: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <label className="text-sm text-ink-muted">
            Phone
            <input
              type="text"
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
        </div>

        {error && <p className="text-sm text-danger mt-4">{error}</p>}

        {/* Club memberships: a financial toggle per club, plus a picker for
            clubs the player hasn't joined yet. The primary club is shown
            with a badge — changing it isn't part of this form. */}
        <div className="mt-8 pt-6 border-t border-border">
          <h2 className="text-lg font-bold text-ink mb-1">Club memberships</h2>
          <p className="text-sm text-ink-muted mb-3">
            Tick the clubs the player is a financial member of. Removing a club takes effect when you save.
          </p>

          {memberships.length === 0 ? (
            <p className="text-sm text-ink-subtle">This player doesn't belong to any club yet.</p>
          ) : (
            <ul className="space-y-2">
              {memberships.map((m) => (
                <li
                  key={m.clubId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-canvas px-4 py-2"
                >
                  <span className="text-sm text-ink min-w-0 truncate">
                    {m.clubName}
                    {m.isPrimaryClub && (
                      <span className="ml-2 rounded bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                        Primary club
                      </span>
                    )}
                    {m.added && (
                      <span className="ml-2 text-xs text-ink-subtle">new — saved with this form</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <label className="flex min-h-11 items-center gap-2 text-sm text-ink-muted">
                      <input
                        type="checkbox"
                        checked={m.isFinancialMember}
                        onChange={() => toggleFinancial(m.clubId)}
                      />
                      Financial member
                    </label>
                    {removeArmed === m.clubId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => removeMembership(m.clubId)}
                          className="min-h-11 rounded-lg bg-danger px-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-danger/90"
                        >
                          Confirm remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemoveArmed(null)}
                          className="min-h-11 rounded-lg px-2 text-sm text-ink-muted transition-colors duration-150 hover:text-ink"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRemoveArmed(m.clubId)}
                        aria-label={`Remove ${m.clubName} membership`}
                        className="min-h-11 rounded-lg px-2 text-sm text-ink-muted transition-colors duration-150 hover:text-danger"
                      >
                        Remove
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {clubsNotJoined.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                aria-label="Add a club"
                value={clubToAdd}
                onChange={(e) => setClubToAdd(e.target.value)}
                className="flex-1 min-w-0 rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Add another club...</option>
                {clubsNotJoined.map((club) => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addClub}
                disabled={!clubToAdd}
                className="min-h-11 shrink-0 rounded-lg border border-border-strong bg-muted px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-border disabled:opacity-50"
              >
                Add club
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <Link
            to="/manage-players"
            className="inline-flex items-center gap-1.5 border border-border-strong bg-muted text-ink font-medium px-4 py-3 rounded-lg hover:bg-border"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-primary-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
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
