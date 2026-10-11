import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import fetchApi from './api'

interface LadderRow {
  teamId: number;
  teamName: string;
  position: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  rubbersWon: number;
  rubbersLost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  percentage: number;
  points: number;
}

interface LadderTableProps {
  sectionId: string | undefined;
  // For highlighting a specific team in the ladder table on the teams page
  highlightTeamId?: number;
}

function LadderTable({ sectionId, highlightTeamId }: LadderTableProps) {
  const [rows, setRows] = useState<LadderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchApi(`/sections/${sectionId}/ladder`)
      .then(setRows)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [sectionId]);

  if (loading) {
    return <p className="px-4 py-8 text-gray-500">Loading...</p>;
  }

  if (error) {
    return <p className="px-4 py-8 text-red-600">Failed to load the ladder.</p>;
  }

  function formatPercentage(value: number) {
    if (!isFinite(value)) {
      return '—';
    }
    return value.toFixed(2);
  }

  return (
    <div className="px-4 pb-8 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="py-2 pr-2">Pos</th>
            <th className="py-2 pr-2">Team</th>
            <th className="py-2 pr-2 text-center">P</th>
            <th className="py-2 pr-2 text-center">W</th>
            <th className="py-2 pr-2 text-center">D</th>
            <th className="py-2 pr-2 text-center">L</th>
            <th className="py-2 pr-2 text-center">Rubbers</th>
            <th className="py-2 pr-2 text-center">Sets</th>
            <th className="py-2 pr-2 text-center">Games</th>
            <th className="py-2 pr-2 text-center">%</th>
            <th className="py-2 pr-2 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isHighlighted = row.teamId === highlightTeamId;
            return (
            <tr
              key={row.teamId}
              className={
                isHighlighted
                  ? 'border-b border-gray-100 bg-sky-50 border-l-4 border-l-sky-500'
                  : 'border-b border-gray-100 even:bg-gray-50'
              }
            >
              <td className="py-2 pr-2 font-semibold">{row.position}</td>
              <td className="py-2 pr-2 font-medium text-gray-900">
                <Link to={`/teams/${row.teamId}`} className="hover:underline hover:text-sky-600">
                  {row.teamName}
                </Link>
              </td>
              <td className="py-2 pr-2 text-center">{row.matchesPlayed}</td>
              <td className="py-2 pr-2 text-center">{row.matchesWon}</td>
              <td className="py-2 pr-2 text-center">{row.matchesDrawn}</td>
              <td className="py-2 pr-2 text-center">{row.matchesLost}</td>
              <td className="py-2 pr-2 text-center">{row.rubbersWon}-{row.rubbersLost}</td>
              <td className="py-2 pr-2 text-center">{row.setsWon}-{row.setsLost}</td>
              <td className="py-2 pr-2 text-center">{row.gamesWon}-{row.gamesLost}</td>
              <td className="py-2 pr-2 text-center">{formatPercentage(row.percentage)}</td>
              <td className="py-2 pr-2 text-center font-semibold">{row.points}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default LadderTable;
