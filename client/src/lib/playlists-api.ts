export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistSong {
  id: string;
  playlistId: string;
  songId: string;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string;
  previewUrl?: string;
  duration?: string;
  addedAt: string;
}

export async function getPlaylists(): Promise<Playlist[]> {
  const response = await fetch('/api/playlists');
  if (!response.ok) throw new Error('Failed to fetch playlists');
  return response.json();
}

export async function getPlaylist(id: string): Promise<Playlist> {
  const response = await fetch(`/api/playlists/${id}`);
  if (!response.ok) throw new Error('Failed to fetch playlist');
  return response.json();
}

export async function getPlaylistSongs(playlistId: string): Promise<PlaylistSong[]> {
  const response = await fetch(`/api/playlists/${playlistId}/songs`);
  if (!response.ok) throw new Error('Failed to fetch playlist songs');
  return response.json();
}

export async function createPlaylist(name: string, description?: string): Promise<Playlist> {
  const response = await fetch('/api/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description: description || null })
  });
  if (!response.ok) throw new Error('Failed to create playlist');
  return response.json();
}

export async function updatePlaylist(id: string, name: string, description?: string, isFavorite?: string): Promise<Playlist> {
  const response = await fetch(`/api/playlists/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description: description || null, isFavorite: isFavorite || 'false' })
  });
  if (!response.ok) throw new Error('Failed to update playlist');
  return response.json();
}

export async function deletePlaylist(id: string): Promise<void> {
  const response = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete playlist');
}

export async function addSongToPlaylist(playlistId: string, songId: string, title: string, artist: string, coverUrl: string, album?: string, previewUrl?: string, duration?: string): Promise<PlaylistSong> {
  const response = await fetch(`/api/playlists/${playlistId}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId, title, artist, album: album || null, coverUrl, previewUrl, duration })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add song to playlist');
  }
  return response.json();
}

export async function removeSongFromPlaylist(songId: string): Promise<void> {
  const response = await fetch(`/api/playlist-songs/${songId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to remove song from playlist');
}

export async function addSongToLibrary(songId: string, title: string, artist: string, coverUrl: string, album?: string, previewUrl?: string, duration?: string): Promise<PlaylistSong> {
  const response = await fetch('/api/library/songs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId, title, artist, album: album || null, coverUrl, previewUrl, duration })
  });
  if (!response.ok) throw new Error('Failed to add song to library');
  return response.json();
}

export async function isSongInPlaylist(playlistId: string, songId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/playlists/${playlistId}/songs/check/${songId}`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.inPlaylist;
  } catch (error) {
    console.error('Error checking song in playlist:', error);
    return false;
  }
}

export async function removeSongFromLibrary(id: string): Promise<void> {
  const response = await fetch(`/api/library/songs/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to remove song from library');
}

export async function isSongInLibrary(songId: string): Promise<boolean> {
  const response = await fetch(`/api/library/songs/check/${songId}`);
  if (!response.ok) throw new Error('Failed to check song in library');
  const data = await response.json();
  return data.inLibrary;
}

export async function searchSongs(term: string): Promise<PlaylistSong[]> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
  if (!response.ok) throw new Error('Failed to search songs');
  return response.json();
}
