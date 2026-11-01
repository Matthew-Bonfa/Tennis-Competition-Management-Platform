import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import fetchApi from '../../lib/api';

export interface PickedPerson {
  id: string;
  firstName: string;
  lastName: string;
}

interface PlayerSearchResult {
  id: string;
  personCode: string;
  firstName: string;
  lastName: string;
  // The API flattens memberships to a single club name, null for someone
  // with no club membership
  primaryClubName: string | null;
}

/* Searchable person picker used by the club/association edit forms to choose a
   contact person or add an official. Searches all people server-side
   (GET /players?search=) so associations can pick anyone, not just members;
   each result shows club memberships to tell people with the same name apart. */
function PersonPicker({
  onPick,
  placeholder = 'Search for a person...',
}: {
  onPick: (person: PickedPerson) => void;
  placeholder?: string;
}) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }

    // Debounce so typing doesn't fire a request per keystroke
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchApi('/players?search=' + encodeURIComponent(term.trim()));
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [term]);

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function pick(person: PlayerSearchResult) {
    onPick({ id: person.id, firstName: person.firstName, lastName: person.lastName });
    setTerm('');
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-4 w-4 text-ink-subtle" />
      </span>
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="block w-full border border-border-strong rounded-lg bg-surface text-ink pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg shadow-sm max-h-56 overflow-y-auto"
        >
          {results.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => pick(person)}
                className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors duration-150"
              >
                <span className="text-sm font-medium text-ink">
                  {person.firstName} {person.lastName}
                </span>
                {person.primaryClubName && (
                  <span className="block text-xs text-ink-subtle">
                    {person.primaryClubName}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && term.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg shadow-sm px-4 py-3 text-sm text-ink-subtle">
          No people found
        </div>
      )}

      {term && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => { setTerm(''); setResults([]); setOpen(false); }}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-subtle hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {loading && (
        <span className="absolute inset-y-0 right-8 flex items-center text-xs text-ink-subtle">
          Searching...
        </span>
      )}
    </div>
  );
}

export default PersonPicker;
