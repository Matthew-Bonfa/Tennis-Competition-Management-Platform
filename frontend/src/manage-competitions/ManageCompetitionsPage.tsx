// file created by Ella Goodwin
// AI was used in writing this file (Claude)

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import fetchApi from '../api';

function ManageCompetitionsPage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi('/competitions')
      .then(data => {
        setCompetitions(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (error) return <div className="text-center py-12 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Competitions</h1>
        <Link
          to="/manage-competitions/create-new-competition"
          className="bg-sky-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-sky-700"
        >
          + Create new competition
        </Link>
      </div>

      {competitions.length > 0 ? (
        <div className="space-y-3">
          {competitions.map(comp => (
            <Link
              key={comp.id}
              to={`/competitions/${comp.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="font-semibold text-sky-800">{comp.name}</p>
              {comp.association?.name && (
                <p className="text-sm text-gray-600">{comp.association.name}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
          No competitions yet. Create one to get started.
        </div>
      )}
    </div>
  );
}

export default ManageCompetitionsPage;