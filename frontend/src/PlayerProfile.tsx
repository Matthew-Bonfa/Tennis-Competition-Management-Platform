import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Trophy } from 'lucide-react';

import fetchApi, { ApiError } from './api'
import PlayerStats from './PlayerStats'
import UpcomingMatches from './UpcomingMatches'
import type { PlayerRecord } from './playerRecord'

interface PlayerClub {
  id: string;
  name: string;
  isPrimaryClub: boolean;
  isFinancialMember: boolean;
}

interface PlayerCompetition {
  teamId: number;
  teamName: string;
  clubId: string;
  clubName: string;
  sectionId: number;
  sectionName: string;
  seasonId: number;
  seasonName: string;
  competitionId: string;
  competitionName: string;
  associationId: string;
  associationName: string;
}

interface PlayerDetail {
  id: string;
  personCode: string;
  firstName: string;
  lastName: string;
  primaryClubName: string | null;
  dateOfBirth: string | null;
  utrId: string | null;
  tennisAustraliaNumber: string | null;
  clubs: PlayerClub[];
  competitions: PlayerCompetition[];
}

function PlayerProfile() {
  const { id } = useParams();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [record, setRecord] = useState<PlayerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        // Profile info and the win/loss record are two independent calls —
        // the record endpoint walks the player's whole rubber history, so
        // keeping it separate means a profile view that only needs the
        // "current information" side isn't paying for that every time.
        const [playerData, recordData] = await Promise.all([
          fetchApi('/players/' + id),
          fetchApi('/players/' + id + '/record'),
        ]);
        setPlayer(playerData);
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

    fetchPlayer();
  }, [id]);

  // One entry per distinct team, for the "next match" row — memoized so
  // UpcomingMatches (which fetches per team) doesn't see a new array
  // identity, and re-fetch, on every render.
  const teams = useMemo(() => {
    if (!player) {
      return [];
    }
    const byTeamId = new Map<number, { teamId: number; teamName: string }>();
    for (const entry of player.competitions) {
      byTeamId.set(entry.teamId, { teamId: entry.teamId, teamName: entry.teamName });
    }
    return [...byTeamId.values()];
  }, [player]);

  if (loading) {
    return <p className="max-w-7xl mx-auto px-4 py-12 text-gray-500">Loading...</p>;
  }

  if (notFound || !player || !record) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">Player not found.</p>
        <Link to="/players" className="text-emerald-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Players
        </Link>
      </div>
    );
  }

  // Group the player's team memberships by competition
  const competitionsById = new Map<string, PlayerCompetition[]>();
  for (const entry of player.competitions) {
    const existing = competitionsById.get(entry.competitionId) ?? [];
    existing.push(entry);
    competitionsById.set(entry.competitionId, existing);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        to="/players"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Players
      </Link>

      {/* Header — just the name */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {player.firstName} {player.lastName}
        </h1>
      </div>

      {/* Upcoming matches — one card per team the player plays for */}
      <UpcomingMatches teams={teams} />

      {/* Current information (left) + win/loss stats (right) side by side. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start">
        <div className="space-y-6">
          {/* Clubs */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" /> Clubs
            </h2>
            {player.clubs.length > 0 ? (
              <ul className="space-y-2">
                {player.clubs.map((club) => (
                  <li key={club.id} className="flex items-center justify-between gap-2">
                    <Link to={`/clubs/${club.id}`} className="text-emerald-700 hover:underline font-medium">
                      {club.name}
                    </Link>
                    {club.isPrimaryClub && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0">
                        Primary
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm text-center">Not currently a member of any club.</p>
            )}
          </div>

          {/* Competitions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-600" /> Competitions
            </h2>
            {competitionsById.size > 0 ? (
              <ul className="space-y-4">
                {[...competitionsById.entries()].map(([competitionId, entries]) => (
                  <li key={competitionId} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <Link
                      to={`/competitions/${competitionId}`}
                      className="text-emerald-700 hover:underline font-semibold"
                    >
                      {entries[0].competitionName}
                    </Link>
                    <ul className="mt-1 space-y-1">
                      {entries.map((entry) => (
                        <li key={entry.teamId} className="text-sm text-gray-600">
                          {entry.seasonName} &middot;{' '}
                          <Link to={`/sections/${entry.sectionId}`} className="hover:underline hover:text-emerald-600">
                            {entry.sectionName}
                          </Link>{' '}
                          &middot; {entry.teamName}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm text-center">Not currently entered in any competition.</p>
            )}
          </div>
        </div>

        <PlayerStats record={record} />
      </div>
    </div>
  );
}

export default PlayerProfile;
