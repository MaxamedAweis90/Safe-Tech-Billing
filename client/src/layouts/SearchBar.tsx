import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { searchAllRecords, SearchResultItem } from '../lib/mockData';
import { formatMoney } from '../lib/math';
import { useNavStore } from '../store/useNavStore';
import { useAuthStore } from '../store/useAuthStore';

export const SearchBar: React.FC = () => {
  const { user } = useAuthStore();
  const isDemo = Boolean(user?.isDemo && (user?.email === 'demo@account.com' || user?.id === 'usr_demo_admin'));

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setSelectedRecord } = useNavStore();

  // Debounced live multi-entity search against API v1 with local fallback
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const [invRes, quoteRes, recRes, custRes] = await Promise.allSettled([
          api.get('/invoices', { params: { q, limit: 5 } }),
          api.get('/quotations', { params: { q, limit: 5 } }),
          api.get('/receipts', { params: { q, limit: 5 } }),
          api.get('/customers', { params: { q, limit: 5 } }),
        ]);

        const combined: SearchResultItem[] = [];

        // 1. Invoices
        if (invRes.status === 'fulfilled' && invRes.value.data?.invoices) {
          invRes.value.data.invoices.forEach((i: any) => {
            const customerName = i.customerName || i.customer_id?.name || 'Customer';
            const total = formatMoney(i.total_milli || 0, i.currency || 'USD');
            combined.push({
              id: i._id || i.id,
              tab: 'invoices',
              title: `Invoice ${i.number || 'Draft'}`,
              subtitle: `${customerName} · ${total}`,
            });
          });
        }

        // 2. Quotations
        if (quoteRes.status === 'fulfilled' && quoteRes.value.data?.quotations) {
          quoteRes.value.data.quotations.forEach((qItem: any) => {
            const customerName = qItem.customerName || qItem.customer_id?.name || 'Customer';
            const total = formatMoney(qItem.total_milli || 0, qItem.currency || 'USD');
            combined.push({
              id: qItem._id || qItem.id,
              tab: 'quotations',
              title: `Quotation ${qItem.number || 'Draft'}`,
              subtitle: `${customerName} · ${total}`,
            });
          });
        }

        // 3. Receipts
        if (recRes.status === 'fulfilled' && recRes.value.data?.receipts) {
          recRes.value.data.receipts.forEach((r: any) => {
            const customerName = r.customer_id?.name || 'Customer';
            const amount = formatMoney(r.amount_milli || 0, r.currency || 'USD');
            combined.push({
              id: r._id || r.id,
              tab: 'receipts',
              title: `Receipt ${r.number}`,
              subtitle: `${customerName} · ${amount}`,
            });
          });
        }

        // 4. Customers
        if (custRes.status === 'fulfilled' && custRes.value.data?.customers) {
          custRes.value.data.customers.forEach((c: any) => {
            combined.push({
              id: c._id || c.id,
              tab: 'customers',
              title: `${c.name} (${c.code})`,
              subtitle: `${c.phone || ''}${c.email ? ' · ' + c.email : ''}`,
            });
          });
        }

        // If API returned zero matches or network was offline, use mockData fallback strictly for demo mode
        if (combined.length === 0) {
          if (isDemo) {
            const fallbackMatches = searchAllRecords(q);
            setResults(fallbackMatches.slice(0, 10));
          } else {
            setResults([]);
          }
        } else {
          setResults(combined.slice(0, 10));
        }

        setIsOpen(true);
        setSelectedIndex(-1);
      } catch {
        if (isDemo) {
          const fallbackMatches = searchAllRecords(q);
          setResults(fallbackMatches.slice(0, 10));
        } else {
          setResults([]);
        }
        setIsOpen(true);
        setSelectedIndex(-1);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Click outside and global shortcuts
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleGlobalShortcuts);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleGlobalShortcuts);
    };
  }, []);

  const handleSelect = (item: SearchResultItem) => {
    setSelectedRecord(item.tab, item.id);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
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
        placeholder="Search invoices, quotations, receipts, customers (Press /)"
        autoComplete="off"
        aria-label="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (query.trim().length >= 2) setIsOpen(true);
        }}
      />

      {isOpen && (
        <div id="gresults" className="search-results" role="listbox">
          {isLoading && results.length === 0 ? (
            <div className="empty" style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13 }}>
              Searching...
            </div>
          ) : results.length > 0 ? (
            results.map((r, index) => (
              <a
                key={`${r.tab}-${r.id}-${index}`}
                href={`#${r.tab}-${r.id}`}
                className={index === selectedIndex ? 'active' : ''}
                role="option"
                aria-selected={index === selectedIndex}
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

export default SearchBar;
