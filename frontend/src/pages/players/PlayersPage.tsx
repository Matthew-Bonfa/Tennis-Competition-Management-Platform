// file created by Rex Kelly
// search/list implementation added — see PlayerProfile.tsx for the detail page

import { useState, useEffect } from 'react'
import { Search, User, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import fetchApi from '../../lib/api'
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';

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
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    return (
      fullName.includes(term) ||
      player.personCode.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-ink mb-6">Players Database</h1>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-ink-subtle" />
        </div>
        <input
          type="text"
          placeholder="Search players by name or player code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-4 py-3 border border-border-strong rounded-lg bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Results Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <Link
              key={player.id}
              to={`/players/${player.id}`}
              className="block bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-primary-600 shrink-0" />
                <h2 className="text-xl font-semibold text-primary-800">
                  {player.firstName} {player.lastName}
                </h2>
              </div>
              <p className="text-sm text-ink-muted">{player.primaryClubName ?? 'No club recorded'}</p>
              <div className="mt-3 text-xs bg-muted text-ink-muted px-2.5 py-1 rounded-md inline-block">
                {player.personCode}
              </div>
              <div className="mt-6 text-primary-600 text-sm font-medium flex items-center gap-1">
                View Player Profile <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState>No players found matching "{searchTerm}".</EmptyState>
      )}
    </div>
  );
}

export default PlayersPage;
