import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ChevronRight } from 'lucide-react';
import fetchApi from "../../../lib/api";
import EmptyState from '../../../components/ui/EmptyState';

interface ClubSummary {
  id: string;
  name: string;
}

function ManageClubsPage(){

  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function getClubs(){
      const response = await fetchApi("/clubs");
      setClubs(response);
    }
    getClubs();
  }, []);
  
  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Header Row: Title & New Club Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-ink">Manage Clubs</h1>
        <Link
          to="new-club"
          className="inline-flex items-center gap-1.5 bg-primary-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          New Club
        </Link>
      </div>

      {/* Search Input with Icon */}
      <div className="mb-6 relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-ink-subtle" />
        </span>
        <input
          type="text"
          value={searchTerm || ''}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search clubs..."
          className="block w-full pl-10 pr-4 py-3 border border-border-strong rounded-lg bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Club List Cards */}
      <div className="space-y-3">
        {filteredClubs.length > 0 ? (
          filteredClubs.map((club) => (
            <Link
              key={club.id}
              to={club.id}
              className="p-4 bg-surface border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-between text-ink group"
            >
              {/* font-normal keeps the club name looking standard instead of bold */}
              <span className="text-ink font-normal group-hover:text-primary-600 transition-colors">
                {club.name}
              </span>
              <ChevronRight className="h-5 w-5 text-ink-subtle group-hover:text-primary-600 transition-colors" />
            </Link>
          ))
        ) : (
          <EmptyState>No clubs found.</EmptyState>
        )}
      </div>

    </div>
  );
}

export default ManageClubsPage;
