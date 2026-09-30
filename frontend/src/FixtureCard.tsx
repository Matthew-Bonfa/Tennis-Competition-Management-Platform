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
                        <span className="font-semibold text-emerald-700">{winnerName} WON</span>
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
        <Link
            to={`/matches/${fixture.matchId}`}
            className="flex items-center justify-between px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
            <div className="text-gray-900">
                {fixture.homeTeam.name} <span className="text-gray-400 mx-1">v</span> {fixture.awayTeam.name}
            </div>

            <div className="flex items-center gap-3">
                {renderStatus()}
                <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
        </Link>
    );
}

export default FixtureCard;
