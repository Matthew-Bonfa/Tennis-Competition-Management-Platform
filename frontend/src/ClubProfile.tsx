// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import { useParams, Link } from 'react-router-dom';
import { MapPin, Building2, ArrowLeft } from 'lucide-react';

import { ALL_CLUBS } from './mock-data/MockClubs';

function ClubProfile() {
  const { id } = useParams();
  const club = ALL_CLUBS.find(c => c.id === id);

  if (!club) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">Club not found.</p>
        <Link to="/clubs" className="text-emerald-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Clubs Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link 
        to="/clubs" 
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Clubs
      </Link>

      {/* Main Profile Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{club.name}</h1>
            <p className="text-lg text-gray-600 flex items-center gap-1.5">
              <MapPin className="h-5 w-5 text-emerald-600 shrink-0" />
              {club.location}
            </p>
          </div>
          <div className="self-start md:self-center bg-emerald-50 text-emerald-700 font-semibold px-4 py-2 rounded-full text-sm border border-emerald-200">
            {club.courts} {club.courts === 1 ? 'Court' : 'Courts'} Available
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">
              Location
            </span>
            <p className="text-gray-900 font-medium text-lg">{club.location}</p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">
              Facility Capacity
            </span>
            <p className="text-gray-900 font-medium text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              {club.courts} Tennis {club.courts === 1 ? 'Court' : 'Courts'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClubProfile;