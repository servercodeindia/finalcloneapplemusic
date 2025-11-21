import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Plus, Trash2, Star, Lock } from "lucide-react";
import { Link } from "wouter";
import { useHaptics } from "@/hooks/use-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlaylists, createPlaylist, deletePlaylist, getPlaylistSongs } from "@/lib/playlists-api";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlaylistsPage() {
  const { light } = useHaptics();
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const queryClient = useQueryClient();

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: getPlaylists
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createPlaylist(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setNewPlaylistName("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlaylist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    }
  });

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createMutation.mutate(newPlaylistName);
    }
  };

  return (
    <Layout>
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center mb-6 relative">
          <Link href="/library" onClick={light} className="absolute left-0 text-primary flex items-center gap-1">
            <ChevronLeft size={24} />
            <span className="text-lg">Library</span>
          </Link>
          <h1 className="text-xl font-bold w-full text-center">Playlists</h1>
        </div>

        <div className="mb-6 flex gap-2">
          <Input 
            placeholder="New playlist name" 
            className="bg-white/10 border-none"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            data-testid="input-playlist-name"
          />
          <button 
            onClick={handleCreatePlaylist}
            disabled={!newPlaylistName.trim() || createMutation.isPending}
            className="bg-primary text-white px-4 rounded-lg hover:opacity-80 disabled:opacity-50"
            data-testid="button-create-playlist"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center py-3 gap-4">
                <Skeleton className="w-12 h-12 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))
          ) : playlists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No playlists yet. Create one!
            </div>
          ) : (
            playlists.map((playlist) => (
              <PlaylistItem 
                key={playlist.id} 
                playlist={playlist} 
                onDelete={deleteMutation.mutate}
                light={light}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

function PlaylistItem({ playlist, onDelete, light }: any) {
  const { data: songs = [] } = useQuery({
    queryKey: ['playlist-songs', playlist.id],
    queryFn: () => getPlaylistSongs(playlist.id)
  });

  const isDefault = playlist.id === "liked-songs-default";

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 active:bg-white/5 -mx-5 px-5 transition-colors group" data-testid={`playlist-${playlist.id}`}>
      <Link href={`/library/playlists/${playlist.id}`} onClick={light} className="flex-1 flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary/50 to-primary rounded-md flex items-center justify-center text-white relative">
          <span className="text-xs font-bold">♪</span>
          {isDefault && <div className="absolute -top-2 -right-2 bg-red-500 rounded-full w-3 h-3 flex items-center justify-center"></div>}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-lg">{playlist.name}</h3>
            {isDefault && <Star size={16} fill="#ef4444" stroke="#ef4444" className="text-red-500" />}
          </div>
          <p className="text-sm text-gray-500">{songs.length} songs</p>
        </div>
      </Link>
      <div className="w-6 h-6">
        {!isDefault ? (
          <button 
            onClick={(e) => {
              e.preventDefault();
              onDelete(playlist.id);
            }}
            className="text-red-500 hover:text-red-600 transition-colors w-6 h-6 flex items-center justify-center"
            data-testid={`button-delete-playlist-${playlist.id}`}
          >
            <Trash2 size={20} />
          </button>
        ) : (
          <div className="text-gray-500 w-6 h-6 flex items-center justify-center" title="Liked Songs playlist is protected">
            <Lock size={16} />
          </div>
        )}
      </div>
    </div>
  );
}
