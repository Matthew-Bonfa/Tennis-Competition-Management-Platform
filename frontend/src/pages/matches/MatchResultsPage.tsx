import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import fetchApi, { ApiError } from '../../lib/api'
import MatchDetail from './MatchDetail'
import ResultStatusPanel from './ResultStatusPanel'
import LoadingState from '../../components/ui/LoadingState';

function MatchResultsPage() {
    const { matchId } = useParams();
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function fetchMatch() {
            try {
                const data = await fetchApi(`/matches/${matchId}`);
                setMatch(data);
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

        fetchMatch();
    }, [matchId]);

    if (loading) {
        return <LoadingState />;
    }

    if (notFound || !match) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
                <p className="text-ink-muted">Match not found.</p>
            </div>
        );
    }

    const homeRubbersWon = match.rubbers.filter((r: any) => r.winningTeamId === match.homeTeam.id).length;
    const awayRubbersWon = match.rubbers.filter((r: any) => r.winningTeamId === match.awayTeam.id).length;
    const homeWonMatch = homeRubbersWon > awayRubbersWon;
    const awayWonMatch = awayRubbersWon > homeRubbersWon;

    const setsWon = match.rubbers.reduce(
        (totals: { home: number; away: number }, rubber: any) => ({
            home: totals.home + rubber.summary.homeSetsWon,
            away: totals.away + rubber.summary.awaySetsWon,
        }),
        { home: 0, away: 0 },
    );

    const gamesWon = match.rubbers.reduce(
        (totals: { home: number; away: number }, rubber: any) => ({
            home: totals.home + rubber.summary.homeGamesWon,
            away: totals.away + rubber.summary.awayGamesWon,
        }),
        { home: 0, away: 0 },
    );

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <Link
                to={`/sections/${match.sectionId}`}
                className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-primary-600 mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Fixtures
            </Link>

            <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h1 className="text-3xl font-bold text-ink">
                        <Link to={`/teams/${match.homeTeam.id}`} className="hover:underline hover:text-primary-600">
                            {match.homeTeam.name}
                        </Link>
                        {' v '}
                        <Link to={`/teams/${match.awayTeam.id}`} className="hover:underline hover:text-primary-600">
                            {match.awayTeam.name}
                        </Link>
                    </h1>
                    <p className="text-sm text-ink-subtle">Round {match.roundNumber}</p>
                </div>

                <div className="px-6 py-4">
                    <ResultStatusPanel match={match} onMatchChange={setMatch} />
                    {match.rubbers.length === 0 ? (
                        <p className="text-sm text-ink-subtle">No result has been entered yet.</p>
                    ) : (
                        <MatchDetail match={match} />
                    )}
                </div>

                {match.rubbers.length > 0 && (
                    <div className="px-6 py-4 border-t border-border bg-canvas">
                        {match.matchStatus !== 'completed' && (
                            <p className="text-center text-xs uppercase tracking-wide text-warning mb-3">Provisional result</p>
                        )}
                        <div className="grid grid-cols-3 gap-y-2 text-center max-w-sm mx-auto">
                            <span className={homeWonMatch ? 'font-bold text-ink' : 'text-ink-subtle'}>{match.homeTeam.name}</span>
                            <span></span>
                            <span className={awayWonMatch ? 'font-bold text-ink' : 'text-ink-subtle'}>{match.awayTeam.name}</span>

                            <span className="text-lg font-semibold text-ink">{homeRubbersWon}</span>
                            <span className="text-xs uppercase tracking-wide text-ink-subtle self-center">Rubbers</span>
                            <span className="text-lg font-semibold text-ink">{awayRubbersWon}</span>

                            <span className="text-lg font-semibold text-ink">{setsWon.home}</span>
                            <span className="text-xs uppercase tracking-wide text-ink-subtle self-center">Sets</span>
                            <span className="text-lg font-semibold text-ink">{setsWon.away}</span>

                            <span className="text-lg font-semibold text-ink">{gamesWon.home}</span>
                            <span className="text-xs uppercase tracking-wide text-ink-subtle self-center">Games</span>
                            <span className="text-lg font-semibold text-ink">{gamesWon.away}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MatchResultsPage;
