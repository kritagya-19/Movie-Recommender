import { useState, useEffect, useRef } from 'react';
import { Film, ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
import axios from 'axios';

export default function TrendingRow({ onCardClick }) {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get('/trending');
        setTrending(res.data.trending || []);
      } catch (err) {
        console.error('Failed to fetch trending:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex gap-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="min-w-[180px] aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!trending.length) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 mt-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <span className="w-1 h-6 bg-brand-red rounded-full" />
          Trending This Week
        </h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <button onClick={() => scroll('right')} className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
      >
        {trending.map((item, idx) => (
          <div
            key={idx}
            className="min-w-[180px] sm:min-w-[200px] group relative card-hover rounded-2xl overflow-hidden cursor-pointer shrink-0"
            onClick={() => onCardClick(item)}
          >
            <div className="aspect-[2/3] w-full bg-brand-grey border border-white/[0.06] rounded-2xl overflow-hidden relative">
              {item.poster ? (
                <img
                  src={item.poster}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Film className="w-12 h-12 text-white/[0.04]" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              {/* Rank number */}
              <div className="absolute top-3 left-3 text-5xl font-black text-white/10 leading-none select-none">
                {idx + 1}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1 text-[11px] text-white/60">
                  {item.rating && (
                    <span className="flex items-center gap-0.5 text-yellow-500">
                      <Star className="w-3 h-3 fill-current" /> {item.rating}
                    </span>
                  )}
                  {item.year && <span>• {item.year}</span>}
                </div>
                <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-brand-red transition-colors">
                  {item.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
