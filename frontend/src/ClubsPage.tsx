// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import {useState} from 'react';
import {Search, MapPin} from 'lucide-react';
import {Link} from 'react-router-dom';

import {ASSOCIATIONS} from './mock-data/MockAssociations'
import {ALL_CLUBS} from './mock-data/MockClubs'
import ClubProfile from './ClubProfile'





function ClubsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter clubs dynamically based on name or location
  const filteredClubs = ALL_CLUBS.filter(club => 
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          placeholder="Search clubs by name or location..."
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
                <h3 className="text-xl font-semibold text-emerald-800 mb-2">{club.name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                  {club.location}
                </p>
                <div className="mt-3 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded inline-block">
                  {club.courts} {club.courts === 1 ? 'Court' : 'Courts'} Available
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
