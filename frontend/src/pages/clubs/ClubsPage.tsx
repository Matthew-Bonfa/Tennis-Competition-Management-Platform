// file created by Rex Kelly
// AI was used in writing this file (Gemini)
// file updated by Zach Ranson

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import fetchApi from '../../lib/api'
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';

function ClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchClubs() {
      const data = await fetchApi("/clubs");
      setClubs(data);
      setLoading(false);
    }

    fetchClubs();
  }, []);

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-ink mb-6">Clubs Directory</h1>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-ink-subtle" />
        </div>
        <input
          type="text"
          placeholder="Search clubs by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-4 py-3 border border-border-strong rounded-lg shadow-sm bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Results Grid */}
      {filteredClubs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map(club => (
            <Link
              key={club.id}
              to={`/clubs/${club.id}`}

              className="block bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold text-primary-800 mb-2 text-center">{club.name}</h3>
                <p className="text-sm text-ink-muted">
                  {club.isFinancialMember ? 'Financial Member' : 'Non-Financial Member'}
                </p>
                <div className="mt-3 text-xs bg-muted text-ink-muted px-2.5 py-1 rounded-md inline-block">
                  {club.teamCount} {club.teamCount === 1 ? 'Team' : 'Teams'} · {club.memberCount} {club.memberCount === 1 ? 'Member' : 'Members'}
                </div>
              </div>

              <div className="mt-6 text-primary-600 text-sm font-medium flex items-center">
                View Club Profile &rarr;
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState>No clubs found matching "{searchTerm}".</EmptyState>
      )}
    </div>
  );
}

export default ClubsPage;
