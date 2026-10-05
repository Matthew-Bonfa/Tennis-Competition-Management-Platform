// file created by Rex Kelly
// AI was used in writing this file (Gemini)
// file updated by Zach Ranson

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import fetchApi from './api'

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
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Clubs Directory</h1>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search clubs by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Results Grid */}
      {filteredClubs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map(club => (
            <Link
              key={club.id}
              to={`/clubs/${club.id}`}

              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold text-emerald-800 mb-2 text-center">{club.name}</h3>
                <p className="text-sm text-gray-600">
                  {club.isFinancialMember ? 'Financial Member' : 'Non-Financial Member'}
                </p>
                <div className="mt-3 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded inline-block">
                  {club.teamCount} {club.teamCount === 1 ? 'Team' : 'Teams'} · {club.memberCount} {club.memberCount === 1 ? 'Member' : 'Members'}
                </div>
              </div>

              <div className="mt-6 text-emerald-600 text-sm font-medium flex items-center">
                View Club Profile &rarr;
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
          No clubs found matching "{searchTerm}".
        </div>
      )}
    </div>
  );
}

export default ClubsPage;
