import { Film, Play, Plus, Check } from 'lucide-react';

export default function MovieCard({ item, typeBadgeColors, typeColors, onClick, onToggleWatchlist, isInWatchlist }) {
  const { title, type, poster, rating, year } = item;
  const gradient = typeColors[type] || 'from-gray-900/40 to-gray-950/60';
  const badge = typeBadgeColors[type] || 'bg-white/10 text-white/60 border-white/20';

  return (
    <div
      className="group relative card-hover rounded-2xl overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className={`aspect-[2/3] w-full bg-gradient-to-b ${gradient} border border-white/[0.06] rounded-2xl overflow-hidden relative`}>

        {/* Poster Image or Placeholder */}
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-16 h-16 text-white/[0.04]" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between">
          {/* Top badge */}
          <div className="flex justify-end">
            <span className={`text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-1 rounded-md border ${badge}`}>
              {type}
            </span>
          </div>

          {/* Bottom */}
          <div>
            {/* Rating & Year */}
            <div className="flex items-center gap-2 mb-1.5 text-[11px] font-medium text-white/70">
              {rating && (
                <span className="flex items-center gap-1 text-yellow-500">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {rating}
                </span>
              )}
              {year && <span>• {year}</span>}
            </div>

            <h3 className="text-base sm:text-lg font-bold leading-tight text-white group-hover:text-brand-red transition-colors duration-300 line-clamp-2 drop-shadow-md">
              {title}
            </h3>

            {/* Hover actions */}
            <div className="flex gap-2 mt-3 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button 
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="flex-1 bg-white text-black py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-brand-red hover:text-white transition-colors duration-200"
              >
                <Play className="w-3.5 h-3.5" fill="currentColor" /> Details
              </button>
              
              {onToggleWatchlist && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleWatchlist(item); }}
                  className={`p-2 rounded-lg border transition-colors duration-200 ${isInWatchlist ? 'bg-brand-red border-brand-red text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                  title={isInWatchlist ? "Remove from My List" : "Add to My List"}
                >
                  {isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
