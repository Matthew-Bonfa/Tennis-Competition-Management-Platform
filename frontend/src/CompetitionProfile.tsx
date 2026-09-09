// file created by Rex Kelly
// AI was used in writing this file (Gemini)

import { useParams, Link } from 'react-router-dom';
import { Trophy, Shield, ArrowLeft, Calendar, Tag } from 'lucide-react';

import { ALL_COMPETITIONS } from './mock-data/MockCompetitions';

function CompetitionProfile() {
  const { id } = useParams();
  const competition = ALL_COMPETITIONS.find(c => c.id === id);

  if (!competition) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">Competition not found.</p>
        <Link to="/competitions" className="text-emerald-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Competitions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link 
        to="/competitions" 
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Competitions
      </Link>

      {/* Main Header Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-emerald-600 shrink-0" />
              <h1 className="text-3xl font-bold text-gray-900">{competition.name}</h1>
            </div>
            {competition.associationName && (
              <p className="text-gray-600 flex items-center gap-1.5 text-base">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                Organized by <span className="font-semibold text-gray-800">{competition.associationName}</span>
              </p>
            )}
          </div>
          
          <span className="self-start md:self-center bg-emerald-50 text-emerald-700 font-semibold px-4 py-2 rounded-full text-sm border border-emerald-200">
            Active Competition
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Overview & Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-emerald-600" /> Competition Details
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Competition ID</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-800">{competition.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Governing Body</span>
              <span className="font-medium text-gray-800">{competition.associationName || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Schedule & Format Placeholder */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" /> Format & Schedule
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Fixtures, ladder standings, and match formats for this competition are managed under the rules of the affiliated association.
          </p>
          {competition.associationId && (
            <Link 
              to={`/associations/${competition.associationId}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline"
            >
              View Parent Association Profile &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompetitionProfile;