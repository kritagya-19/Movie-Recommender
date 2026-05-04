import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

export default function SmartFinder({ onClose, onDiscover }) {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    content_type: 'Movie',
    genre: 'Action',
    mood: 'Feel Good'
  });

  const types = ['Movie', 'Series', 'Anime', 'K-Drama'];
  const genres = ['Action', 'Romance', 'Thriller', 'Comedy', 'Horror', 'Sci-Fi', 'Drama'];
  const moods = ['Dark', 'Motivational', 'Feel Good', 'Mind-Bending', 'Emotional', 'Suspenseful'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onDiscover(filters);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-xl bg-brand-grey rounded-2xl border border-white/[0.08] shadow-2xl p-6 sm:p-8 animate-fade-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/[0.04] rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-brand-red/20 rounded-2xl">
            <Sparkles className="w-8 h-8 text-brand-red" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Smart Finder</h2>
            <p className="text-sm text-white/50 mt-1">Tell us what you're in the mood for.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Content Type */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Content Type</label>
            <div className="flex flex-wrap gap-2.5">
              {types.map(t => (
                <button type="button" key={t} onClick={() => setFilters({...filters, content_type: t})} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${filters.content_type === t ? 'bg-brand-red text-white scale-105 shadow-[0_0_20px_rgba(229,9,20,0.3)]' : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08]'}`}>{t}</button>
              ))}
            </div>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Genre</label>
            <div className="flex flex-wrap gap-2.5">
              {genres.map(g => (
                <button type="button" key={g} onClick={() => setFilters({...filters, genre: g})} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${filters.genre === g ? 'bg-blue-600 text-white scale-105 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08]'}`}>{g}</button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Mood</label>
            <div className="flex flex-wrap gap-2.5">
              {moods.map(m => (
                <button type="button" key={m} onClick={() => setFilters({...filters, mood: m})} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${filters.mood === m ? 'bg-purple-600 text-white scale-105 shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08]'}`}>{m}</button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full mt-4 bg-white text-black font-black text-lg py-4 rounded-xl hover:bg-brand-red hover:text-white transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(229,9,20,0.4)] disabled:opacity-50">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6" /> Find My Next Obsession</>}
          </button>
        </form>
      </div>
    </div>
  );
}
