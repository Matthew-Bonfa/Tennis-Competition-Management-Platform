import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, ListOrdered } from 'lucide-react';

import fetchApi, { deleteApi } from '../../lib/api'
import { isAdmin, isClubAdmin, isAuthenticated } from '../../lib/auth';
import LadderTable from '../matches/LadderTable'
import TeamRecordCard from './TeamRecordCard'
import UpcomingMatches from '../matches/UpcomingMatches'
import type { TeamDetail, TeamRecord } from '../../lib/teamRecord'
import LoadingState from '../../components/ui/LoadingState';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';

function TeamProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [record, setRecord] = useState<TeamRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Two-step roster removal: first click arms the row, second click deletes
  const [removeArmed, setRemoveArmed] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const [teamData, recordData] = await Promise.all([
          fetchApi('/teams/' + id),
          fetchApi('/teams/' + id + '/record'),
        ]);
        setTeam(teamData);
        setRecord(recordData);
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
    fetchTeam();
  }, [id]);

  const teams = useMemo(
    () => (team ? [{ teamId: team.id, teamName: team.name }] : []),
    [team],
  );

  const canManageRoster = isAuthenticated() && (isAdmin() || isClubAdmin());

  async function handleRemovePlayer(personId: string) {
    if (!team) return;
    setRemoving(true);
    try {
      await deleteApi(`/teams/${team.id}/players/${personId}`);
      // Re-fetch so the roster (and the ladder link above it) stay truthful
      setTeam(await fetchApi('/teams/' + team.id));
      setRemoveArmed(null);
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (notFound || !team || !record) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <p className="text-ink-muted mb-4">Team not found.</p>
        <Link to="/clubs" className="text-primary-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Clubs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to={`/sections/${team.sectionId}`}
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {team.sectionName}
      </Link>

      {/* Header: team name, club, and one link to the section (which
          carries the competition name within it, e.g. "Saturday Open
          Pennant · Section 1"). Ladder position/points live in the
          ladder card below instead of being duplicated up here. */}
      <div className="bg-surface border border-border rounded-lg p-8 shadow-sm mb-6 text-center">
        <h1 className="text-3xl font-bold text-ink">{team.name}</h1>
        <p className="text-sm text-ink-subtle mt-2">
          <Link to={`/clubs/${team.clubId}`} className="text-primary-600 hover:underline">{team.clubName}</Link>
          {' · '}
          <Link to={`/sections/${team.sectionId}`} className="text-primary-600 hover:underline">
            {team.competitionName} &middot; {team.seasonName} &middot; {team.sectionName}
          </Link>
        </p>
      </div>

      {/* Next fixture — one card, same component the player profile uses */}
      <UpcomingMatches teams={teams} />

      {/* Fixtures (left) + record (right), mirroring the player profile */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start">
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink mb-4 flex items-center justify-center gap-2">
            <Users className="h-5 w-5 text-primary-600" /> Players
          </h2>
          {team.players.length > 0 ? (
            <ul className="space-y-2">
              {team.players.map((player) => (
                <li key={player.personId} className="flex items-center justify-between gap-2">
                  <Link to={`/players/${player.personId}`} className="text-primary-600 hover:underline font-medium">
                    {player.firstName} {player.lastName}
                  </Link>
                  {canManageRoster && (
                    removeArmed === player.personId ? (
                      <span className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={removing}
                          onClick={() => handleRemovePlayer(player.personId)}
                          className="min-h-11 rounded-lg bg-danger px-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-danger/90 disabled:opacity-50"
                        >
                          Confirm remove
                        </button>
                        <button
                          type="button"
                          disabled={removing}
                          onClick={() => setRemoveArmed(null)}
                          className="min-h-11 rounded-lg px-2 text-sm text-ink-muted transition-colors duration-150 hover:text-ink disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRemoveArmed(player.personId)}
                        aria-label={`Remove ${player.firstName} ${player.lastName} from the team`}
                        className="min-h-11 shrink-0 rounded-lg px-2 text-sm text-ink-muted transition-colors duration-150 hover:text-danger"
                      >
                        Remove
                      </button>
                    )
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-subtle text-sm text-center">No players registered to this team.</p>
          )}
        </div>

        <TeamRecordCard record={record} />
      </div>

      {/* Full section ladder, with this team's row picked out — same
          LadderTable the section page uses, so the numbers can never
          drift from what SectionPage shows for this section. */}
      <div className="bg-surface border border-border rounded-lg shadow-sm mt-6 overflow-hidden">
        <h2 className="text-xl font-bold text-ink pt-6 mb-2 flex items-center justify-center gap-2">
          <ListOrdered className="h-5 w-5 text-primary-600" /> Section Ladder
        </h2>
        <LadderTable sectionId={String(team.sectionId)} highlightTeamId={team.id} />
      </div>

      {/* Danger zone — admins only. The delete takes every match the team
          played with it, so it stays behind the type-the-name dialog. */}
      {isAuthenticated() && (isAdmin() || isClubAdmin()) && (
        <div className="max-w-2xl mx-auto mt-8 bg-surface border border-danger-border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold text-danger">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Deleting a team removes it for good, with every match it played.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-4 min-h-11 rounded-lg border border-danger-border bg-danger-bg px-4 text-sm font-medium text-danger transition-colors duration-150 hover:bg-danger/10"
          >
            Delete team
          </button>
        </div>
      )}

      {deleteOpen && team && (
        <ConfirmDeleteDialog
          title="Delete team"
          entityName={team.name}
          consequences={[
            `The team "${team.name}" (${team.clubName})`,
            'Its player list',
            `Every fixture and match result it played in ${team.sectionName}`,
          ]}
          onDelete={async () => {
            await deleteApi(`/teams/${team.id}`);
            navigate(`/sections/${team.sectionId}`);
          }}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}

export default TeamProfile;
