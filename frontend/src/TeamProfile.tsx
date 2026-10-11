import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, ListOrdered } from 'lucide-react';

import fetchApi, { ApiError } from './api'
import LadderTable from './LadderTable'
import TeamRecordCard from './TeamRecordCard'
import UpcomingMatches from './UpcomingMatches'
import type { TeamDetail, TeamRecord } from './teamRecord'

function TeamProfile() {
  const { id } = useParams();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [record, setRecord] = useState<TeamRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  if (loading) {
    return <p className="max-w-7xl mx-auto px-4 py-12 text-gray-500">Loading...</p>;
  }

  if (notFound || !team || !record) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">Team not found.</p>
        <Link to="/clubs" className="text-sky-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Clubs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        to={`/sections/${team.sectionId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {team.sectionName}
      </Link>

      {/* Header: team name, club, and one link to the section (which
          carries the competition name within it, e.g. "Saturday Open
          Pennant · Section 1"). Ladder position/points live in the
          ladder card below instead of being duplicated up here. */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
        <p className="text-sm text-gray-500 mt-2">
          <Link to={`/clubs/${team.clubId}`} className="text-sky-700 hover:underline">{team.clubName}</Link>
          {' · '}
          <Link to={`/sections/${team.sectionId}`} className="text-sky-700 hover:underline">
            {team.competitionName} &middot; {team.sectionName}
          </Link>
        </p>
      </div>

      {/* Next fixture — one card, same component the player profile uses */}
      <UpcomingMatches teams={teams} />

      {/* Fixtures (left) + record (right), mirroring the player profile */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
            <Users className="h-5 w-5 text-sky-600" /> Players
          </h2>
          {team.players.length > 0 ? (
            <ul className="space-y-2">
              {team.players.map((player) => (
                <li key={player.personId}>
                  <Link to={`/players/${player.personId}`} className="text-sky-700 hover:underline font-medium">
                    {player.firstName} {player.lastName}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm text-center">No players registered to this team.</p>
          )}
        </div>

        <TeamRecordCard record={record} />
      </div>

      {/* Full section ladder, with this team's row picked out — same
          LadderTable the section page uses, so the numbers can never
          drift from what SectionPage shows for this section. */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-6 overflow-hidden">
        <h2 className="text-xl font-bold text-gray-900 pt-6 mb-2 flex items-center justify-center gap-2">
          <ListOrdered className="h-5 w-5 text-sky-600" /> Section Ladder
        </h2>
        <LadderTable sectionId={String(team.sectionId)} highlightTeamId={team.id} />
      </div>
    </div>
  );
}

export default TeamProfile;
