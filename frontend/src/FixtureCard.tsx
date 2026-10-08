import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

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
    status: 'scheduled' | 'completed' | 'washout' | 'forfeit' | 'bye';
    homeTeam: FixtureTeam;
    awayTeam: FixtureTeam;
    result: FixtureResult | null;
}

interface FixtureCardProps {
    fixture: Fixture;
}

function FixtureCard({ fixture }: FixtureCardProps) {
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
                        <span className="font-semibold text-sky-700">{winnerName} WON</span>
                    )}
                    <span className="bg-gray-100 text-gray-900 font-semibold px-3 py-1 rounded-full text-sm">
                        {homeRubbersWon}–{awayRubbersWon}
                    </span>
                </>
            );
        }

        if (fixture.status === 'scheduled') {
            const dateLabel = new Date(fixture.matchDate).toLocaleDateString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
            });
            return <span className="text-gray-500 text-sm">{dateLabel}</span>;
        }

        return <span className="text-gray-500 text-sm capitalize">{fixture.status}</span>;
    }

    return (
        <div className="relative flex items-center justify-between px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            {/* Full-card overlay link to the match. Sits behind the team-name
                links (z-0 vs z-10) so clicking a name goes to that team and
                clicking anywhere else goes to the match — nesting an <a>
                inside this one would be invalid HTML and fire both navigations. */}
            <Link to={`/matches/${fixture.matchId}`} className="absolute inset-0 z-0" aria-label="View match result" />

            <div className="relative z-10 text-gray-900">
                <Link to={`/teams/${fixture.homeTeam.id}`} className="hover:underline hover:text-sky-600">
                    {fixture.homeTeam.name}
                </Link>
                <span className="text-gray-400 mx-1">v</span>
                <Link to={`/teams/${fixture.awayTeam.id}`} className="hover:underline hover:text-sky-600">
                    {fixture.awayTeam.name}
                </Link>
            </div>

            <div className="relative z-10 flex items-center gap-3 pointer-events-none">
                {renderStatus()}
                <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
        </div>
    );
}

export default FixtureCard;
