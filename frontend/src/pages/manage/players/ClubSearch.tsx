// Type-to-search club picker
import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';

export interface ClubOption {
  id: string;
  name: string;
}

interface ClubSearchProps {
  clubs: ClubOption[];
  value: string; // the selected club id, '' when none is picked
  onChange: (clubId: string) => void;
}

function ClubSearch({ clubs, value, onChange }: ClubSearchProps) {
  const selected = clubs.find((club) => club.id === value) ?? null;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusAfterClear = useRef(false);

  // alphabetical, so the list reads in a predictable order before and after filtering
  const matches = clubs
    .filter((club) => club.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // close the list when the user clicks anywhere outside the picker
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!selected && focusAfterClear.current) {
      focusAfterClear.current = false;
      inputRef.current?.focus();
    }
  }, [selected]);

  function choose(club: ClubOption) {
    onChange(club.id);
    setQuery('');
    setOpen(false);
  }

  function clear() {
    focusAfterClear.current = true;
    onChange('');
    setQuery('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlighted((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      // pick the highlighted club rather than submitting the whole form
      if (open && matches[highlighted]) {
        e.preventDefault();
        choose(matches[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Once a club is picked, show it as a chip that can be cleared to search again
  if (selected) {
    return (
      <div className="mt-1 flex w-full items-center justify-between rounded-lg border border-border-strong bg-surface px-4 py-3 text-ink">
        <span>{selected.name}</span>
        <button
          type="button"
          onClick={clear}
          aria-label="Change club"
          className="flex h-11 w-11 items-center justify-center text-ink-subtle hover:text-ink-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative mt-1">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-4 w-4 text-ink-subtle" />
      </div>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label="Search clubs"
        aria-expanded={open}
        aria-autocomplete="list"
        placeholder="Search clubs..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlighted(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-border-strong bg-surface py-3 pl-9 pr-4 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      {open && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-md"
        >
          {matches.length > 0 ? (
            matches.map((club, i) => (
              <li
                key={club.id}
                role="option"
                aria-selected={i === highlighted}
                // mousedown rather than click, so it fires before the input loses focus
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(club);
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex min-h-11 cursor-pointer items-center px-4 py-2 text-ink ${i === highlighted ? 'bg-primary-50 text-primary-800' : ''}`}
              >
                {club.name}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-ink-subtle">No clubs match "{query}"</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default ClubSearch;
