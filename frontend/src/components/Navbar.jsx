import { Film, Bell, Search } from 'lucide-react';

export default function Navbar({ onLogoClick }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <button onClick={onLogoClick} className="flex items-center gap-2.5 group">
          <div className="bg-brand-red p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            CINE<span className="text-brand-red">PHILE</span>
          </span>
        </button>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/50">
          <a href="#" className="text-white transition-colors">Discover</a>
          <a href="#" className="hover:text-white transition-colors">Trending</a>
          <a href="#" className="hover:text-white transition-colors">My List</a>
          <a href="#" className="hover:text-white transition-colors">Community</a>
        </div>

        <div className="flex items-center gap-5">
          <button className="text-white/50 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/10">
            K
          </div>
        </div>
      </div>
    </nav>
  );
}
