import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';

import fetchApi from './api'

interface FixtureTeam {
  id: number;
  name: string;
  clubId: string;
  clubName: string;
}

interface Fixture {
  matchId: string;
  sectionId: number;
  roundNumber: number;
  matchDate: string;
  status: string;
  homeTeam: FixtureTeam;
  awayTeam: FixtureTeam;
}

interface UpcomingTeam {
  teamId: number;
  teamName: string;
}

interface UpcomingMatchesProps {
  teams: UpcomingTeam[];
}

// One card per team the player belongs to, showing that team's next
// scheduled fixture. Each team is fetched independently (GET /fixtures
// already sorts by matchDate ascending, so the first "upcoming" result is
// the next match) so one team's fixtures failing to load doesn't block
// the others from showing.
function UpcomingMatches({ teams }: UpcomingMatchesProps) {
  const [nextByTeam, setNextByTeam] = useState<Record<number, Fixture | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchNextMatches() {
      const entries = await Promise.all(
        teams.map(async (team) => {
          const fixtures: Fixture[] = await fetchApi(`/fixtures?teamId=${team.teamId}&status=upcoming`);
          return [team.teamId, fixtures[0] ?? null] as const;
        }),
      );

      if (!cancelled) {
        setNextByTeam(Object.fromEntries(entries));
        setLoading(false);
      }
    }

    fetchNextMatches();
    return () => {
      cancelled = true;
    };
  }, [teams]);

  if (teams.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${Math.min(teams.length, 3)}, minmax(0, 1fr))` }}>
      {teams.map((team) => {
        const fixture = nextByTeam[team.teamId];
        const opponent = fixture
          ? fixture.homeTeam.id === team.teamId
            ? fixture.awayTeam.name
            : fixture.homeTeam.name
          : null;

        return (
          <div key={team.teamId} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm text-center">
            <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
              {team.teamName}
            </div>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : fixture ? (
              <Link to={`/matches/${fixture.matchId}`} className="block hover:text-sky-600">
                <div className="flex items-center justify-center gap-1.5 text-gray-900 font-semibold">
                  <CalendarClock className="h-4 w-4 text-sky-600 shrink-0" />
                  vs {opponent}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Round {fixture.roundNumber} &middot; {new Date(fixture.matchDate).toLocaleDateString()}
                </p>
              </Link>
            ) : (
              <p className="text-gray-400 text-sm">No upcoming match scheduled</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default UpcomingMatches;
