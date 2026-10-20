// file created by Rex Kelly
// file edited by Ella Goodwin
// AI was used in writing this file (Gemini, Claude)

// CHANGED: added useEffect alongside useState, for running the fetch once on load
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trophy, Shield } from 'lucide-react';

// REMOVED: mock-data imports (ASSOCIATIONS, ALL_COMPETITIONS) — no longer needed,
// we're pulling real data from the backend instead

function CompetitionsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // ADDED: state to hold the real competitions list once the fetch resolves,
  // plus loading/error flags so the page can show the right thing at each stage
  // CHANGED: added <any[]> so TypeScript knows this will eventually hold an
  // array of objects, instead of defaulting to "never" for an empty array
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ADDED: state for the associations dropdown — the list of options, and
  // which one (if any) the user has currently selected
  const [associations, setAssociations] = useState<any[]>([]);
  const [selectedAssociationId, setSelectedAssociationId] = useState('');

  // ADDED: fetch the list of associations once, to populate the dropdown.
  // Separate from the competitions fetch below since it only needs to run once
  // and doesn't depend on anything changing.
  useEffect(() => {
    fetch('http://localhost:3000/api/associations')
      .then(response => response.json())
      .then(data => setAssociations(data))
      .catch(err => console.error('Failed to load associations:', err));
  }, []);

  // CHANGED: this fetch now depends on selectedAssociationId (see the [selectedAssociationId]
  // at the end) — so it re-runs and re-fetches every time the dropdown changes, not just once.
  // When an association is selected, we add ?associationId=... to the URL, which your backend's
  // findAll(associationId?) already knows how to filter by.
  useEffect(() => {
    setLoading(true);
    const url = selectedAssociationId
      ? `http://localhost:3000/api/competitions?associationId=${selectedAssociationId}`
      : 'http://localhost:3000/api/competitions';
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setCompetitions(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedAssociationId]);

  // CHANGED: comp.associationName -> comp.association?.name — backend nests
  // the association as an object, not a flat "associationName" string
  const filteredCompetitions = competitions.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (comp.association?.name && comp.association.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ADDED: early-exit screens for the loading and error states, shown instead
  // of the main page while we're waiting or if the fetch failed
  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (error) return <div className="text-center py-12 text-red-600">Error: {error}</div>;

  // UNCHANGED FROM HERE DOWN: this is all Rex's original JSX, untouched
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Tennis Competitions</h1>

      {/* Search Bar + Association Dropdown */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search competitions by name or association..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* ADDED: association dropdown, per the Figma wireframe */}
        <select
          value={selectedAssociationId}
          onChange={(e) => setSelectedAssociationId(e.target.value)}
          className="border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Associations</option>
          {associations.map(assoc => (
            <option key={assoc.id} value={assoc.id}>{assoc.name}</option>
          ))}
        </select>
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
                  <Trophy className="h-5 w-5 text-sky-600 shrink-0" />
                  <h3 className="text-xl font-semibold text-sky-800">{comp.name}</h3>
                </div>
                {/* CHANGED: was comp.associationName */}
                {comp.association?.name && (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-2">
                    <Shield className="h-4 w-4 text-gray-400 shrink-0" />
                    {comp.association.name}
                  </p>
                )}
              </div>

              <div className="mt-6 text-sky-600 text-sm font-medium flex items-center">
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