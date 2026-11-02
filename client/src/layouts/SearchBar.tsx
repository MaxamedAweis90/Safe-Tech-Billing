import React, { useState, useEffect, useRef } from 'react';
import { searchAllRecords, SearchResultItem } from '../lib/mockData';
import { useNavStore } from '../store/useNavStore';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setActiveTab } = useNavStore();

  // Listen to input changes
  useEffect(() => {
    const q = query.trim();
    if (q.length >= 2) {
      const res = searchAllRecords(q);
      setResults(res);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  // Click outside and Escape key listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === '/' && document.activeElement !== inputRef.current) {
        // Prevent default only if not in an input/textarea
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (item: SearchResultItem) => {
    setActiveTab(item.tab);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={inputRef}
        id="gsearch"
        type="text"
        placeholder="Search invoices, quotations, receipts, customers"
        autoComplete="off"
        aria-label="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim().length >= 2) setIsOpen(true);
        }}
      />

      {isOpen && (
        <div id="gresults" className="search-results">
          {results.length > 0 ? (
            results.map((r) => (
              <a
                key={`${r.tab}-${r.id}`}
                href={`#${r.tab}-${r.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(r);
                }}
              >
                <span>{r.title}</span>
                <small>{r.subtitle}</small>
              </a>
            ))
          ) : (
            <div className="empty" style={{ padding: 16 }}>
              No matches for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
};

