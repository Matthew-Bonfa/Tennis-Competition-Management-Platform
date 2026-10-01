// file created by Rex Kelly
// search/list implementation added — see PlayerProfile.tsx for the detail page

import { useState, useEffect } from 'react'
import { Search, User } from 'lucide-react'
import { Link } from 'react-router-dom'

import fetchApi from './api'

interface PlayerSummary {
  id: string;
  personCode: string;
  firstName: string;
  lastName: string;
  primaryClubName: string | null;
}

function PlayersPage() {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchPlayers() {
      // Filtering client-side against the full list, same as ClubsPage —
      // the backend's ?search= param exists for when the player list
      // grows large enough that fetching everyone up front stops making
      // sense, but isn't needed yet.
      const data = await fetchApi('/players');
      setPlayers(data);
      setLoading(false);
    }

    fetchPlayers();
  }, []);

  const filteredPlayers = players.filter((player) => {
    const term = searchTerm.toLowerCase();
    return (
      player.firstName.toLowerCase().includes(term) ||
      player.lastName.toLowerCase().includes(term) ||
      player.personCode.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Players Database</h1>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search players by name or player code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Results Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <Link
              key={player.id}
              to={`/players/${player.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-emerald-600 shrink-0" />
                <h3 className="text-xl font-semibold text-emerald-800">
                  {player.firstName} {player.lastName}
                </h3>
              </div>
              <p className="text-sm text-gray-600">{player.primaryClubName ?? 'No club recorded'}</p>
              <div className="mt-3 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded inline-block">
                {player.personCode}
              </div>
              <div className="mt-6 text-emerald-600 text-sm font-medium flex items-center">
                View Player Profile &rarr;
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
          No players found matching "{searchTerm}".
        </div>
      )}
    </div>
  );
}

export default PlayersPage;
