// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import { useParams, Link } from 'react-router-dom';
import { Trophy, Building2 } from 'lucide-react';

import { ASSOCIATIONS } from './mock-data/MockAssociations';

function AssociationProfile() {
  const { id } = useParams();
  const association = ASSOCIATIONS.find(a => a.id === id);

  if (!association) {
    return <div className="p-8 text-center text-gray-600">Association not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{association.name}</h1>
        <p className="text-lg text-gray-700">{association.description}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Competitions List */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-600" /> Competitions
          </h2>
          <ul className="divide-y divide-gray-100">
            {association.competitions.map(comp => (
              <li key={comp.id} className="py-3 text-gray-800 font-medium">
                {comp.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Clubs List */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" /> Affiliated Clubs
          </h2>
          <ul className="divide-y divide-gray-100">
            {association.clubs.map(club => (
              <li key={club.id}>
                <Link
                  to={`/clubs/${club.id}`}
                  className="py-3 flex justify-between items-center group hover:bg-gray-50 -mx-2 px-2 rounded-md transition-colors"
                >
                  <span className="font-medium text-gray-800 group-hover:text-emerald-600 transition-colors">
                    {club.name}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {club.location} ({club.courts} courts)
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AssociationProfile;