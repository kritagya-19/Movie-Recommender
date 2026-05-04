import { useState, useEffect, useRef } from 'react';
import { Search, Film } from 'lucide-react';
import axios from 'axios';

export default function SearchAutocomplete({ query, setQuery, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get('/autocomplete', { params: { q: query } });
        setSuggestions(res.data.suggestions || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Autocomplete error:', err);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-grey/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl z-50 animate-fade-in">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.06] transition-colors text-left"
              onClick={() => {
                setQuery(s.title);
                setShowDropdown(false);
                onSelect(s.title);
              }}
            >
              {/* Mini poster */}
              <div className="w-8 h-12 rounded-md overflow-hidden bg-white/[0.04] shrink-0">
                {s.poster ? (
                  <img src={s.poster} alt={s.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-4 h-4 text-white/10" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{s.title}</p>
                <div className="flex items-center gap-2 text-[11px] text-white/40">
                  <span className="capitalize">{s.media_type === 'tv' ? 'TV Show' : 'Movie'}</span>
                  {s.year && <span>• {s.year}</span>}
                </div>
              </div>

              {/* Search icon */}
              <Search className="w-4 h-4 text-white/20 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
