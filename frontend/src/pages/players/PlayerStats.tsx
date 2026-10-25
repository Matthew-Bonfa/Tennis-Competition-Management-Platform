import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';

import type { PlayerRecord, RubberType } from '../../lib/playerRecord';
import { RUBBER_TYPE_LABELS, sumTotals, winPercentage } from '../../lib/playerRecord';

interface PlayerStatsProps {
  record: PlayerRecord;
}

type MatchTypeFilter = 'all' | RubberType;
type YearFilter = 'all' | number;

// Win/loss panel for the player profile's right-hand column
function PlayerStats({ record }: PlayerStatsProps) {
  const [year, setYear] = useState<YearFilter>('all');
  const [matchType, setMatchType] = useState<MatchTypeFilter>('all');

  const selectedBuckets = useMemo(
    () =>
      record.buckets.filter(
        (bucket) =>
          (year === 'all' || bucket.year === year) &&
          (matchType === 'all' || bucket.rubberType === matchType),
      ),
    [record.buckets, year, matchType],
  );

  const totals = sumTotals(selectedBuckets);
  const percentage = winPercentage(totals);

  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold text-ink mb-4 flex items-center justify-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary-600" /> Win/Loss Record
      </h2>

      {/* Filter row: year dropdown + match type segmented control */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="border border-border-strong rounded-lg min-h-11 px-3 py-1.5 bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All years</option>
          {record.years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Hidden entirely for a player who's only ever played one match
            type — there's nothing to toggle between. */}
        {record.rubberTypes.length > 1 && (
          <div className="inline-flex rounded-lg border border-border-strong overflow-hidden text-sm">
            <button
              onClick={() => setMatchType('all')}
              className={`min-h-11 px-3 py-1.5 font-medium ${matchType === 'all' ? 'bg-primary-600 text-white' : 'bg-surface text-ink-muted hover:bg-canvas'}`}
            >
              All
            </button>
            {record.rubberTypes.map((type) => (
              <button
                key={type}
                onClick={() => setMatchType(type)}
                className={`min-h-11 px-3 py-1.5 font-medium border-l border-border-strong ${matchType === type ? 'bg-primary-600 text-white' : 'bg-surface text-ink-muted hover:bg-canvas'}`}
              >
                {RUBBER_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      {totals.played === 0 ? (
        <p className="text-ink-subtle text-sm py-6 text-center">
          No results for this filter.
        </p>
      ) : (
        <>
          {/* Headline: won-lost and win percentage */}
          <div className="flex items-end justify-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="text-center">
              <div className="text-4xl font-bold text-ink">
                {totals.won}&ndash;{totals.lost}
              </div>
              <div className="text-xs uppercase tracking-wider text-ink-subtle mt-1">Won&ndash;Lost</div>
            </div>
            <div className="bg-primary-50 text-primary-700 font-semibold px-4 py-2 rounded-full text-sm border border-primary-200 mb-1">
              {percentage}% win rate
            </div>
          </div>

          {/* Secondary stat tiles */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div>
              <div className="text-lg font-semibold text-ink">{totals.played}</div>
              <div className="text-xs uppercase tracking-wide text-ink-subtle">Played</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-ink">
                {totals.setsWon}-{totals.setsLost}
              </div>
              <div className="text-xs uppercase tracking-wide text-ink-subtle">Sets</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-ink">
                {totals.gamesWon}-{totals.gamesLost}
              </div>
              <div className="text-xs uppercase tracking-wide text-ink-subtle">Games</div>
            </div>
          </div>

          {/* Breakdown table: one row per bucket in the current selection.
              Every header is text-center, matching its column's data, so
              the numbers line up directly under their titles. */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-ink-subtle border-b border-border">
                  <th className="py-2 px-2 text-center">Year</th>
                  <th className="py-2 px-2 text-center">Match Type</th>
                  <th className="py-2 px-2 text-center">W&ndash;L</th>
                  <th className="py-2 px-2 text-center">Sets</th>
                  <th className="py-2 px-2 text-center">Games</th>
                </tr>
              </thead>
              <tbody>
                {selectedBuckets.map((bucket) => (
                  <tr key={`${bucket.year}-${bucket.rubberType}`} className="border-b border-border even:bg-canvas">
                    <td className="py-2 px-2 text-center font-medium text-ink">{bucket.year}</td>
                    <td className="py-2 px-2 text-center">{RUBBER_TYPE_LABELS[bucket.rubberType]}</td>
                    <td className="py-2 px-2 text-center">{bucket.won}&ndash;{bucket.lost}</td>
                    <td className="py-2 px-2 text-center">{bucket.setsWon}-{bucket.setsLost}</td>
                    <td className="py-2 px-2 text-center">{bucket.gamesWon}-{bucket.gamesLost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default PlayerStats;
