import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import fetchApi, { ApiError } from './api'
import MatchDetail from './MatchDetail'

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
        return <p className="max-w-3xl mx-auto px-4 py-12 text-gray-500">Loading...</p>;
    }

    if (notFound || !match) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                <p className="text-gray-600 mb-4">Match not found.</p>
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
        <div className="max-w-3xl mx-auto px-4 py-8">
            <Link
                to={`/sections/${match.sectionId}`}
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Fixtures
            </Link>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-gray-900">
                        {match.homeTeam.name} v {match.awayTeam.name}
                    </h1>
                    <p className="text-sm text-gray-500">Round {match.roundNumber}</p>
                </div>

                <div className="px-6 py-4">
                    <MatchDetail match={match} />
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-3 gap-y-2 text-center max-w-sm mx-auto">
                        <span className={homeWonMatch ? 'font-bold text-gray-900' : 'text-gray-500'}>{match.homeTeam.name}</span>
                        <span></span>
                        <span className={awayWonMatch ? 'font-bold text-gray-900' : 'text-gray-500'}>{match.awayTeam.name}</span>

                        <span className="text-lg font-semibold text-gray-900">{homeRubbersWon}</span>
                        <span className="text-xs uppercase tracking-wide text-gray-500 self-center">Rubbers</span>
                        <span className="text-lg font-semibold text-gray-900">{awayRubbersWon}</span>

                        <span className="text-lg font-semibold text-gray-900">{setsWon.home}</span>
                        <span className="text-xs uppercase tracking-wide text-gray-500 self-center">Sets</span>
                        <span className="text-lg font-semibold text-gray-900">{setsWon.away}</span>

                        <span className="text-lg font-semibold text-gray-900">{gamesWon.home}</span>
                        <span className="text-xs uppercase tracking-wide text-gray-500 self-center">Games</span>
                        <span className="text-lg font-semibold text-gray-900">{gamesWon.away}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MatchResultsPage;
