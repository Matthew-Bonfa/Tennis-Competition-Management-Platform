// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trophy, Shield } from 'lucide-react';

import { ASSOCIATIONS } from './mock-data/MockAssociations'; // Import the source data instead
import {ALL_COMPETITIONS} from './mock-data/MockCompetitions'

function CompetitionsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter competitions by name or parent association name
  const filteredCompetitions = ALL_COMPETITIONS.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (comp.associationName && comp.associationName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Tennis Competitions</h1>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search competitions by name or association..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Results Grid */}
      {filteredCompetitions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompetitions.map(comp => (
            <Link
              key={comp.id}
              to={`/competitions/${comp.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-emerald-600 shrink-0" />
                  <h3 className="text-xl font-semibold text-emerald-800">{comp.name}</h3>
                </div>
                {comp.associationName && (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-2">
                    <Shield className="h-4 w-4 text-gray-400 shrink-0" />
                    {comp.associationName}
                  </p>
                )}
              </div>

              <div className="mt-6 text-emerald-600 text-sm font-medium flex items-center">
                View Competition Profile &rarr;
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
          No competitions found matching "{searchTerm}".
        </div>
      )}
    </div>
  );
}

export default CompetitionsPage;