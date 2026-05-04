import { Film, Play, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function MovieModal({ movie, onClose }) {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-brand-grey rounded-2xl border border-white/[0.08] shadow-2xl animate-fade-in custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Image / Trailer */}
        <div className="relative aspect-video w-full bg-black rounded-t-2xl overflow-hidden">
          {movie.trailer ? (
            <iframe
              src={`${movie.trailer}?autoplay=1&mute=1&rel=0`}
              title="Trailer"
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : movie.backdrop ? (
            <img src={movie.backdrop} alt={movie.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-grey to-black">
              <Film className="w-24 h-24 text-white/5" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-grey via-transparent to-transparent" />
        </div>

        {/* Info Section */}
        <div className="p-6 sm:p-8 -mt-16 relative z-10">
          {/* Tagline */}
          {movie.tagline && (
            <p className="text-brand-red text-xs font-bold tracking-widest uppercase mb-2">
              {movie.tagline}
            </p>
          )}

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            {movie.title}
          </h2>

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-white/60">
            {movie.rating && (
              <span className="flex items-center gap-1 text-yellow-500 font-bold">
                <Star className="w-4 h-4 fill-current" />
                {movie.rating}
              </span>
            )}
            {movie.year && <span>{movie.year}</span>}
            {movie.runtime && (
              <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-xs">
                {movie.runtime}
              </span>
            )}
            {movie.director && <span>Directed by <span className="text-white/90">{movie.director}</span></span>}
          </div>

          {/* Genres */}
          {movie.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {movie.genres.map((g, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-white/70">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Overview */}
          {movie.overview && (
            <p className="mt-5 text-white/50 leading-relaxed text-sm sm:text-base">
              {movie.overview}
            </p>
          )}

          {/* Watch Providers */}
          {movie.providers?.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                Where to Watch
              </h4>
              <div className="flex items-center gap-3">
                {movie.providers.map((p, i) => (
                  <div key={i} className="group/provider relative">
                    {p.logo ? (
                      <img
                        src={p.logo}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/10 group-hover/provider:ring-brand-red transition-all"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50">
                        {p.name?.charAt(0)}
                      </div>
                    )}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover/provider:block px-2 py-1 bg-black rounded text-[10px] text-white whitespace-nowrap">
                      {p.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cast */}
          {movie.cast?.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                Top Cast
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {movie.cast.map((c, i) => (
                  <div key={i} className="text-center group/cast">
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-white/[0.04] mb-2">
                      {c.photo ? (
                        <img src={c.photo} alt={c.name} className="w-full h-full object-cover group-hover/cast:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10 text-2xl font-bold">
                          {c.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white/80 truncate">{c.name}</p>
                    <p className="text-[10px] text-white/30 truncate">{c.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TMDB Similar Recommendations */}
          {movie.tmdb_recommendations?.length > 0 && (
            <div className="mt-8">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                You Might Also Like
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {movie.tmdb_recommendations.map((r, i) => (
                  <div key={i} className="group/rec">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                      {r.poster ? (
                        <img src={r.poster} alt={r.title} className="w-full h-full object-cover group-hover/rec:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-6 h-6 text-white/10" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-white/60 mt-1.5 truncate">{r.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
