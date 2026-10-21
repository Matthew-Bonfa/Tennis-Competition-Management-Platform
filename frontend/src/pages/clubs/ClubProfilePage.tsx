// file created by Rex Kelly
// AI was used in writing this file (Gemini)
// file updated by Zach Ranson

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

import fetchApi, { ApiError } from '../../lib/api'
import LoadingState from '../../components/ui/LoadingState';

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
    return <LoadingState />;
  }

  if (notFound || !club) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <p className="text-ink-muted mb-4">Club not found.</p>
        <Link to="/clubs" className="text-primary-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Clubs Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Button */}
      <Link
        to="/clubs"
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Clubs
      </Link>

      {/* Main Profile Card */}
      <div className="bg-surface border border-border rounded-lg p-8 shadow-sm">
        <div className="relative text-center border-b border-border pb-6 mb-6">
          <div className="bg-primary-50 text-primary-700 font-semibold px-4 py-2 rounded-full text-sm border border-primary-200 absolute top-0 right-0">
            {club.isFinancialMember ? 'Financial Member' : 'Non-Financial Member'}
          </div>
          <h1 className="text-3xl font-bold text-ink pr-28 sm:pr-0">{club.name}</h1>
        </div>

        {/* Associations & Teams */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-canvas border border-border rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-ink-subtle font-semibold block mb-1">
              Associations
            </span>
            {club.associations.length > 0 ? (
              <ul>
                {club.associations.map((a: any) => (
                  <li key={a.id}>
                    <Link to={`/associations/${a.id}`} className="text-primary-600 hover:underline">
                      {a.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-subtle">No associations</p>
            )}
          </div>

          <div className="bg-canvas border border-border rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-ink-subtle font-semibold block mb-1">
              Teams
            </span>
            {club.teams.length > 0 ? (
              <ul>
                {club.teams.map((t: any) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary-600" />
                    <Link to={`/teams/${t.id}`} className="hover:underline hover:text-primary-600">
                      {t.name}
                    </Link>
                    {' — '}{t.sectionName}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-subtle">No teams</p>
            )}
          </div>
        </div>

        {/* Officials & Contact */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-canvas border border-border rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-ink-subtle font-semibold block mb-1">
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
              <p className="text-ink-subtle">No officials</p>
            )}
          </div>

          {club.contactPerson && (
            <div className="bg-canvas border border-border rounded-lg p-5 text-left">
              <span className="text-xs uppercase tracking-wider text-ink-subtle font-semibold block mb-1">
                Contact
              </span>
              <p>{club.contactPerson.firstName} {club.contactPerson.lastName}</p>
              {club.contactPerson.phone && (
                <p>
                  Phone:{' '}
                  <a href={`tel:${club.contactPerson.phone}`} className="text-primary-600 hover:underline">
                    {club.contactPerson.phone}
                  </a>
                </p>
              )}
              {club.contactPerson.email && (
                <p>
                  Email:{' '}
                  <a href={`mailto:${club.contactPerson.email}`} className="text-primary-600 hover:underline">
                    {club.contactPerson.email}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClubProfile;
