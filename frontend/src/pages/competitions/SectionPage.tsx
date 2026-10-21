import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import fetchApi, { ApiError } from '../../lib/api'
import RoundSelector from '../matches/RoundSelector'
import FixtureList from '../matches/FixtureList'
import LadderTable from '../matches/LadderTable'
import ExportFixturesControl from '../matches/ExportFixturesControl'
import { ladderExportUrl } from '../../lib/exportLinks'
import LoadingState from '../../components/ui/LoadingState';

function SectionPage() {
    const { sectionId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const tab = searchParams.get('tab') ??  'matches';
    const activeRound = searchParams.get('round');

    const [rounds, setRounds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function fetchRounds() {
            try {
                const data = await fetchApi(`/sections/${sectionId}/rounds`);
                setRounds(data);

                if (activeRound === null && data.length > 0) {
                    const defaultRound = data.find((r: any) => !r.allComplete) ?? data[data.length - 1];
                    setSearchParams({ tab, round: String(defaultRound.roundNumber) }, { replace: true });
                }
            }
            catch (err) {
                if (err instanceof ApiError && err.status === 404) {
                    setNotFound(true);
                }
                else {
                    throw err;
                }
            }
            finally {
                setLoading(false);
            }
        }
        fetchRounds();
    }, [sectionId]);

    function buildParams(nextTab: string, nextRound: string | null) {
        const params: Record<string, string> = { tab: nextTab };
        if (nextRound !== null) {
            params.round = nextRound;
        }
        return params;
    }

    function selectTab(nextTab: string) {
        setSearchParams(buildParams(nextTab, activeRound));
    }

    function selectRound(nextRound: number) {
        setSearchParams(buildParams(tab, String(nextRound)));
    }

    if (loading) {
        return <LoadingState />;
    }

    if (notFound) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
                <p className="text-ink-muted">Section not found.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {/* Tab header */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => selectTab('matches')}
                    className={`flex-1 py-6 text-2xl font-bold ${tab === 'matches' ? 'text-ink bg-surface' : 'text-ink-subtle bg-canvas'}`}
                >
                    Matches
                </button>
                <button
                    onClick={() => selectTab('ladder')}
                    className={`flex-1 py-6 text-2xl font-bold ${tab === 'ladder' ? 'text-ink bg-surface' : 'text-ink-subtle bg-canvas'}`}
                >
                    Ladder
                </button>
            </div>

            {tab === 'matches' ? (
                <>
                    <RoundSelector rounds={rounds} activeRound={activeRound} onChange={selectRound} />
                    <FixtureList sectionId={sectionId} round={activeRound} />
                    {/* Exports the full season (not just the active round), scoped by team */}
                    <ExportFixturesControl sectionId={sectionId!} />
                </>
            ) : (
                <>
                    <LadderTable sectionId={sectionId} />
                    <div className="px-4 pb-8">
                        <a
                            href={ladderExportUrl(sectionId!)}
                            download
                            className="text-sm font-semibold text-primary-600 hover:text-primary-800"
                        >
                            Export Ladder (CSV)
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}

export default SectionPage;