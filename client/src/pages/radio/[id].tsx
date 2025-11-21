import { Layout } from "@/components/Layout";
import { ChevronLeft, Shuffle, Heart, Play, Loader, Volume2 } from "lucide-react";
import React, { useState } from "react";
import { Link, useParams } from "wouter";
import { useHaptics } from "@/hooks/use-haptics";
import { useQuery } from "@tanstack/react-query";
import { usePlayer } from "@/hooks/use-player";
import { isSongInPlaylist, addSongToPlaylist, getPlaylistSongs, removeSongFromPlaylist } from "@/lib/playlists-api";
import { APPLE_MUSIC_RADIO_STATIONS } from "./index";
import { Skeleton } from "@/components/ui/skeleton";

export default function RadioDetailPage() {
  const params = useParams();
  const stationId = params?.id as string;
  const { light } = useHaptics();
  const { play } = usePlayer();
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

  const station = APPLE_MUSIC_RADIO_STATIONS.find(s => s.id === stationId);

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['radio-songs', stationId],
    queryFn: async () => {
      if (!station) return [];
      try {
        const response = await fetch(`/api/itunes/genre/${encodeURIComponent(station.genre)}?limit=50`);
        if (!response.ok) throw new Error('Failed to fetch songs');
        const results = await response.json();
        const filtered = results.filter((song: any) => song.previewUrl);
        
        // Check which songs are in favorites
        for (const song of filtered) {
          const isFav = await isSongInPlaylist("liked-songs-default", song.id);
          if (isFav) {
            setLikedSongs(prev => new Set([...prev, song.id]));
          }
        }
        
        return filtered;
      } catch (error) {
        console.error('Failed to fetch radio songs:', error);
        return [];
      }
    },
    enabled: !!station
  });

  const handlePlayAll = () => {
    if (songs.length > 0) {
      light();
      play(songs[0] as any, songs as any);
    }
  };

  const handleShuffle = () => {
    if (songs.length > 0) {
      light();
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      play(shuffled[0] as any, shuffled as any);
    }
  };

  const handleLike = async (e: React.MouseEvent, song: any) => {
    e.stopPropagation();
    try {
      if (likedSongs.has(song.id)) {
        const favSongs = await getPlaylistSongs("liked-songs-default");
        const songToRemove = favSongs.find(s => s.songId === song.id);
        if (songToRemove) {
          await removeSongFromPlaylist(songToRemove.id);
        }
        setLikedSongs(prev => {
          const newSet = new Set(prev);
          newSet.delete(song.id);
          return newSet;
        });
      } else {
        await addSongToPlaylist("liked-songs-default", song.id, song.title, song.artist, song.coverUrl, song.album, song.previewUrl, song.duration);
        setLikedSongs(prev => new Set([...prev, song.id]));
      }
    } catch (error) {
      console.error('Failed to update like:', error);
    }
  };

  const handlePlaySong = (song: any) => {
    light();
    play(song as any, songs as any);
  };

  if (!station) return null;

  return (
    <Layout>
      <div className="pb-20">
        {/* Hero Header with Station */}
        <div className={`bg-gradient-to-b ${station.color} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative px-5 pt-8 pb-12">
            <Link href="/radio" onClick={light} className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8">
              <ChevronLeft size={24} />
              <span>Radio</span>
            </Link>
            
            <div className="flex items-end gap-4">
              <div className="text-5xl flex-shrink-0">{station.icon}</div>
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium mb-1">Station</p>
                <h1 className="text-5xl font-bold text-white tracking-tight mb-1">{station.name}</h1>
                <p className="text-white/90">{station.tagline}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Player Actions */}
        <div className="px-5 py-6 bg-white/5 backdrop-blur-md border-b border-white/10">
          <div className="flex gap-3">
            <button
              onClick={handlePlayAll}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 rounded-full text-black font-semibold transition-all active:scale-95 shadow-lg hover:shadow-xl"
              data-testid="button-play-all"
            >
              <Play size={20} className="fill-black" />
              <span>Play</span>
            </button>
            <button
              onClick={handleShuffle}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white font-semibold transition-all border border-white/20 hover:border-white/40"
              data-testid="button-shuffle"
            >
              <Shuffle size={20} />
            </button>
          </div>
        </div>

        {/* Station Info */}
        <div className="px-5 py-6 border-b border-white/5">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Volume2 size={16} />
            <span className="text-sm">{isLoading ? 'Loading' : songs.length} songs • All with previews</span>
          </div>
        </div>

        {/* Songs List */}
        <div className="px-5 pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Volume2 size={48} className="text-gray-600 mb-4" />
              <p className="text-lg font-semibold text-white mb-2">No songs available</p>
              <p className="text-gray-400">Try again later</p>
            </div>
          ) : (
            <div className="space-y-1">
              {songs.map((song, index) => (
                <div
                  key={song.id}
                  onClick={() => handlePlaySong(song)}
                  className="flex items-center gap-3 p-3 -mx-2 rounded-lg active:bg-white/5 transition-colors group cursor-pointer"
                  data-testid={`song-${song.id}`}
                >
                  <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-white/10 relative overflow-hidden">
                    <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <Play size={18} className="text-white fill-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate text-sm">{song.title}</h3>
                    <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                  </div>

                  <button
                    onClick={(e) => handleLike(e, song)}
                    className="flex-shrink-0 text-gray-500 hover:text-red-500 transition-colors"
                    data-testid={`button-like-${song.id}`}
                  >
                    <Heart size={18} fill={likedSongs.has(song.id) ? "currentColor" : "none"} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
