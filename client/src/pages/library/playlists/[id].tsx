import { Layout } from "@/components/Layout";
import { ChevronLeft, Plus, Trash2, Heart, Star, Play, Shuffle } from "lucide-react";
import React from "react";
import { Link, useParams } from "wouter";
import { useHaptics } from "@/hooks/use-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlaylist, getPlaylistSongs, addSongToPlaylist, removeSongFromPlaylist, updatePlaylist, isSongInPlaylist } from "@/lib/playlists-api";
import { usePlayer } from "@/hooks/use-player";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function PlaylistDetailPage() {
  const params = useParams();
  const playlistId = params?.id as string;
  const { light } = useHaptics();
  const { play } = usePlayer();
  const queryClient = useQueryClient();
  const [isFavoritedLocal, setIsFavoritedLocal] = useState(false);
  const [likedSongs, setLikedSongs] = React.useState<Set<string>>(new Set());

  const { data: playlist, isLoading: playlistLoading } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => getPlaylist(playlistId),
    enabled: !!playlistId
  });

  const { data: songs = [], isLoading: songsLoading } = useQuery({
    queryKey: ['playlist-songs', playlistId],
    queryFn: async () => {
      const data = await getPlaylistSongs(playlistId);
      for (const song of data) {
        const isFav = await isSongInPlaylist("liked-songs-default", song.songId);
        if (isFav) {
          setLikedSongs(prev => new Set([...prev, song.songId]));
        }
      }
      return data;
    },
    enabled: !!playlistId
  });

  const removeSongMutation = useMutation({
    mutationFn: (songId: string) => removeSongFromPlaylist(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-songs', playlistId] });
    }
  });

  const favoriteMutation = useMutation({
    mutationFn: (favorite: string) => updatePlaylist(playlistId, playlist?.name || '', playlist?.description, favorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    }
  });

  const handleToggleFavorite = () => {
    const newFavorite = isFavoritedLocal ? 'false' : 'true';
    setIsFavoritedLocal(!isFavoritedLocal);
    favoriteMutation.mutate(newFavorite);
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      light();
      play(songs[0] as any);
    }
  };

  const handleShuffle = () => {
    if (songs.length > 0) {
      light();
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      play(shuffled[0] as any, shuffled as any);
    }
  };

  if (!playlistId) return null;
  if (playlistLoading) return <Layout><div className="p-5 pt-8">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="px-5 pt-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <Link href="/library/playlists" onClick={light} className="text-primary flex items-center gap-1">
            <ChevronLeft size={24} />
            <span className="text-lg">Back</span>
          </Link>
          <button 
            onClick={handleToggleFavorite}
            className="text-gray-500 hover:text-primary transition-colors"
            data-testid={`button-favorite-${playlistId}`}
          >
            <Heart size={24} fill={isFavoritedLocal ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="w-full max-w-xs aspect-square bg-gray-100/10 rounded-3xl flex items-center justify-center mb-6">
            {playlist?.name === "Favorite" ? (
              <Star size={80} className="text-red-500" fill="currentColor" />
            ) : (
              <Star size={80} className="text-red-500" />
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{playlist?.name}</h1>
            {playlist?.name === "Favorite" && <Star size={24} className="text-red-500" fill="currentColor" />}
          </div>
          {playlist?.description && <p className="text-gray-400 text-base mb-1">{playlist.description}</p>}
          <p className="text-sm text-gray-500">{songs.length} songs</p>
        </div>

        {songs.length > 0 && (
          <div className="flex gap-3 mb-8 justify-center">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 transition-colors rounded-full text-white font-semibold"
              data-testid="button-play-all"
            >
              <Play size={20} fill="currentColor" />
              <span>Play</span>
            </button>
            <button
              onClick={handleShuffle}
              className="flex items-center gap-2 px-8 py-3 bg-gray-400/30 hover:bg-gray-400/50 transition-colors rounded-full text-white font-semibold"
              data-testid="button-shuffle"
            >
              <Shuffle size={20} />
              <span>Shuffle</span>
            </button>
          </div>
        )}

        <div className="space-y-2">
          {songsLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center py-3 gap-4">
                <Skeleton className="w-12 h-12 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))
          ) : songs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No songs in this playlist yet</div>
          ) : (
            songs.map((song) => (
              <div 
                key={song.id}
                className="flex items-center justify-between py-3 border-b border-white/5 active:bg-white/5 -mx-5 px-5 transition-colors group"
                data-testid={`song-${song.id}`}
              >
                <div 
                  onClick={() => play(song as any)}
                  className="flex-1 flex items-center gap-4 cursor-pointer"
                >
                  <img src={song.coverUrl} alt={song.title} className="w-12 h-12 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{song.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async (e) => {
                      e.preventDefault();
                      if (likedSongs.has(song.songId)) {
                        setLikedSongs(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(song.songId);
                          return newSet;
                        });
                      } else {
                        const isAlreadyInPlaylist = await isSongInPlaylist("liked-songs-default", song.songId);
                        if (isAlreadyInPlaylist) {
                          setLikedSongs(prev => new Set([...prev, song.songId]));
                          return;
                        }
                        setLikedSongs(prev => new Set([...prev, song.songId]));
                      }
                      addSongToPlaylist("liked-songs-default", song.songId, song.title, song.artist, song.coverUrl, song.album, song.previewUrl, song.duration).then(() => {
                        queryClient.invalidateQueries({ queryKey: ['playlist-songs'] });
                        queryClient.invalidateQueries({ queryKey: ['playlists'] });
                      }).catch(() => {
                        if (likedSongs.has(song.songId)) {
                          setLikedSongs(prev => new Set([...prev, song.songId]));
                        } else {
                          setLikedSongs(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(song.songId);
                            return newSet;
                          });
                        }
                      });
                    }}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    data-testid={`button-like-song-${song.id}`}
                  >
                    <Heart size={18} fill={likedSongs.has(song.songId) ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      removeSongMutation.mutate(song.id);
                    }}
                    className="text-red-500 hover:text-red-600 transition-colors"
                    data-testid={`button-remove-song-${song.id}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
