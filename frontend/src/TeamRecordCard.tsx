import { BarChart3 } from 'lucide-react';
import type { TeamRecord } from './teamRecord';

interface TeamRecordCardProps {
  record: TeamRecord;
}

function TeamRecordCard({ record }: TeamRecordCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
        <BarChart3 className="h-5 w-5 text-sky-600" /> Win/Loss Record
      </h2>

      {record.matchesPlayed === 0 ? (
        <p className="text-gray-500 text-sm py-6 text-center">No completed matches yet this season.</p>
      ) : (
        <>
          <div className="flex items-end justify-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {record.matchesWon}&ndash;{record.matchesLost}
                {record.matchesDrawn > 0 && <>&ndash;{record.matchesDrawn}</>}
              </div>
              <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">
                Won&ndash;Lost{record.matchesDrawn > 0 && <>&ndash;Drawn</>}
              </div>
            </div>
            <div className="bg-sky-50 text-sky-700 font-semibold px-4 py-2 rounded-full text-sm border border-sky-200 mb-1">
              {record.winPercentage}% win rate
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">{record.matchesPlayed}</div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Played</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{record.rubbersWon}-{record.rubbersLost}</div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Rubbers</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{record.setsWon}-{record.setsLost}</div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Sets</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{record.gamesWon}-{record.gamesLost}</div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Games</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TeamRecordCard;
