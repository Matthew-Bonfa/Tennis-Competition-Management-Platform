import { BarChart3 } from 'lucide-react';
import type { TeamRecord } from '../../lib/teamRecord';

interface TeamRecordCardProps {
  record: TeamRecord;
}

function TeamRecordCard({ record }: TeamRecordCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold text-ink mb-4 flex items-center justify-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary-600" /> Win/Loss Record
      </h2>

      {record.matchesPlayed === 0 ? (
        <p className="text-ink-subtle text-sm py-6 text-center">No completed matches yet this season.</p>
      ) : (
        <>
          <div className="flex items-end justify-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="text-center">
              <div className="text-4xl font-bold text-ink">
                {record.matchesWon}&ndash;{record.matchesLost}
                {record.matchesDrawn > 0 && <>&ndash;{record.matchesDrawn}</>}
              </div>
              <div className="text-xs uppercase tracking-wider text-ink-subtle mt-1">
                Won&ndash;Lost{record.matchesDrawn > 0 && <>&ndash;Drawn</>}
              </div>
            </div>
            <div className="bg-primary-50 text-primary-700 font-semibold px-4 py-2 rounded-full text-sm border border-primary-200 mb-1">
              {record.winPercentage}% win rate
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <div>
              <div className="text-lg font-semibold text-ink">{record.matchesPlayed}</div>
              <div className="text-xs uppercase tracking-wide text-ink-subtle">Played</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-ink">{record.rubbersWon}-{record.rubbersLost}</div>
              <div className="text-xs uppercase tracking-wide text-ink-subtle">Rubbers</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-ink">{record.setsWon}-{record.setsLost}</div>
              <div className="text-xs uppercase tracking-wide text-ink-subtle">Sets</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-ink">{record.gamesWon}-{record.gamesLost}</div>
              <div className="text-xs uppercase tracking-wide text-ink-subtle">Games</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TeamRecordCard;
