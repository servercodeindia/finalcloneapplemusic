import { Layout } from "@/components/Layout";
import { Search as SearchIcon, X, Mic, Play, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayer } from "@/hooks/use-player";
import { useLocation } from "wouter";

const SEARCH_CATEGORIES = [
  { id: 1, name: "Blinding Lights", color: "from-slate-400 to-slate-600", emoji: "🎵" },
  { id: 2, name: "Tum Hi Ho", color: "from-teal-400 to-teal-600", emoji: "💕" },
  { id: 3, name: "Baarish Ban Jaana", color: "from-purple-500 to-purple-700", emoji: "🌧️" },
  { id: 4, name: "Raanjhanaa", color: "from-orange-400 to-red-500", emoji: "❤️" },
  { id: 5, name: "Shape of You", color: "from-slate-600 to-slate-800", emoji: "🎸" },
  { id: 6, name: "Vaaste", color: "from-blue-600 to-blue-800", emoji: "🎤" },
  { id: 7, name: "Aashiqui 2", color: "from-red-500 to-red-700", emoji: "💔" },
  { id: 8, name: "Phoolon Jaisa", color: "from-pink-500 to-pink-700", emoji: "🌹" },
  { id: 9, name: "Ek Duje Ke Liye", color: "from-cyan-400 via-pink-500 to-purple-600", emoji: "👫" },
  { id: 10, name: "Unstoppable", color: "from-yellow-600 to-green-800", emoji: "⚡" },
];

export default function SearchPage() {
  const [location] = useLocation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { play, currentSong, queue } = usePlayer();

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search-results', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) throw new Error('Search failed');
        const results = await response.json();
        return results;
      } catch (error) {
        console.error('Search error:', error);
        return [];
      }
    },
    enabled: debouncedQuery.length > 0
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
    }
  }, [location]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setShowResults(query.length > 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleCategoryClick = (category: typeof SEARCH_CATEGORIES[0]) => {
    setQuery(category.name);
  };

  return (
    <Layout>
      <div className="pb-20 w-full overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/5 backdrop-blur-xl px-5 pt-6 pb-4 w-full border-b border-white/10">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Search</h1>

          {/* Search Bar */}
          <div className="relative w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Apple Music"
              className="w-full pl-10 pr-10 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-gray-500 h-11 rounded-full focus-visible:ring-1 focus-visible:ring-primary transition-all hover:bg-white/15 hover:border-white/30"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="input-search"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                data-testid="button-clear-search"
              >
                <X size={18} />
              </button>
            ) : (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors" data-testid="button-voice-search">
                <Mic size={18} />
              </button>
            )}
          </div>
        </div>

        {showResults && debouncedQuery ? (
          // Search Results
          <div className="px-5 py-6 w-full">
            <h2 className="text-xl font-bold mb-4">Results for "{debouncedQuery}"</h2>
            <div className="space-y-2 w-full">
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 w-full">
                    <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>No songs found</p>
                </div>
              ) : (
                searchResults.map((song: any) => (
                  <div
                    key={song.id}
                    onClick={() => play(song, searchResults)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer group w-full backdrop-blur-sm border border-white/5 hover:border-white/10 hover:shadow-lg"
                    data-testid={`search-result-${song.id}`}
                  >
                    <img src={song.coverUrl} alt={song.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate text-white">{song.title}</h3>
                      <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        play(song, searchResults);
                      }}
                      className="text-gray-500 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                      data-testid={`button-play-result-${song.id}`}
                    >
                      <Play size={18} className="fill-current" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // Categories Grid
          <div className="px-5 pt-6 pb-8 w-full">
            <div className="grid grid-cols-2 gap-3 w-full">
              {SEARCH_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className={`bg-gradient-to-br ${category.color} rounded-2xl p-4 cursor-pointer h-28 flex flex-col justify-between relative overflow-hidden group w-full backdrop-blur-md border border-white/20 hover:border-white/40 hover:shadow-xl transition-all`}
                  data-testid={`category-${category.id}`}
                >
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                  <div className="relative z-10 w-full">
                    <div className="text-2xl mb-2">{category.emoji}</div>
                    <h3 className="text-base font-bold text-white leading-tight line-clamp-2 break-words">{category.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Now Playing Mini Card - Only show when there's a current song */}
        {currentSong && (
          <div className="fixed bottom-24 left-0 right-0 px-3 pb-3 w-full">
            <div className="mx-auto max-w-md bg-white/10 backdrop-blur-xl rounded-full p-3 flex items-center gap-3 shadow-lg border border-white/20 hover:border-white/40 transition-all w-full">
              <img src={currentSong.coverUrl} alt={currentSong.title} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{currentSong.title}</p>
                <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
              </div>
              <button className="flex-shrink-0 text-gray-400 hover:text-primary transition-colors p-1" data-testid="button-mini-play">
                <Play size={16} className="fill-current" />
              </button>
              <button className="flex-shrink-0 text-gray-400 hover:text-primary transition-colors p-1" data-testid="button-mini-next">
                <Play size={16} className="fill-current" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
