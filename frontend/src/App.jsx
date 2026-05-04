import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Film, ChevronRight, Loader2, Sparkles } from 'lucide-react';

import Navbar from './components/Navbar';
import MovieCard from './components/MovieCard';
import MovieModal from './components/MovieModal';
import TrendingRow from './components/TrendingRow';
import SearchAutocomplete from './components/SearchAutocomplete';
import SmartFinder from './components/SmartFinder';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showSmartFinder, setShowSmartFinder] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('cinephile_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cinephile_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (movie) => {
    setWatchlist((prev) => {
      const exists = prev.find((m) => m.title === movie.title);
      if (exists) {
        return prev.filter((m) => m.title !== movie.title);
      } else {
        return [movie, ...prev];
      }
    });
  };

  const openWatchlist = () => {
    setShowWatchlist(true);
    setSearched(true);
    window.scrollTo(0, 0);
  };

  const typeColors = {
    movie: 'from-blue-900/40 to-blue-950/60',
    kdrama: 'from-purple-900/40 to-purple-950/60',
    webseries: 'from-emerald-900/40 to-emerald-950/60',
  };

  const typeBadgeColors = {
    movie: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    kdrama: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    webseries: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  // ─── Search Handler ───
  const handleSearch = async (e, overrideQuery) => {
    e?.preventDefault();
    setShowWatchlist(false);
    const searchTerm = overrideQuery || query;
    if (!searchTerm.trim()) return;

    setQuery(searchTerm);
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const response = await axios.post('/recommend', { movie: searchTerm });
      setResults(response.data.results);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`"${searchTerm}" not found in our database. Try another title.`);
      } else {
        setError('Server error. Make sure the backend is running.');
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Smart Discover Handler ───
  const handleSmartDiscover = async (filters) => {
    setShowWatchlist(false);
    setLoading(true);
    setError('');
    setSearched(true);
    setQuery(`${filters.mood} ${filters.genre} ${filters.content_type}`); // Set a readable query for the UI
    try {
      const response = await axios.post('/discover', filters);
      setResults(response.data.results);
      if (response.data.results.length === 0) {
        setError("No exact matches found for that specific combination. Try changing the mood or genre.");
      }
    } catch (err) {
      setError('Server error. Make sure the backend is running.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Open Modal with full details ───
  const openModal = async (item) => {
    // If item has tmdb_id and media_type, fetch full details
    const tmdbId = item.tmdb_id;
    const mediaType = item.media_type || item.type;

    if (tmdbId && (mediaType === 'movie' || mediaType === 'tv')) {
      setModalLoading(true);
      try {
        const res = await axios.get(`/details/${mediaType}/${tmdbId}`);
        setSelectedMovie(res.data);
      } catch {
        // Fallback to whatever data we already have
        setSelectedMovie(item);
      } finally {
        setModalLoading(false);
      }
    } else {
      setSelectedMovie(item);
    }
  };

  // ─── Reset to home ───
  const goHome = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setError('');
    setShowWatchlist(false);
  };

  const displayItems = showWatchlist ? watchlist : results;

  return (
    <div className="min-h-screen font-sans bg-brand-black">
      <Navbar onLogoClick={goHome} onMyListClick={openWatchlist} />

      {/* Hero Section */}
      <div className={`relative flex flex-col items-center justify-center transition-all duration-700 ease-out ${
        searched ? 'pt-32 pb-6' : 'min-h-[85vh] pt-20'
      }`}>
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-red/[0.07] blur-[150px] rounded-full pointer-events-none" />

        {/* Badge */}
        {!searched && (
          <div className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-[10px] tracking-[0.25em] uppercase font-bold text-white/50 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
            Curated. Cinematic. Endless.
          </div>
        )}

        {/* Heading */}
        <h1 className="text-center px-4 max-w-4xl">
          <span className="block text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.1]">
            Your next obsession,
          </span>
          <span className="block text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-brand-red text-glow tracking-tight italic leading-[1.1] mt-1">
            one search away.
          </span>
        </h1>

        {/* Subtitle */}
        {!searched && (
          <p className="mt-8 text-white/35 text-center max-w-md px-6 leading-relaxed text-sm sm:text-base animate-fade-in">
            Movies, anime, K-dramas and web series — beautifully organized, intelligently surfaced. Build the watchlist of your dreams.
          </p>
        )}

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="mt-10 w-full max-w-2xl px-6 relative"
        >
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-brand-red transition-colors duration-300 z-10" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, actors, directors, vibes..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 sm:py-5 pl-14 pr-28 text-base sm:text-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-red/40 focus:border-brand-red/60 transition-all duration-300"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/30 font-mono">
                <span className="text-xs font-sans">⌘</span> K
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-brand-red hover:bg-red-600 disabled:bg-white/10 disabled:text-white/30 text-white p-2.5 rounded-xl transition-all duration-200 active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          <SearchAutocomplete
            query={query}
            setQuery={setQuery}
            onSelect={(title) => handleSearch(null, title)}
          />

          {/* Smart Finder Trigger */}
          {!searched && (
            <div className="mt-6 flex justify-center animate-fade-in">
              <button 
                type="button"
                onClick={() => setShowSmartFinder(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red hover:bg-brand-red/20 transition-colors text-sm font-bold"
              >
                <Sparkles className="w-4 h-4" />
                Try Smart Finder
              </button>
            </div>
          )}
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-brand-red text-sm font-medium animate-fade-in">
            {error}
          </div>
        )}
      </div>

      {/* Trending Row (shown on homepage before search or watchlist) */}
      {!searched && !showWatchlist && (
        <TrendingRow onCardClick={openModal} />
      )}

      {/* Results / Watchlist Grid */}
      {displayItems.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-24 animate-fade-in mt-10">
          <div className="flex items-center justify-between mb-8 border-b border-white/[0.06] pb-4">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <span className="w-1 h-7 bg-brand-red rounded-full" />
              {showWatchlist ? 'My List' : 'Recommended for You'}
            </h2>
            {!showWatchlist && (
              <p className="text-white/30 text-sm hidden sm:block">
                Based on "<span className="text-white/60">{query}</span>"
              </p>
            )}
            {showWatchlist && (
              <p className="text-white/30 text-sm hidden sm:block">
                {watchlist.length} items
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {displayItems.map((item, idx) => (
              <MovieCard
                key={idx}
                item={item}
                typeColors={typeColors}
                typeBadgeColors={typeBadgeColors}
                onClick={() => openModal(item)}
                onToggleWatchlist={toggleWatchlist}
                isInWatchlist={watchlist.some(m => m.title === item.title)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(searched || showWatchlist) && !loading && displayItems.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-white/30 animate-fade-in">
          <Film className="w-16 h-16 mb-4 text-white/10" />
          <p className="text-lg font-medium">
            {showWatchlist ? "Your watchlist is empty" : "No recommendations found"}
          </p>
          <p className="text-sm mt-1">
            {showWatchlist ? "Add some movies or shows to get started" : "Try searching with a different title"}
          </p>
        </div>
      )}

      {/* Modal Loading Overlay */}
      {modalLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-brand-red animate-spin" />
            <p className="text-white/50 text-sm">Loading details...</p>
          </div>
        </div>
      )}

      {/* Movie Detail Modal */}
      {selectedMovie && !modalLoading && (
        <MovieModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
          onToggleWatchlist={toggleWatchlist}
          isInWatchlist={watchlist.some(m => m.title === selectedMovie.title)}
        />
      )}

      {/* Smart Finder Modal */}
      {showSmartFinder && (
        <SmartFinder 
          onClose={() => setShowSmartFinder(false)} 
          onDiscover={handleSmartDiscover} 
        />
      )}
    </div>
  );
}

export default App;
