import { Fragment } from 'react';

interface MatchDetailProps {
    match: any;
}

function MatchDetail({ match }: MatchDetailProps) {
    function sidePlayers(rubber: any, teamId: number) {
        return rubber.players
            .filter((p: any) => p.teamId === teamId)
            .map((p: any) => `${p.person.firstName[0]}. ${p.person.lastName}`)
            .join(' / ');
    }

    return (
        // A single grid across every rubber, not one flex row each — that way
        // every row shares the same column widths, instead of a 3-set
        // doubles scoreline squeezing that row's name columns narrower than
        // a 2-set singles row above it.
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 text-sm">
            {match.rubbers.map((rubber: any, index: number) => {
                const homeNames = sidePlayers(rubber, match.homeTeam.id);
                const awayNames = sidePlayers(rubber, match.awayTeam.id);
                const homeWon = rubber.winningTeamId === match.homeTeam.id;
                const isLast = index === match.rubbers.length - 1;
                const rowBorder = isLast ? 'py-2' : 'py-2 border-b border-gray-50';

                return (
                    <Fragment key={rubber.id}>
                        <span className={`min-w-0 truncate text-right ${rowBorder} ${homeWon ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{homeNames}</span>
                        <span className={`font-mono text-gray-700 text-center ${rowBorder}`}>{rubber.scoreline}</span>
                        <span className={`min-w-0 truncate text-left ${rowBorder} ${!homeWon ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{awayNames}</span>
                    </Fragment>
                );
            })}
        </div>
    );
}

export default MatchDetail;
