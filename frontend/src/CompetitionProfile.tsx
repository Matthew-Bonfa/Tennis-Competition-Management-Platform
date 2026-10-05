// file created by Rex Kelly
// file edited by Ella Goodwin
// AI was used in writing this file (Gemini, Claude)

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Shield, ArrowLeft, Calendar, Tag } from 'lucide-react';

function CompetitionProfile() {
  const { id } = useParams();

  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:3000/api/competitions/${id}`)
      .then(response => response.json())
      .then(data => {
        setCompetition(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  useEffect(() => {
    if (competition?.seasons?.length > 0 && selectedSeasonId === null) {
      setSelectedSeasonId(competition.seasons[0].id);
    }
  }, [competition]);

  useEffect(() => {
    if (selectedSeasonId === null) return;
    setSectionsLoading(true);
    fetch(`http://localhost:3000/api/sections?seasonId=${selectedSeasonId}`)
      .then(response => response.json())
      .then(data => {
        setSections(data);
        setSectionsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load sections:', err);
        setSectionsLoading(false);
      });
  }, [selectedSeasonId]);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (error) return <div className="text-center py-12 text-red-600">Error: {error}</div>;

  if (!competition) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 mb-4">Competition not found.</p>
        <Link to="/competitions" className="text-sky-600 hover:underline inline-flex items-center gap-1">
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
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Competitions
      </Link>

      {/* Main Header Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-sky-600 shrink-0" />
              <h1 className="text-3xl font-bold text-gray-900">{competition.name}</h1>
            </div>
            {competition.association?.name && (
              <p className="text-gray-600 flex items-center gap-1.5 text-base">
                <Shield className="h-4 w-4 text-sky-600 shrink-0" />
                Organized by <span className="font-semibold text-gray-800">{competition.association.name}</span>
              </p>
            )}
          </div>
          
          <span className="self-start md:self-center bg-sky-50 text-sky-700 font-semibold px-4 py-2 rounded-full text-sm border border-sky-200">
            Active Competition
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Overview & Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-sky-600" /> Competition Details
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Governing Body</span>
              <span className="font-medium text-gray-800">{competition.association?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Location</span>
              <span className="font-medium text-gray-400 italic">Not yet available</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Day</span>
              <span className="font-medium text-gray-400 italic">Not yet available</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Time</span>
              <span className="font-medium text-gray-400 italic">Not yet available</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Location, day, and time will display here once these fields are added to the Competition schema.
          </p>
          {competition.association?.id && (
            <Link 
              to={`/associations/${competition.association.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:underline mt-4"
            >
              View Parent Association Profile &rarr;
            </Link>
          )}
        </div>

        {/* Sections */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-600" /> Sections
            </h2>
            {competition.seasons?.length > 0 && (
              <select
                value={selectedSeasonId ?? ''}
                onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
                className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {competition.seasons.map((season: any) => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
            )}
          </div>

          {(!competition.seasons || competition.seasons.length === 0) && (
            <p className="text-gray-500 text-sm">No seasons recorded for this competition yet.</p>
          )}

          {sectionsLoading && <p className="text-gray-500 text-sm">Loading sections...</p>}
          {!sectionsLoading && sections.length === 0 && competition.seasons?.length > 0 && (
            <p className="text-gray-500 text-sm">No sections found for this season.</p>
          )}
          {!sectionsLoading && sections.length > 0 && (
            <ul className="space-y-2">
              {sections.map((section: any) => (
                <li key={section.id}>
                  <Link
                    to={`/sections/${section.id}`}
                    className="text-sky-600 hover:underline text-sm font-medium"
                  >
                    {section.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompetitionProfile;
