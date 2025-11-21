import { Layout } from "@/components/Layout";
import { ChevronLeft, Music, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useHaptics } from "@/hooks/use-haptics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlayer } from "@/hooks/use-player";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { removeSongFromLibrary } from "@/lib/playlists-api";

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

export default function SongsPage() {
  const { light } = useHaptics();
  const { play } = usePlayer();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['library-songs'],
    queryFn: async () => {
      const response = await fetch('/api/library/songs');
      if (!response.ok) throw new Error('Failed to fetch library songs');
      return response.json() as Promise<LibrarySong[]>;
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

  return (
    <Layout>
      <div className="px-5 pt-8 pb-20">
        <div className="flex items-center mb-6 relative">
          <Link href="/library" onClick={light} className="absolute left-0 text-primary flex items-center gap-1">
            <ChevronLeft size={24} />
            <span className="text-lg">Library</span>
          </Link>
          <h1 className="text-xl font-bold w-full text-center">Songs</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square rounded-lg mb-2" />
                <Skeleton className="h-3 w-3/4 mb-1" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Music size={48} className="text-gray-400 mb-4" />
            <p className="text-xl font-semibold text-white mb-2">No songs in your library</p>
            <p className="text-gray-400">Play music and click 'Add to Library' to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
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
                <div className="aspect-square overflow-hidden rounded-lg mb-2 shadow-sm bg-neutral-800 relative">
                  <img 
                    src={song.coverUrl} 
                    alt={song.title} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    loading="lazy"
                  />
                  <button
                    onClick={(e) => handleRemove(e, song.id, song.title)}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-full transition-opacity"
                    data-testid={`button-remove-${song.id}`}
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                </div>
                <h3 className="font-medium text-sm truncate">{song.title}</h3>
                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
