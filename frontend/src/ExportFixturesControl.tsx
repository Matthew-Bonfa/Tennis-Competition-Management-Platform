import { useState, useEffect } from 'react';
import fetchApi from './api'
import { fixturesExportUrl } from './exportLinks'

interface Team {
    teamId: number;
    teamName: string;
}

interface ExportFixturesControlProps {
    sectionId: string;
}

// Sits below the match list on the Matches tab. Starts as a single button;
// clicking it reveals a team picker (plus "All Teams") and a confirm link
// that downloads the whole season's fixtures (not just the currently
// viewed round) for whichever team was chosen.
function ExportFixturesControl({ sectionId }: ExportFixturesControlProps) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [expanded, setExpanded] = useState(false);
    // '' is the "All Teams" option.
    const [selectedTeamId, setSelectedTeamId] = useState('');

    useEffect(() => {
        fetchApi(`/sections/${sectionId}/ladder`)
            .then(setTeams)
            .catch(() => {
                // If the team list fails to load, the picker just offers
                // "All Teams" - the export itself still works.
            });
    }, [sectionId]);

    if (!expanded) {
        return (
            <div className="px-4 pb-8">
                <button
                    onClick={() => setExpanded(true)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                    Export Season Fixtures (CSV)
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 px-4 pb-8">
            <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
                <option value="">All Teams</option>
                {teams.map((team) => (
                    <option key={team.teamId} value={team.teamId}>{team.teamName}</option>
                ))}
            </select>
            {}
            <a
                href={fixturesExportUrl(sectionId, selectedTeamId || null)}
                download
                onClick={() => setExpanded(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
                Confirm Export
            </a>
            <button
                onClick={() => setExpanded(false)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
                Cancel
            </button>
        </div>
    );
}

export default ExportFixturesControl;
