import { Layout } from "@/components/Layout";
import { LIBRARY_MENU } from "@/lib/dummyData";
import * as Icons from "lucide-react";
import { ChevronRight, Music, Trash2, Heart } from "lucide-react";
import { useHaptics } from "@/hooks/use-haptics";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlayer } from "@/hooks/use-player";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import { removeSongFromLibrary, isSongInPlaylist, addSongToPlaylist, getPlaylistSongs, removeSongFromPlaylist } from "@/lib/playlists-api";

interface LibrarySong {
  id: string;
  songId: string;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string;
  previewUrl?: string;
  duration?: string;
  addedAt: string;
}

export default function LibraryPage() {
  const { light } = useHaptics();
  const { play } = usePlayer();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['library-songs'],
    queryFn: async () => {
      const response = await fetch('/api/library/songs');
      if (!response.ok) throw new Error('Failed to fetch library songs');
      const data = await response.json() as LibrarySong[];
      
      // Check which songs are in favorites
      for (const song of data) {
        const isFav = await isSongInPlaylist("liked-songs-default", song.songId);
        if (isFav) {
          setLikedSongs(prev => new Set([...prev, song.songId]));
        }
      }
      return data;
    }
  });

  const handleRemove = async (e: React.MouseEvent, songId: string, songTitle: string) => {
    e.stopPropagation();
    try {
      await removeSongFromLibrary(songId);
      await queryClient.invalidateQueries({ queryKey: ['library-songs'] });
      toast({
        title: "Removed",
        description: `${songTitle} removed from library`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove song",
      });
    }
  };

  const handleLike = async (e: React.MouseEvent, song: LibrarySong) => {
    e.stopPropagation();
    try {
      if (likedSongs.has(song.songId)) {
        const favSongs = await getPlaylistSongs("liked-songs-default");
        const songToRemove = favSongs.find(s => s.songId === song.songId);
        if (songToRemove) {
          await removeSongFromPlaylist(songToRemove.id);
        }
        setLikedSongs(prev => {
          const newSet = new Set(prev);
          newSet.delete(song.songId);
          return newSet;
        });
      } else {
        await addSongToPlaylist("liked-songs-default", song.songId, song.title, song.artist, song.coverUrl, song.album, song.previewUrl, song.duration);
        setLikedSongs(prev => new Set([...prev, song.songId]));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like",
      });
    }
  };

  return (
    <Layout>
      <div className="px-5 pt-8 pb-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        </div>

        <div className="space-y-1 mb-8">
          {LIBRARY_MENU.map((item) => {
            const Icon = (Icons as any)[item.icon] || Icons.Music;
            
            return (
              <Link href={item.path || "/library"} key={item.label}>
                <div 
                  className="flex items-center justify-between py-3 border-b border-white/5 active:bg-white/10 -mx-5 px-5 transition-colors cursor-pointer group"
                  onClick={light}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="text-primary group-hover:opacity-80 transition-opacity" size={24} />
                    <span className="text-[20px] font-normal">{item.label}</span>
                  </div>
                  <ChevronRight className="text-gray-500/50" size={20} />
                </div>
              </Link>
            );
          })}
        </div>

        <section>
          <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
            <h2 className="text-lg font-bold">Recently Added</h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square rounded-lg mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-1" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music size={48} className="text-gray-400 mb-4" />
              <p className="text-xl font-semibold text-white mb-2">No songs in your library</p>
              <p className="text-gray-400">Play music and click 'Add to Library' to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {songs.map((song) => (
                <div 
                  key={song.id} 
                  className="cursor-pointer group relative"
                  onClick={() => play({
                    id: song.songId,
                    title: song.title,
                    artist: song.artist,
                    album: song.album || undefined,
                    coverUrl: song.coverUrl,
                    previewUrl: song.previewUrl,
                    duration: song.duration
                  }, songs.map(s => ({
                    id: s.songId,
                    title: s.title,
                    artist: s.artist,
                    album: s.album || undefined,
                    coverUrl: s.coverUrl,
                    previewUrl: s.previewUrl,
                    duration: s.duration
                  })))}
                >
                  <div className="aspect-square overflow-visible rounded-lg mb-2 shadow-sm bg-neutral-800 relative">
                    <img 
                      src={song.coverUrl} 
                      alt={song.title} 
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg" 
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={(e) => handleLike(e, song)}
                        className="p-2 bg-white/20 hover:bg-red-500 rounded-full transition-colors"
                        data-testid={`button-like-${song.id}`}
                      >
                        <Heart size={16} className={likedSongs.has(song.songId) ? "text-red-500 fill-red-500" : "text-white"} />
                      </button>
                      <button
                        onClick={(e) => handleRemove(e, song.id, song.title)}
                        className="p-2 bg-red-500/80 rounded-full transition-opacity"
                        data-testid={`button-remove-${song.id}`}
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-medium text-sm truncate">{song.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
