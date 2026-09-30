// file created by Rex Kelly
// AI was used in writing this file (Gemini)
// file updated by Zach Ranson

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

import fetchApi, { ApiError } from './api'

function ClubProfile() {
  const { id } = useParams();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchClub() {
      try {
        const data = await fetchApi('/clubs/' + id);
        setClub(data);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          throw err;
        }
      } finally {
        setLoading(false);
      }
    }

    fetchClub();
  }, [id]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (notFound || !club) {
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
            {club.contactPerson && (
              <p className="text-lg text-gray-600">
                Contact: {club.contactPerson.firstName} {club.contactPerson.lastName}
              </p>
            )}
          </div>
          <div className="self-start md:self-center bg-emerald-50 text-emerald-700 font-semibold px-4 py-2 rounded-full text-sm border border-emerald-200">
            {club.isFinancialMember ? 'Financial Member' : 'Non-Financial Member'}
          </div>
        </div>

        {/* Associations & Teams */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">
              Associations
            </span>
            {club.associations.length > 0 ? (
              <ul>
                {club.associations.map((a: any) => (
                  <li key={a.id}>
                    <Link to={`/associations/${a.id}`} className="text-emerald-700 hover:underline">
                      {a.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No associations</p>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">
              Teams
            </span>
            {club.teams.length > 0 ? (
              <ul>
                {club.teams.map((t: any) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    {t.name} — {t.sectionName}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No teams</p>
            )}
          </div>
        </div>

        {/* Officials */}
        <div className="mt-6">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">
              Officials
            </span>
            {club.officials.length > 0 ? (
              <ul>
                {club.officials.map((o: any) => (
                  <li key={o.personId}>
                    {o.firstName} {o.lastName} — {o.role}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No officials</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClubProfile;
