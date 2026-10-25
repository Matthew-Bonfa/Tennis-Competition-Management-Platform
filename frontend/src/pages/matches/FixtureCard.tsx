import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, PencilLine } from 'lucide-react';

import fetchApi, { ApiError } from '../../lib/api';
import { isAuthenticated } from '../../lib/auth';

interface FixtureTeam {
    id: number;
    name: string;
    clubId: string;
    clubName: string;
}

interface FixtureResult {
    homeRubbersWon: number;
    awayRubbersWon: number;
    winner: 'home' | 'away' | 'draw';
}

interface Fixture {
    matchId: string;
    sectionId: number;
    roundNumber: number;
    matchDate: string;
    status: 'scheduled' | 'awaiting_confirmation' | 'disputed' | 'completed' | 'washout' | 'forfeit' | 'bye';
    homeTeam: FixtureTeam;
    awayTeam: FixtureTeam;
    result: FixtureResult | null;
}

const STATUS_LABELS: Partial<Record<Fixture['status'], string>> = {
    awaiting_confirmation: 'Awaiting confirmation',
    disputed: 'Disputed',
};

interface FixtureCardProps {
    fixture: Fixture;
}

// Result entry opens once the match day arrives, and stays open if nobody has entered one yet
function hasStarted(matchDate: string) {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return new Date(matchDate) <= endOfToday;
}

function FixtureCard({ fixture }: FixtureCardProps) {
    // Whether the signed-in viewer is allowed to enter this result 
    const [canEnter, setCanEnter] = useState(false);
    const entryOpen = fixture.status === 'scheduled' && hasStarted(fixture.matchDate);

    useEffect(() => {
        if (!entryOpen || !isAuthenticated()) {
            return;
        }

        let cancelled = false;
        fetchApi(`/matches/${fixture.matchId}/result-form`)
            .then(() => {
                if (!cancelled) {
                    setCanEnter(true);
                }
            })
            .catch((err) => {
                // A 403 just means this viewer can't enter the result, so they keep seeing the date
                if (!(err instanceof ApiError && err.status === 403)) {
                    throw err;
                }
            });

        return () => {
            cancelled = true;
        };
    }, [entryOpen, fixture.matchId]);

    function renderStatus() {
        if (fixture.status === 'completed' && fixture.result) {
            const { homeRubbersWon, awayRubbersWon, winner } = fixture.result;
            const winnerName =
                winner === 'home' ? fixture.homeTeam.name :
                winner === 'away' ? fixture.awayTeam.name :
                'Drawn';

            return (
                <>
                    {winner !== 'draw' && (
                        <span className="font-semibold text-primary-700">{winnerName} WON</span>
                    )}
                    <span className="bg-muted text-ink font-semibold px-3 py-1 rounded-full text-sm">
                        {homeRubbersWon}–{awayRubbersWon}
                    </span>
                </>
            );
        }

        if (fixture.status === 'scheduled' && canEnter) {
            return (
                <Link
                    to={`/matches/${fixture.matchId}/enter`}
                    className="pointer-events-auto inline-flex min-h-11 items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                >
                    <PencilLine className="h-4 w-4" />
                    Enter result
                </Link>
            );
        }

        if (fixture.status === 'scheduled') {
            const dateLabel = new Date(fixture.matchDate).toLocaleDateString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
            });
            return <span className="text-ink-subtle text-sm">{dateLabel}</span>;
        }

        return <span className="text-ink-subtle text-sm capitalize">{STATUS_LABELS[fixture.status] ?? fixture.status}</span>;
    }

    return (
        <div className="relative flex items-center justify-between px-4 py-4 border-b border-border hover:bg-canvas transition-colors">
            {/* Full-card overlay link to the match. Sits behind the team-name
                links (z-0 vs z-10) so clicking a name goes to that team and
                clicking anywhere else goes to the match — nesting an <a>
                inside this one would be invalid HTML and fire both navigations. */}
            <Link to={`/matches/${fixture.matchId}`} className="absolute inset-0 z-0" aria-label="View match result" />

            <div className="relative z-10 text-ink">
                <Link to={`/teams/${fixture.homeTeam.id}`} className="hover:underline hover:text-primary-600">
                    {fixture.homeTeam.name}
                </Link>
                <span className="text-ink-subtle mx-1">v</span>
                <Link to={`/teams/${fixture.awayTeam.id}`} className="hover:underline hover:text-primary-600">
                    {fixture.awayTeam.name}
                </Link>
            </div>

            <div className="relative z-10 flex items-center gap-3 pointer-events-none">
                {renderStatus()}
                <ChevronRight className="h-4 w-4 text-ink-subtle" />
            </div>
        </div>
    );
}

export default FixtureCard;
