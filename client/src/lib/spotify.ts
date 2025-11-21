import type { Song } from "@shared/types";

// Fetch from iTunes API (free, no auth needed)
async function fetchFromItunes(searchTerm: string, limit = 50): Promise<Song[]> {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&entity=song&limit=${limit}`
    );
    const data = await response.json();
    return data.results
      .filter((item: any) => item.previewUrl)
      .map((item: any) => ({
        id: item.trackId.toString(),
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName,
        coverUrl: item.artworkUrl100?.replace("100x100bb", "600x600bb") || item.artworkUrl100,
        previewUrl: item.previewUrl,
        duration: item.trackTimeMillis ? Math.floor(item.trackTimeMillis / 1000).toString() : undefined,
      }))
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching from iTunes:", error);
    return [];
  }
}

export async function searchMusic(term: string, limit = 50): Promise<Song[]> {
  return fetchFromItunes(term, limit);
}

export async function getRecommendations(genres: string[] = ["pop"], limit = 50): Promise<Song[]> {
  const searchTerm = genres[0] || "popular music";
  return fetchFromItunes(searchTerm, limit);
}

export async function getFeaturedMusic(limit = 50): Promise<Song[]> {
  return fetchFromItunes("trending music", limit);
}

export async function getNewReleases(limit = 50): Promise<Song[]> {
  return fetchFromItunes("new music 2024 2025", limit);
}

export async function getIndianMusic(limit = 50): Promise<Song[]> {
  return fetchFromItunes("indian music", limit);
}

export async function getTrack(trackId: string): Promise<Song | null> {
  try {
    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${trackId}&media=music&entity=song`
    );
    const data = await response.json();
    if (data.results.length > 0) {
      const item = data.results[0];
      return {
        id: item.trackId.toString(),
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName,
        coverUrl: item.artworkUrl100?.replace("100x100bb", "600x600bb") || item.artworkUrl100,
        previewUrl: item.previewUrl,
        duration: item.trackTimeMillis ? Math.floor(item.trackTimeMillis / 1000).toString() : undefined,
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting track:", error);
    return null;
  }
}
